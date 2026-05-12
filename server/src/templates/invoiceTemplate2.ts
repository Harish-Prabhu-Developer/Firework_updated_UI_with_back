export const generateInvoiceHTML2 = (invoiceData: any, qrCodeDataUrl: string, shopInfo: any) => {
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
            <td>${String(index + 1).padStart(2, '0')}</td>
            <td>
                <div class="product-info">
                    <span class="product-name">${item.productName || item.product?.name || 'Unknown Product'}</span>
                    ${item.product?.slug ? `<span class="product-desc">${item.product.slug}</span>` : ''}
                </div>
            </td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-right">₹${parseFloat(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="text-right">₹${parseFloat(item.totalPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${invoiceNumber}</title>
        <style>
            :root {
                --primary-color: #007bff;
                --secondary-color: #6c757d;
                --dark-color: #1a1a1a;
                --light-bg: #f8f9fa;
                --border-color: #e9ecef;
                --text-main: #333333;
                --text-muted: #777777;
            }

            * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                margin: 0; 
                padding: 0; 
                color: var(--text-main);
                background-color: #fff;
                line-height: 1.5;
            }
            .invoice-wrapper {
                max-width: 850px;
                margin: 0 auto;
                padding: 40px;
            }

            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 2px solid var(--primary-color);
                padding-bottom: 20px;
            }
            .shop-details h1 {
                margin: 0;
                font-size: 28px;
                color: var(--dark-color);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .shop-details p {
                margin: 4px 0;
                color: var(--text-muted);
                font-size: 14px;
            }

            .invoice-meta {
                text-align: right;
            }
            .invoice-label {
                font-size: 32px;
                font-weight: 800;
                color: var(--primary-color);
                margin: 0;
                line-height: 1;
            }
            .invoice-no {
                font-size: 16px;
                font-weight: 600;
                margin-top: 10px;
            }

            /* Info Grid */
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 40px;
            }
            .info-box h3 {
                font-size: 14px;
                text-transform: uppercase;
                color: var(--primary-color);
                margin-bottom: 12px;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 5px;
            }
            .info-box p {
                margin: 4px 0;
                font-size: 15px;
            }
            .info-box strong {
                color: var(--dark-color);
                display: block;
                font-size: 16px;
                margin-bottom: 2px;
            }

            /* Table Styles */
            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            thead th {
                background-color: var(--dark-color);
                color: white;
                text-align: left;
                padding: 12px 15px;
                font-size: 13px;
                text-transform: uppercase;
            }
            tbody td {
                padding: 15px;
                border-bottom: 1px solid var(--border-color);
                font-size: 14px;
                vertical-align: top;
            }
            .product-name { font-weight: 600; display: block; color: var(--dark-color); }
            .product-desc { font-size: 12px; color: var(--text-muted); }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }

            /* Calculation Section */
            .bottom-section {
                display: grid;
                grid-template-columns: 1.2fr 0.8fr;
                gap: 40px;
            }

            .payment-info {
                background: var(--light-bg);
                padding: 20px;
                border-radius: 8px;
            }
            .payment-info h4 { margin: 0 0 10px 0; font-size: 14px; color: var(--primary-color); }
            .payment-info p { margin: 5px 0; font-size: 13px; }

            .qr-container {
                margin-top: 15px;
                text-align: center;
                background: #fff;
                padding: 10px;
                display: inline-block;
                border: 1px solid var(--border-color);
            }
            .qr-container img { width: 100px; height: 100px; }

            .totals-table {
                width: 100%;
            }
            .totals-table tr td {
                padding: 8px 0;
                border-bottom: none;
            }
            .totals-table tr.grand-total td {
                border-top: 2px solid var(--dark-color);
                padding-top: 15px;
                font-size: 20px;
                font-weight: 800;
                color: var(--dark-color);
            }

            .footer {
                margin-top: 60px;
                text-align: center;
                border-top: 1px solid var(--border-color);
                padding-top: 20px;
                font-size: 12px;
                color: var(--text-muted);
            }

            @media print {
                .invoice-wrapper { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <header class="header">
                <div class="shop-details">
                    <h1>${shopInfo.shopName}</h1>
                    <p>${shopInfo.shopAddress}</p>
                    <p>Phone: +91 ${shopInfo.shopPhone}</p>
                    ${shopInfo.shopGst ? `<p>GSTIN: ${shopInfo.shopGst}</p>` : ''}
                </div>
                <div class="invoice-meta">
                    <h2 class="invoice-label">INVOICE</h2>
                    <div class="invoice-no">#${invoiceNumber}</div>
                    <p style="margin: 5px 0; font-size: 14px;">Date: <strong>${date}</strong></p>
                </div>
            </header>

            <div class="info-grid">
                <div class="info-box">
                    <h3>Billing To:</h3>
                    <strong>${customer?.name || 'Walk-in Customer'}</strong>
                    <p>${customer?.phone || ''}</p>
                    ${customer?.address ? `<p>${customer.address}</p>` : ''}
                </div>
                <div class="info-box">
                    <h3>Payment Details:</h3>
                    <p>Method: <strong>${paymentMethod.toUpperCase()}</strong></p>
                    <p>Status: <strong>PAID</strong></p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="50">#</th>
                        <th>Product Description</th>
                        <th class="text-center" width="80">Qty</th>
                        <th class="text-right" width="120">Unit Price</th>
                        <th class="text-right" width="120">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRows}
                </tbody>
            </table>

            <div class="bottom-section">
                <div class="left-col">
                    <div class="payment-info">
                        <h4>Notes & Information</h4>
                        <p>${notes || 'Thank you for your business. Please keep this invoice for your records.'}</p>
                        
                        <div class="qr-container">
                            <img src="${qrCodeDataUrl}" alt="Invoice QR">
                            <div style="font-size: 10px; margin-top: 5px; color: #999;">Scan to Verify</div>
                        </div>
                    </div>
                </div>
                <div class="right-col">
                    <table class="totals-table">
                        <tr>
                            <td>Sub Total</td>
                            <td class="text-right">₹${parseFloat(subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td>Discount (-)</td>
                            <td class="text-right">₹${parseFloat(discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                            <td>Tax Amount</td>
                            <td class="text-right">₹${parseFloat(taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr class="grand-total">
                            <td>Total</td>
                            <td class="text-right">₹${parseFloat(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <footer class="footer">
                <p>Terms: All items are non-refundable after purchase. High quality crackers for a bright celebration!</p>
                <p>&copy; ${new Date().getFullYear()} ${shopInfo.shopName}. All Rights Reserved.</p>
            </footer>
        </div>
    </body>
    </html>
    `;
};