import { Router, type Router as ExpressRouter } from 'express';
import {
    createOrder,
    getAllOrders,
    getOrderById,
    getOrderPDF,
    convertOrderToInvoice,
    deleteOrder,
    bulkDeleteOrders,
    getOrderToken,
    updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();
// Public routes for customers
router.post('/', createOrder);

// Protected administrative routes
router.get('/', authenticate, checkPermission('orders', 'read'), getAllOrders);
router.get('/pdf/*', getOrderPDF); // Public for verification or internal use? Let's check.
router.get('/:id/token', authenticate, checkPermission('orders', 'read'), getOrderToken);
router.post('/:id/convert', authenticate, checkPermission('orders', 'update'), convertOrderToInvoice);
router.patch('/:id/status', authenticate, checkPermission('orders', 'update'), updateOrderStatus);
router.get('/:id', authenticate, checkPermission('orders', 'read'), getOrderById);
router.delete('/:id', authenticate, checkPermission('orders', 'delete'), deleteOrder);
router.post('/bulk-delete', authenticate, checkPermission('orders', 'bulkDelete'), bulkDeleteOrders);

export default router;
