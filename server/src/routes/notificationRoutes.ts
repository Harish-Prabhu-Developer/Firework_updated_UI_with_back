// server/src/routes/notificationRoutes.ts
import { Router, type Router as ExpressRouter } from 'express';
import {
    getMyNotifications,
    readNotification,
    readAllNotifications,
    registerDeviceToken,
    unregisterDeviceToken
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router: ExpressRouter = Router();

router.get('/my-notifications', authenticate, getMyNotifications);
router.patch('/read/:id', authenticate, readNotification);
router.patch('/read-all', authenticate, readAllNotifications);
router.post('/fcm-token', authenticate, registerDeviceToken);
router.delete('/fcm-token', authenticate, unregisterDeviceToken);

export default router;