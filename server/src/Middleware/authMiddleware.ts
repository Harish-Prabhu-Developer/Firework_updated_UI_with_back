import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { db } from '../db/index.js';
import { users, roles } from '../db/schema/users.js';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        roleId: string;
        roleName?: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, msg: "Access token required" });

        const decoded = verifyToken(token);
        
        // Fetch user and role
        const userResult = await db.select({
            id: users.id,
            roleId: users.roleId,
            roleName: roles.name,
            isActive: users.isActive
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, decoded.id));

        if (userResult.length === 0 || !userResult[0].isActive) {
            return res.status(401).json({ success: false, msg: "Unauthorized" });
        }

        req.user = {
            id: userResult[0].id,
            roleId: userResult[0].roleId || '',
            roleName: userResult[0].roleName || ''
        };

        next();
    } catch (error) {
        return res.status(401).json({ success: false, msg: "Invalid token" });
    }
};

export const authorizeSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.roleName !== 'Super Admin') {
        return res.status(403).json({ success: false, msg: "Forbidden: Super Admin access required" });
    }
    next();
};
