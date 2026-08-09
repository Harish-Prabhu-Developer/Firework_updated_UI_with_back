// server/src/controllers/invoiceController.ts
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { invoices, invoiceItems, customers } from '../db/schema/invoices.js';
import { products } from '../db/schema/category.js';
import { settings } from '../db/schema/settings.js';
import type { InferSelectModel, SQL } from 'drizzle-orm';
import { eq, inArray, desc, and, or, ilike, sql } from 'drizzle-orm';
import { generateInvoiceNumber } from '../utils/helpers.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { generatePDFFromHTML } from '../services/pdfService.js';

import { renderInvoiceHtml } from '../templates/invoiceTemplate.js'
import dotenv from "dotenv";
import {
    bodyToStringArray,
    paramToString,
    queryToPositiveInt,
} from '../utils/request.js';
import { numberToWords } from '../utils/helpers.js';

dotenv.config();

type PaymentMethodValue = 'cash' | 'upi' | 'card';

interface InvoiceItemInput {
    productId?: string;
    productName?: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

/* ─────────────────────────────────────────────────────────────────────────────
   POST /invoices
   Body: {
     customerId, paymentMethod,
     subTotal, discountAmount, taxAmount, totalAmount,
     gstEnabled, gstType, gstPercentage,
     taxableAmount, cgstPercentage, cgstAmount,
     sgstPercentage, sgstAmount, igstPercentage, igstAmount,
     items: [{ productId, productName, quantity, unitPrice, totalPrice }]
   }
───────────────────────────────────────────────────────────────────────────── */
export const createInvoice = async (req: Request, res: Response) => {
    try {
        const {
            customerId,
            paymentMethod,
            subTotal,
            discountAmount,
            taxAmount,
            totalAmount,
            // GST breakdown
            gstEnabled,
            gstType,
            gstPercentage,
            taxableAmount,
            cgstPercentage,
            cgstAmount,
            sgstPercentage,
            sgstAmount,
            igstPercentage,
            igstAmount,
            notes,
            items,
        } = req.body as {
            customerId: string;
            paymentMethod?: string;
            subTotal?: string;
            discountAmount?: string;
            taxAmount?: string;
            totalAmount?: string;
            gstEnabled?: boolean;
            gstType?: string;
            gstPercentage?: string;
            taxableAmount?: string;
            cgstPercentage?: string;
            cgstAmount?: string;
            sgstPercentage?: string;
            sgstAmount?: string;
            igstPercentage?: string;
            igstAmount?: string;
            notes?: string;
            items: InvoiceItemInput[];
        };

        if (!customerId) {
            return res.status(400).json({ success: false, msg: 'customerId is required' });
        }
        if (!items?.length) {
            return res.status(400).json({ success: false, msg: 'At least one item is required' });
        }

        const invoice = await db.transaction(async (tx) => {
            // Verify customer exists
            const [customer] = await tx.select().from(customers).where(eq(customers.id, customerId)).limit(1);
            if (!customer) throw new Error('Customer not found');

            // Create invoice
            const invoiceNumber = await generateInvoiceNumber();
            const [newInvoice] = await tx.insert(invoices).values({
                invoiceNumber,
                userId: req.user?.id ?? null,
                customerId,
                subTotal: subTotal?.toString() ?? '0',
                discountAmount: discountAmount?.toString() ?? '0',
                taxAmount: taxAmount?.toString() ?? '0',
                totalAmount: totalAmount?.toString() ?? '0',
                // GST
                gstEnabled: !!gstEnabled,
                gstType: (gstType ?? 'INSIDE_TN') as 'INSIDE_TN' | 'OUTSIDE_TN',
                gstPercentage: parseFloat(gstPercentage ?? '0') || 0,
                taxableAmount: taxableAmount?.toString() ?? '0',
                cgstPercentage: parseFloat(cgstPercentage ?? '0') || 0,
                cgstAmount: cgstAmount?.toString() ?? '0',
                sgstPercentage: parseFloat(sgstPercentage ?? '0') || 0,
                sgstAmount: sgstAmount?.toString() ?? '0',
                igstPercentage: parseFloat(igstPercentage ?? '0') || 0,
                igstAmount: igstAmount?.toString() ?? '0',
                paymentMethod: (paymentMethod ?? 'cash') as PaymentMethodValue,
                notes: notes ?? null,
            }).returning();

            // Insert items with product snapshot
            for (const item of items) {
                let productSnapshot: InferSelectModel<typeof products> | null = null;
                if (item.productId) {
                    const [p] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
                    productSnapshot = p ?? null;
                }

                await tx.insert(invoiceItems).values({
                    invoiceId: newInvoice.id,
                    productId: item.productId ?? null,
                    productName: item.productName || productSnapshot?.name || 'Unknown Product',
                    productContent: productSnapshot?.slug ?? null,
                    productImage: productSnapshot?.image ?? null,
                    quantity: Number(item.quantity),
                    unitPrice: item.unitPrice?.toString() ?? '0',
                    totalPrice: item.totalPrice?.toString() ?? '0',
                });
            }

            return newInvoice;
        });

        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        console.error('Create Invoice Error:', error);
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /invoices
   Query: page, limit, search, paymentMethod
───────────────────────────────────────────────────────────────────────────── */
export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const page = queryToPositiveInt(req.query.page, 1);
        const limit = queryToPositiveInt(req.query.limit, 50);
        const search = req.query.search as string;
        const paymentMethodFilter = req.query.paymentMethod as string;
        const offset = (page - 1) * limit;

        const searchFilters: (SQL | undefined)[] = [];

        if (search) {
            const matchedCustomers = await db.select({ id: customers.id })
                .from(customers)
                .where(or(
                    ilike(customers.name, `%${search}%`),
                    ilike(customers.phone, `%${search}%`),
                    ilike(customers.email, `%${search}%`),
                ));
            const customerIds = matchedCustomers.map(c => c.id);

            searchFilters.push(or(
                ilike(invoices.invoiceNumber, `%${search}%`),
                customerIds.length > 0 ? inArray(invoices.customerId, customerIds) : undefined
            ));
        }

        if (paymentMethodFilter) {
            searchFilters.push(eq(invoices.paymentMethod, paymentMethodFilter as PaymentMethodValue));
        }

        const finalWhere = searchFilters.length > 0 ? and(...searchFilters) : undefined;

        const data = await db.query.invoices.findMany({
            where: finalWhere,
            with: { customer: true, user: true, items: true },
            orderBy: [desc(invoices.createdAt)],
            limit,
            offset,
        });

        const [totalCountResult] = await db.select({ count: sql<number>`count(*)` })
            .from(invoices)
            .where(finalWhere);

        const total = Number(totalCountResult?.count || 0);

        res.json({
            success: true,
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Get All Invoices Error:', error);
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /invoices/:id
───────────────────────────────────────────────────────────────────────────── */
export const getInvoiceById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, id),
            with: { customer: true, user: true, items: true },
        });

        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PUT /invoices/:id
   Body: { paymentMethod?, notes? }
───────────────────────────────────────────────────────────────────────────── */
export const updateInvoice = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { paymentMethod, notes } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        const [invoice] = await db.update(invoices)
            .set({ paymentMethod, notes, updatedAt: new Date() })
            .where(eq(invoices.id, id))
            .returning();

        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        res.json({ success: true, data: invoice });
    } catch (error) {
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE /invoices/:id
───────────────────────────────────────────────────────────────────────────── */
export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        const result = await db.delete(invoices).where(eq(invoices.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        res.json({ success: true, msg: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /invoices/bulk-delete
   Body: { ids: string[] }
───────────────────────────────────────────────────────────────────────────── */
export const bulkDeleteInvoices = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        for (const id of ids) await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        const result = await db.delete(invoices).where(inArray(invoices.id, ids));
        res.json({ success: true, msg: `${result.rowCount} invoices deleted` });
    } catch (error) {
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /invoices/:id/token  — encrypted token for PDF public URL
───────────────────────────────────────────────────────────────────────────── */
export const getInvoiceToken = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Invoice ID required' });

        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        const token = encrypt(id);
        res.json({ success: true, data: { token } });
    } catch (error) {
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /invoices/pdf/:token  — public PDF endpoint, token-based auth
───────────────────────────────────────────────────────────────────────────── */
export const getInvoicePDF = async (req: Request, res: Response) => {
    try {
        const encryptedId = paramToString(req.params[0] || req.params.encryptedId);
        if (!encryptedId) return res.status(400).json({ success: false, msg: 'Token required' });

        const invoiceId = decrypt(encryptedId);
        if (!invoiceId) return res.status(400).json({ success: false, msg: 'Invalid token' });

        const invoiceData = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceId),
            with: {
                customer: true,
                items: {
                    with: { product: true },
                },
            },
        });

        if (!invoiceData) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        const settingsRow = await db.select().from(settings).limit(1);
        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const verificationUrl = `${baseUrl}/api/v1/invoices/pdf/${encryptedId}`;
        const templateId = req.query.template as string;

        const s = settingsRow[0];
        const shopMapped = {
            name: s?.shopName || 'CRACKERS KINGDOM',
            address: s?.shopAddress || '',
            phone: s?.shopPhone || '',
            email: s?.shopEmail || '',
            gstin: s?.shopGst || '',
            website: s?.shopWebsite || '',
        };

        type InvoiceItemWithProduct = InferSelectModel<typeof invoiceItems> & {
            product?: InferSelectModel<typeof products> | null;
        };

        const invoiceMapped = {
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceDate: invoiceData.createdAt,
            customerName: invoiceData.customer?.name || '',
            customerAddress: invoiceData.customer?.address || '',
            customerEmail: invoiceData.customer?.email || '',
            customerPhone: invoiceData.customer?.phone || '',
            items: invoiceData.items.map((item: InvoiceItemWithProduct) => ({
                name: item.productName || item.product?.name || 'Unknown',
                description: item.productContent || item.product?.slug || '',
                unit: item.product?.unit || 'Nos',
                quantity: Number(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                total: parseFloat(item.totalPrice),
            })),
            subtotal: parseFloat(invoiceData.subTotal),
            discountAmount: parseFloat(invoiceData.discountAmount || '0'),
            taxableAmount: parseFloat(invoiceData.taxableAmount || '0'),
            gstEnabled: invoiceData.gstEnabled,
            gstType: invoiceData.gstType,
            gstPercentage: invoiceData.gstPercentage || 0,
            cgstPercentage: invoiceData.cgstPercentage || 0,
            cgstAmount: parseFloat(invoiceData.cgstAmount || '0'),
            sgstPercentage: invoiceData.sgstPercentage || 0,
            sgstAmount: parseFloat(invoiceData.sgstAmount || '0'),
            igstPercentage: invoiceData.igstPercentage || 0,
            igstAmount: parseFloat(invoiceData.igstAmount || '0'),
            taxAmount: parseFloat(invoiceData.taxAmount || '0'),
            grandTotal: parseFloat(invoiceData.totalAmount),
            paymentMethod: invoiceData.paymentMethod,
            notes: invoiceData.notes || 'Thank you for your business!',
            termsAndConditions: 'All items are non-refundable after purchase.',
            payQrLabel: 'Scan to Pay',
            verifyQrLabel: 'Scan to Verify',
        };

        let html = '';
        const dateObj = new Date(invoiceData.createdAt);
        const invoiceDateStr = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        html = renderInvoiceHtml({
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceDate: invoiceDateStr,
            company: {
                name: s?.shopName || 'CRACKERS KINGDOM',
                addressLines: (s?.shopAddress || '').split(',').map((l: string) => l.trim()).filter(Boolean),
                phone: s?.shopPhone || '',
                email: s?.shopEmail || '',
                gstin: s?.shopGst || ''
            },
            billTo: {
                name: invoiceData.customer?.name || '',
                addressLines: (invoiceData.customer?.address || '').split(',').map((l: string) => l.trim()).filter(Boolean),
                phone: invoiceData.customer?.phone || ''
            },
            items: invoiceData.items.map((item: InvoiceItemWithProduct) => ({
                description: item.productName || item.product?.name || 'Unknown',
                subDescription: item.productContent || item.product?.slug || '',
                uom: item.product?.unit || 'Nos',
                qty: Number(item.quantity),
                rate: parseFloat(item.unitPrice)
            })),
            tax: {
                cgstPercent: invoiceData.cgstPercentage || 0,
                sgstPercent: invoiceData.sgstPercentage || 0,
                igstPercent: invoiceData.igstPercentage || 0
            },
            amountInWords: numberToWords(parseFloat(invoiceData.totalAmount))
        });
        const pdf = await generatePDFFromHTML(html, `invoice_${invoiceData.id}`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice_${invoiceData.invoiceNumber}.pdf"`);
        res.send(pdf);
    } catch (error) {
        console.error('Get Invoice PDF Error:', error);
        res.status(500).json({ success: false, msg: getErrorMessage(error) });
    }
};
