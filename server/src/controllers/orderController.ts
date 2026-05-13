import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { orders, orderItems, orderStatusEnum } from '../db/schema/invoices.js';
import { products, productStocks } from '../db/schema/category.js';
import { customers } from '../db/schema/invoices.js';
import { settings } from '../db/schema/settings.js';
import { eq, inArray, desc, sql, like } from 'drizzle-orm';
import { generateOrderNumber, formatCurrency } from '../utils/helpers.js';
import { decrypt } from '../utils/crypto.js';
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
        const { customerData, items, notes, paymentMethod, subTotal, totalAmount } = req.body;

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
            totalAmount: String(totalAmount || 0),
            paymentMethod: paymentMethod || "cash",
            notes: notes || null,
            status: 'pending' // Adding default status
        }).returning();

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

            // Optional: Update stock if needed (original code had this)
            for (const item of items) {
                await db.update(productStocks)
                    .set({
                        quantity: sql`${productStocks.quantity} - ${item.quantity}`,
                        updatedAt: new Date(),
                    })
                    .where(eq(productStocks.productId, item.productId));
            }
        }

        res.status(201).json({ success: true, order: newOrder });


        // ── Send Order Confirmation Email with PDF Attachment (fire-and-forget) ──
        const customerEmail = customerData.email?.trim();
        if (customerEmail) {
            (async () => {
                try {
                    const orderDate = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

                    // Parallelize data fetching and QR generation
                    const [fullOrderData, shopSettings, qrCodeDataUrl] = await Promise.all([
                        db.query.orders.findFirst({
                            where: eq(orders.orderNumber, orderNumber),
                            with: {
                                customer: true,
                                items: { with: { product: { with: { uom: true } } } },
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
                        total: `₹${Number(totalAmount || 0).toLocaleString("en-IN")}`,
                        items: (fullOrderData?.items || []).map((item: any) => ({
                            productName: item.productName || item.product?.name || "Product",
                            content: item.productContent || (item.product?.uom?.code ? `1${item.product.uom.code}` : ""),
                            quantity: Number(item.quantity || 0),
                            unitPrice: Number(item.unitPrice || 0),
                            totalPrice: Number(item.totalPrice || 0),
                        })),
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

        const allOrders = status
            ? await db.select().from(orders).where(eq(orders.status, status as typeof orderStatusEnum.enumValues[number])).orderBy(desc(orders.createdAt))
            : await db.select().from(orders).orderBy(desc(orders.createdAt));
        const paginated = allOrders.slice(offset, offset + limitNum);

        const ordersWithCustomer = await Promise.all(
            paginated.map(async (order) => {
                const customer = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
                const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
                return { ...order, customer: customer[0], items };
            })
        );

        res.json({
            success: true,
            data: ordersWithCustomer,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: allOrders.length,
                totalPages: Math.ceil(allOrders.length / limitNum),
            },
        });
    } catch (error: any) {
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

export const getOrderPDF = async (req: Request, res: Response) => {
    try {
        const encryptedId = paramToString(req.params.encryptedId);
        if (!encryptedId) return res.status(400).json({ success: false, msg: 'Encrypted order ID required' });

        const orderId = decrypt(encryptedId);
        if (!orderId) return res.status(400).json({ success: false, msg: 'Invalid order ID' });

        const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
        if (!order[0]) {
            return res.status(404).json({ success: false, msg: 'Order not found' });
        }

        const customer = await db.select().from(customers).where(eq(customers.id, order[0].customerId)).limit(1);
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order[0].id));

        const settingRows = await db.select().from(settings).limit(1);
        const shopInfo = settingRows[0] || {};

        const html = generateOrderHTML(
            { ...order[0], customer: customer[0], items },
            '',
            shopInfo,
            shopInfo.orderReceiptQrStatus ?? false
        );

        const pdf = await generatePDFFromHTML(html, `order_${order[0].orderNumber}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="order_${order[0].orderNumber}.pdf"`);
        res.send(pdf);
    } catch (error: any) {
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
