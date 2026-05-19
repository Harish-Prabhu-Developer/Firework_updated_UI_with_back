import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { categories, tags, productTags, products } from '../db/schema/category.js';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { toSlug } from '../utils/helpers.js';
import {
    bodyToStringArray,
    paramToString,
    queryToBoolean,
    queryToPositiveInt,
} from '../utils/request.js';

// ── In-memory fallback for the global display limit ──────────────────────────
// This is only used when there are zero tags in the DB so we have nowhere to
// persist the value. Once the first tag is created, showLimit is written to DB.
let _memoryLimit: number = 0;

// ── Config: get / set global display limit ───────────────────────────────────

/**
 * GET /tags/config
 * Returns the current global display limit.
 *
 * Resolution order:
 *   1. First tag's showLimit in the DB (authoritative when tags exist)
 *   2. In-memory value set via POST /tags/config (used before any tag exists)
 */
export const getTagConfig = async (req: Request, res: Response) => {
    try {
        const [firstTag] = await db
            .select({ showLimit: tags.showLimit })
            .from(tags)
            .orderBy(desc(tags.rank))
            .limit(1);

        const showLimit = firstTag?.showLimit ?? _memoryLimit;
        res.json({ success: true, data: { showLimit } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

/**
 * POST /tags/config
 * Sets the global display limit.
 *
 * - Updates ALL existing tags' showLimit in the DB.
 * - If no tags exist yet, stores the value in memory so the first createTag
 *   call can inherit it.
 */
export const setTagConfig = async (req: Request, res: Response) => {
    try {
        const showLimit = Number(req.body.showLimit);
        if (isNaN(showLimit) || showLimit < 0) {
            return res.status(400).json({ success: false, msg: 'showLimit must be a non-negative number' });
        }

        // Always keep the memory value in sync
        _memoryLimit = showLimit;

        // Update all existing tags
        const result = await db.update(tags).set({ showLimit, updatedAt: new Date() });

        res.json({
            success: true,
            data: { showLimit },
            msg: `Display limit set to ${showLimit}. ${result.rowCount ?? 0} tag(s) updated.`,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// ── Standard CRUD ─────────────────────────────────────────────────────────────

export const createTag = async (req: Request, res: Response) => {
    try {
        const { name, color, rank, showLimit, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, msg: 'Name required' });

        // Use provided showLimit, falling back to _memoryLimit so new tags
        // automatically inherit the global config even if set before any tag existed.
        const effectiveShowLimit = showLimit !== undefined ? Number(showLimit) : _memoryLimit;

        const slug = toSlug(name);
        const [tag] = await db
            .insert(tags)
            .values({
                name,
                slug,
                color,
                rank: rank || 0,
                showLimit: effectiveShowLimit,
                isActive: isActive !== undefined ? isActive : true,
            })
            .returning();

        res.status(201).json({ success: true, data: tag });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, msg: 'Tag name or slug already exists' });
        }
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

/**
 * GET /tags
 * Returns all tags, each enriched with a `linkedProductCount` field so the
 * "Linked Tags" tab can display product counts without a separate API call.
 */
export const getAllTags = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const isActive = queryToBoolean(req.query.isActive);

        // Fetch tags
        const all = isActive === undefined
            ? await db.select().from(tags).orderBy(desc(tags.rank))
            : await db.select().from(tags).where(eq(tags.isActive, isActive)).orderBy(desc(tags.rank));

        // Fetch product counts per tag in one query
        const counts = await db
            .select({
                tagId: productTags.tagId,
                count: sql<number>`cast(count(*) as integer)`,
            })
            .from(productTags)
            .groupBy(productTags.tagId);

        const countMap = new Map(counts.map(c => [c.tagId, c.count]));

        const enriched = all.map(tag => ({
            ...tag,
            linkedProductCount: countMap.get(tag.id) ?? 0,
        }));

        const paginated = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
            success: true,
            data: paginated,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: all.length,
                totalPages: Math.ceil(all.length / limitNum),
            },
        });
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

        // Also fetch linked products for this tag
        const linked = await db
            .select({
                productId: productTags.productId,
                id: products.id,
                name: products.name,
                slug: products.slug,
                image: products.image,
                isActive: products.isActive,
                category: {
                    id: categories.id,
                    name: categories.name,
                    slug: categories.slug,
                },
            })
            .from(productTags)
            .innerJoin(products, eq(productTags.productId, products.id))
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(eq(productTags.tagId, id));

        res.json({ success: true, data: { ...tag, linkedProducts: linked } });
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

export const linkProductsToTag = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { productIds } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Tag ID required' });
        if (!Array.isArray(productIds)) return res.status(400).json({ success: false, msg: 'productIds must be an array' });

        await db.delete(productTags).where(eq(productTags.tagId, id));

        if (productIds.length > 0) {
            await db.insert(productTags).values(
                productIds.map((productId: string) => ({
                    tagId: id,
                    productId,
                }))
            );
        }

        res.json({ success: true, msg: 'Linked products updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
