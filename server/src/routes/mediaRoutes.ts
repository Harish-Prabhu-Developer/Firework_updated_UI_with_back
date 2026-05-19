import { Router, type IRouter } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    listMedia,
    addMedia,
    editMedia,
    deleteMedia,
    bulkDeleteMedia,
} from '../controllers/mediaController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';
import { paramToString } from '../utils/request.js';

const router: IRouter = Router();

// Ensure upload directories exist
const dirs = ['uploads/category', 'uploads/products', 'uploads/videos'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = paramToString(req.params.type);
        let folder = 'uploads';
        if (type === 'category') folder = 'uploads/category';
        else if (type === 'products') folder = 'uploads/products';
        else if (type === 'videos') folder = 'uploads/videos';
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

// Media Library APIs
router.get('/', checkPermission('media-library', 'read'), listMedia);
router.post('/upload/:type', checkPermission('media-library', 'create'), upload.array('files'), addMedia);
router.put('/edit/:type/:fileName', checkPermission('media-library', 'update'), upload.array('files'), editMedia);
router.delete('/delete/:type/:fileName', checkPermission('media-library', 'delete'), deleteMedia);
router.post('/bulk-delete', checkPermission('media-library', 'delete'), bulkDeleteMedia);

export default router;
