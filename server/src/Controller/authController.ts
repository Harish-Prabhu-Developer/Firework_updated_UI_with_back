import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, userSessions } from '../db/schema/users.js';
import { eq, or, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

// register user
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, password, roleId } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, msg: 'Password is required' });
        }

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await db.insert(users).values({
            name,
            email,
            phone,
            password: hashedPassword,
            roleId
        }).returning();
        
        res.status(201).json({
            success: true,
            msg: 'User registered successfully',
            data: user[0]
        });
    } catch (error: any) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, msg: error.message || 'Internal server error' });
    }
};

// login user
export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body; 
        
        if (!identifier || !password) {
            return res.status(400).json({ success: false, msg: 'Email/Phone and Password are required' });
        }

        // Find user
        const userResult = await db.select().from(users).where(
            or(eq(users.email, identifier), eq(users.phone, identifier))
        );

        if (userResult.length === 0) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        const user = userResult[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password || "");
        if (!validPassword) {
            return res.status(401).json({ success: false, msg: 'Invalid password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, msg: 'User account is deactivated' });
        }

        // Generate tokens
        const accessToken = signToken({ id: user.id, roleId: user.roleId });
        const refreshToken = signRefreshToken({ id: user.id });

        // Save session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await db.insert(userSessions).values({
            userId: user.id,
            refreshToken,
            expiresAt,
            ipAddress: req.ip,
            deviceInfo: req.headers['user-agent'] || 'Unknown'
        });

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            msg: 'Login successful',
            accessToken,
            refreshToken,
            user: userWithoutPassword
        });
    } catch (error: any) {
        console.error('Error logging in user:', error);
        res.status(500).json({ success: false, msg: error.message || 'Internal server error' });
    }
};

// refresh token
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ success: false, msg: "Refresh token required" });

        const decoded = verifyRefreshToken(refreshToken);
        
        // Verify session in DB
        const session = await db.select().from(userSessions).where(
            and(
                eq(userSessions.refreshToken, refreshToken),
                eq(userSessions.userId, decoded.id)
            )
        );

        if (session.length === 0) {
            return res.status(403).json({ success: false, msg: "Invalid session" });
        }

        // Generate new access token
        const user = await db.select().from(users).where(eq(users.id, decoded.id));
        const newAccessToken = signToken({ id: user[0].id, roleId: user[0].roleId });

        res.json({ success: true, accessToken: newAccessToken });
    } catch (error: any) {
        res.status(403).json({ success: false, msg: "Invalid or expired refresh token" });
    }
};

// logout user
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ success: false, msg: "Refresh token required" });

        await db.delete(userSessions).where(eq(userSessions.refreshToken, refreshToken));
        
        res.json({ success: true, msg: "Logged out successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

// force logout user (Super Admin only can trigger this)
export const forceLogout = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params; // ID of the user to be logged out
        
        await db.delete(userSessions).where(eq(userSessions.userId, userId as string));
        
        res.json({ success: true, msg: `User sessions invalidated successfully` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
