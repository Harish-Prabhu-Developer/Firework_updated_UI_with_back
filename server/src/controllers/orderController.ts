// server/src/controllers/orderController.ts
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { orders, orderItems, orderStatusEnum } from '../db/schema/invoices.js';
import { products } from '../db/schema/category.js';
import { customers } from '../db/schema/invoices.js';
import { settings } from '../db/schema/settings.js';
import { eq, inArray, desc, sql, like } from 'drizzle-orm';
import { generateOrderNumber, formatCurrency } from '../utils/helpers.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { generatePDFFromHTML } from '../services/pdfService.js';
import { generateOrderHTML } from '../templates/orderTemplate.js';
import { sendOrderReceivedEmail } from '../services/emailService.js';
import { invoices, invoiceItems } from '../db/schema/invoices.js';
import { generateInvoiceNumber } from '../utils/helpers.js';
import QRCode from 'qrcode';
import { generateOrderPDFBuffer } from '../services/pdfService.js';
import {
    bodyToStringArray,
    paramToString,
    queryToOptionalString,
    queryToPositiveInt,
} from '../utils/request.js';
import { sendToRole, sendToUser, sendToAllUsers } from '../services/notificationService.js';
import { orderStatusLogs } from '../db/schema/invoices.js';

type OrderItemSnapshot = {
    productId: string;
    productName: string;
    productContent: string;
    productImage: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { customerData, items, notes, paymentMethod, subTotal, discountAmount, totalAmount } = req.body;

        if (!customerData || !customerData.phone) {
            return res.status(400).json({ success: false, message: "Customer phone is required" });
        }

        // 1. Find or Create Customer
        let customer = await db.query.customers.findFirst({
            where: eq(customers.phone, String(customerData.phone)),
        });

        if (!customer) {
            const inserted = await db.insert(customers).values({
                name: customerData.name || "Unknown",
                phone: String(customerData.phone),
                email: customerData.email || null,
                address: customerData.address || null,
            }).returning();
            customer = inserted[0];
        }

        // 0. Check Settings (Sales Status and Minimum Order)
        const settingRows = await db.select().from(settings).limit(1);
        const shopSettings = settingRows[0];

        if (shopSettings) {
            if (!shopSettings.salesStatus) {
                return res.status(403).json({ success: false, message: "Store is currently not accepting orders." });
            }
            if (Number(totalAmount) < shopSettings.minimumOrder) {
                return res.status(400).json({ success: false, message: `Minimum order amount is ₹${shopSettings.minimumOrder}` });
            }
        }

        const orderNumber = await generateOrderNumber();

        // 3. Create Order
        const [newOrder] = await db.insert(orders).values({
            orderNumber,
            userId: req.user?.id || null, // Assuming userId might be available from auth middleware
            customerId: customer.id,
            subTotal: String(subTotal || 0),
            discountAmount: String(discountAmount || 0),
            totalAmount: String(totalAmount || 0),
            paymentMethod: paymentMethod || "cash",
            notes: notes || null,
            status: 'ESTIMATE_SUBMITTED' // Default status
        }).returning();

        // Notify all users in the system
        sendToAllUsers({
            title: 'New Estimate Request',
            message: `New estimate request received. Order #${orderNumber}`,
            type: 'ORDER',
            referenceId: newOrder.id,
            orderNumber: orderNumber,
            screen: 'Order',
            route: `/orders/${newOrder.id}`,
            status: 'ESTIMATE_SUBMITTED'
        }).catch(e => console.error("Notification Error:", e));

        // 4. Create Order Items
        if (items && Array.isArray(items) && items.length > 0) {
            const itemsToInsert = items.map((item: any) => ({
                orderId: newOrder.id,
                productId: item.productId,
                productName: item.productName,
                productContent: item.productContent,
                productImage: item.productImage || item.image,
                quantity: parseInt(String(item.quantity || 0)),
                unitPrice: String(item.unitPrice || 0),
                totalPrice: String(item.totalPrice || 0),
            }));

            await db.insert(orderItems).values(itemsToInsert);

            for (const item of items) {
                await db.update(products)
                    .set({
                        stock: sql`${products.stock} - ${item.quantity}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(products.id, item.productId));
            }
        }

        res.status(201).json({ success: true, order: newOrder });


        // ── Send Order Confirmation Email with PDF Attachment (fire-and-forget) ──
        const customerEmail = customerData.email?.trim();
        if (customerEmail) {
            (async () => {
                try {
                    const orderDate = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

                    const [fullOrderData, shopSettings, qrCodeDataUrl] = await Promise.all([
                        db.query.orders.findFirst({
                            where: eq(orders.orderNumber, orderNumber),
                            with: {
                                customer: true,
                                items: { with: { product: true } },
                            },
                        }),
                        db.select().from(settings).limit(1),
                        QRCode.toDataURL(`${process.env.BASE_URL}/api/orders/pdf/${Buffer.from(orderNumber).toString('hex')}`)
                    ]);

                    const shopInfo = shopSettings?.[0] || {
                        shopName: "Crackers Kingdom",
                        shopPhone: "9944336113",
                        shopAddress: "M/S NANDHINI TRADERS,SURVEY NO: 299/13A1C, 299/15A2, DOOR NO: 3/1362/20, BHARATHI NAGAR - II VISWANATHAM, SIVAKASI, VIRUDHUNAGAR",
                        shopGst: "",
                    };

                    if (!fullOrderData) throw new Error("Order not found for background process");

                    // Generate PDF buffer
                    const pdfBuffer = await generateOrderPDFBuffer(fullOrderData, shopInfo, qrCodeDataUrl);

                    const emailData = {
                        orderNumber,
                        orderDate,
                        customerPhone: String(customerData.phone),
                        customerEmail,
                        subtotal: `₹${Number(subTotal || 0).toLocaleString("en-IN")}`,
                        discountAmount: `₹${Number(discountAmount || 0).toLocaleString("en-IN")}`,
                        discountPercentage: Number(subTotal) > 0 ? Math.round((Number(discountAmount || 0) / Number(subTotal || 1)) * 100) : 0,
                        total: `₹${Number(totalAmount || 0).toLocaleString("en-IN")}`,
                        items: (fullOrderData?.items || []).map((item: any) => ({
                            productName: item.productName || item.product?.name || "Product",
                            content: item.productContent || (item.product?.unit ? `1${item.product.unit}` : ""),
                            quantity: Number(item.quantity || 0),
                            unitPrice: Number(item.unitPrice || 0),
                            totalPrice: Number(item.totalPrice || 0),
                        }))
                    };

                    await sendOrderReceivedEmail(customerEmail, emailData, [
                        {
                            filename: `order-${orderNumber}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf',
                        },
                    ]);

                    console.log(`[Email] Order PDF attached and sent to ${customerEmail} for ${orderNumber}`);
                } catch (err: any) {
                    console.error("[Email] Failed to send order confirmation with PDF:", err.message);
                }
            })();
        }

    } catch (error: any) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const status = queryToOptionalString(req.query.status);
        const offset = (pageNum - 1) * limitNum;

        if (status && !orderStatusEnum.enumValues.includes(status as typeof orderStatusEnum.enumValues[number])) {
            return res.status(400).json({ success: false, msg: 'Invalid order status' });
        }


        const whereCondition = status
            ? eq(orders.status, status as typeof orderStatusEnum.enumValues[number])
            : undefined;

        // Fetch paginated data efficiently with joins
        const paginatedOrders = await db.query.orders.findMany({
            where: whereCondition,
            orderBy: [desc(orders.createdAt)],
            limit: limitNum,
            offset: offset,
            with: {
                customer: true,
                items: true,
            }
        });

        // Get total count (efficiently without fetching all rows)
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(whereCondition);

        const totalCount = Number(totalResult[0]?.count || 0);

        res.json({
            success: true,
            data: paginatedOrders,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitNum) || 1,
            },
        });
    } catch (error: any) {
        console.error("GetAllOrders Error:", error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Order ID required' });

        const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

        if (!order[0]) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const customer = await db.select().from(customers).where(eq(customers.id, order[0].customerId)).limit(1);
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order[0].id));

        res.json({
            success: true,
            data: { ...order[0], customer: customer[0], items },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getOrderToken = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Order ID required' });

        const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
        if (!order[0]) return res.status(404).json({ success: false, msg: 'Order not found' });

        const token = encrypt(id);
        console.log('[OrderToken] Generated token for ID:', id, '->', token);
        res.json({ success: true, data: { token } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getOrderPDF = async (req: Request, res: Response) => {
    try {
        const encryptedId = paramToString(req.params[0] || req.params.encryptedId);

        if (!encryptedId) return res.status(400).json({ success: false, msg: 'Encrypted order ID required' });

        console.log('[OrderPDF] Attempting to decrypt token:', encryptedId);
        const orderId = decrypt(encryptedId);
        if (!orderId) {
            console.error('[OrderPDF] Decryption failed for token:', encryptedId);
            return res.status(400).json({ success: false, msg: 'Invalid order ID' });
        }

        const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order[0]) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const customer = await db.select().from(customers).where(eq(customers.id, order[0].customerId)).limit(1);
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order[0].id));

        const settingRows = await db.select().from(settings).limit(1);
        const shopInfo = settingRows[0] || {};

        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const verificationUrl = `${baseUrl}/api/v1/orders/pdf/${encryptedId}`;
        const isQrEnabled = !!shopInfo.orderReceiptQrStatus;

        const qrCodeDataUrl = isQrEnabled
            ? await QRCode.toDataURL(verificationUrl, {
                margin: 1,
                width: 200,
                color: { dark: '#1f2937', light: '#ffffff' }
            })
            : '';

        const html = generateOrderHTML(
            { ...order[0], customer: customer[0] || { name: 'Guest Customer', phone: 'N/A' }, items },
            qrCodeDataUrl,
            shopInfo,
            false
        );

        const pdf = await generatePDFFromHTML(html, `order_${order[0].orderNumber}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="order_${order[0].orderNumber}.pdf"`);
        res.send(pdf);
    } catch (error: any) {
        console.error('[OrderPDF] Critical error generating PDF:', error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const convertOrderToInvoice = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Order ID required' });

        const order = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
        if (!order[0]) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        if (order[0].status === 'converted') {
            return res.status(400).json({ success: false, msg: 'Order already converted to invoice' });
        }

        const orderItemsList = await db.select().from(orderItems).where(eq(orderItems.orderId, order[0].id));

        const invoiceNumber = await generateInvoiceNumber();

        const [invoice] = await db.insert(invoices).values({
            invoiceNumber,
            userId: req.user!.id,
            customerId: order[0].customerId,
            subTotal: order[0].subTotal,
            discountAmount: '0',
            taxAmount: '0',
            totalAmount: order[0].totalAmount,
            paymentMethod: order[0].paymentMethod,
            notes: order[0].notes,
        }).returning();

        for (const item of orderItemsList) {
            await db.insert(invoiceItems).values({
                invoiceId: invoice.id,
                productId: item.productId,
                productName: item.productName,
                productContent: item.productContent,
                productImage: item.productImage,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            });
        }

        await db.update(orders).set({ status: 'converted' }).where(eq(orders.id, order[0].id));

        res.json({ success: true, data: invoice });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Order ID required' });

        await db.delete(orderItems).where(eq(orderItems.orderId, id));
        const result = await db.delete(orders).where(eq(orders.id, id));

        if (!result.rowCount) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        res.json({ success: true, msg: 'Order deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteOrders = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);

        if (ids.length === 0) {
            return res.status(400).json({ success: false, msg: 'IDs array required' });
        }

        for (const id of ids) {
            await db.delete(orderItems).where(eq(orderItems.orderId, id));
        }

        const result = await db.delete(orders).where(inArray(orders.id, ids));

        res.json({ success: true, msg: `${result.rowCount} orders deleted successfully` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { status, rejectionReason, transportName, lrNumber, vehicleNumber } = req.body;
        
        if (!id) return res.status(400).json({ success: false, msg: 'Order ID required' });
        if (!status) return res.status(400).json({ success: false, msg: 'Status required' });

        const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
        const order = orderResult[0];
        if (!order) return res.status(404).json({ success: false, msg: 'Order not found' });

        const updateData: any = { status };
        if (status === 'REJECTED') updateData.rejectionReason = rejectionReason;
        if (status === 'DISPATCHED') {
            updateData.transportName = transportName;
            updateData.lrNumber = lrNumber;
            updateData.vehicleNumber = vehicleNumber;
            updateData.dispatchedAt = new Date();
        }
        if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
        if (status === 'DELIVERED') updateData.deliveredAt = new Date();

        await db.update(orders).set(updateData).where(eq(orders.id, id));

        await db.insert(orderStatusLogs).values({
            orderId: id,
            status,
            remarks: rejectionReason || transportName || '',
            createdBy: req.user?.id
        });

        let title = '';
        let message = '';
        if (status === 'PENDING_VERIFICATION') {
            title = 'Order Waiting Verification';
            message = `Order #${order.orderNumber} is waiting for customer verification.`;
        } else if (status === 'CONFIRMED') {
            title = 'Order Confirmed';
            message = `Order #${order.orderNumber} has been confirmed.`;
        } else if (status === 'READY_FOR_DISPATCH') {
            title = 'Order Ready For Dispatch';
            message = `Order #${order.orderNumber} has been packed and is ready for dispatch.`;
        } else if (status === 'DISPATCHED') {
            title = 'Order Dispatched';
            message = `Order #${order.orderNumber} has been dispatched. LR: ${lrNumber}, Transport: ${transportName}`;
        } else if (status === 'DELIVERED') {
            title = 'Order Delivered';
            message = `Order #${order.orderNumber} has been delivered successfully.`;
        } else if (status === 'REJECTED') {
            title = 'Order Rejected';
            message = `Order #${order.orderNumber} has been rejected. Reason: ${rejectionReason}`;
        }

        if (title) {
            const payload = {
                title,
                message,
                type: 'ORDER',
                referenceId: order.id,
                orderNumber: order.orderNumber,
                status,
                rejectionReason: rejectionReason || ''
            };
            if (order.userId) {
                sendToUser(order.userId, payload).catch(e => console.error(e));
            }
            if (status === 'PENDING_VERIFICATION') {
                sendToRole('Admin', payload).catch(e => console.error(e));
            }
        }

        res.json({ success: true, msg: 'Order status updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
