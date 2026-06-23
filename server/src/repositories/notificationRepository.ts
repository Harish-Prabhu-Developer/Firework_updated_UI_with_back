import { db } from '../db/index.js';
import { notifications } from '../db/schema/notifications.js';
import { userSessions } from '../db/schema/users.js';
import { eq, and, isNotNull } from 'drizzle-orm';

export const createNotification = async (payload: {
    userId: string;
    title: string;
    message: string;
    type: string;
    referenceId?: string;
    referenceType?: string;
}) => {
    const [notification] = await db.insert(notifications).values(payload).returning();
    return notification;
};

export const getUserNotifications = async (userId: string, limit = 50) => {
    return await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
        limit,
    });
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
    return await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
};

export const markAllNotificationsAsRead = async (userId: string) => {
    return await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.userId, userId));
};

export const getUserDeviceTokens = async (userId: string) => {
    const sessions = await db.query.userSessions.findMany({
        where: and(
            eq(userSessions.userId, userId),
            isNotNull(userSessions.fcmToken)
        )
    });
    return sessions.map(s => s.fcmToken as string);
};

export const removeInvalidToken = async (fcmToken: string) => {
    await db.update(userSessions)
        .set({ fcmToken: null, fcmPlatform: null })
        .where(eq(userSessions.fcmToken, fcmToken));
};
