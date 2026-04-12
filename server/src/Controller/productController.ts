import { Request, Response } from "express";
import { db } from "../db/index.js";
import { products, productStocks, productTags, tags } from "../db/schema/category.js";
import { eq, desc, inArray } from "drizzle-orm";
import fs from "fs";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { categoryId, uomId, name, slug, rank, mrp, sellingPrice, isActive, quantity, tags: tagsJson } = req.body;
    const image = req.file ? req.file.path : null;

    const newProduct = await db.transaction(async (tx) => {
      const inserted = await tx.insert(products).values({
        categoryId,
        uomId,
        name,
        slug,
        image,
        rank: rank ? parseInt(rank) : 0,
        mrp: mrp ? String(mrp) : "0",
        sellingPrice: sellingPrice ? String(sellingPrice) : "0",
        isActive: isActive === 'true' || isActive === true,
      }).returning();

      if (inserted.length > 0) {
        const productId = inserted[0].id;
        
        // Handle Stock
        await tx.insert(productStocks).values({
          productId,
          quantity: quantity ? parseInt(quantity) : 0,
        });

        // Handle Tags
        if (tagsJson) {
           const tagIds = JSON.parse(tagsJson);
           if (Array.isArray(tagIds) && tagIds.length > 0) {
             await tx.insert(productTags).values(
               tagIds.map(tagId => ({
                 productId,
                 tagId
               }))
             );
           }
        }
      }

      return inserted[0];
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: "Product created successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const allProducts = await db.query.products.findMany({
      with: {
        stock: true,
        productTags: true,
        uom: true,
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

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await db.query.products.findFirst({
      where: eq(products.id, id as any),
      with: {
        stock: true,
        productTags: true,
        uom: true,
      }
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ 
      success: true, 
      data: { 
        ...product, 
        quantity: product.stock?.quantity || 0,
        tags: product.productTags.map(pt => pt.tagId)
      } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { categoryId, uomId, name, slug, rank, mrp, sellingPrice, isActive, tags: tagsJson } = req.body;
    
    // Check if product exists
    const existingProductArr = await db.select().from(products).where(eq(products.id, id as any));
    if (existingProductArr.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const existingProduct = existingProductArr[0];
    let image = existingProduct.image;

    if (req.file) {
      // Delete old image if exists
      if (image && fs.existsSync(image)) {
        fs.unlinkSync(image);
      }
      image = req.file.path;
    }

    const updatedProduct = await db.transaction(async (tx) => {
      const updated = await tx.update(products)
        .set({
          categoryId,
          uomId,
          name,
          slug,
          image,
          rank: rank ? parseInt(rank) : undefined,
          mrp: mrp ? String(mrp) : undefined,
          sellingPrice: sellingPrice ? String(sellingPrice) : undefined,
          isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id as any))
        .returning();

      if (tagsJson) {
        const tagIds = JSON.parse(tagsJson);
        if (Array.isArray(tagIds)) {
          // Delete existing tags
          await tx.delete(productTags).where(eq(productTags.productId, id as any));
          
          // Add new tags
          if (tagIds.length > 0) {
            await tx.insert(productTags).values(
              tagIds.map(tagId => ({
                productId: id as any,
                tagId
              }))
            );
          }
        }
      }

      return updated[0];
    });

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    // Check if product exists
    const existingProduct = await db.select().from(products).where(eq(products.id, id as any));
    if (existingProduct.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Upsert stock
    const existingStock = await db.select().from(productStocks).where(eq(productStocks.productId, id as any));
    
    let updatedStock;
    if (existingStock.length === 0) {
      updatedStock = await db.insert(productStocks).values({
        productId: id as any,
        quantity: parseInt(quantity) || 0
      }).returning();
    } else {
      updatedStock = await db.update(productStocks)
        .set({ 
          quantity: parseInt(quantity) || 0,
          updatedAt: new Date()
        })
        .where(eq(productStocks.productId, id as any))
        .returning();
    }

    res.status(200).json({
      success: true,
      data: updatedStock[0],
      message: "Stock updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Use returning to get deleted item and its image path
    const deletedProduct = await db.delete(products)
      .where(eq(products.id, id as any))
      .returning();

    if (deletedProduct.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete image file if exists
    if (deletedProduct[0].image && fs.existsSync(deletedProduct[0].image)) {
      fs.unlinkSync(deletedProduct[0].image);
    }

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
