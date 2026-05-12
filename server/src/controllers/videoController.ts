import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { videos, products } from '../db/schema/category.js';
import { eq, inArray, desc } from 'drizzle-orm';
import {
    bodyToStringArray,
    paramToString,
    queryToOptionalString,
    queryToPositiveInt,
} from '../utils/request.js';

export const createVideo = async (req: Request, res: Response) => {
    try {
        const { productId, name, type, url } = req.body;
        if (!productId || !url) return res.status(400).json({ success: false, msg: 'productId and url required' });

        const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
        if (!product[0]) return res.status(404).json({ success: false, msg: 'Product not found' });

        const [video] = await db.insert(videos).values({ productId, name: name || null, type: type || 'upload', url }).returning();
        res.status(201).json({ success: true, data: video });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateVideo = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, type, url } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Video ID required' });

        const [video] = await db.update(videos).set({ name, type, url, updatedAt: new Date() }).where(eq(videos.id, id)).returning();
        if (!video) return res.status(404).json({ success: false, msg: 'Video not found' });
        res.json({ success: true, data: video });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllVideos = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const productId = queryToOptionalString(req.query.productId);
        const all = productId
            ? await db.select().from(videos).where(eq(videos.productId, productId)).orderBy(desc(videos.createdAt))
            : await db.select().from(videos).orderBy(desc(videos.createdAt));
        const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({ success: true, data: paginated, pagination: { page: pageNum, limit: limitNum, total: all.length, totalPages: Math.ceil(all.length / limitNum) } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getVideoById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Video ID required' });

        const [video] = await db.select().from(videos).where(eq(videos.id, id));
        if (!video) return res.status(404).json({ success: false, msg: 'Video not found' });
        res.json({ success: true, data: video });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteVideo = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Video ID required' });

        const result = await db.delete(videos).where(eq(videos.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Video not found' });
        res.json({ success: true, msg: 'Video deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteVideos = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        const result = await db.delete(videos).where(inArray(videos.id, ids));
        res.json({ success: true, msg: `${result.rowCount} videos deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
