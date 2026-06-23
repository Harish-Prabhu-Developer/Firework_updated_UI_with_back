import { Request, Response } from 'express';
import { 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from '../repositories/notificationRepository.js';
import { db } from '../db/index.js';
import { notifications } from '../db/schema/notifications.js';
import { eq, and } from 'drizzle-orm';
import { queryToPositiveInt } from '../utils/request.js';

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, msg: 'Unauthorized' });
        }

        const limitNum = queryToPositiveInt(req.query.limit, 50);

        const data = await getUserNotifications(userId, limitNum);

        // Get unread count
        const unreadCountQuery = await db.select().from(notifications).where(
            and(eq(notifications.userId, userId), eq(notifications.isRead, false))
        );
        const unreadCount = unreadCountQuery.length;

        res.json({ success: true, data, unreadCount });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const readNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const notificationId = req.params.id as string;
        if (!userId || !notificationId) {
            return res.status(400).json({ success: false, msg: 'Invalid request' });
        }

        await markNotificationAsRead(notificationId, userId);
        res.json({ success: true, msg: 'Notification marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const readAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, msg: 'Unauthorized' });
        }

        await markAllNotificationsAsRead(userId);
        res.json({ success: true, msg: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
