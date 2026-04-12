import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { categories, products, videos } from '../db/schema/category.js';
import { eq } from 'drizzle-orm';

type AssetType = 'categoryImage' | 'productImage' | 'videoFile';

const ASSET_DIR_BY_TYPE: Record<AssetType, string> = {
  categoryImage: path.join(process.cwd(), 'uploads', 'category'),
  productImage: path.join(process.cwd(), 'uploads', 'products'),
  videoFile: path.join(process.cwd(), 'uploads', 'videos'),
};

const ASSET_WEB_PREFIX_BY_TYPE: Record<AssetType, string> = {
  categoryImage: '/uploads/category',
  productImage: '/uploads/products',
  videoFile: '/uploads/videos',
};

const VALID_TYPES: AssetType[] = ['categoryImage', 'productImage', 'videoFile'];

const paramToString = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

const getAssetType = (value: string): AssetType | null => {
  if (VALID_TYPES.includes(value as AssetType)) {
    return value as AssetType;
  }
  return null;
};

const ensureSafeFileName = (fileName: string): boolean => {
  return !fileName.includes('..') && !fileName.includes('/') && !fileName.includes('\\');
};

const toRelativeAssetPath = (assetType: AssetType, fileName: string): string =>
  `${ASSET_WEB_PREFIX_BY_TYPE[assetType]}/${fileName}`;

