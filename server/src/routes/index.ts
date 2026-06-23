import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import videoRoutes from './videoRoutes.js';
import userRoutes from './userRoutes.js';
import customerRoutes from './customerRoutes.js';
import orderRoutes from './orderRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import roleRoutes from './roleRoutes.js';
import settingRoutes from './settingRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import clientProductRoutes from './client.productRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import contactRoutes from './contactRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/videos', videoRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/roles', roleRoutes);
router.use('/settings', settingRoutes);
router.use('/uploads', uploadRoutes);
router.use('/client', clientProductRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/contact', contactRoutes);
router.use('/media', mediaRoutes);
router.use('/notifications', notificationRoutes);

export default router;
