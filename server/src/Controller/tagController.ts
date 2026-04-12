import { Request, Response } from "express";
import { db } from "../db/index.js";
import { tags } from "../db/schema/category.js";
import { eq, desc } from "drizzle-orm";

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, slug, isActive, color, rank, showLimit } = req.body;

    const newTag = await db.insert(tags).values({
      name,
      slug,
      color: color ? color.substring(0, 7) : undefined,
      rank: rank ? parseInt(rank) : 0,
      showLimit: showLimit ? parseInt(showLimit) : 0,
      isActive: isActive === 'true' || isActive === true,
    }).returning();

    res.status(201).json({
      success: true,
      data: newTag[0],
      message: "Tag created successfully",
    });
  } catch (error: any) {
    console.error("Error in createTag:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTags = async (req: Request, res: Response) => {
  try {
    const allTags = await db.select().from(tags).orderBy(tags.rank, desc(tags.createdAt));
    res.status(200).json({ success: true, data: allTags });
  } catch (error: any) {
    console.error("Error in getAllTags:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTagById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tag = await db.select().from(tags).where(eq(tags.id, id as any));
    
    if (tag.length === 0) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    res.status(200).json({ success: true, data: tag[0] });
  } catch (error: any) {
    console.error("Error in getTagById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, isActive, color, rank, showLimit } = req.body;
    
    const updatedTag = await db.update(tags)
      .set({
        name,
        slug,
        color: color ? color.substring(0, 7) : undefined,
        rank: rank !== undefined ? parseInt(rank) : undefined,
        showLimit: showLimit !== undefined ? parseInt(showLimit) : undefined,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tags.id, id as any))
      .returning();

    if (updatedTag.length === 0) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedTag[0],
      message: "Tag updated successfully",
    });
  } catch (error: any) {
    console.error("Error in updateTag:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deletedTag = await db.delete(tags)
      .where(eq(tags.id, id as any))
      .returning();

    if (deletedTag.length === 0) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    res.status(200).json({ success: true, message: "Tag deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleteTag:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
