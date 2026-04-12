import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOP_DETAILS = {
    shopName: 'CRACKERS KINGDOM',
    legalName: 'M/S NANDHINI TRADERS',
    addressLine1: 'Survey No: 299/13A1C, 299/15A2, Door No: 3/1362/20',
    addressLine2: 'Bharathi Nagar - II, Viswanatham',
    addressLine3: 'Sivakasi - 626189, Virudhunagar District',
    addressLine4: 'Tamil Nadu, India',
    contactLine: '+91 81442 71571 | crackerskingdom26@gmail.com',
    gstinLine: 'GSTIN: 30239HHJ343HG393',
} as const;

const resolveLogoDataUrl = () => {
    const candidatePaths = [
        path.resolve(__dirname, '../../assets/logo.png'),
        path.resolve(__dirname, '../../../src/assets/logo.png'),
        path.resolve(process.cwd(), 'src/assets/logo.png'),
        path.resolve(process.cwd(), 'server/src/assets/logo.png'),
    ];

    const logoPath = candidatePaths.find((candidate) => fs.existsSync(candidate));
    if (!logoPath) {
        return '';
    }

    const imageBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
};

const logoDataUrl = resolveLogoDataUrl();

const formatCurrency = (value: unknown) => {
    const numericValue = Number.parseFloat(String(value ?? 0));
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    return `&#8377;${safeValue.toFixed(2)}`;
};

