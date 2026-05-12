import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { uoms } from '../db/schema/category.js';
import { eq, inArray, desc } from 'drizzle-orm';
import {
    bodyToStringArray,
    paramToString,
    queryToBoolean,
    queryToPositiveInt,
} from '../utils/request.js';

export const createUOM = async (req: Request, res: Response) => {
    try {
        const { name, code, description, isActive } = req.body;
        if (!name || !code) return res.status(400).json({ success: false, msg: 'Name and code required' });

        const [uom] = await db.insert(uoms).values({
            name, code, description: description || null, isActive: isActive !== undefined ? isActive : true,
        }).returning();
        res.status(201).json({ success: true, data: uom });
    } catch (error: any) {
        if (error.code === '23505') return res.status(400).json({ success: false, msg: 'Name or code already exists' });
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateUOM = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, code, description, isActive } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'UOM ID required' });

        const [uom] = await db.update(uoms).set({ name, code, description, isActive, updatedAt: new Date() }).where(eq(uoms.id, id)).returning();
        if (!uom) return res.status(404).json({ success: false, msg: 'UOM not found' });
        res.json({ success: true, data: uom });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllUOMs = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const isActive = queryToBoolean(req.query.isActive);
        const all = isActive === undefined
            ? await db.select().from(uoms).orderBy(desc(uoms.createdAt))
            : await db.select().from(uoms).where(eq(uoms.isActive, isActive)).orderBy(desc(uoms.createdAt));
        const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({ success: true, data: paginated, pagination: { page: pageNum, limit: limitNum, total: all.length, totalPages: Math.ceil(all.length / limitNum) } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getUOMById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'UOM ID required' });

        const [uom] = await db.select().from(uoms).where(eq(uoms.id, id));
        if (!uom) return res.status(404).json({ success: false, msg: 'UOM not found' });
        res.json({ success: true, data: uom });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteUOM = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'UOM ID required' });

        const result = await db.delete(uoms).where(eq(uoms.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'UOM not found' });
        res.json({ success: true, msg: 'UOM deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteUOMs = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        const result = await db.delete(uoms).where(inArray(uoms.id, ids));
        res.json({ success: true, msg: `${result.rowCount} UOMs deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
