import { Request, Response } from "express";
import { db } from "../db/index.js";
import { categories } from "../db/schema/category.js";
import { eq, desc } from "drizzle-orm";
import fs from "fs";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, rank, isActive } = req.body;
    const image = req.file ? req.file.path : null;

    const newCategory = await db.insert(categories).values({
      name,
      slug,
      description,
      image,
      rank: rank ? parseInt(rank) : 0,
      isActive: isActive === 'true' || isActive === true,
    }).returning();

    res.status(201).json({
      success: true,
      data: newCategory[0],
      message: "Category created successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const allCategories = await db.select().from(categories).orderBy(desc(categories.rank));
    res.status(200).json({ success: true, data: allCategories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await db.select().from(categories).where(eq(categories.id, id as any));
    
    if (category.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: category[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, rank, isActive } = req.body;
    
    // Check if category exists
    const existingCategoryArr = await db.select().from(categories).where(eq(categories.id, id as any));
    if (existingCategoryArr.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const existingCategory = existingCategoryArr[0];
    let image = existingCategory.image;

    if (req.file) {
      // Delete old image if exists
      if (image && fs.existsSync(image)) {
        fs.unlinkSync(image);
      }
      image = req.file.path;
    }

    const updatedCategory = await db.update(categories)
      .set({
        name,
        slug,
        description,
        image,
        rank: rank ? parseInt(rank) : undefined,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id as any))
      .returning();

    res.status(200).json({
      success: true,
      data: updatedCategory[0],
      message: "Category updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Use returning to get deleted item and its image path
    const deletedCategory = await db.delete(categories)
      .where(eq(categories.id, id as any))
      .returning();

    if (deletedCategory.length === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Delete image file if exists
    if (deletedCategory[0].image && fs.existsSync(deletedCategory[0].image)) {
      fs.unlinkSync(deletedCategory[0].image);
    }

    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
