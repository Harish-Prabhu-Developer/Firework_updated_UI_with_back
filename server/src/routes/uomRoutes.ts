import { Router } from 'express';
import {
    createUOM,
    updateUOM,
    getAllUOMs,
    getUOMById,
    deleteUOM,
    bulkDeleteUOMs,
} from '../controllers/uomController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.post('/', checkPermission('uoms', 'create'), createUOM);
router.put('/:id', checkPermission('uoms', 'update'), updateUOM);
router.get('/', checkPermission('uoms', 'read'), getAllUOMs);
router.get('/:id', checkPermission('uoms', 'read'), getUOMById);
router.delete('/:id', checkPermission('uoms', 'delete'), deleteUOM);
router.post('/bulk-delete', checkPermission('uoms', 'bulkDelete'), bulkDeleteUOMs);

export default router;