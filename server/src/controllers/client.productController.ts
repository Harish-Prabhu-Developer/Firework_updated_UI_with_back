import { Request, Response } from "express";
import { db } from "../db/index.js";
import { categories, products } from "../db/schema/category.js";
import { eq, and } from "drizzle-orm";

/**
 * Fetches all active categories and their active products for the client-side catalog.
 * This ensures that only items marked as 'status: Active' are displayed to end-users.
 */
export const getAllProducts = async (req: Request, res: Response) => {
    try {
        // 1. Fetch Categories where status is Active (isActive = true)
        // 2. Fetch Products where status is Active (isActive = true)
        // 3. Join with UOM to get the 'content' display string (e.g. "10 PCS")
        const data = await db.query.categories.findMany({
            where: eq(categories.isActive, true),
            with: {
                products: {
                    where: eq(products.isActive, true),
                    with: {
                        uom: true,
                    },
                    orderBy: (products, { asc }) => [asc(products.rank)],
                },
            },
            orderBy: (categories, { asc }) => [asc(categories.rank)],
        });

        // 4. Transform data to match the structure expected by the frontend (Products.tsx)
        const formattedData = data.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image: cat.image,
            products: cat.products.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                // Frontend uses 'price' for MRP and 'discPrice' for the actual selling price
                price: parseFloat(p.mrp),
                discPrice: parseFloat(p.sellingPrice),
                img: p.image,
                // 'content' is derived from the Unit of Measure code (e.g. PCS)
                content: p.uom?.code || "",
                rank: p.rank,
            })),
        }));

        res.json({
            success: true,
            data: formattedData,
        });
    } catch (error: any) {
        console.error("GetAllProducts Error:", error);
        res.status(500).json({
            success: false,
            msg: "Failed to fetch catalog data. Please try again later.",
            error: error.message,
        });
    }
};