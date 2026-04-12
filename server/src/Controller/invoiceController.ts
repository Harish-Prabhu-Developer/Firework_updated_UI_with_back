import { Request, Response } from "express";
import { db } from "../db/index.js";
import { invoices, invoiceItems, customers, orders } from "../db/schema/invoices.js";
import { settings } from "../db/schema/settings.js";
import { eq, desc, sql, like, and, or, inArray } from "drizzle-orm";
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import QRCode from 'qrcode';
import { generateInvoiceHTML } from '../utils/invoiceTemplates/invoiceTemplate.js';
import { pdfCache, PDF_CACHE_TTL } from '../utils/pdfCache.js';
import { generateInvoiceHTML2 } from "../utils/invoiceTemplates/invoiceTemplate2.js";
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate a unique invoice number
 */
const generateInvoiceNumber = async () => {
  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const datePrefix = `INV-${year}${month}${day}-`;

    console.log("Generating invoice number with prefix:", datePrefix);

    // Find the last invoice with this date prefix
    const lastInvoice = await db.select({
      invoiceNumber: invoices.invoiceNumber
    })
      .from(invoices)
      .where(like(invoices.invoiceNumber, `${datePrefix}%`))
      .orderBy(desc(invoices.invoiceNumber))
      .limit(1);

    let sequence = 1;
    if (lastInvoice.length > 0) {
      const parts = lastInvoice[0].invoiceNumber.split('-');
      const lastNumStr = parts[parts.length - 1];
      if (lastNumStr) {
        sequence = parseInt(lastNumStr) + 1;
      }
    }

    const newInvoiceNumber = `${datePrefix}${sequence.toString().padStart(4, '0')}`;
    console.log("New Invoice Number:", newInvoiceNumber);
    return newInvoiceNumber;
  } catch (err) {
    console.error("Error in generateInvoiceNumber:", err);
    throw err;
  }
};

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

    console.log("Create Invoice Request Body:", JSON.stringify(req.body, null, 2));

    if (!customerPhone || !items || items.length === 0) {
      return res.status(400).json({ success: false, msg: "Missing required fields: phone and items are required." });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Handle Customer
      let customerId: string;
      const existingCustomer = await tx.select().from(customers).where(eq(customers.phone, customerPhone)).limit(1);

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].id;
        console.log("Using existing customer:", customerId);
        // Update customer details if provided
        await tx.update(customers).set({
          name: customerName || existingCustomer[0].name,
          email: customerEmail || existingCustomer[0].email,
          address: customerAddress || existingCustomer[0].address,
          updatedAt: new Date()
        }).where(eq(customers.id, customerId));
      } else {
        console.log("Creating new customer for phone:", customerPhone);
        const newCustomer = await tx.insert(customers).values({
          name: customerName || "Walk-in Customer",
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
        }).returning({ id: customers.id });
        customerId = newCustomer[0].id;
        console.log("New customer created:", customerId);
      }

      // 2. Create Invoice
      const invoiceNumber = await generateInvoiceNumber();
      
      const insertData: any = {
        invoiceNumber,
        customerId,
        subTotal: String(subTotal || 0),
        discountAmount: String(discountAmount || 0),
        taxAmount: String(taxAmount || 0),
        totalAmount: String(totalAmount || 0),
        paymentMethod: paymentMethod || "cash",
        notes: notes || null,
      };

      // Only add userId if it's a valid string
      if (userId && userId.trim() !== "") {
          insertData.userId = userId;
      }

      console.log("Inserting invoice with data:", JSON.stringify(insertData, null, 2));
      const newInvoice = await tx.insert(invoices).values(insertData).returning();

      const invoiceId = newInvoice[0].id;
      console.log("Invoice created with ID:", invoiceId);

      // 3. Create Invoice Items
      const itemsToInsert = items.map((item: any) => ({
        invoiceId,
        productId: item.productId,
        productName: item.productName, // Save snapshot
        productImage: item.productImage || item.image, // Save snapshot
        quantity: parseInt(String(item.quantity)),
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
      }));

      console.log("Inserting invoice items:", itemsToInsert.length);
      await tx.insert(invoiceItems).values(itemsToInsert);
      
      // 4. Update Order Status if converting
      if (orderId) {
        console.log("Updating order status to converted for order:", orderId);
        await tx.update(orders)
          .set({ status: 'converted', updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      }

      return newInvoice[0];
    });

    res.status(201).json({
      success: true,
      data: result,
      msg: "Invoice created successfully",
    });
  } catch (error: any) {
    console.error("Create Invoice Error:", error);
    res.status(500).json({ success: false, msg: error.message || "Failed to create invoice" });
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const paymentMethod = req.query.paymentMethod as string;
    const offset = (page - 1) * limit;

    // Step 1: If searching, resolve invoice IDs via a join query
    let searchedInvoiceIds: string[] | undefined = undefined;
    if (search) {
      const searchResult = await db.select({ id: invoices.id })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(
          or(
            like(invoices.invoiceNumber, `%${search}%`),
            like(customers.name, `%${search}%`),
            like(customers.phone, `%${search}%`)
          )
        );
      searchedInvoiceIds = searchResult.map(r => r.id);

      // No matching invoices found for this search term
      if (searchedInvoiceIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 }
        });
      }
    }

    // Step 2: Build the final where conditions
    const whereConditions: any[] = [];
    if (paymentMethod && paymentMethod !== 'all') {
      whereConditions.push(eq(invoices.paymentMethod, paymentMethod as 'cash' | 'upi' | 'card'));
    }
    if (searchedInvoiceIds) {
      whereConditions.push(inArray(invoices.id, searchedInvoiceIds));
    }

    const finalWhere = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Step 3: Get total count for pagination
    const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(finalWhere);
    const total = countResult[0].count;

    // Step 4: Fetch the paginated data with relations
    const allInvoices = await db.query.invoices.findMany({
      where: finalWhere,
      limit,
      offset,
      orderBy: [desc(invoices.createdAt)],
      with: {
        customer: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          with: {
            product: true
          }
        }
      }
    });

    res.status(200).json({
        success: true,
        data: allInvoices,
        pagination: {
            total: Number(total),
            page,
            limit,
            totalPages: Math.ceil(Number(total) / limit)
        }
    });
  } catch (error: any) {
    console.error("Get All Invoices Error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id as any),
      with: {
        customer: true,
        user: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          with: {
            product: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, msg: "Invoice not found" });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error: any) {
    console.error("Get Invoice By Id Error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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
      notes
    } = req.body;

    console.log(`Updating invoice ${id} with body:`, JSON.stringify(req.body, null, 2));

    const result = await db.transaction(async (tx) => {
      // Check if invoice exists
      const existingInvoice = await tx.select().from(invoices).where(eq(invoices.id, id as any)).limit(1);
      if (existingInvoice.length === 0) {
        throw new Error("Invoice not found");
      }

      // 1. Handle Customer
      let customerId = existingInvoice[0].customerId;
      if (customerPhone) {
        const existingCustomer = await tx.select().from(customers).where(eq(customers.phone, customerPhone)).limit(1);
        if (existingCustomer.length > 0) {
          customerId = existingCustomer[0].id;
          console.log("Updating existing customer:", customerId);
          await tx.update(customers).set({
            name: customerName || existingCustomer[0].name,
            email: customerEmail || existingCustomer[0].email,
            address: customerAddress || existingCustomer[0].address,
            updatedAt: new Date()
          }).where(eq(customers.id, customerId));
        } else {
          console.log("Creating new customer during update for phone:", customerPhone);
          const newCustomer = await tx.insert(customers).values({
            name: customerName || "Walk-in Customer",
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress,
          }).returning({ id: customers.id });
          customerId = newCustomer[0].id;
        }
      }

      // 2. Update Invoice
      const updateData: any = {
        customerId,
        subTotal: subTotal !== undefined ? String(subTotal) : undefined,
        discountAmount: discountAmount !== undefined ? String(discountAmount) : undefined,
        taxAmount: taxAmount !== undefined ? String(taxAmount) : undefined,
        totalAmount: totalAmount !== undefined ? String(totalAmount) : undefined,
        paymentMethod: paymentMethod || undefined,
        notes: notes !== undefined ? notes : null,
        updatedAt: new Date(),
      };

      console.log("Updating invoice row with data:", JSON.stringify(updateData, null, 2));
      const updatedInvoice = await tx.update(invoices).set(updateData).where(eq(invoices.id, id as any)).returning();

      // 3. Update Items (Simplified: Delete and Re-insert)
      if (items && items.length > 0) {
        console.log("Replacing invoice items for invoice:", id);
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id as any));
        
        const itemsToInsert = items.map((item: any) => ({
          invoiceId: id,
          productId: item.productId,
          productName: item.productName, // Save snapshot
          productImage: item.productImage || item.image, // Save snapshot
          quantity: parseInt(String(item.quantity)),
          unitPrice: String(item.unitPrice),
          totalPrice: String(item.totalPrice),
        }));

        await tx.insert(invoiceItems).values(itemsToInsert);
      }

      return updatedInvoice[0];
    });

    // 🗑️ Evict the cached PDF so the next view regenerates with fresh data
    const updatedInvoiceNumber = result?.invoiceNumber;
    if (updatedInvoiceNumber) {
        pdfCache.delete(updatedInvoiceNumber);
    }

    res.status(200).json({
      success: true,
      data: result,
      msg: "Invoice updated successfully",
    });
  } catch (error: any) {
    console.error("Update Invoice Error:", error);
    res.status(500).json({ success: false, msg: error.message || "Failed to update invoice" });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("Deleting invoice:", id);
    
    // items will be deleted automatically due to CASCADE in schema
    const deletedInvoice = await db.delete(invoices)
      .where(eq(invoices.id, id as any))
      .returning();

    if (deletedInvoice.length === 0) {
      return res.status(404).json({ success: false, msg: "Invoice not found" });
    }

    // 🗑️ Evict the cached PDF for this deleted invoice
    const deletedInvoiceNumber = deletedInvoice[0]?.invoiceNumber;
    if (deletedInvoiceNumber) {
        pdfCache.delete(deletedInvoiceNumber);
    }

    res.status(200).json({ success: true, msg: "Invoice deleted successfully" });
  } catch (error: any) {
    console.error("Delete Invoice Error:", error);
    res.status(500).json({ success: false, msg: error.message || "Failed to delete invoice" });
  }
};


