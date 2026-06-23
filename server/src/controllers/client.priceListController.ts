import { Request, Response } from "express";
import { db } from "../db/index.js";
import { categories, products } from "../db/schema/category.js";
import { settings } from "../db/schema/settings.js";
import { eq, asc } from "drizzle-orm";
import { generatePDFFromHTML } from "../services/pdfService.js";
import { generatePriceListHtml, PriceListCategory, CompanyInfo } from "../templates/PriceListTemplate.js";

const COMPANY = {
  name: "Crackers Kindom",
  shortName: "Crackers Kindom",
  phones: ["+91 90801 49556", "+91 75400 01610"],
  address: [
    "M/S NANDHINI TRADERS",
    "Survey No: 299/13A1C, 299/15A2, Door No: 3/1362/20",
    "Bharathi Nagar - II, Viswanatham",
    "Sivakasi - 626189, Virudhunagar District",
    "Tamil Nadu, India",
  ],
  website: "www.crackerskingdom.in",
  docTitle: "PRICELIST",
};

function formatPrice(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return num.toFixed(2);
}

export const getPriceList = async (req: Request, res: Response) => {
  try {
    const settingsData = await db.select().from(settings).limit(1);
    const siteDiscount = parseFloat(settingsData[0]?.siteDiscount || "0");

    const dbData = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      with: {
        products: {
          where: eq(products.isActive, true),
          orderBy: (products, { asc }) => [asc(products.rank)],
        },
      },
      orderBy: (categories, { asc }) => [asc(categories.rank)],
    });

    const categoriesData: PriceListCategory[] = dbData
      .map((cat) => {
        const categoryDiscount = parseFloat(cat.categoryDiscount || "0");
        return {
          cat: cat.name || "",
          items: cat.products.map((p) => {
            const productDiscount = parseFloat(p.productDiscount || "0");
            let applicableDiscount = siteDiscount;
            if (categoryDiscount > 0) applicableDiscount = categoryDiscount;
            if (productDiscount > 0) applicableDiscount = productDiscount;

            const mrp = parseFloat(p.mrp);
            let offerPrice = mrp;
            if (applicableDiscount > 0) {
                offerPrice = mrp * (1 - applicableDiscount / 100);
            }

            return {
              name: p.name || "",
              mrp: formatPrice(p.mrp),
              unit: p.unit || "",
              offer: formatPrice(offerPrice)
            };
          })
        };
      })
      .filter((c) => c.items.length > 0);

    const html = generatePriceListHtml(categoriesData, COMPANY as CompanyInfo);

    const pdfBuffer = await generatePDFFromHTML(html, 'price-list', 'Letter');

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=price-list.pdf");
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("GetPriceList Error:", error);
    res.status(500).json({
      success: false,
      msg: "Failed to generate price list.",
      error: error.message,
    });
  }
};
