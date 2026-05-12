import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { settings } from '../db/schema/settings.js';

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
        const { shopName, shopPhone, shopAddress, shopGst } = req.body;
        const existing = await db.select().from(settings).limit(1);
        let result;
        if (existing[0]) {
            result = await db.update(settings).set({ shopName, shopPhone, shopAddress, shopGst, updatedAt: new Date() }).where(eq(settings.id, existing[0].id)).returning();
        } else {
            result = await db.insert(settings).values({ shopName, shopPhone, shopAddress, shopGst }).returning();
        }
        res.json({ success: true, data: result[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
