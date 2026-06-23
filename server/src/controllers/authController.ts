import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, userSessions, roles } from '../db/schema/users.js';
import { eq, or } from 'drizzle-orm';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password, fcmToken, fcmPlatform } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, msg: 'Identifier and password required' });
        }

        const userResult = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            password: users.password,
            isActive: users.isActive,
            roleId: users.roleId,
            roleName: roles.name,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(
            or(
                eq(users.email, identifier),
                eq(users.phone, identifier)
            )
        ).limit(1);

        const user = userResult[0];

        if (!user) {
            return res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, msg: 'Account is disabled' });
        }

        const payload: TokenPayload = {
            id: user.id,
            email: user.email || undefined,
            phone: user.phone || undefined,
            roleId: user.roleId!,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db.insert(userSessions).values({
            userId: user.id,
            refreshToken,
            fcmToken: fcmToken || null,
            fcmPlatform: fcmPlatform || null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    roleId: user.roleId,
                    roleName: user.roleName,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            roleId: users.roleId,
            roleName: roles.name,
            isActive: users.isActive,
            createdAt: users.createdAt,
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, req.user!.id))
        .limit(1);
        
        res.json({ success: true, data: user[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.body.refreshToken;
        if (refreshToken) {
            await db.delete(userSessions).where(eq(userSessions.refreshToken, refreshToken));
        }
        res.json({ success: true, msg: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateFcmToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken, fcmToken, fcmPlatform } = req.body;
        
        if (!fcmToken) {
            return res.status(400).json({ success: false, msg: 'FCM token required' });
        }

        if (refreshToken) {
            // Update by refreshToken (original behaviour)
            await db.update(userSessions)
                .set({ fcmToken: fcmToken || null, fcmPlatform: fcmPlatform || null })
                .where(eq(userSessions.refreshToken, refreshToken));
        } else if (req.user?.id) {
            // Fallback: find the most recent session for this user and update it
            const sessions = await db.select()
                .from(userSessions)
                .where(eq(userSessions.userId, req.user.id))
                .orderBy(userSessions.createdAt)
                .limit(1);

            if (sessions.length > 0) {
                await db.update(userSessions)
                    .set({ fcmToken, fcmPlatform: fcmPlatform || null })
                    .where(eq(userSessions.id, sessions[0].id));
            } else {
                return res.status(404).json({ success: false, msg: 'No active session found' });
            }
        } else {
            return res.status(400).json({ success: false, msg: 'Refresh token or authentication required' });
        }
            
        res.json({ success: true, msg: 'FCM token updated successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};