import { Router, type Router as ExpressRouter } from 'express';
import {
    createTag,
    updateTag,
    getAllTags,
    getTagById,
    deleteTag,
    bulkDeleteTags,
    getTagConfig,
    setTagConfig,
    linkProductsToTag,
} from '../controllers/tagController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();
router.use(authenticate);

// ── Config (display limit) — must be ABOVE /:id to avoid route collision ──────
router.get('/config', checkPermission('tags', 'read'), getTagConfig);
router.post('/config', checkPermission('tags', 'update'), setTagConfig);

// ── Bulk delete — must be ABOVE /:id ─────────────────────────────────────────
router.post('/bulk-delete', checkPermission('tags', 'bulkDelete'), bulkDeleteTags);

// ── Standard CRUD ─────────────────────────────────────────────────────────────
router.post('/', checkPermission('tags', 'create'), createTag);
router.put('/:id', checkPermission('tags', 'update'), updateTag);
router.put('/:id/products', checkPermission('tags', 'update'), linkProductsToTag);
router.get('/', checkPermission('tags', 'read'), getAllTags);
router.get('/:id', checkPermission('tags', 'read'), getTagById);
router.delete('/:id', checkPermission('tags', 'delete'), deleteTag);

export default router;