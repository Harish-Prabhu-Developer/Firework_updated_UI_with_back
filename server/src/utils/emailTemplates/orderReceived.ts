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
  total: string;
  items: OrderItem[];
}

const formatCurrency = (val: number | string) =>
  `₹${Number(val).toLocaleString("en-IN")}`;

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
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<title>Crackers Kingdom</title>
<style>
body { margin:0; background:#F7F4EF; font-family:'DM Sans', Arial, sans-serif; color:#1A1A1A; }
.container { width:600px; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.08); }
.heading { font-family:'Playfair Display', serif; }
.primary { color:#D4A017; }
.button { background:#D4A017; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block; }
.footer { background:#1A1A1A; color:#B8B8B8; font-size:12px; }
</style>
</head>

<body>

<table width="100%" bgcolor="#F7F4EF">
<tr>
<td align="center" style="padding:40px 10px">

<table class="container">

<!-- HEADER -->
<tr>
<td align="center" style="background:#D4A017;padding:30px">
  <div style="background:#000000;padding:12px 20px;border-radius:8px;display:inline-block">
    <img src="https://crackerskingdom-demo2.netlify.app/assets/logo-DfoKolw9.png" width="140" alt="Crackers Kingdom Logo" style="display:block">
  </div>
  <h1 class="heading" style="color:#ffffff;margin-top:14px;font-size:26px;font-weight:700;font-family:Arial,Helvetica,sans-serif">
    Crackers Kingdom
  </h1>
  <p style="color:#fff7e2;font-size:14px;margin-top:6px;font-family:Arial,Helvetica,sans-serif">
    Premium Sivakasi Crackers Shop
  </p>
</td>
</tr>

<!-- MESSAGE -->
<tr>
<td style="padding:35px">
  <p style="font-size:14px;color:#D4A017;font-weight:600;margin-bottom:6px">
    Order Enquiry Received
  </p>
  <h2 class="heading" style="font-size:22px;margin-bottom:12px">
    Thank you for choosing Crackers Kingdom
  </h2>
  <p style="color:#6B6B6B;font-size:15px;line-height:1.6">
    Your estimate request has been successfully received by <strong>Crackers Kingdom</strong>.
    Our team will review your enquiry and contact you shortly to confirm the order details and delivery information.
  </p>
</td>
</tr>

<!-- SHOP IMAGE -->
<tr>
<td style="padding:0 35px 30px 35px">
  <table width="100%" style="background:#F7F4EF;border-radius:14px">
    <tr>
      <td width="40%" style="padding:10px" align="center">
        <div style="width:180px;height:180px;border-radius:999px;padding:3px;background:linear-gradient(135deg,#D4A017,#E7C561,#D4A017);box-shadow:0 0 0 4px rgba(212,160,23,0.18),0 0 26px rgba(212,160,23,0.55);display:inline-block"><div style="width:100%;height:100%;border-radius:999px;background:#111111;border:1px solid rgba(255,255,255,0.2);overflow:hidden"><img src="https://crackerskingdom-demo2.netlify.app/assets/logo-DfoKolw9.png" width="100%" alt="Crackers Kingdom Logo" style="display:block;width:100%;height:100%;object-fit:contain;padding:8px;border-radius:999px"></div></div>
      </td>
      <td width="60%" style="padding:20px">
        <h3 class="heading primary" style="margin:0 0 8px 0">Enquiry Received</h3>
        <p style="font-size:14px;color:#6B6B6B;line-height:1.6">
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
  <table width="100%" style="border:1px solid #EEE;border-radius:12px">
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
  <h3 class="heading" style="font-size:20px;margin-bottom:15px">Estimate Summary</h3>
  <table width="100%" style="border-collapse:collapse">
    <tr style="background:#F7F4EF;font-size:13px">
      <th align="left" style="padding:10px">Product</th>
      <th align="center">Content</th>
      <th align="center">Qty</th>
      <th align="right">Price</th>
      <th align="right">Subtotal</th>
    </tr>
    ${buildProductRows(data.items)}
  </table>
</td>
</tr>

<!-- TOTAL -->
<tr>
<td style="padding:0 35px 30px 35px" align="right">
  <table width="250" style="background:#F7F4EF;border-radius:12px">
    <tr>
      <td style="padding:16px">
        <table width="100%">
          <tr>
            <td style="font-size:14px">Subtotal</td>
            <td align="right">${data.subtotal}</td>
          </tr>
          <tr>
            <td style="padding-top:6px">Delivery</td>
            <td align="right" style="padding-top:6px">To be confirmed</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:10px;border-top:1px dashed #DDD"></td>
          </tr>
          <tr>
            <td style="font-weight:700;padding-top:10px">Total</td>
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

<!-- PDF NOTICE -->
<tr>
<td style="padding:0 35px 30px 35px">
  <table width="100%" style="background:#FFF8E3;border-radius:12px">
    <tr>
      <td style="padding:16px">
        <p style="font-weight:600;margin:0 0 6px 0">Estimate PDF Attached</p>
        <p style="font-size:13px;color:#6B6B6B;line-height:1.6">
          Your estimate summary is attached as a PDF receipt for reference.
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
<td class="footer" align="center" style="padding:25px">
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
