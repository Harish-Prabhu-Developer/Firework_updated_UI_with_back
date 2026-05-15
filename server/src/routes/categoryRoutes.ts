import { Router, type Router as ExpressRouter } from 'express';
import {
    createCategory,
    updateCategory,
    getAllCategories,
    getCategoryById,
    deleteCategory,
    bulkDeleteCategories,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();

router.use(authenticate);

router.post('/', checkPermission('categories', 'create'), createCategory);
router.put('/:id', checkPermission('categories', 'update'), updateCategory);
router.get('/', checkPermission('categories', 'read'), getAllCategories);
router.get('/:id', checkPermission('categories', 'read'), getCategoryById);
router.delete('/:id', checkPermission('categories', 'delete'), deleteCategory);
router.post('/bulk-delete', checkPermission('categories', 'bulkDelete'), bulkDeleteCategories);

export default router;