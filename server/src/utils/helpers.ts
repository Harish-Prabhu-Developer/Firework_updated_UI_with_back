import { db } from '../db/index.js';
import { orders, invoices } from '../db/schema/invoices.js';
import { like, desc } from 'drizzle-orm';

export const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateOrderNumber = async (): Promise<string> => {
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
    return `ORD-${dateStr}-${nextSeq}`;
};

export const generateInvoiceNumber = async (): Promise<string> => {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
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
    return `INV-${dateStr}-${nextSeq}`;
};

export const toSlug = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
};

export const safeParseJSON = (jsonStr: string | null): any[] => {
    if (!jsonStr || jsonStr === 'null' || jsonStr.trim() === '') return [];
    try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero Rupees Only';
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

    const convert = (n: number): string => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
    };

    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let result = '';
    if (rupees > 0) result += convert(rupees) + 'Rupees ';
    if (paise > 0) result += (rupees > 0 ? 'and ' : '') + convert(paise) + 'Paise ';
    
    return result.trim() + ' Only';
};