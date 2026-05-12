import { Router } from 'express';
import {
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    bulkDeleteBanners
} from '../controllers/bannerController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('banners', 'read'), getAllBanners);
router.post('/', checkPermission('banners', 'create'), createBanner);
router.put('/:id', checkPermission('banners', 'update'), updateBanner);
router.delete('/bulk', checkPermission('banners', 'delete'), bulkDeleteBanners);
router.delete('/:id', checkPermission('banners', 'delete'), deleteBanner);

export default router;
