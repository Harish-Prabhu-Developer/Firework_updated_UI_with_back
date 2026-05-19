import { Request, Response } from 'express';
import { and, desc, eq, inArray, ilike, type SQL } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, categories, uoms, productTags, tags } from '../db/schema/category.js';
import { toSlug, safeParseJSON } from '../utils/helpers.js';
import { productStocks } from '../db/schema/category.js';
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
            categoryId, uomId, name, description, image, images = [],
            rank, mrp, sellingPrice, conversionQty, isActive,
            quantity, tagId,
        } = req.body;

        if (!categoryId || !uomId || !name || !mrp || !sellingPrice) {
            return res.status(400).json({ success: false, msg: 'Missing required fields' });
        }

        const slug = toSlug(name);
        const existing = await db.select().from(products).where(
            and(eq(products.categoryId, categoryId), eq(products.slug, slug))
        ).limit(1);
        if (existing[0]) {
            return res.status(400).json({ success: false, msg: 'Product with same slug already exists in this category' });
        }

        const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

        const [product] = await db.insert(products).values({
            categoryId, uomId, name, slug,
            description: description || null,
            image: image || null,
            images: imagesJson,
            rank: rank || 0,
            mrp: mrp.toString(),
            sellingPrice: sellingPrice.toString(),
            conversionQty: conversionQty || 1,
            isActive: isActive !== undefined ? isActive : true,
        }).returning();

        // Auto-create stock record with initial quantity
        await db.insert(productStocks).values({ 
            productId: product.id, 
            quantity: quantity || 0 
        }).onConflictDoUpdate({
            target: productStocks.productId,
            set: { quantity: quantity || 0, updatedAt: new Date() }
        });

        // Link tag if provided
        if (tagId) {
            await db.insert(productTags).values({
                productId: product.id,
                tagId: tagId,
            }).onConflictDoNothing();
        }

        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const {
            categoryId, uomId, name, description, image, images,
            rank, mrp, sellingPrice, conversionQty, isActive,
            quantity, tagId,
        } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Product ID required' });

        const updateData: any = { updatedAt: new Date() };
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (uomId !== undefined) updateData.uomId = uomId;
        if (name !== undefined) {
            updateData.name = name;
            updateData.slug = toSlug(name);
        }
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (images !== undefined) updateData.images = JSON.stringify(Array.isArray(images) ? images : []);
        if (rank !== undefined) updateData.rank = rank;
        if (mrp !== undefined) updateData.mrp = mrp.toString();
        if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice.toString();
        if (conversionQty !== undefined) updateData.conversionQty = conversionQty;
        if (isActive !== undefined) updateData.isActive = isActive;
        
        if (quantity !== undefined) {
            await db.insert(productStocks)
                .values({ productId: id, quantity })
                .onConflictDoUpdate({
                    target: productStocks.productId,
                    set: { quantity, updatedAt: new Date() }
                });
        }

        // Link tag if tagId parameter is present
        if (tagId !== undefined) {
            await db.delete(productTags).where(eq(productTags.productId, id));
            if (tagId) {
                await db.insert(productTags).values({
                    productId: id,
                    tagId: tagId,
                }).onConflictDoNothing();
            }
        }

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
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .innerJoin(uoms, eq(products.uomId, uoms.id))
            .leftJoin(productStocks, eq(products.id, productStocks.productId));

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

        const productIds = paginated.map(row => row.products.id);
        const relationsMap = new Map<string, { tag: any }[]>();

        if (productIds.length > 0) {
            const relations = await db
                .select({
                    productId: productTags.productId,
                    tag: {
                        id: tags.id,
                        name: tags.name,
                        slug: tags.slug,
                        color: tags.color,
                        rank: tags.rank,
                        isActive: tags.isActive,
                    }
                })
                .from(productTags)
                .innerJoin(tags, eq(productTags.tagId, tags.id))
                .where(inArray(productTags.productId, productIds));

            for (const r of relations) {
                if (!relationsMap.has(r.productId)) {
                    relationsMap.set(r.productId, []);
                }
                relationsMap.get(r.productId)!.push({ tag: r.tag });
            }
        }

        const data = paginated.map(row => ({
            ...row.products,
            images: safeParseJSON(row.products.images as string | null),
            category: row.category,
            uom: row.uoms,
            stock: row.product_stocks,
            productTags: relationsMap.get(row.products.id) || [],
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
        const uom = await db.select().from(uoms).where(eq(uoms.id, row[0].uomId)).limit(1);
        const stock = await db.select().from(productStocks).where(eq(productStocks.productId, row[0].id)).limit(1);

        const productRelations = await db
            .select({
                tag: {
                    id: tags.id,
                    name: tags.name,
                    slug: tags.slug,
                    color: tags.color,
                    rank: tags.rank,
                    isActive: tags.isActive,
                }
            })
            .from(productTags)
            .innerJoin(tags, eq(productTags.tagId, tags.id))
            .where(eq(productTags.productId, id));

        res.json({
            success: true,
            data: {
                ...row[0],
                images: safeParseJSON(row[0].images as string | null),
                category: category[0],
                uom: uom[0],
                stock: stock[0],
                productTags: productRelations,
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

        await db.delete(productStocks).where(eq(productStocks.productId, id));
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
        for (const id of ids) await db.delete(productStocks).where(eq(productStocks.productId, id));
        const result = await db.delete(products).where(inArray(products.id, ids));
        res.json({ success: true, msg: `${result.rowCount} products deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