export const generateOrderHTML = (orderData: any, qrCodeDataUrl: string, _shopInfo: any, isCopy: boolean = false) => {
    const {
        orderNumber,
        createdAt,
        customer,
        items,
        subTotal,
        totalAmount,
        notes,
    } = orderData;

    const date = new Date(createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const itemRows = (items || []).map((item: any, index: number) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <div class="product-name">${item.productName || item.product?.name || 'Unknown Product'}</div>
            </td>
            <td>${item.productContent || (item.product?.uom?.code ? `1${item.product.uom.code}` : '')}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right">${formatCurrency(item.totalPrice)}</td>
        </tr>
    `).join('');

    const brandLogoMarkup = logoDataUrl
        ? `<img src="${logoDataUrl}" alt="Crackers Kingdom" class="brand-logo-image" />`
        : '<span class="brand-logo-fallback">CK</span>';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order ${orderNumber}</title>
        <style>
            :root {
                --primary: hsl(43 65% 52%);
                --festive-gold: hsl(43 75% 52%);
                --footer-bg: hsl(240 10% 10%);
                --text-main: #1f2937;
                --text-muted: #6b7280;
                --border: #e5e7eb;
                --bg-light: #f9fafb;
            }

            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            body {
                font-family: 'Inter', sans-serif;
                color: var(--text-main);
                line-height: 1.5;
                margin: 0;
                padding: 40px;
                background: white;
            }

            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 20px;
                margin-bottom: 32px;
                border-bottom: 1px solid var(--border);
                padding-bottom: 24px;
            }

            .header-left {
                display: flex;
                align-items: flex-start;
                gap: 14px;
                flex: 1;
                min-width: 0;
            }

            .brand-logo-shell {
                position: relative;
                width: 94px;
                height: 94px;
                border-radius: 999px;
                padding: 2px;
                background: linear-gradient(135deg, var(--primary), var(--festive-gold), var(--primary));
                flex-shrink: 0;
            }

            .brand-logo-inner {
                position: relative;
                z-index: 2;
                width: 100%;
                height: 100%;
                border-radius: 999px;
                background: rgba(23, 23, 28, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .brand-logo-image {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 999px;
                padding: 4px;
            }

            .brand-logo-fallback {
                color: white;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 0.05em;
            }

            .brand-section h1 {
                margin: 0;
                color: var(--primary);
                font-size: 27px;
                line-height: 1.15;
                font-weight: 800;
                letter-spacing: 0.01em;
            }

            .brand-legal {
                margin: 5px 0 8px;
                color: #111827;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.03em;
            }

            .brand-line {
                margin: 1px 0;
                color: var(--text-main);
                font-size: 12.5px;
                line-height: 1.35;
            }

            .brand-contact {
                margin-top: 7px;
                font-size: 12.5px;
                font-weight: 600;
                color: #111827;
            }

            .brand-gstin {
                margin-top: 3px;
                font-size: 12.5px;
                font-weight: 700;
                color: #111827;
            }

            .invoice-meta {
                text-align: right;
            }

            .invoice-title {
                font-size: 30px;
                font-weight: 700;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .meta-item {
                font-size: 14px;
                color: var(--text-muted);
                margin-bottom: 2px;
            }

            .meta-item strong {
                color: var(--text-main);
            }

            .info-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 40px;
                margin-bottom: 40px;
                padding: 24px;
                background: var(--bg-light);
                border-radius: 12px;
            }

            .info-box h3 {
                font-size: 12px;
                text-transform: uppercase;
                color: var(--text-muted);
                margin: 0 0 12px;
                letter-spacing: 0.05em;
            }

            .info-box p {
                margin: 2px 0;
                font-size: 14px;
            }

            .info-box strong {
                font-size: 16px;
                display: block;
                margin-bottom: 4px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }

            th {
                background: var(--bg-light);
                text-align: left;
                padding: 12px 16px;
                font-size: 12px;
                text-transform: uppercase;
                color: var(--text-muted);
                border-bottom: 2px solid var(--border);
            }

            td {
                padding: 16px;
                border-bottom: 1px solid var(--border);
                font-size: 14px;
                vertical-align: top;
            }

            .product-name {
                font-weight: 600;
                color: var(--text-main);
            }

            .product-slug {
                font-size: 12px;
                color: var(--text-muted);
                font-style: italic;
            }

            .text-right {
                text-align: right;
            }

            .summary-section {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
            }

            .summary-table {
                width: 300px;
            }

            .summary-table tr td {
                padding: 8px 0;
                border-bottom: none;
            }

            .summary-table tr.total td {
                border-top: 2px solid var(--border);
                padding-top: 16px;
                font-weight: 700;
                font-size: 18px;
                color: var(--primary);
            }

            .footer {
                margin-top: 60px;
                padding-top: 20px;
                border-top: 1px solid var(--border);
                text-align: center;
                color: var(--text-muted);
                font-size: 12px;
            }

            .qr-code {
                width: 82px;
                height: 82px;
                border: 1px solid var(--border);
                padding: 5px;
                border-radius: 10px;
                background: white;
            }

            .header-right {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 12px;
            }

            @page {
                size: A4;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="header-left">
                    <div class="brand-logo-shell">
                        <div class="brand-logo-inner">
                            ${brandLogoMarkup}
                        </div>
                    </div>
                    <div class="brand-section">
                        <h1>${SHOP_DETAILS.shopName}</h1>
                        <p class="brand-legal">${SHOP_DETAILS.legalName}</p>
                        <p class="brand-line">${SHOP_DETAILS.addressLine1}</p>
                        <p class="brand-line">${SHOP_DETAILS.addressLine2}</p>
                        <p class="brand-line">${SHOP_DETAILS.addressLine3}</p>
                        <p class="brand-line">${SHOP_DETAILS.addressLine4}</p>
                        <p class="brand-contact">${SHOP_DETAILS.contactLine}</p>
                        <p class="brand-gstin">${SHOP_DETAILS.gstinLine}</p>
                    </div>
                </div>
                <div class="header-right">
                    <img src="${qrCodeDataUrl}" class="qr-code" />
                    <div class="invoice-meta">
                        <div class="invoice-title">${isCopy ? 'Order Receipt Copy' : 'Order Receipt'}</div>
                        <div class="meta-item">No: <strong>${orderNumber}</strong></div>
                        <div class="meta-item">Date: <strong>${date}</strong></div>
                    </div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <h3>Customer Details:</h3>
                    <strong>${customer.name}</strong>
                    <p>${customer.phone}</p>
                    <p>${customer.address || ''}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Item Description</th>
                        <th style="width: 80px;">Content</th>
                        <th class="text-right" style="width: 60px;">Qty</th>
                        <th class="text-right" style="width: 100px;">Price</th>
                        <th class="text-right" style="width: 100px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <div class="summary-section">
                <table class="summary-table">
                    <tr>
                        <td>Subtotal</td>
                        <td class="text-right">${formatCurrency(subTotal)}</td>
                    </tr>
                    <tr class="total">
                        <td>ESTIMATED TOTAL</td>
                        <td class="text-right">${formatCurrency(totalAmount)}</td>
                    </tr>
                </table>
            </div>

            ${notes ? `
            <div style="margin-top: 40px;">
                <h3 style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Notes:</h3>
                <p style="font-size: 14px; color: var(--text-main);">${notes}</p>
            </div>
            ` : ''}

            <div class="footer">
                <p>Thank you for your enquiry! This order is undergoing processing.</p>
                <p style="margin-top: 8px;">This is a system-generated order receipt.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
