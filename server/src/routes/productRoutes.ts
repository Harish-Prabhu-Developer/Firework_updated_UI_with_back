import { Router } from 'express';
import {
    createProduct,
    updateProduct,
    getAllProducts,
    getProductById,
    deleteProduct,
    bulkDeleteProducts,
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.post('/', checkPermission('products', 'create'), createProduct);
router.put('/:id', checkPermission('products', 'update'), updateProduct);
router.get('/', checkPermission('products', 'read'), getAllProducts);
router.get('/:id', checkPermission('products', 'read'), getProductById);
router.delete('/:id', checkPermission('products', 'delete'), deleteProduct);
router.post('/bulk-delete', checkPermission('products', 'bulkDelete'), bulkDeleteProducts);

export default router;