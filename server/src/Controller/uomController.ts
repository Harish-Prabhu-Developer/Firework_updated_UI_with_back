import { Request, Response } from "express";
import { db } from "../db/index.js";
import { uoms } from "../db/schema/category.js";
import { eq, desc } from "drizzle-orm";

export const createUom = async (req: Request, res: Response) => {
  try {
    const { name, code, description, isActive } = req.body;

    const newUom = await db.insert(uoms).values({
      name,
      code,
      description,
      isActive: isActive === 'true' || isActive === true,
    }).returning();

    res.status(201).json({
      success: true,
      data: newUom[0],
      message: "Unit of Measure created successfully",
    });
  } catch (error: any) {
    console.error("Error in createUom:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUoms = async (req: Request, res: Response) => {
  try {
    const allUoms = await db.select().from(uoms).orderBy(desc(uoms.createdAt));
    res.status(200).json({ success: true, data: allUoms });
  } catch (error: any) {
    console.error("Error in getAllUoms:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const uom = await db.select().from(uoms).where(eq(uoms.id, id as any));
    
    if (uom.length === 0) {
      return res.status(404).json({ success: false, message: "UOM not found" });
    }

    res.status(200).json({ success: true, data: uom[0] });
  } catch (error: any) {
    console.error("Error in getUomById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;
    
    const updatedUom = await db.update(uoms)
      .set({
        name,
        code,
        description,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(uoms.id, id as any))
      .returning();

    if (updatedUom.length === 0) {
      return res.status(404).json({ success: false, message: "UOM not found" });
    }

    res.status(200).json({
      success: true,
      data: updatedUom[0],
      message: "UOM updated successfully",
    });
  } catch (error: any) {
    console.error("Error in updateUom:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deletedUom = await db.delete(uoms)
      .where(eq(uoms.id, id as any))
      .returning();

    if (deletedUom.length === 0) {
      return res.status(404).json({ success: false, message: "UOM not found" });
    }

    res.status(200).json({ success: true, message: "UOM deleted successfully" });
  } catch (error: any) {
    console.error("Error in deleteUom:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
