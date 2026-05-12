import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { banners } from '../db/schema/category.js';
import { eq, inArray, desc } from 'drizzle-orm';
import { bodyToStringArray, paramToString, queryToPositiveInt } from '../utils/request.js';

export const createBanner = async (req: Request, res: Response) => {
    try {
        const { image, badgeIcon, badge, title, desc: description, cta, link, displayOrder, status } = req.body;

        if (!image || !title) {
            return res.status(400).json({ success: false, msg: 'Image and title are required' });
        }

        const [banner] = await db.insert(banners).values({
            image,
            badgeIcon: badgeIcon || 'sparkles',
            badge: badge || '',
            title,
            desc: description || '',
            cta: cta || 'Shop Collection',
            link: link || '/products',
            displayOrder: displayOrder || 1,
            status: status !== undefined ? status : true,
        }).returning();

        res.status(201).json({ success: true, data: banner });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateBanner = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { image, badgeIcon, badge, title, desc: description, cta, link, displayOrder, status } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, msg: 'Banner ID required' });
        }

        const updateData: any = { updatedAt: new Date() };
        if (image !== undefined) updateData.image = image;
        if (badgeIcon !== undefined) updateData.badgeIcon = badgeIcon;
        if (badge !== undefined) updateData.badge = badge;
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.desc = description;
        if (cta !== undefined) updateData.cta = cta;
        if (link !== undefined) updateData.link = link;
        if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
        if (status !== undefined) updateData.status = status;

        const [banner] = await db.update(banners).set(updateData).where(eq(banners.id, id)).returning();

        if (!banner) {
            return res.status(404).json({ success: false, msg: 'Banner not found' });
        }

        res.json({ success: true, data: banner });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllBanners = async (req: Request, res: Response) => {
    try {
        const allBanners = await db.select().from(banners).orderBy(desc(banners.displayOrder));
        res.json({ success: true, data: allBanners });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, msg: 'Banner ID required' });
        }

        const result = await db.delete(banners).where(eq(banners.id, id));

        if (!result.rowCount) {
            return res.status(404).json({ success: false, msg: 'Banner not found' });
        }

        res.json({ success: true, msg: 'Banner deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteBanners = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);

        if (ids.length === 0) {
            return res.status(400).json({ success: false, msg: 'IDs array required' });
        }

        const result = await db.delete(banners).where(inArray(banners.id, ids));

        res.json({ success: true, msg: `${result.rowCount} banners deleted successfully` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
