import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { categories } from '../db/schema/category.js';
import { eq, inArray, desc } from 'drizzle-orm';
import { toSlug } from '../utils/helpers.js';
import {
    bodyToStringArray,
    paramToString,
    queryToBoolean,
    queryToOptionalString,
    queryToPositiveInt,
} from '../utils/request.js';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description, image, rank, isActive } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, msg: 'Name is required' });
        }

        const slug = toSlug(name);

        const existing = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
        if (existing[0]) {
            return res.status(400).json({ success: false, msg: 'Category with this name already exists' });
        }

        const [category] = await db.insert(categories).values({
            name,
            slug,
            description: description || null,
            image: image || null,
            rank: rank || 0,
            isActive: isActive !== undefined ? isActive : true,
        }).returning();

        res.status(201).json({ success: true, data: category });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, description, image, rank, isActive } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, msg: 'Category ID required' });
        }

        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) {
            updateData.name = name;
            updateData.slug = toSlug(name);
        }
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (rank !== undefined) updateData.rank = rank;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [category] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();

        if (!category) {
            return res.status(404).json({ success: false, msg: 'Category not found' });
        }

        res.json({ success: true, data: category });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const search = queryToOptionalString(req.query.search);
        const isActive = queryToBoolean(req.query.isActive);
        const offset = (pageNum - 1) * limitNum;

        const allCategories = isActive === undefined
            ? await db.select().from(categories).orderBy(desc(categories.rank))
            : await db.select().from(categories).where(eq(categories.isActive, isActive)).orderBy(desc(categories.rank));

        let filtered = allCategories;
        if (search) {
            const normalizedSearch = search.toLowerCase();
            filtered = allCategories.filter((category) => category.name.toLowerCase().includes(normalizedSearch));
        }

        const paginated = filtered.slice(offset, offset + limitNum);

        res.json({
            success: true,
            data: paginated,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / limitNum),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, msg: 'Category ID required' });
        }

        const category = await db.select().from(categories).where(eq(categories.id, id)).limit(1);

        if (!category[0]) {
            return res.status(404).json({ success: false, msg: 'Category not found' });
        }

        res.json({ success: true, data: category[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) {
            return res.status(400).json({ success: false, msg: 'Category ID required' });
        }

        const result = await db.delete(categories).where(eq(categories.id, id));

        if (!result.rowCount) {
            return res.status(404).json({ success: false, msg: 'Category not found' });
        }

        res.json({ success: true, msg: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteCategories = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);

        if (ids.length === 0) {
            return res.status(400).json({ success: false, msg: 'IDs array required' });
        }

        const result = await db.delete(categories).where(inArray(categories.id, ids));

        res.json({ success: true, msg: `${result.rowCount} categories deleted successfully` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
