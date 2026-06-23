// server/src/controllers/mediaController.ts
import fs from 'fs/promises';
import path from 'path';
import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { categories, products, videos } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { paramToString, queryToOptionalString } from '../utils/request.js';

type AssetType = 'category' | 'products' | 'videos';

const UPLOADS_BASE = path.join(process.cwd(), 'uploads');

const ASSET_DIR_BY_TYPE: Record<AssetType, string> = {
    category: path.join(UPLOADS_BASE, 'category'),
    products: path.join(UPLOADS_BASE, 'products'),
    videos: path.join(UPLOADS_BASE, 'videos'),
};

const ASSET_WEB_PREFIX_BY_TYPE: Record<AssetType, string> = {
    category: '/uploads/category',
    products: '/uploads/products',
    videos: '/uploads/videos',
};

const VALID_TYPES: AssetType[] = ['category', 'products', 'videos'];

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
    if (assetType === 'category') {
        const rows = await db
            .select({ id: categories.id, name: categories.name, slug: categories.slug })
            .from(categories)
            .where(eq(categories.image, relativePath));
        return rows.map((r) => ({ table: 'categories', id: r.id, title: r.name, meta: r.slug }));
    }

    if (assetType === 'products') {
        const rows1 = await db
            .select({ id: products.id, name: products.name, slug: products.slug })
            .from(products)
            .where(eq(products.image, relativePath));

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
        const seen = new Set();
        const unique = combined.filter((r) => {
            const key = `${r.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        return unique.map((r) => ({ table: 'products', id: r.id, title: r.name, meta: r.slug }));
    }

    if (assetType === 'videos') {
        const rows = await db
            .select({ id: videos.id, name: videos.name, type: videos.type })
            .from(videos)
            .where(eq(videos.url, relativePath));
        return rows.map((r) => ({ table: 'videos', id: r.id, title: r.name, meta: r.type }));
    }

    return [];
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
        mimeType: fileName.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg', // Simple heuristic
    };
};

/**
 * List all media files
 */
export const listMedia = async (req: Request, res: Response) => {
    try {
        const requestedType = queryToOptionalString(req.query.type);
        const resolvedTypes = requestedType ? [getAssetType(requestedType)].filter((v): v is AssetType => !!v) : VALID_TYPES;

        const payload: any[] = [];

        for (const type of resolvedTypes) {
            const dirPath = ASSET_DIR_BY_TYPE[type];
            await fs.mkdir(dirPath, { recursive: true });
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const files = entries.filter((e) => e.isFile()).map((e) => e.name);

            for (const fileName of files) {
                try {
                    const fileMeta = await getFileMeta(type, fileName);
                    payload.push(fileMeta);
                } catch (e) {
                    // Skip files that might have been deleted while reading
                }
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
            msg: error?.message || 'Failed to list media',
        });
    }
};

/**
 * Add / Upload media
 */
export const addMedia = async (req: Request, res: Response) => {
    try {
        const type = getAssetType(paramToString(req.params.type));
        if (!type) {
            return res.status(400).json({
                success: false,
                msg: 'Invalid type. Use category, products, or videos.',
            });
        }

        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'No files uploaded',
            });
        }

        const uploadedMeta = await Promise.all(
            files.map((f) => getFileMeta(type, f.filename))
        );

        return res.status(201).json({
            success: true,
            msg: `${uploadedMeta.length} file(s) uploaded successfully`,
            data: uploadedMeta,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            msg: error?.message || 'Failed to add media',
        });
    }
};

/**
 * Edit / Update media metadata or file
 */
export const editMedia = async (req: Request, res: Response) => {
    try {
        const type = getAssetType(paramToString(req.params.type));
        const oldFileName = paramToString(req.params.fileName);

        if (!type || !ensureSafeFileName(oldFileName)) {
            return res.status(400).json({ success: false, msg: 'Invalid request parameters' });
        }

        const files = req.files as Express.Multer.File[];
        const newFile = files?.[0];

        if (!newFile) {
            return res.status(400).json({ success: false, msg: 'New file is required' });
        }

        const oldRelativePath = toRelativeAssetPath(type, oldFileName);
        const newRelativePath = toRelativeAssetPath(type, newFile.filename);

        // Update database references
        if (type === 'category') {
            await db.update(categories).set({ image: newRelativePath }).where(eq(categories.image, oldRelativePath));
        } else if (type === 'products') {
            await db.update(products).set({ image: newRelativePath }).where(eq(products.image, oldRelativePath));
            // Also handle products.images JSON array
            const allProducts = await db.select().from(products);
            for (const p of allProducts) {
                const images = safeParseImages(p.images);
                if (images.includes(oldRelativePath)) {
                    const updatedImages = images.map(img => img === oldRelativePath ? newRelativePath : img);
                    await db.update(products).set({ images: JSON.stringify(updatedImages) }).where(eq(products.id, p.id));
                }
            }
        } else if (type === 'videos') {
            await db.update(videos).set({ url: newRelativePath }).where(eq(videos.url, oldRelativePath));
        }

        // Delete old file
        const oldAbsolutePath = path.join(ASSET_DIR_BY_TYPE[type], oldFileName);
        try {
            await fs.unlink(oldAbsolutePath);
        } catch {
            // Ignore if already deleted
        }

        const fileMeta = await getFileMeta(type, newFile.filename);
        return res.status(200).json({
            success: true,
            msg: 'Media updated successfully',
            data: fileMeta,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            msg: error?.message || 'Failed to edit media',
        });
    }
};

/**
 * Delete a single media file
 */
export const deleteMedia = async (req: Request, res: Response) => {
    try {
        const type = getAssetType(paramToString(req.params.type));
        const fileName = paramToString(req.params.fileName);

        if (!type || !ensureSafeFileName(fileName)) {
            return res.status(400).json({ success: false, msg: 'Invalid request parameters' });
        }

        const relativePath = toRelativeAssetPath(type, fileName);
        const linkedRecords = await getLinkedRecords(type, relativePath);

        if (linkedRecords.length > 0) {
            return res.status(400).json({
                success: false,
                msg: 'Cannot delete media because it is linked to records',
                data: { linkedRecords },
            });
        }

        const absolutePath = path.join(ASSET_DIR_BY_TYPE[type], fileName);
        await fs.unlink(absolutePath);

        return res.status(200).json({
            success: true,
            msg: 'Media deleted successfully',
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            msg: error?.message || 'Failed to delete media',
        });
    }
};

/**
 * Bulk Delete media files
 */
export const bulkDeleteMedia = async (req: Request, res: Response) => {
    try {
        const { files } = req.body; // Expecting [{ type: 'category', fileName: 'abc.jpg' }, ...]
        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ success: false, msg: 'Files array is required' });
        }

        const results = {
            deleted: [] as string[],
            failed: [] as { fileName: string, reason: string }[],
        };

        for (const item of files) {
            const type = getAssetType(item.type);
            const fileName = item.fileName;

            if (!type || !ensureSafeFileName(fileName)) {
                results.failed.push({ fileName, reason: 'Invalid parameters' });
                continue;
            }

            const relativePath = toRelativeAssetPath(type, fileName);
            const linkedRecords = await getLinkedRecords(type, relativePath);

            if (linkedRecords.length > 0) {
                results.failed.push({ fileName, reason: 'File is linked to records' });
                continue;
            }

            try {
                const absolutePath = path.join(ASSET_DIR_BY_TYPE[type], fileName);
                await fs.unlink(absolutePath);
                results.deleted.push(fileName);
            } catch (error: any) {
                results.failed.push({ fileName, reason: error.message });
            }
        }

        return res.status(200).json({
            success: true,
            msg: `Processed ${files.length} files. Deleted: ${results.deleted.length}, Failed: ${results.failed.length}`,
            data: results,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            msg: error?.message || 'Failed to perform bulk delete',
        });
    }
};
