import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { settings } from '../db/schema/settings.js';
import { clearPDFCache } from '../services/pdfService.js';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const rows = await db.select().from(settings);
        const data = rows[0] || {};
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { 
            shopName, shopPhone, shopAddress, shopGst, 
            shopEmail, minimumOrder, whatsappNum, socialMedias,
            salesStatus, orderReceiptQrStatus, invoiceQrStatus 
        } = req.body;
        const existing = await db.select().from(settings).limit(1);
        const settingsData = {
            shopName, shopPhone, shopAddress, shopGst,
            shopEmail, minimumOrder, whatsappNum, socialMedias,
            salesStatus, orderReceiptQrStatus, invoiceQrStatus,
            updatedAt: new Date()
        };

        let result;
        if (existing[0]) {
            // Check if any fields that affect PDF layout or info have changed
            const hasCriticalChange = 
                existing[0].shopName !== shopName ||
                existing[0].shopPhone !== shopPhone ||
                existing[0].shopAddress !== shopAddress ||
                existing[0].shopGst !== shopGst ||
                existing[0].invoiceQrStatus !== invoiceQrStatus ||
                existing[0].orderReceiptQrStatus !== orderReceiptQrStatus;

            result = await db.update(settings)
                .set(settingsData)
                .where(eq(settings.id, existing[0].id))
                .returning();

            if (hasCriticalChange) {
                clearPDFCache();
            }
        } else {
            result = await db.insert(settings)
                .values(settingsData)
                .returning();
            clearPDFCache();
        }

        res.json({ success: true, data: result[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
