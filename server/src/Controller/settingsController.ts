import { Request, Response } from "express";
import { db } from "../db/index.js";
import { settings } from "../db/schema/settings.js";
import { eq } from "drizzle-orm";
import { pdfCache } from "../utils/pdfCache.js";

export const getShopSettings = async (req: Request, res: Response) => {
    try {
        const shopSettings = await db.select().from(settings).limit(1);
        
        if (shopSettings.length === 0) {
            // Seed default settings if empty
            const defaultSettings = await db.insert(settings).values({
                shopName: "PRABHU CRACKERS",
                shopPhone: "9944336113",
                shopAddress: "Main Road, Sivakasi, Tamil Nadu",
                shopGst: ""
            }).returning();
            return res.status(200).json({ success: true, data: defaultSettings[0] });
        }

        res.status(200).json({ success: true, data: shopSettings[0] });
    } catch (error: any) {
        console.error("Get Shop Settings Error:", error);
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const createOrUpdateSettings = async (req: Request, res: Response) => {
    try {
        const { shopName, shopPhone, shopAddress, shopGst } = req.body;
        console.log("Saving Shop Settings:", req.body);
        
        const existingSettings = await db.select().from(settings).limit(1);
        
        let result;
        if (existingSettings.length > 0) {
            console.log("Updating existing settings ID:", existingSettings[0].id);
            result = await db.update(settings)
                .set({ 
                    shopName, 
                    shopPhone, 
                    shopAddress, 
                    shopGst: shopGst || "",
                    updatedAt: new Date()
                })
                .where(eq(settings.id, existingSettings[0].id))
                .returning();
        } else {
            console.log("Creating new settings record");
            result = await db.insert(settings)
                .values({ 
                    shopName, 
                    shopPhone, 
                    shopAddress, 
                    shopGst: shopGst || "" 
                })
                .returning();
        }

        // 🚀 CRITICAL: Invalidate PDF Cache since shop details changed!
        pdfCache.clear();

        res.status(200).json({ success: true, data: result[0], msg: "Shop settings saved successfully" });
    } catch (error: any) {
        console.error("Save Shop Settings Error:", error);
        res.status(500).json({ success: false, msg: error.message });
    }
};
