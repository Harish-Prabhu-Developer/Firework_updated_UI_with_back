import { Request, Response } from "express";
import { db } from "../db/index.js";
import { videos, products } from "../db/schema/category.js";
import { eq, desc } from "drizzle-orm";

export const getAllVideos = async (req: Request, res: Response) => {
    try {
        const data = await db.query.videos.findMany({
            where: eq(videos.isActive, true),
            with: {
                product: true,
            },
            orderBy: [desc(videos.createdAt)],
        });

        res.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error("GetAllVideos Error:", error);
        res.status(500).json({
            success: false,
            msg: "Failed to fetch videos.",
            error: error.message,
        });
    }
};
