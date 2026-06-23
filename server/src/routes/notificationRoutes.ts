import { Router, type Router as ExpressRouter } from 'express';
import { 
    getMyNotifications, 
    readNotification, 
    readAllNotifications 
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router: ExpressRouter = Router();

router.get('/my-notifications', authenticate, getMyNotifications);
router.patch('/read/:id', authenticate, readNotification);
router.patch('/read-all', authenticate, readAllNotifications);

export default router;
