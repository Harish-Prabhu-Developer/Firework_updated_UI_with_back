// server/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    upsertFcmToken,
    removeInvalidToken,
    deleteOldNotifications
} from '../repositories/notificationRepository.js';
import { db } from '../db/index.js';
import { notifications } from '../db/schema/notifications.js';
import { eq, and } from 'drizzle-orm';
import { queryToPositiveInt } from '../utils/request.js';

export const registerDeviceToken = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, msg: 'Unauthorized' });

        const { fcmToken, platform } = req.body as {
            fcmToken?: string;
            platform?: 'android' | 'ios' | 'web';
        };

        if (!fcmToken || !platform) {
            return res.status(400).json({ success: false, msg: 'fcmToken and platform are required' });
        }
        if (!['android', 'ios', 'web'].includes(platform)) {
            return res.status(400).json({ success: false, msg: 'platform must be android, ios, or web' });
        }

        await upsertFcmToken(userId, fcmToken, platform);
        res.json({ success: true, msg: 'Device registered for push notifications' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const unregisterDeviceToken = async (req: Request, res: Response) => {
    try {
        const { fcmToken } = req.body as { fcmToken?: string };
        if (!fcmToken) return res.status(400).json({ success: false, msg: 'fcmToken is required' });

        await removeInvalidToken(fcmToken);
        res.json({ success: true, msg: 'Device unregistered' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

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

        // Fire and forget cleanup of old notifications (older than 5 days)
        deleteOldNotifications(5).catch(err => console.error('Cleanup old notifications error:', err));

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