import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { tags } from '../db/schema/category.js';
import { eq, inArray, desc } from 'drizzle-orm';
import { toSlug } from '../utils/helpers.js';
import {
    bodyToStringArray,
    paramToString,
    queryToBoolean,
    queryToPositiveInt,
} from '../utils/request.js';

export const createTag = async (req: Request, res: Response) => {
    try {
        const { name, color, rank, showLimit, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, msg: 'Name required' });
        const slug = toSlug(name);
        const [tag] = await db.insert(tags).values({ name, slug, color, rank: rank || 0, showLimit: showLimit || 0, isActive: isActive !== undefined ? isActive : true }).returning();
        res.status(201).json({ success: true, data: tag });
    } catch (error: any) {
        if (error.code === '23505') return res.status(400).json({ success: false, msg: 'Tag name or slug already exists' });
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateTag = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, color, rank, showLimit, isActive } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Tag ID required' });

        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) { updateData.name = name; updateData.slug = toSlug(name); }
        if (color !== undefined) updateData.color = color;
        if (rank !== undefined) updateData.rank = rank;
        if (showLimit !== undefined) updateData.showLimit = showLimit;
        if (isActive !== undefined) updateData.isActive = isActive;
        const [tag] = await db.update(tags).set(updateData).where(eq(tags.id, id)).returning();
        if (!tag) return res.status(404).json({ success: false, msg: 'Tag not found' });
        res.json({ success: true, data: tag });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllTags = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const isActive = queryToBoolean(req.query.isActive);
        const all = isActive === undefined
            ? await db.select().from(tags).orderBy(desc(tags.rank))
            : await db.select().from(tags).where(eq(tags.isActive, isActive)).orderBy(desc(tags.rank));
        const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({ success: true, data: paginated, pagination: { page: pageNum, limit: limitNum, total: all.length, totalPages: Math.ceil(all.length / limitNum) } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getTagById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Tag ID required' });

        const [tag] = await db.select().from(tags).where(eq(tags.id, id));
        if (!tag) return res.status(404).json({ success: false, msg: 'Tag not found' });
        res.json({ success: true, data: tag });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteTag = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Tag ID required' });

        const result = await db.delete(tags).where(eq(tags.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Tag not found' });
        res.json({ success: true, msg: 'Tag deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteTags = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        const result = await db.delete(tags).where(inArray(tags.id, ids));
        res.json({ success: true, msg: `${result.rowCount} tags deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