export const getInvoicePDF = async (req: Request, res: Response) => {
  try {
    const { invoiceNumber: encryptedInvoiceNumber } = req.params;
    
    // Decode invoice number from Hex
    const invoiceNumber = Buffer.from(encryptedInvoiceNumber as string, 'hex').toString('utf8');
    console.log("Generating PDF for invoice:", invoiceNumber, "from encrypted:", encryptedInvoiceNumber);

    // Check cache first for instant response
    const cached = pdfCache.get(invoiceNumber);
    if (cached && (Date.now() - cached.timestamp < PDF_CACHE_TTL)) {
        console.log("Serving PDF from cache:", invoiceNumber);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=invoice-${encryptedInvoiceNumber}.pdf`);
        res.setHeader('Content-Length', cached.buffer.length);
        return res.send(cached.buffer);
    }

    // Fetch Shop Settings for Invoice Header
    const shopSettings = await db.select().from(settings).limit(1);
    const shopInfo = shopSettings[0] || {
        shopName: "PRABHU CRACKERS",
        shopPhone: "9944336113",
        shopAddress: "Main Road, Sivakasi, Tamil Nadu",
        shopGst: ""
    };
    console.log("Using Shop Info for PDF:", JSON.stringify(shopInfo));

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.invoiceNumber, invoiceNumber as string),
      with: {
        customer: true,
        items: {
          with: {
            product: true
          }
        }
      }
    });

    if (!invoice) {
        return res.status(404).json({ success: false, msg: "Invoice not found" });
    }
    
    // Generate QR Code for secure verification (hides raw invoice number in URL)
    const verificationUrl = `${process.env.BASE_URL}/api/invoices/pdf/${encryptedInvoiceNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 200,
        color: {
            dark: '#1f2937',
            light: '#ffffff'
        }
    });

    const html = generateInvoiceHTML2(invoice, qrCodeDataUrl, shopInfo);
    
    // Environment-aware browser launch
    let browser;
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

    if (isProduction) {
        console.log("🚀 Launching Production Browser (Vercel/Chromium)");
        browser = await puppeteerCore.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    } else {
        console.log("💻 Launching Local Browser (Puppeteer)");
        browser = await puppeteer.launch({
            headless: true,
            pipe: true, // Use pipe instead of WebSocket for more reliable IPC on Windows
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-features=IsolateOrigins,site-per-process',
                '--font-render-hinting=none'
            ]
        });
    }

    try {
      const page = await browser.newPage();
      
      // Use 'load' + small settle time for maximum stability
      await page.setContent(html, { 
        waitUntil: 'load', 
        timeout: 45000 // Increased timeout
      });

      // Brief wait for any JS/rendering to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        preferCSSPageSize: true
      });

      // Save to cache before sending
      pdfCache.set(invoiceNumber, { 
        buffer: Buffer.from(pdfBuffer), 
        timestamp: Date.now() 
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=invoice-${encryptedInvoiceNumber}.pdf`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } finally {
      await browser.close();
    }

  } catch (error: any) {
    console.error("Get Invoice PDF Error:", error);
    res.status(500).json({ success: false, msg: error.message || "Failed to generate PDF" });
  }
};
