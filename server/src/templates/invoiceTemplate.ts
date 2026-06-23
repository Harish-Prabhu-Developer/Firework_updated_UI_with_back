import { InvoiceInput, InvoiceComputedTotals, InvoiceLineItem } from './types.js';
import { DEFAULT_LOGO_DATA_URL } from './defaultLogo.js';

/**
 * Formats a number as Indian-style currency grouping (e.g. 1,42,500.00)
 * without a currency symbol.
 */
function formatInr(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  let lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  if (rest !== '') {
    lastThree = ',' + lastThree;
  }
  const grouped =
    rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const sign = value < 0 ? '-' : '';
  return `${sign}${grouped}.${decPart}`;
}

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Computes subtotal, tax breakdown, and grand total from line items.
 * Pass an explicit roundOff in InvoiceInput to override the auto-calculated value.
 */
export function computeTotals(input: InvoiceInput): InvoiceComputedTotals {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0
  );
  const freight = input.freightCharge ?? 0;
  const taxableBase = subtotal + freight;

  const igstAmount = input.tax.igstPercent
    ? (taxableBase * input.tax.igstPercent) / 100
    : 0;
  const cgstAmount = input.tax.igstPercent
    ? 0
    : (taxableBase * (input.tax.cgstPercent || 0)) / 100;
  const sgstAmount = input.tax.igstPercent
    ? 0
    : (taxableBase * (input.tax.sgstPercent || 0)) / 100;

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const rawTotal = taxableBase + totalTax;

  const roundedTotal = Math.round(rawTotal);
  const autoRoundOff = roundedTotal - rawTotal;
  const roundOff = input.roundOff ?? autoRoundOff;

  const grandTotal = rawTotal + roundOff;

  return {
    subtotal,
    freight,
    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOff,
    grandTotal,
    totalTax,
  };
}

function renderLineItemRow(item: InvoiceLineItem, index: number): string {
  const amount = item.qty * item.rate;
  return `
          <tr>
            <td class="sno-cell">${String(index + 1).padStart(2, '0')}</td>
            <td>
              <div class="prod-name">${escapeHtml(item.description)}</div>
              ${item.subDescription ? `<div class="prod-desc">${escapeHtml(item.subDescription)}</div>` : ''}
              ${item.hsnCode ? `<div><span class="hsn-tag">HSN: ${escapeHtml(item.hsnCode)}</span></div>` : ''}
            </td>
            <td class="uom-cell">${escapeHtml(item.uom)}</td>
            <td class="r">${item.qty}</td>
            <td class="r">${formatInr(item.rate)}</td>
            <td class="r" style="font-weight:500">${formatInr(amount)}</td>
          </tr>`;
}

function renderAddressBlock(lines: string[]): string {
  return lines.filter(Boolean).map(escapeHtml).join('<br>');
}

function renderTaxRows(input: InvoiceInput, totals: InvoiceComputedTotals): string {
  if (input.tax.igstPercent) {
    return `
          <tr class="tax-row"><td>IGST @ ${input.tax.igstPercent}%</td><td class="r">${formatInr(totals.igstAmount)}</td></tr>`;
  }
  return `
          <tr class="tax-row"><td>CGST @ ${input.tax.cgstPercent || 0}%</td><td class="r">${formatInr(totals.cgstAmount)}</td></tr>
          <tr class="tax-row"><td>SGST @ ${input.tax.sgstPercent || 0}%</td><td class="r">${formatInr(totals.sgstAmount)}</td></tr>`;
}

const DEFAULT_PLACEHOLDER_QR = (label: string) => `
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <rect width="80" height="80" fill="white"/>
              <rect x="6" y="6" width="26" height="26" rx="2" fill="none" stroke="#999" stroke-width="2.5"/>
              <rect x="48" y="6" width="26" height="26" rx="2" fill="none" stroke="#999" stroke-width="2.5"/>
              <rect x="6" y="48" width="26" height="26" rx="2" fill="none" stroke="#999" stroke-width="2.5"/>
              <text x="40" y="44" font-size="8" text-anchor="middle" fill="#999" font-family="sans-serif">${escapeHtml(label)}</text>
            </svg>`;

function renderQrBlock(label: string, sublabel: string, dataUrl?: string): string {
  const content = dataUrl && dataUrl !== 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    ? `<img src="${dataUrl}" alt="${escapeHtml(label)}" style="width:80px;height:80px;display:block;" />`
    : DEFAULT_PLACEHOLDER_QR(label);
  return `
        <div class="qr-block">
          <div class="qr-label">${escapeHtml(label)}</div>
          <div class="qr-box">${content}</div>
          <div class="qr-sublabel">${escapeHtml(sublabel)}</div>
        </div>`;
}

