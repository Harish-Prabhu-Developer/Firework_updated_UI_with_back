import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { invoices, invoiceItems, customers, orders } from '../db/schema/invoices.js';
import { products } from '../db/schema/category.js';
import { settings } from '../db/schema/settings.js';
import { eq, inArray, desc, and, or, ilike, sql } from 'drizzle-orm';
import { generateInvoiceNumber, formatCurrency } from '../utils/helpers.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { generatePDFFromHTML } from '../services/pdfService.js';
import { generateInvoiceHTML } from '../templates/invoiceTemplate.js';
import { generateInvoiceHTML2 } from '../templates/invoiceTemplate2.js';
import QRCode from 'qrcode';
import dotenv from "dotenv"
import {
    bodyToStringArray,
    paramToString,
    queryToPositiveInt,
} from '../utils/request.js';

dotenv.config();
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const {
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            items,
            subTotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paymentMethod,
            userId,
            notes,
            orderId
        } = req.body;

        if (!customerPhone || !items?.length) {
            return res.status(400).json({ success: false, msg: 'Customer phone and items are required' });
        }

        const invoice = await db.transaction(async (tx) => {
            // 1. Customer Resolution
            let customerId: string;
            const existingCustomer = await tx.select().from(customers).where(eq(customers.phone, customerPhone)).limit(1);

            if (existingCustomer[0]) {
                customerId = existingCustomer[0].id;
                // Update their name/email if provided
                await tx.update(customers)
                    .set({
                        name: customerName || existingCustomer[0].name,
                        email: customerEmail || existingCustomer[0].email,
                        address: customerAddress || existingCustomer[0].address,
                        updatedAt: new Date()
                    })
                    .where(eq(customers.id, customerId));
            } else {
                const [newCustomer] = await tx.insert(customers).values({
                    name: customerName || "Walk-in Customer",
                    phone: customerPhone,
                    email: customerEmail || null,
                    address: customerAddress || null,
                }).returning();
                customerId = newCustomer.id;
            }

            // 2. Invoice Entry
            const invoiceNumber = await generateInvoiceNumber();
            const [newInvoice] = await tx.insert(invoices).values({
                invoiceNumber,
                userId: userId || (req as any).user?.id,
                customerId,
                subTotal: subTotal.toString(),
                discountAmount: (discountAmount || 0).toString(),
                taxAmount: (taxAmount || 0).toString(),
                totalAmount: totalAmount.toString(),
                paymentMethod: paymentMethod || 'cash',
                notes: notes || null,
            }).returning();

            // 3. Item Snapshots
            for (const item of items) {
                let product = null;
                if (item.productId) {
                    product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
                }

                const productName = item.productName || product?.[0]?.name || 'Unknown Product';
                const unitPrice = item.unitPrice || product?.[0]?.sellingPrice || "0";
                const totalPrice = (parseFloat(unitPrice) * item.quantity).toString();

                await tx.insert(invoiceItems).values({
                    invoiceId: newInvoice.id,
                    productId: item.productId || null,
                    productName,
                    productContent: item.productContent || product?.[0]?.slug || '',
                    productImage: item.productImage || product?.[0]?.image || '',
                    quantity: item.quantity,
                    unitPrice: unitPrice.toString(),
                    totalPrice,
                });
            }

            // 4. Order Update (if originated from an existing order)
            if (orderId) {
                await tx.update(orders)
                    .set({ status: 'converted', updatedAt: new Date() })
                    .where(eq(orders.id, orderId));
            }

            return newInvoice;
        });

        res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
        console.error('Create Invoice Error:', error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const page = queryToPositiveInt(req.query.page, 1);
        const limit = queryToPositiveInt(req.query.limit, 50);
        const search = req.query.search as string;
        const paymentMethod = req.query.paymentMethod as string;
        const offset = (page - 1) * limit;

        // Construct dynamic where clause
        let searchFilters = [];

        if (search) {
            // Find customer IDs matching name or phone
            const matchedCustomers = await db.select({ id: customers.id })
                .from(customers)
                .where(or(
                    ilike(customers.name, `%${search}%`),
                    ilike(customers.phone, `%${search}%`)
                ));
            const customerIds = matchedCustomers.map(c => c.id);

            searchFilters.push(or(
                ilike(invoices.invoiceNumber, `%${search}%`),
                customerIds.length > 0 ? inArray(invoices.customerId, customerIds) : undefined
            ));
        }

        if (paymentMethod) {
            searchFilters.push(eq(invoices.paymentMethod, paymentMethod as any));
        }

        const finalWhere = searchFilters.length > 0 ? and(...searchFilters) : undefined;

        // Fetch paginated invoices with relations
        const data = await db.query.invoices.findMany({
            where: finalWhere,
            with: {
                customer: true,
                user: true,
                items: true,
            },
            orderBy: [desc(invoices.createdAt)],
            limit,
            offset,
        });

        // Get total count for pagination metadata
        const [totalCountResult] = await db.select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(finalWhere);

        const total = Number(totalCountResult?.count || 0);

        res.json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error: any) {
        console.error('Get All Invoices Error:', error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
        if (!invoice[0]) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        const customer = await db.select().from(customers).where(eq(customers.id, invoice[0].customerId)).limit(1);
        const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice[0].id));
        res.json({ success: true, data: { ...invoice[0], customer: customer[0], items } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateInvoice = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { paymentMethod, notes } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        const [invoice] = await db.update(invoices).set({ paymentMethod, notes, updatedAt: new Date() }).where(eq(invoices.id, id)).returning();
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getInvoicePDF = async (req: Request, res: Response) => {
    try {
        const encryptedId = paramToString(req.params[0] || req.params.encryptedId);
        if (!encryptedId) return res.status(400).json({ success: false, msg: 'Encrypted invoice ID required' });

        // 1. Identity Decoding & Security
        const invoiceId = decrypt(encryptedId);
        if (!invoiceId) return res.status(400).json({ success: false, msg: 'Invalid invoice ID' });

        // 2. Data Assembly (Relational Query)
        const invoiceData = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceId),
            with: {
                customer: true,
                items: {
                    with: {
                        product: {
                            with: {
                                uom: true,
                                productTags: {
                                    with: {
                                        tag: true
                                    }
                                }
                            }
                        }
                    }
                },
            }
        });

        if (!invoiceData) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        const shopSettings = await db.select().from(settings).limit(1);
        const shopInfo = shopSettings[0] || {};
        console.log("ShopInfo : ", shopInfo);


        // 3. Verification QR Code
        // Points to a verification URL for digital validation of physical printouts
        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const verificationUrl = `${baseUrl}/api/v1/invoices/pdf/${encryptedId}`;

        // Robust check for boolean status
        const isQrEnabled = !!shopInfo.invoiceQrStatus;

        const qrCodeDataUrl = isQrEnabled
            ? await QRCode.toDataURL(verificationUrl, {
                margin: 1,
                width: 200,
                color: {
                    dark: '#1f2937',
                    light: '#ffffff'
                }
            })
            : '';

        // 4. Professional PDF Rendering & Caching
        // Support multiple templates via query parameter
        const templateId = req.query.template as string;
        const html = templateId === '2'
            ? generateInvoiceHTML2(invoiceData, qrCodeDataUrl, shopInfo)
            : generateInvoiceHTML(invoiceData, qrCodeDataUrl, shopInfo);

        const pdf = await generatePDFFromHTML(html, `invoice_${invoiceData.id}_t${templateId || '1'}`);

        // 5. Final Response (Inline)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice_${invoiceData.invoiceNumber}.pdf"`);
        res.send(pdf);
    } catch (error: any) {
        console.error('Get Invoice PDF Error:', error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        const result = await db.delete(invoices).where(eq(invoices.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        res.json({ success: true, msg: 'Invoice deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getInvoiceToken = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        const invoice = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
        if (!invoice[0]) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        const token = encrypt(id);
        res.json({ success: true, data: { token } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteInvoices = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        for (const id of ids) await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        const result = await db.delete(invoices).where(inArray(invoices.id, ids));
        res.json({ success: true, msg: `${result.rowCount} invoices deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
