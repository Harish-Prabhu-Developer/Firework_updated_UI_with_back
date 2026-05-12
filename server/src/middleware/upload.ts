import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

type UploadType = 'category' | 'product' | 'video';

const UPLOAD_DIRS: Record<UploadType, string> = {
    category: 'uploads/category',
    product: 'uploads/products',
    video: 'uploads/videos',
};

const createStorage = (type: UploadType) => {
    const dir = UPLOAD_DIRS[type];
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `${type}-${uniqueSuffix}${ext}`);
        },
    });
};

const fileFilter = (type: UploadType) => {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (type === 'video') {
            if (file.mimetype.startsWith('video/')) {
                cb(null, true);
            } else {
                cb(new Error('Only video files are allowed'));
            }
        } else {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    };
};

export const uploadCategoryImage = multer({
    storage: createStorage('category'),
    fileFilter: fileFilter('category'),
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadProductImage = multer({
    storage: createStorage('product'),
    fileFilter: fileFilter('product'),
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadVideo = multer({
    storage: createStorage('video'),
    fileFilter: fileFilter('video'),
    limits: { fileSize: 100 * 1024 * 1024 },
});