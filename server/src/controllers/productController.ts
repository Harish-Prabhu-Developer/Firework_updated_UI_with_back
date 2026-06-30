import { Request, Response } from 'express';
import { and, desc, eq, inArray, ilike, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema/category.js';
import { toSlug, safeParseJSON } from '../utils/helpers.js';
import {
    bodyToStringArray,
    paramToString,
    queryToBoolean,
    queryToOptionalString,
    queryToPositiveInt,
} from '../utils/request.js';

export const createProduct = async (req: Request, res: Response) => {
    try {
        const {
            categoryId, name, description, image, images = [],
            stock, tag, unit, rank, mrp, isActive, productDiscount
        } = req.body;

        if (!categoryId || !name || !mrp) {
            return res.status(400).json({ success: false, msg: 'Missing required fields: categoryId, name, mrp' });
        }

        const slug = toSlug(name);
        const existing = await db.select().from(products).where(
            and(eq(products.categoryId, categoryId), eq(products.slug, slug))
        ).limit(1);
        if (existing[0]) {
            return res.status(400).json({ success: false, msg: 'Product with same slug already exists in this category' });
        }

        const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

        let resolvedCode = (req.body.productCode ?? '').toString().trim();
        if (!resolvedCode) {
            const allCodes = await db
                .select({ code: products.productCode })
                .from(products)
                .where(ilike(products.productCode, 'CK%'));
            
            let maxNum = 99;
            for (const row of allCodes) {
                const match = row.code.match(/^CK(\d+)$/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
            resolvedCode = `CK${maxNum + 1}`;
        }

        const [product] = await db.insert(products).values({
            productCode: resolvedCode,
            categoryId, name, slug,
            description: description || null,
            image: image || null,
            images: imagesJson,
            stock: stock ?? 0,
            tag: tag || null,
            unit: unit || null,
            rank: rank || 0,
            mrp: mrp.toString(),
            productDiscount: productDiscount !== undefined ? productDiscount.toString() : "0",
            isActive: isActive !== undefined ? isActive : true,
        }).returning();

        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, msg: 'Product code or slug already exists' });
        }
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const {
            categoryId, productCode, name, description, image, images,
            stock, tag, unit, rank, mrp, isActive, productDiscount
        } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Product ID required' });

        const updateData: any = { updatedAt: new Date() };
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (productCode !== undefined) updateData.productCode = productCode;
        if (name !== undefined) {
            updateData.name = name;
            updateData.slug = toSlug(name);
        }
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (images !== undefined) updateData.images = JSON.stringify(Array.isArray(images) ? images : []);
        if (stock !== undefined) updateData.stock = stock;
        if (tag !== undefined) updateData.tag = tag;
        if (unit !== undefined) updateData.unit = unit;
        if (rank !== undefined) updateData.rank = rank;
        if (mrp !== undefined) updateData.mrp = mrp.toString();
        if (productDiscount !== undefined) updateData.productDiscount = productDiscount.toString();
        if (isActive !== undefined) updateData.isActive = isActive;

        const [product] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
        if (!product) return res.status(404).json({ success: false, msg: 'Product not found' });

        res.json({ success: true, data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const search = queryToOptionalString(req.query.search);
        const categoryId = queryToOptionalString(req.query.categoryId);
        const isActive = queryToBoolean(req.query.isActive);
        const offset = (pageNum - 1) * limitNum;

        const baseQuery = db
            .select()
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id));

        const conditions: SQL[] = [];
        if (categoryId) conditions.push(eq(products.categoryId, categoryId));
        if (isActive !== undefined) conditions.push(eq(products.isActive, isActive));
        if (search) {
            conditions.push(ilike(products.name, `%${search}%`));
        }

        const allRows = conditions.length > 0
            ? await baseQuery.where(and(...conditions)).orderBy(desc(products.rank))
            : await baseQuery.orderBy(desc(products.rank));
        const paginated = allRows.slice(offset, offset + limitNum);

        const data = paginated.map(row => ({
            ...row.products,
            images: safeParseJSON(row.products.images as string | null),
            category: row.category,
        }));

        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: allRows.length,
                totalPages: Math.ceil(allRows.length / limitNum),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Product ID required' });

        const row = await db.select().from(products).where(eq(products.id, id)).limit(1);
        if (!row[0]) return res.status(404).json({ success: false, msg: 'Product not found' });

        const category = await db.select().from(categories).where(eq(categories.id, row[0].categoryId)).limit(1);

        res.json({
            success: true,
            data: {
                ...row[0],
                images: safeParseJSON(row[0].images as string | null),
                category: category[0],
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Product ID required' });

        const result = await db.delete(products).where(eq(products.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Product not found' });
        res.json({ success: true, msg: 'Product deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        const result = await db.delete(products).where(inArray(products.id, ids));
        res.json({ success: true, msg: `${result.rowCount} products deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkImportProducts = async (req: Request, res: Response) => {
    try {
        const { categoryId, products: rows }: { categoryId?: string; products?: Record<string, string>[] } = req.body;

        if (!categoryId) {
            return res.status(400).json({ success: false, msg: 'Category ID is required' });
        }

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ success: false, msg: 'No products provided' });
        }

        const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
        if (!category) {
            return res.status(400).json({ success: false, msg: 'Category not found' });
        }

        const REQUIRED_HEADERS = ['name', 'mrp'];
        const missingHeaders = REQUIRED_HEADERS.filter(h => !(h in rows[0]));
        if (missingHeaders.length > 0) {
            return res.status(400).json({
                success: false,
                msg: `Missing required column(s): ${missingHeaders.join(', ')}`,
            });
        }

        const [maxRankRow] = await db.select({ maxRank: sql<number>`COALESCE(MAX(display_order), 0)` }).from(products).where(eq(products.categoryId, categoryId));
        let nextRank = (maxRankRow?.maxRank ?? 0) + 1;

        const errors: { row: number; reason: string }[] = [];
        const insertedProducts: typeof products.$inferSelect[] = [];

        // Pre-compute the max CK number for auto-generation
        const allCodes = await db
            .select({ code: products.productCode })
            .from(products)
            .where(ilike(products.productCode, 'CK%'));
        
        let maxCKNum = 99;
        for (const row of allCodes) {
            const match = row.code.match(/^CK(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxCKNum) maxCKNum = num;
            }
        }
        let nextProductCodeNum = maxCKNum + 1;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            const productCode = (row.productCode ?? '').trim();
            const name = (row.name ?? '').trim();
            const mrp = parseFloat(row.mrp ?? '');
            const stock = parseInt(row.stock ?? '0', 10);
            const rowErrors: string[] = [];

            if (!name) rowErrors.push('Product Name is required');
            if (isNaN(mrp) || mrp <= 0) rowErrors.push('MRP must be greater than 0');
            if (isNaN(stock) || stock < 0) rowErrors.push('Stock must be 0 or greater');

            if (rowErrors.length > 0) {
                errors.push({ row: rowNum, reason: rowErrors.join('; ') });
                continue;
            }

            let finalProductCode = productCode;
            if (productCode) {
                const existing = await db.select().from(products).where(eq(products.productCode, productCode)).limit(1);
                if (existing[0]) {
                    finalProductCode = '';
                    errors.push({ row: rowNum, reason: 'Duplicate Product Code - auto-generated' });
                }
            }

            const slug = toSlug(name);
            const description = (row.description ?? '').trim() || null;
            const tag = (row.tag ?? '').trim() || null;

            let combinedUnit: string | null = null;
            const unit = (row.unit ?? '').trim();
            const perQty = (row.perQty ?? '').trim();
            if (unit && perQty) combinedUnit = `${unit} ${perQty}`;
            else if (unit) combinedUnit = unit;

            const image = (row.image ?? '').trim() || null;

            const isActive = (row.status ?? '').trim().toLowerCase() === 'active';
            const productDiscount = row.productDiscount !== undefined && row.productDiscount.trim() !== '' ? row.productDiscount.trim() : '0';

            // Auto-generate product code if not provided or duplicate was detected
            const bulkCode = finalProductCode || `CK${nextProductCodeNum++}`;

            try {
                const [inserted] = await db.insert(products).values({
                    productCode: bulkCode,
                    categoryId,
                    name,
                    slug,
                    description,
                    image,
                    images: null,
                    stock,
                    tag,
                    unit: combinedUnit,
                    rank: nextRank++,
                    mrp: mrp.toString(),
                    productDiscount,
                    isActive,
                }).returning();
                insertedProducts.push(inserted);
            } catch (err: any) {
                if (err.code === '23505') {
                    errors.push({ row: rowNum, reason: 'Duplicate Product Code or Slug' });
                } else {
                    errors.push({ row: rowNum, reason: err.message ?? 'Insert failed' });
                }
            }
        }

        res.json({
            success: true,
            message: `Successfully uploaded ${insertedProducts.length} products to ${category.name} category`,
            uploaded: insertedProducts.length,
            skipped: rows.length - insertedProducts.length - errors.filter(e => e.reason.includes('Duplicate')).length,
            errors,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
