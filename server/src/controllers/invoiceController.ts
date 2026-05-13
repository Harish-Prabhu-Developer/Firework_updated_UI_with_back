import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { invoices, invoiceItems, customers } from '../db/schema/invoices.js';
import { products } from '../db/schema/category.js';
import { settings } from '../db/schema/settings.js';
import { eq, inArray, desc } from 'drizzle-orm';
import { generateInvoiceNumber, formatCurrency } from '../utils/helpers.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { generatePDFFromHTML } from '../services/pdfService.js';
import { generateInvoiceHTML } from '../templates/invoiceTemplate.js';
import { generateQRCodeDataURL } from '../utils/qrCode.js';
import {
    bodyToStringArray,
    paramToString,
    queryToPositiveInt,
} from '../utils/request.js';

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const { CustomerData, items, discountAmount = 0, taxAmount = 0, paymentMethod = 'cash', notes } = req.body;
        
        if (!CustomerData || !items?.length) {
            return res.status(400).json({ success: false, msg: 'Customer details and items are required' });
        }

        const { phone, name, email, address } = CustomerData;
        if (!phone) return res.status(400).json({ success: false, msg: 'Customer phone is required' });

        // Find or create customer
        let customerId: string;
        const existingCustomer = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);

        if (existingCustomer[0]) {
            customerId = existingCustomer[0].id;
        } else {
            if (!name) return res.status(400).json({ success: false, msg: 'Customer name is required for registration' });
            const [newCustomer] = await db.insert(customers).values({
                name,
                phone,
                email: email || null,
                address: address || null,
            }).returning();
            customerId = newCustomer.id;
        }

        let subTotal = 0;
        const invoiceItemsData = [];
        for (const item of items) {
            let product = null;
            if (item.productId) {
                product = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
                if (!product[0]) return res.status(404).json({ success: false, msg: `Product ${item.productId} not found` });
            }
            const productName = item.productName || product?.[0]?.name;
            const unitPrice = parseFloat(item.unitPrice || product?.[0]?.sellingPrice || 0);
            const totalPrice = unitPrice * item.quantity;
            subTotal += totalPrice;

            invoiceItemsData.push({
                productId: item.productId || null,
                productName,
                productContent: item.productContent || product?.[0]?.slug || '',
                productImage: item.productImage || product?.[0]?.image || '',
                quantity: item.quantity,
                unitPrice: unitPrice.toString(),
                totalPrice: totalPrice.toString(),
            });
        }

        const totalAmount = subTotal + parseFloat(taxAmount) - parseFloat(discountAmount);
        const invoiceNumber = await generateInvoiceNumber();

        const [invoice] = await db.insert(invoices).values({
            invoiceNumber,
            userId: (req as any).user!.id,
            customerId,
            subTotal: subTotal.toString(),
            discountAmount: discountAmount.toString(),
            taxAmount: taxAmount.toString(),
            totalAmount: totalAmount.toString(),
            paymentMethod,
            notes: notes || null,
        }).returning();

        for (const item of invoiceItemsData) {
            await db.insert(invoiceItems).values({ ...item, invoiceId: invoice.id });
        }

        res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllInvoices = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const all = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
        const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        const withCustomer = await Promise.all(paginated.map(async inv => {
            const customer = await db.select().from(customers).where(eq(customers.id, inv.customerId)).limit(1);
            const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, inv.id));
            return { ...inv, customer: customer[0], items };
        }));
        res.json({ success: true, data: withCustomer, pagination: { page: pageNum, limit: limitNum, total: all.length, totalPages: Math.ceil(all.length / limitNum) } });
    } catch (error: any) {
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
        const encryptedId = paramToString(req.params.encryptedId);
        if (!encryptedId) return res.status(400).json({ success: false, msg: 'Encrypted invoice ID required' });

        const invoiceId = decrypt(encryptedId);
        if (!invoiceId) return res.status(400).json({ success: false, msg: 'Invalid invoice ID' });

        const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
        if (!invoice[0]) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        const customer = await db.select().from(customers).where(eq(customers.id, invoice[0].customerId)).limit(1);
        const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice[0].id));
        const shopSettings = await db.select().from(settings).limit(1);
        const shopInfo = shopSettings[0] || {};

        const customerData = customer[0];
        if (!customerData) return res.status(404).json({ success: false, msg: 'Customer not found' });

        const qrData = `Invoice: ${invoice[0].invoiceNumber}\nCustomer: ${customerData.name}\nAmount: ${formatCurrency(invoice[0].totalAmount)}`;
        const qrCodeDataUrl = shopInfo.invoiceQrStatus !== false ? await generateQRCodeDataURL(qrData) : '';

        const html = generateInvoiceHTML({ ...invoice[0], customer: customerData, items }, qrCodeDataUrl, shopInfo);
        const pdf = await generatePDFFromHTML(html, `invoice_${invoice[0].invoiceNumber}`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice_${invoice[0].invoiceNumber}.pdf"`);
        res.send(pdf);
    } catch (error: any) {
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
