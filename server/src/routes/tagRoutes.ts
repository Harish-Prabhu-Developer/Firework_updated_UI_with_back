import { Router } from 'express';
import {
    createTag,
    updateTag,
    getAllTags,
    getTagById,
    deleteTag,
    bulkDeleteTags,
} from '../controllers/tagController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.post('/', checkPermission('tags', 'create'), createTag);
router.put('/:id', checkPermission('tags', 'update'), updateTag);
router.get('/', checkPermission('tags', 'read'), getAllTags);
router.get('/:id', checkPermission('tags', 'read'), getTagById);
router.delete('/:id', checkPermission('tags', 'delete'), deleteTag);
router.post('/bulk-delete', checkPermission('tags', 'bulkDelete'), bulkDeleteTags);

export default router;