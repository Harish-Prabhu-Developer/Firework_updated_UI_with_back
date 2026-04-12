export const generateInvoiceHTML = (invoiceData: any, qrCodeDataUrl: string, shopInfo: any) => {
    const {
        invoiceNumber,
        createdAt,
        customer,
        items,
        subTotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paymentMethod,
        notes
    } = invoiceData;

    const date = new Date(createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    const itemRows = items.map((item: any, index: number) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <div class="product-name">${item.productName || item.product?.name || 'Unknown Product'}</div>
                <div class="product-slug">${item.product?.slug || ''}</div>
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹${parseFloat(item.unitPrice).toFixed(2)}</td>
            <td class="text-right">₹${parseFloat(item.totalPrice).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber}</title>
        <style>
            /* @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); */
            
            :root {
                --primary: #4f46e5;
                --text-main: #1f2937;
                --text-muted: #6b7280;
                --border: #e5e7eb;
                --bg-light: #f9fafb;
            }

            * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
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
                margin-bottom: 40px;
            }

            .brand-section h1 {
                margin: 0;
                color: var(--primary);
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.025em;
            }

            .brand-section p {
                margin: 4px 0 0;
                color: var(--text-muted);
                font-size: 14px;
            }

            .invoice-meta {
                text-align: right;
            }

            .invoice-title {
                font-size: 32px;
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
                grid-template-columns: 1fr 1fr;
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

            .payment-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 600;
                background: #dcfce7;
                color: #166534;
                text-transform: uppercase;
            }

            .qr-code {
                width: 80px;
                height: 80px;
                border: 1px solid var(--border);
                padding: 4px;
                border-radius: 8px;
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
                <div class="brand-section">
                    <h1>${shopInfo.shopName.toUpperCase()}</h1>
                    <p>${shopInfo.shopAddress}</p>
                    <p>Mob: ${shopInfo.shopPhone}${shopInfo.shopGst ? ` | GST: ${shopInfo.shopGst}` : ''}</p>
                </div>
                <div class="header-right">
                    <img src="${qrCodeDataUrl}" class="qr-code" />
                    <div class="invoice-meta">
                        <div class="invoice-title">Invoice</div>
                        <div class="meta-item">No: <strong>${invoiceNumber}</strong></div>
                        <div class="meta-item">Date: <strong>${date}</strong></div>
                    </div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <h3>Bill To:</h3>
                    <strong>${customer.name}</strong>
                    <p>${customer.phone}</p>
                    <p>${customer.email || ''}</p>
                    <p>${customer.address || ''}</p>
                </div>
                <div class="info-box">
                    <h3>Payment Info:</h3>
                    <p>Method: <span class="payment-badge">${paymentMethod}</span></p>
                    <p>Status: <span class="payment-badge">Paid</span></p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th>Item Description</th>
                        <th class="text-right" style="width: 80px;">Qty</th>
                        <th class="text-right" style="width: 120px;">Price</th>
                        <th class="text-right" style="width: 120px;">Total</th>
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
                        <td class="text-right">₹${parseFloat(subTotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Discount (-)</td>
                        <td class="text-right">₹${parseFloat(discountAmount).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Tax</td>
                        <td class="text-right">₹${parseFloat(taxAmount).toFixed(2)}</td>
                    </tr>
                    <tr class="total">
                        <td>GRAND TOTAL</td>
                        <td class="text-right">₹${parseFloat(totalAmount).toFixed(2)}</td>
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
                <p>Thank you for choosing Crackers Shop! Wish you a happy and bright celebration.</p>
                <p style="margin-top: 8px;">This is a system-generated invoice.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
