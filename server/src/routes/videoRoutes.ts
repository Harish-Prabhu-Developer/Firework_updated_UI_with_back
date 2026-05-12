import { Router } from 'express';
import {
    createVideo,
    updateVideo,
    getAllVideos,
    getVideoById,
    deleteVideo,
    bulkDeleteVideos,
} from '../controllers/videoController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.post('/', checkPermission('videos', 'create'), createVideo);
router.put('/:id', checkPermission('videos', 'update'), updateVideo);
router.get('/', checkPermission('videos', 'read'), getAllVideos);
router.get('/:id', checkPermission('videos', 'read'), getVideoById);
router.delete('/:id', checkPermission('videos', 'delete'), deleteVideo);
router.post('/bulk-delete', checkPermission('videos', 'bulkDelete'), bulkDeleteVideos);

export default router;  