// server/src/repositories/notificationRepository.ts
import { db } from '../db/index.js';
import { notifications } from '../db/schema/notifications.js';
import { fcmTokens, devicePlatformEnum } from '../db/schema/fcmTokens.js';
import { eq, and, lt } from 'drizzle-orm';

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

export const deleteOldNotifications = async (days = 5) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    await db.delete(notifications).where(lt(notifications.createdAt, cutoffDate));
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

/**
 * Upsert by fcmToken — a device re-registering (token unchanged) updates its
 * row in place; a token that moved to a different logged-in user gets
 * reassigned rather than duplicated.
 */
export const upsertFcmToken = async (
    userId: string,
    fcmToken: string,
    platform: (typeof devicePlatformEnum.enumValues)[number]
) => {
    const [token] = await db
        .insert(fcmTokens)
        .values({ userId, fcmToken, platform })
        .onConflictDoUpdate({
            target: fcmTokens.fcmToken,
            set: { userId, platform, updatedAt: new Date() },
        })
        .returning();
    return token;
};


export const getUserDeviceTokens = async (userId: string) => {
    const rows = await db
        .select({ fcmToken: fcmTokens.fcmToken })
        .from(fcmTokens)
        .where(eq(fcmTokens.userId, userId));

    return rows.map((r) => r.fcmToken);
};
export const removeInvalidToken = async (fcmToken: string) => {
    await db.delete(fcmTokens).where(eq(fcmTokens.fcmToken, fcmToken));
};