// Safe JSON parse helper for the images field
const safeParseImages = (imagesStr: string | null | undefined): string[] => {
  if (!imagesStr || imagesStr === 'null' || imagesStr.trim() === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(imagesStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getLinkedRecords = async (assetType: AssetType, relativePath: string) => {
  if (assetType === 'categoryImage') {
    const rows = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.image, relativePath));
    return rows.map((r) => ({ table: 'categories', id: r.id, title: r.name, meta: r.slug }));
  }

  if (assetType === 'productImage') {
    const rows1 = await db
      .select({ id: products.id, name: products.name, slug: products.slug })
      .from(products)
      .where(eq(products.image, relativePath));
    
    // Safely parse product images from database text field
    const allProducts = await db
      .select({ id: products.id, name: products.name, slug: products.slug, images: products.images })
      .from(products);
    
    const rows2 = allProducts
      .filter((p) => {
        const imageArray = safeParseImages(p.images);
        return imageArray.includes(relativePath);
      })
      .map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
    
    const combined = [...rows1, ...rows2];
    // Remove duplicates
    const seen = new Set();
    const unique = combined.filter((r) => {
      const key = `${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.map((r) => ({ table: 'products', id: r.id, title: r.name, meta: r.slug }));
  }

  const rows = await db
    .select({ id: videos.id, name: videos.name, type: videos.type })
    .from(videos)
    .where(eq(videos.url, relativePath));
  return rows.map((r) => ({ table: 'videos', id: r.id, title: r.name, meta: r.type }));
};

const getFileMeta = async (assetType: AssetType, fileName: string) => {
  const relativePath = toRelativeAssetPath(assetType, fileName);
  const absolutePath = path.join(ASSET_DIR_BY_TYPE[assetType], fileName);
  const stat = await fs.stat(absolutePath);
  const linkedRecords = await getLinkedRecords(assetType, relativePath);

  return {
    fileName,
    assetType,
    relativePath,
    size: stat.size,
    updatedAt: stat.mtime,
    linkedCount: linkedRecords.length,
    linkedRecords,
  };
};

export const listAssets = async (req: Request, res: Response) => {
  try {
    const requestedType = req.query.assetType as string | undefined;
    const requestedTypes = requestedType ? [requestedType] : VALID_TYPES;

    const resolvedTypes = requestedTypes
      .map(getAssetType)
      .filter((v): v is AssetType => Boolean(v));

    if (requestedType && resolvedTypes.length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assetType. Use categoryImage, productImage, or videoFile.',
      });
    }

    const payload: any[] = [];

    for (const type of resolvedTypes) {
      const dirPath = ASSET_DIR_BY_TYPE[type];
      await fs.mkdir(dirPath, { recursive: true });
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = entries.filter((e) => e.isFile()).map((e) => e.name);

      for (const fileName of files) {
        const fileMeta = await getFileMeta(type, fileName);
        payload.push(fileMeta);
      }
    }

    payload.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return res.status(200).json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      msg: error?.message || 'Failed to list assets',
    });
  }
};

export const uploadAsset = async (req: Request, res: Response) => {
  try {
    const assetType = getAssetType(paramToString(req.params.assetType));
    if (!assetType) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assetType. Use categoryImage, productImage, or videoFile.',
      });
    }

    const files = (req as any).files as Record<string, Array<{ filename: string }>> | undefined;
    const assetFiles = files?.[assetType] || [];

    if (assetFiles.length === 0) {
      return res.status(400).json({
        success: false,
        msg: `File is required in field "${assetType}"`,
      });
    }

    const uploadedMeta = await Promise.all(
      assetFiles
        .filter((f) => !!f?.filename)
        .map((f) => getFileMeta(assetType, f.filename))
    );

    return res.status(201).json({
      success: true,
      msg: `${uploadedMeta.length} asset${uploadedMeta.length > 1 ? 's' : ''} uploaded successfully`,
      data: uploadedMeta,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      msg: error?.message || 'Failed to upload asset',
    });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const assetType = getAssetType(paramToString(req.params.assetType));
    const oldFileName = paramToString(req.params.fileName);

    if (!assetType) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assetType. Use categoryImage, productImage, or videoFile.',
      });
    }
    if (!ensureSafeFileName(oldFileName)) {
      return res.status(400).json({ success: false, msg: 'Invalid fileName' });
    }

    const files = (req as any).files as Record<string, Array<{ filename: string }>> | undefined;
    const newFile = files?.[assetType]?.[0];
    if (!newFile?.filename) {
      return res.status(400).json({
        success: false,
        msg: `New file is required in field "${assetType}"`,
      });
    }

    const oldRelativePath = toRelativeAssetPath(assetType, oldFileName);
    const newRelativePath = toRelativeAssetPath(assetType, newFile.filename);

    if (assetType === 'categoryImage') {
      await db.update(categories).set({ image: newRelativePath }).where(eq(categories.image, oldRelativePath));
    } else if (assetType === 'productImage') {
      await db.update(products).set({ image: newRelativePath }).where(eq(products.image, oldRelativePath));
    } else {
      await db.update(videos).set({ url: newRelativePath }).where(eq(videos.url, oldRelativePath));
    }

    const oldAbsolutePath = path.join(ASSET_DIR_BY_TYPE[assetType], oldFileName);
    try {
      await fs.unlink(oldAbsolutePath);
    } catch {
      // Ignore missing file and continue.
    }

    const fileMeta = await getFileMeta(assetType, newFile.filename);
    return res.status(200).json({
      success: true,
      msg: 'Asset updated successfully',
      data: fileMeta,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      msg: error?.message || 'Failed to update asset',
    });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const assetType = getAssetType(paramToString(req.params.assetType));
    const fileName = paramToString(req.params.fileName);

    if (!assetType) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid assetType. Use categoryImage, productImage, or videoFile.',
      });
    }
    if (!ensureSafeFileName(fileName)) {
      return res.status(400).json({ success: false, msg: 'Invalid fileName' });
    }

    const relativePath = toRelativeAssetPath(assetType, fileName);
    const linkedRecords = await getLinkedRecords(assetType, relativePath);
    if (linkedRecords.length > 0) {
      return res.status(400).json({
        success: false,
        msg: 'Cannot delete asset because it is linked to records',
        data: { linkedRecords },
      });
    }

    const absolutePath = path.join(ASSET_DIR_BY_TYPE[assetType], fileName);
    await fs.unlink(absolutePath);

    return res.status(200).json({
      success: true,
      msg: 'Asset deleted successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      msg: error?.message || 'Failed to delete asset',
    });
  }
};
