import { Router, type Router as ExpressRouter } from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    getOrderPDF,
    convertOrderToInvoice,
    deleteOrder,
    bulkDeleteOrders,
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();
router.use(authenticate);

router.post('/', checkPermission('orders', 'create'), createOrder);
router.get('/', checkPermission('orders', 'read'), getAllOrders);
router.get('/pdf/:encryptedId', checkPermission('orders', 'read'), getOrderPDF);
router.post('/:id/convert', checkPermission('orders', 'update'), convertOrderToInvoice);
router.get('/:id', checkPermission('orders', 'read'), getOrderById);
router.delete('/:id', checkPermission('orders', 'delete'), deleteOrder);
router.post('/bulk-delete', checkPermission('orders', 'bulkDelete'), bulkDeleteOrders);

export default router;
