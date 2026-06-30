
interface OrderItem {
  productName: string;
  content?: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

interface OrderReceivedData {
  orderNumber: string;
  orderDate: string;
  customerPhone: string;
  customerEmail: string;
  subtotal: string;
  discountAmount?: string;
  discountPercentage?: number;
  total: string;
  items: OrderItem[];
}

const formatCurrency = (value: number | string) =>
  `&#8377;${Number(value).toLocaleString("en-IN")}`;

const buildProductRows = (items: OrderItem[]): string =>
  items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #EEE;font-size:14px">
        <td style="padding:10px">${item.productName}</td>
        <td align="center" style="padding:10px">${item.content || ""}</td>
        <td align="center" style="padding:10px">${item.quantity}</td>
        <td align="right" style="padding:10px">${formatCurrency(item.unitPrice)}</td>
        <td align="right" style="padding:10px">${formatCurrency(item.totalPrice)}</td>
      </tr>`
    )
    .join("");

export const OrderReceivedTemplate = (data: OrderReceivedData): string => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Crackers Kingdom</title>
<style>
body { margin:0; background:#F7F4EF; font-family:Arial, sans-serif; color:#1A1A1A; }
.container { width:600px; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.08); }
.footer { background:#1A1A1A; color:#B8B8B8; font-size:12px; }
</style>
</head>

<body>

<table width="100%" bgcolor="#F7F4EF" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:40px 10px">

<table class="container" cellpadding="0" cellspacing="0" border="0">

<!-- HEADER -->
<tr>
<td align="center" style="background:#D4A017;padding:30px">
  <div style="background:#000000;padding:14px 24px;border-radius:8px;display:inline-block">
    <span style="color:#D4A017;font-size:32px;font-weight:900;font-family:Arial,Helvetica,sans-serif;letter-spacing:4px;line-height:1">CK</span>
  </div>
  <h1 style="color:#ffffff;margin-top:14px;font-size:26px;font-weight:700;font-family:Arial,Helvetica,sans-serif;margin-bottom:4px">
    Crackers Kingdom
  </h1>
  <p style="color:#fff7e2;font-size:14px;margin-top:6px;font-family:Arial,Helvetica,sans-serif;margin-bottom:0">
    Premium Sivakasi Crackers Shop
  </p>
</td>
</tr>

<!-- MESSAGE -->
<tr>
<td style="padding:35px">
  <p style="font-size:14px;color:#D4A017;font-weight:600;margin-bottom:6px;margin-top:0">
    Order Enquiry Received
  </p>
  <h2 style="font-size:22px;margin-bottom:12px;margin-top:0;font-family:Arial,Helvetica,sans-serif">
    Thank you for choosing Crackers Kingdom
  </h2>
  <p style="color:#6B6B6B;font-size:15px;line-height:1.6;margin:0">
    Your estimate request has been successfully received by <strong>Crackers Kingdom</strong>.
    Our team will review your enquiry and contact you shortly to confirm the order details and delivery information.
  </p>
</td>
</tr>

<!-- INTRO CARD -->
<tr>
<td style="padding:0 35px 30px 35px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F4EF;border-radius:14px">
    <tr>
      <td width="40%" style="padding:20px" align="center">
        <div style="width:120px;height:120px;border-radius:50%;background:#D4A017;display:inline-block;text-align:center;line-height:120px">
          <span style="color:#000000;font-size:36px;font-weight:900;font-family:Arial,Helvetica,sans-serif;letter-spacing:3px;line-height:120px">CK</span>
        </div>
      </td>
      <td width="60%" style="padding:20px">
        <h3 style="margin:0 0 8px 0;color:#D4A017;font-family:Arial,Helvetica,sans-serif">Enquiry Received</h3>
        <p style="font-size:14px;color:#6B6B6B;line-height:1.6;margin:0">
          Our team will verify your estimate and reach you within <strong>2 hours</strong> to confirm availability, pricing, and delivery options.
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- ORDER DETAILS -->
<tr>
<td style="padding:0 35px 30px 35px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #EEE;border-radius:12px">
    <tr>
      <td style="padding:16px;font-size:14px;color:#444">
        <strong>Enquiry ID:</strong> ${data.orderNumber} <br><br>
        <strong>Date:</strong> ${data.orderDate} <br><br>
        <strong>Phone:</strong> ${data.customerPhone} <br><br>
        <strong>Email:</strong> ${data.customerEmail}
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- ESTIMATE SUMMARY -->
<tr>
<td style="padding:0 35px 25px 35px">
  <h3 style="font-size:20px;margin-bottom:15px;margin-top:0;font-family:Arial,Helvetica,sans-serif">Estimate Summary</h3>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr style="background:#F7F4EF;font-size:13px">
      <th align="left" style="padding:10px">Product</th>
      <th align="center" style="padding:10px">Content</th>
      <th align="center" style="padding:10px">Qty</th>
      <th align="right" style="padding:10px">Price</th>
      <th align="right" style="padding:10px">Subtotal</th>
    </tr>
    ${buildProductRows(data.items)}
  </table>
</td>
</tr>

<!-- TOTAL -->
<tr>
<td style="padding:0 35px 30px 35px" align="right">
  <table width="250" cellpadding="0" cellspacing="0" border="0" style="background:#F7F4EF;border-radius:12px">
    <tr>
      <td style="padding:16px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:14px;padding-bottom:6px">Net Total</td>
            <td align="right" style="font-size:14px;padding-bottom:6px">${data.subtotal}</td>
          </tr>
          ${data.discountAmount && data.discountAmount !== '&#8377;0' ? `
          <tr>
            <td style="padding-bottom:6px; color: #16a34a; font-weight: 500;">You Save</td>
            <td align="right" style="padding-bottom:6px; color: #16a34a; font-weight: 500;">- ${data.discountAmount}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding-bottom:6px">Delivery</td>
            <td align="right" style="padding-bottom:6px">To be confirmed</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:4px;border-top:1px dashed #DDD;font-size:1px">&nbsp;</td>
          </tr>
          <tr>
            <td style="font-weight:700;padding-top:10px">Overall Total</td>
            <td align="right" style="font-weight:700;color:#D4A017;padding-top:10px">
              ${data.total}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- NOTICE -->
<tr>
<td style="padding:0 35px 30px 35px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF8E3;border-radius:12px">
    <tr>
      <td style="padding:16px">
        <p style="font-weight:600;margin:0 0 6px 0">Estimate Summary Included</p>
        <p style="font-size:13px;color:#6B6B6B;line-height:1.6;margin:0">
          Your estimate summary is included in this email for quick reference.
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- ADDRESS -->
<tr>
<td style="padding:0 35px 35px 35px;font-size:13px;color:#555;line-height:1.7">
  <strong>Crackers Kingdom</strong><br>
  M/S NANDHINI TRADERS<br>
  Survey No: 299/13A1C, 299/15A2<br>
  Bharathi Nagar II, Viswanatham<br>
  Sivakasi, Virudhunagar
</td>
</tr>

<!-- FOOTER -->
<tr>
<td class="footer" align="center" style="padding:25px;background:#1A1A1A;color:#B8B8B8;font-size:12px">
  &copy; 2026 Crackers Kingdom<br>
  Premium Sivakasi Crackers Shop
  <br><br>
  Support: +91 81442 71571
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`;
