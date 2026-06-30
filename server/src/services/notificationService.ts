// server/src/services/notificationService.ts
import { getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { db } from '../db/index.js';
import {
    createNotification,
    getUserDeviceTokens,
    removeInvalidToken
} from '../repositories/notificationRepository.js';

// Avoid re-initializing if already initialized
if (!getApps().length) {
    // If no GOOGLE_APPLICATION_CREDENTIALS are set, this might fail or fallback to defaults
    try {
        initializeApp();
        console.log('[NotificationService] Firebase Admin Initialized successfully.');
    } catch (error) {
        console.error('[NotificationService] Failed to initialize Firebase Admin:', error);
    }
}

export const sendToUser = async (
    userId: string,
    payload: { title: string; message: string; type: string; referenceId?: string; referenceType?: string; screen?: string; route?: string; status?: string; orderNumber?: string; rejectionReason?: string; }
) => {
    try {
        // 1. Create the notification in DB
        const notification = await createNotification({
            userId,
            title: payload.title,
            message: payload.message,
            type: payload.type,
            referenceId: payload.referenceId,
            referenceType: payload.referenceType
        });

        // 2. Fetch all valid tokens for this user
        const tokens = await getUserDeviceTokens(userId);
        if (!tokens || tokens.length === 0) return notification;

        // 3. Prepare FCM message
        const message = {
            notification: {
                title: payload.title,
                body: payload.message,
            },
            data: {
                type: payload.type || '',
                referenceId: payload.referenceId || '',
                referenceType: payload.referenceType || '',
                screen: payload.screen || '',
                route: payload.route || '',
                status: payload.status || '',
                orderNumber: payload.orderNumber || '',
                rejectionReason: payload.rejectionReason || ''
            },
            tokens,
        };

        // 4. Send via Firebase Admin
        const response = await getMessaging().sendEachForMulticast(message);

        // 5. Clean up invalid tokens
        if (response.failureCount > 0) {
            response.responses.forEach((res: any, idx: number) => {
                if (!res.success) {
                    const errorCode = res.error?.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        // Remove token from DB
                        removeInvalidToken(tokens[idx]).catch(e => console.error(e));
                    }
                }
            });
        }

        return notification;
    } catch (error) {
        console.error('[NotificationService] Error sending to user:', error);
        return null;
    }
};

export const sendToRole = async (
    roleName: string,
    payload: { title: string; message: string; type: string; referenceId?: string; referenceType?: string; screen?: string; route?: string; status?: string; orderNumber?: string; }
) => {
    try {
        const allUsers = await db.query.users.findMany({
            with: { role: true }
        });

        const targetUsers = allUsers.filter(u => u.role?.name?.toLowerCase() === roleName.toLowerCase());

        const results = [];
        for (const user of targetUsers) {
            results.push(await sendToUser(user.id, payload));
        }
        return results;
    } catch (error) {
        console.error('[NotificationService] Error sending to role:', error);
    }
};
export const sendToAllUsers = async (
    payload: { title: string; message: string; type: string; referenceId?: string; referenceType?: string; screen?: string; route?: string; status?: string; orderNumber?: string; }
) => {
    try {
        const allUsers = await db.query.users.findMany();

        const results = [];
        for (const user of allUsers) {
            results.push(await sendToUser(user.id, payload));
        }
        return results;
    } catch (error) {
        console.error('[NotificationService] Error sending to all users:', error);
    }
};
