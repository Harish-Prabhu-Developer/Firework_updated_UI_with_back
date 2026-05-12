import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { db } from '../db/index.js';
import { users } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, msg: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
        if (!user[0] || !user[0].isActive) {
            return res.status(401).json({ success: false, msg: 'User not found or inactive' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, msg: 'Invalid or expired token' });
    }
};