import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    listAssets,
    uploadAsset,
    updateAsset,
    deleteAsset,
} from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';
import { paramToString } from '../utils/request.js';

const router = Router();

// Ensure upload directories exist
const dirs = ['uploads/category', 'uploads/products', 'uploads/videos'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer configuration for dynamic fields
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const assetType = paramToString(req.params.assetType);
        let folder = 'uploads';
        if (assetType === 'categoryImage') folder = 'uploads/category';
        else if (assetType === 'productImage') folder = 'uploads/products';
        else if (assetType === 'videoFile') folder = 'uploads/videos';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.use(authenticate);

// Uploads are managed from the Media Library module.
router.get('/', checkPermission('media-library', 'read'), listAssets);
router.post('/:assetType', checkPermission('media-library', 'create'), upload.any(), uploadAsset);
router.put('/:assetType/:fileName', checkPermission('media-library', 'update'), upload.any(), updateAsset);
router.delete('/:assetType/:fileName', checkPermission('media-library', 'delete'), deleteAsset);

export default router;