/**
 * Renders the full invoice as a standalone HTML string, ready to be
 * passed to Puppeteer's page.setContent().
 */
export function renderInvoiceHtml(input: InvoiceInput): string {
  const totals = computeTotals(input);
  const shipTo = input.shipTo ?? input.billTo;
  const logo = input.logoDataUrl ?? DEFAULT_LOGO_DATA_URL;
  const accent = input.accentColor ?? '#b8860b';
  const watermarkOpacity = input.watermarkOpacity ?? 0.07;

  const itemRows = input.items.map(renderLineItemRow).join('');

  const freightRow =
    totals.freight > 0
      ? `
      <table style="width:100%;border-collapse:collapse">
        <tr class="freight-wrap">
          <td style="width:44px"></td>
          <td colspan="3">Freight &amp; handling charges (lumpsum)</td>
          <td class="r" style="width:100px">${formatInr(totals.freight)}</td>
        </tr>
      </table>`
      : '';

  const shippingRows = input.shippingDetails
    ? `
        ${input.shippingDetails.transport ? `<div class="detail-line"><span class="detail-key">Transport</span><span class="detail-val">${escapeHtml(input.shippingDetails.transport)}</span></div>` : ''}
        ${input.shippingDetails.vehicleNo ? `<div class="detail-line"><span class="detail-key">Vehicle No.</span><span class="detail-val">${escapeHtml(input.shippingDetails.vehicleNo)}</span></div>` : ''}
        ${input.shippingDetails.ewayBill ? `<div class="detail-line"><span class="detail-key">E-Way Bill</span><span class="detail-val">${escapeHtml(input.shippingDetails.ewayBill)}</span></div>` : ''}`
    : '';

  const bankBlock = input.bank
    ? `
        <div class="bank-label">
          <strong>Bank Details</strong><br>
          Bank: ${escapeHtml(input.bank.bankName)} &nbsp;|&nbsp; A/C: ${escapeHtml(input.bank.accountNo)}<br>
          IFSC: ${escapeHtml(input.bank.ifsc)} &nbsp;|&nbsp; Branch: ${escapeHtml(input.bank.branch)}
        </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tax Invoice ${escapeHtml(input.invoiceNumber)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'IBM Plex Sans',sans-serif;font-size:13px;background:#f4f4f0;color:#1a1a1a;padding:0}
  .inv-wrap{max-width:860px;margin:0 auto}
  .inv-page{background:#fff;border:0.5px solid #d0cfc8;border-radius:12px;overflow:hidden;position:relative}
  .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:420px;height:420px;background-image:url('${logo}');background-size:contain;background-repeat:no-repeat;background-position:center;opacity:${watermarkOpacity};pointer-events:none;z-index:0}
  .inv-page>*:not(.watermark){position:relative;z-index:1}
  .qr-bar{display:flex;justify-content:space-between;align-items:center;background:#f8f8f4;border-bottom:0.5px solid #e4e3dc;padding:16px 24px;gap:12px}
  .qr-bar-note{font-size:11px;color:#888780;flex:1}
  .qr-pair{display:flex;gap:32px}
  .qr-block{display:flex;flex-direction:column;align-items:center;gap:6px}
  .qr-label{font-size:11px;font-weight:500;color:#5f5e5a;text-transform:uppercase;letter-spacing:.06em}
  .qr-sublabel{font-size:10px;color:#888780}
  .qr-box{width:80px;height:80px;border:0.5px solid #d0cfc8;border-radius:6px;overflow:hidden;background:#fff}
  .header-band{display:flex;justify-content:space-between;align-items:center;padding:18px 24px 16px;border-bottom:2px solid ${accent};background:linear-gradient(to right,#fffdf5,#fff)}
  .header-left{display:flex;align-items:center;gap:14px}
  .logo-img{width:70px;height:70px;border-radius:50%;object-fit:cover;flex-shrink:0}
  .company-name{font-size:19px;font-weight:600;letter-spacing:-.01em;color:#1a1a1a;margin-bottom:3px}
  .company-sub{font-size:12px;color:#5f5e5a;line-height:1.65}
  .inv-title-block{text-align:right}
  .inv-title{font-size:18px;font-weight:600;color:${accent};letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
  .inv-meta{font-size:12px;color:#5f5e5a;line-height:1.7;font-family:'IBM Plex Mono',monospace}
  .inv-meta strong{color:#1a1a1a;font-weight:500}
  .section-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:0.5px solid #e4e3dc}
  .section-cell{padding:14px 24px}
  .section-cell:first-child{border-right:0.5px solid #e4e3dc}
  .section-heading{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${accent};margin-bottom:8px}
  .cust-name{font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:4px}
  .cust-addr{font-size:12px;color:#5f5e5a;line-height:1.7}
  .detail-line{display:flex;gap:6px;margin-top:4px;font-size:12px}
  .detail-key{color:#5f5e5a;min-width:80px}
  .detail-val{color:#1a1a1a;font-weight:500}
  .table-wrap{padding:0 24px}
  table.inv-table{width:100%;border-collapse:collapse;margin:16px 0 0;table-layout:fixed}
  .inv-table thead th{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#fff;padding:9px 10px;background:${accent};text-align:left}
  .inv-table thead th.r{text-align:right}
  .inv-table tbody td{padding:9px 10px;border-bottom:0.5px solid #e4e3dc;font-size:12.5px;vertical-align:top}
  .inv-table tbody tr:nth-child(even) td{background:#fffdf5}
  .inv-table tbody tr:last-child td{border-bottom:none}
  .inv-table tbody td.r{text-align:right;font-family:'IBM Plex Mono',monospace}
  .col-sno{width:44px}.col-desc{width:auto}.col-uom{width:64px}.col-qty{width:56px}.col-rate{width:90px}.col-amt{width:100px}
  .prod-name{font-weight:500;color:#1a1a1a}
  .prod-desc{font-size:11px;color:#5f5e5a;margin-top:2px}
  .hsn-tag{display:inline-block;font-size:10px;background:#f8f4e8;border:0.5px solid #e8d898;border-radius:4px;padding:1px 5px;color:#7a6020;margin-top:3px;font-family:'IBM Plex Mono',monospace}
  .sno-cell{color:#888780}
  .uom-cell{font-family:'IBM Plex Mono',monospace;color:#888780}
  .freight-wrap td{padding:10px;border-top:0.5px solid ${accent};font-size:12px;color:#5f5e5a;font-style:italic}
  .freight-wrap td.r{text-align:right;font-family:'IBM Plex Mono',monospace;font-style:normal;font-size:12.5px}
  .footer-row{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid ${accent}}
  .words-cell{padding:16px 24px;border-right:0.5px solid #e4e3dc}
  .words-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:${accent};margin-bottom:6px}
  .words-val{font-size:12.5px;color:#1a1a1a;font-style:italic;font-weight:500;line-height:1.5}
  .bank-label{font-size:11px;color:#888780;line-height:1.7;margin-top:14px}
  .bank-label strong{color:#5f5e5a}
  .totals-cell{padding:12px 24px}
  table.totals-table{width:100%;border-collapse:collapse}
  .totals-table td{padding:4px 0;font-size:13px}
  .totals-table td.r{text-align:right;font-family:'IBM Plex Mono',monospace}
  .totals-table .sub-label{color:#5f5e5a}
  .totals-table .tax-row td{font-size:12px;color:#5f5e5a}
  .totals-table .sep td{border-bottom:0.5px solid #c8c7c0;padding-bottom:8px}
  .totals-table .grand-row td{font-size:15px;font-weight:600;padding-top:8px}
  .grand-total-amt{color:${accent}}
  .tax-note{font-size:11px;color:#888780;padding-top:4px}
  .bottom-strip{border-top:0.5px solid #e4e3dc;padding:20px 24px 18px;background:#fffdf5;display:flex;flex-direction:column;align-items:center;gap:0}
  .contact-row{display:flex;justify-content:center;align-items:center;gap:20px}
  .contact-item{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#5f5e5a}
  .contact-icon{width:15px;height:15px;flex-shrink:0;color:${accent}}
  .contact-item span{color:#1a1a1a;font-weight:500}
  .vdiv{width:1px;height:16px;background:#e4e3dc}
  .hdiv{width:100%;border:none;border-top:0.5px solid #e0d5aa;margin:14px 0 12px}
  .thankyou-text{font-size:15px;font-weight:600;color:${accent};letter-spacing:.01em;text-align:center;margin-bottom:8px}
  .autogen-text{font-size:11px;color:#888780;text-align:center;font-style:italic}
  @media print{body{background:#fff}.inv-page{border:none;border-radius:0}@page{margin:12mm;size:A4}}
</style>
</head>
<body>
<div class="inv-wrap">
  <div class="inv-page">
    <div class="watermark" aria-hidden="true"></div>

    <div class="qr-bar">
      <div class="qr-bar-note">Scan QR codes for payment or to verify this invoice</div>
      <div class="qr-pair">${renderQrBlock('Scan to Pay', 'UPI / Bank Transfer', input.qr?.paymentQrDataUrl)}${renderQrBlock('Invoice QR', 'Verify on GST Portal', input.qr?.invoiceQrDataUrl)}</div>
    </div>

    <div class="header-band">
      <div class="header-left">
        <img class="logo-img" src="${logo}" alt="${escapeHtml(input.company.name)} Logo">
        <div>
          <div class="company-name">${escapeHtml(input.company.name)}</div>
          <div class="company-sub">
            ${renderAddressBlock(input.company.addressLines)}<br>
            Ph: ${escapeHtml(input.company.phone)}<br>
            GSTIN: ${escapeHtml(input.company.gstin)}${input.company.pan ? ` &nbsp;|&nbsp; PAN: ${escapeHtml(input.company.pan)}` : ''}
          </div>
        </div>
      </div>
      <div class="inv-title-block">
        <div class="inv-title">Tax Invoice</div>
        <div class="inv-meta">
          <strong>Invoice No.</strong>&nbsp; ${escapeHtml(input.invoiceNumber)}<br>
          <strong>Date</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${escapeHtml(input.invoiceDate)}<br>
          ${input.dueDate ? `<strong>Due Date</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${escapeHtml(input.dueDate)}<br>` : ''}
          ${input.placeOfSupply ? `<strong>Place of Supply</strong>&nbsp; ${escapeHtml(input.placeOfSupply)}` : ''}
        </div>
      </div>
    </div>

    <div class="section-row">
      <div class="section-cell">
        <div class="section-heading">Bill To</div>
        <div class="cust-name">${escapeHtml(input.billTo.name)}</div>
        <div class="cust-addr">${renderAddressBlock(input.billTo.addressLines)}${input.billTo.phone ? `<br>Ph: ${escapeHtml(input.billTo.phone)}` : ''}</div>
        ${input.billTo.gstin ? `<div class="detail-line"><span class="detail-key">GSTIN</span><span class="detail-val">${escapeHtml(input.billTo.gstin)}</span></div>` : ''}
      </div>
      <div class="section-cell">
        <div class="section-heading">Ship To</div>
        <div class="cust-name">${escapeHtml(shipTo.name)}</div>
        <div class="cust-addr">${renderAddressBlock(shipTo.addressLines)}</div>
        ${shippingRows}
      </div>
    </div>

    <div class="table-wrap">
      <table class="inv-table">
        <colgroup><col class="col-sno"><col class="col-desc"><col class="col-uom"><col class="col-qty"><col class="col-rate"><col class="col-amt"></colgroup>
        <thead>
          <tr><th>S.No.</th><th>Product Description</th><th>UOM</th><th class="r">Qty</th><th class="r">Rate (&#8377;)</th><th class="r">Amount (&#8377;)</th></tr>
        </thead>
        <tbody>${itemRows}
        </tbody>
      </table>
      ${freightRow}
    </div>

    <div class="footer-row">
      <div class="words-cell">
        <div class="words-label">Amount in Words</div>
        <div class="words-val">${escapeHtml(input.amountInWords)}</div>
        ${bankBlock}
      </div>
      <div class="totals-cell">
        <table class="totals-table">
          <tr><td class="sub-label">Subtotal</td><td class="r">${formatInr(totals.subtotal)}</td></tr>
          ${totals.freight > 0 ? `<tr><td class="sub-label">Freight</td><td class="r">${formatInr(totals.freight)}</td></tr>` : ''}
          ${renderTaxRows(input, totals)}
          <tr class="tax-row sep"><td>Round Off</td><td class="r">${totals.roundOff < 0 ? '-' : ''}${formatInr(Math.abs(totals.roundOff))}</td></tr>
          <tr class="grand-row"><td>Grand Total</td><td class="r grand-total-amt">&#8377; ${formatInr(totals.grandTotal)}</td></tr>
          <tr><td colspan="2" class="tax-note">Tax included: &#8377; ${formatInr(totals.totalTax)}</td></tr>
        </table>
      </div>
    </div>

    <div class="bottom-strip">
      <div class="contact-row">
        <div class="contact-item">
          <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
          <span>${escapeHtml(input.company.email)}</span>
        </div>
        <div class="vdiv"></div>
        <div class="contact-item">
          <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.07 2.18 2 2 0 012.06 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <span>${escapeHtml(input.company.phone)}</span>
        </div>
      </div>
      <hr class="hdiv">
      <div class="thankyou-text">Thank you for your business &mdash; we truly value your trust in us.</div>
      <div class="autogen-text">This is a computer-generated invoice. No signature is required.</div>
    </div>
  </div>
</div>
</body>
</html>`;
}
