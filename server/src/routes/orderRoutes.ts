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
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();
// Public route for customers to place orders
router.post('/', createOrder);

// Protected administrative routes
router.get('/', authenticate, checkPermission('orders', 'read'), getAllOrders);
router.get('/pdf/*', getOrderPDF); // Public for verification or internal use? Let's check.
router.get('/:id/token', authenticate, checkPermission('orders', 'read'), getOrderToken);
router.post('/:id/convert', authenticate, checkPermission('orders', 'update'), convertOrderToInvoice);
router.get('/:id', authenticate, checkPermission('orders', 'read'), getOrderById);
router.delete('/:id', authenticate, checkPermission('orders', 'delete'), deleteOrder);
router.post('/bulk-delete', authenticate, checkPermission('orders', 'bulkDelete'), bulkDeleteOrders);

export default router;
