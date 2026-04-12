import { Request, Response } from "express";
import { db } from "../db/index.js";
import { categories, products, productStocks, productTags, tags } from "../db/schema/category.js";
import { eq, desc, and } from "drizzle-orm";
import fs from "fs";


export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const allProducts = await db.query.products.findMany({
            with: {
                stock: true,
                productTags: true
            },
            orderBy: [desc(products.createdAt)],
        });

        // Map to include tags at top level
        const formattedData = allProducts.map(p => ({
            ...p,
            quantity: p.stock?.quantity || 0,
            tags: p.productTags.map(pt => pt.tagId)
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
    try {
        const data = await db.query.categories.findMany({
            where: eq(categories.isActive, true),
            with: {
                products: {
                    where: eq(products.isActive, true),
                    with: {
                        uom: true
                    },
                    orderBy: [products.rank]
                }
            },
            orderBy: [categories.rank]
        });

        const formattedData = data.map(cat => ({
            name: cat.name.toUpperCase(),
            products: cat.products.map(p => ({
                id: p.id,
                name: p.name,
                content: "1" + p.uom?.code || "1PCS",
                price: parseFloat(p.mrp as any),
                discPrice: parseFloat(p.sellingPrice as any),
                img: p.image
            }))
        })).filter(cat => cat.products.length > 0);

        res.status(200).json({ success: true, data: formattedData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProductsByTags = async (req: Request, res: Response) => {
    try {
        const data = await db.query.tags.findMany({
            where: eq(tags.isActive, true),
            with: {
                productTags: {
                    with: {
                        product: {
                            with: {
                                stock: true,
                            }
                        }
                    }
                }
            },
            orderBy: [tags.rank, desc(tags.createdAt)]
        });

        const formattedData = data.map(tag => {
            // Filter and extract products from productTags
            let tagProducts = tag.productTags
                .map(pt => pt.product)
                .filter(p => p !== null && p.isActive);

            // Restrictively implement the show limit
            if (tag.showLimit > 0) {
                tagProducts = tagProducts.slice(0, tag.showLimit);
            }

            return {
                id: tag.id,
                name: tag.name,
                products: tagProducts.map(p => ({
                    id: p?.id,
                    name: p?.name,
                    content: (p as any)?.packSize || "1PCS",
                    mrp: parseFloat(p?.mrp as any),
                    sellingPrice: parseFloat(p?.sellingPrice as any),
                    img: (p as any)?.image,
                    quantity: p?.stock?.quantity || 0
                }))
            };
        }).filter(tag => tag.products.length > 0);

        res.status(200).json({ success: true, data: formattedData });
    } catch (error: any) {
        console.error("Error in getProductsByTags:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
