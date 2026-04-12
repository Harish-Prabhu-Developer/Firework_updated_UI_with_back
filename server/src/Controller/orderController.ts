import { Request, Response } from "express";
import { db } from "../db/index.js";
import { orders, orderItems, customers, invoices, invoiceItems } from "../db/schema/invoices.js";
import { settings } from "../db/schema/settings.js";
import { eq, desc, sql, like, and, or } from "drizzle-orm";
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import QRCode from 'qrcode';
import { generateOrderHTML } from '../utils/invoiceTemplates/orderTemplate.js';
import { pdfCache, PDF_CACHE_TTL } from '../utils/pdfCache.js';
import { transporter } from '../utils/mailer.js';
import { OrderReceivedTemplate } from '../utils/emailTemplates/orderReceived.js';
import dotenv from 'dotenv';

dotenv.config();

// ─── Reusable PDF Generator ───────────────────────────────────────────────────
async function generateOrderPDFBuffer(orderData: any, shopInfo: any): Promise<Buffer> {
    const encryptedOrderNumber = Buffer.from(orderData.orderNumber).toString('hex');
    const qrCodeDataUrl = await QRCode.toDataURL(
        `${process.env.BASE_URL}/api/orders/pdf/${encryptedOrderNumber}`
    );
    const html = generateOrderHTML(orderData, qrCodeDataUrl, shopInfo);

    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    let browser;

    if (isProduction) {
        browser = await puppeteerCore.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    } else {
        browser = await puppeteer.launch({
            headless: true,
            pipe: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        });
    }

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        });

        // Warm the cache
        pdfCache.set(orderData.orderNumber, {
            buffer: Buffer.from(pdfBuffer),
            timestamp: Date.now(),
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}
// ──────────────────────────────────────────────────────────────────────────────

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { customerData, items, subTotal, totalAmount, paymentMethod, notes } = req.body;

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

        // 2. Generate Order Number: ORD-YYMMDD-001
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD

        const lastOrder = await db.query.orders.findFirst({
            where: like(orders.orderNumber, `ORD-${dateStr}-%`),
            orderBy: [desc(orders.orderNumber)],
        });

        let nextSeq = "001";
        if (lastOrder) {
            const parts = lastOrder.orderNumber.split("-");
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[2]);
                if (!isNaN(lastSeq)) {
                    nextSeq = String(lastSeq + 1).padStart(3, "0");
                }
            }
        }
        const orderNumber = `ORD-${dateStr}-${nextSeq}`;

        // 3. Create Order
        const [newOrder] = await db.insert(orders).values({
            orderNumber,
            customerId: customer.id,
            subTotal: String(subTotal || 0),
            totalAmount: String(totalAmount || 0),
            paymentMethod: paymentMethod || "cash",
            notes: notes || null,
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
                    const pdfBuffer = await generateOrderPDFBuffer(fullOrderData, shopInfo);

                    const emailHtml = OrderReceivedTemplate({
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
                    });

                    await transporter.sendMail({
                        from: `"Crackers Kingdom" <${process.env.SMTP_USER}>`,
                        to: customerEmail,
                        subject: `Order Enquiry Received — ${orderNumber} | Crackers Kingdom`,
                        html: emailHtml,
                        attachments: [
                            {
                                filename: `order-${orderNumber}.pdf`,
                                content: pdfBuffer,
                                contentType: 'application/pdf',
                            },
                        ],
                    });

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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;
        const search = req.query.search as string;
        const offset = (page - 1) * limit;

        // Build where clauses
        const whereClauses: any[] = [];
        if (status && status !== 'all') {
            whereClauses.push(eq(orders.status, status as any));
        }

        if (search) {
            whereClauses.push(
                or(
                    like(orders.orderNumber, `%${search}%`),
                    sql`EXISTS (SELECT 1 FROM ${customers} WHERE ${customers}.id = ${orders.customerId} AND (${customers}.name ILIKE ${`%${search}%`} OR ${customers}.phone LIKE ${`%${search}%`}))`
                )
            );
        }

        const finalWhere = whereClauses.length > 0 ? and(...whereClauses) : undefined;

        // Get total count with filters
        const countQuerySnapshot = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(finalWhere);
        const total = countQuerySnapshot[0].count;

        const allOrders = await db.query.orders.findMany({
            with: {
                customer: true,
                items: {
                    with: {
                        product: { with: { uom: true } }
                    }
                },
            },
            where: finalWhere,
            limit,
            offset,
            orderBy: [desc(orders.createdAt)],
        });

        res.json({
            success: true,
            data: allOrders,
            pagination: {
                total: Number(total),
                page,
                limit,
                totalPages: Math.ceil(Number(total) / limit)
            }
        });
    } catch (error: any) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const convertOrderToInvoice = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        const order = await db.query.orders.findFirst({
            where: eq(orders.id, String(orderId)),
            with: {
                items: {
                    with: {
                        product: { with: { uom: true } }
                    }
                },
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === 'converted') {
            return res.status(400).json({ success: false, message: "Order already converted to invoice" });
        }

        // 1. Generate Invoice Number: INV-YYMMDD-XXXX
        const now = new Date();
        const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
        const lastInvoice = await db.query.invoices.findFirst({
            where: like(invoices.invoiceNumber, `INV-${dateStr}-%`),
            orderBy: [desc(invoices.invoiceNumber)],
        });

        let nextSeq = "0001";
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split("-");
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[2]);
                if (!isNaN(lastSeq)) {
                    nextSeq = String(lastSeq + 1).padStart(4, "0");
                }
            }
        }
        const invoiceNumber = `INV-${dateStr}-${nextSeq}`;

        // 2. Create Invoice
        const [newInvoice] = await db.insert(invoices).values({
            invoiceNumber,
            customerId: order.customerId,
            subTotal: order.subTotal,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            notes: `Converted from ${order.orderNumber}. ${order.notes || ""}`,
        }).returning();

        // 3. Create Invoice Items
        if (order.items && order.items.length > 0) {
            const invItems = order.items.map((item: any) => ({
                invoiceId: newInvoice.id,
                productId: item.productId,
                productName: item.productName || item.product?.name,
                productContent: item.productContent || item.product?.content,
                productImage: item.productImage || item.product?.image,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            }));

            await db.insert(invoiceItems).values(invItems);
        }

        // 4. Update Order Status
        await db.update(orders)
            .set({ status: 'converted' })
            .where(eq(orders.id, String(orderId)));

        res.json({ success: true, invoice: newInvoice });
    } catch (error: any) {
        console.error("Convert Order to Invoice Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOrderPDF = async (req: Request, res: Response) => {
    try {
        const rawOrderNumber = req.params.orderNumber;

        if (!rawOrderNumber || typeof rawOrderNumber !== 'string') {
            return res.status(400).json({ message: "Invalid or missing order number" });
        }

        const encryptedOrderNumber: string = rawOrderNumber;

        // Decode hex order number safely
        let orderNumber = encryptedOrderNumber;
        try {
            orderNumber = Buffer.from(encryptedOrderNumber, 'hex').toString('utf8');
        } catch (e) {
            console.warn("Hex decoding failed for orderNumber:", encryptedOrderNumber);
        }

        // Check Cache
        const cached = pdfCache.get(orderNumber);
        if (cached && (Date.now() - cached.timestamp < PDF_CACHE_TTL)) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `inline; filename=order-${encryptedOrderNumber}.pdf`);
            res.setHeader("Content-Length", cached.buffer.length);
            return res.send(cached.buffer);
        }

        const orderData = await db.query.orders.findFirst({
            where: eq(orders.orderNumber, orderNumber),
            with: {
                customer: true,
                items: {
                    with: {
                        product: { with: { uom: true } }
                    }
                },
            },
        });

        if (!orderData) {
            return res.status(404).json({ message: "Order not found" });
        }

        const shopSettings = await db.select().from(settings).limit(1);
        const shopInfo = shopSettings[0] || {
            shopName: "Crackers Kingdom",
            shopPhone: "9944336113",
            shopAddress: "M/S NANDHINI TRADERS, SURVEY NO: 299/13A1C, 299/15A2, DOOR NO: 3/1362/20, BHARATHI NAGAR - II VISWANATHAM, SIVAKASI, VIRUDHUNAGAR",
            shopGst: ""
        };

        // Generate QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.BASE_URL}/api/orders/pdf/${encryptedOrderNumber}`);

        const html = generateOrderHTML(orderData, qrCodeDataUrl, shopInfo);

        // Environment-aware browser launch
        let browser;
        const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

        if (isProduction) {
            console.log("🚀 Launching Production Browser (Vercel/Chromium)");
            browser = await puppeteerCore.launch({
                args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                executablePath: await chromium.executablePath(),
                headless: true,
            });
        } else {
            console.log("💻 Launching Local Browser (Puppeteer)");
            browser = await puppeteer.launch({
                headless: true,
                pipe: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });
        }

        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
            });

            // Store in Cache
            pdfCache.set(orderNumber, {
                buffer: Buffer.from(pdfBuffer),
                timestamp: Date.now()
            });

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `inline; filename=order-${encryptedOrderNumber}.pdf`);
            res.setHeader("Content-Length", pdfBuffer.length);
            res.send(pdfBuffer);
        } finally {
            await browser.close();
        }

    } catch (error: any) {
        console.error("Order PDF Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // Delete order (cascading delete will handle items)
        const deleted = await db.delete(orders).where(eq(orders.id, String(orderId))).returning();

        if (deleted.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order deleted successfully" });
    } catch (error: any) {
        console.error("Delete Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
