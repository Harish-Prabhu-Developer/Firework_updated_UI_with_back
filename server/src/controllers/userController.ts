import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, roles, userSessions } from '../db/schema/users.js';
import { eq, inArray, desc, or, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
    bodyToStringArray,
    paramToString,
    queryToOptionalString,
    queryToPositiveInt,
} from '../utils/request.js';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, password, roleId, isActive } = req.body;
        if ((!email && !phone) || !password) return res.status(400).json({ success: false, msg: 'Email/phone and password required' });

        const existing = email && phone
            ? await db.select().from(users).where(or(eq(users.email, email), eq(users.phone, phone))).limit(1)
            : email
                ? await db.select().from(users).where(eq(users.email, email)).limit(1)
                : await db.select().from(users).where(eq(users.phone, phone)).limit(1);
        if (existing[0]) return res.status(400).json({ success: false, msg: 'User with this email or phone already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const [user] = await db.insert(users).values({ name, email, phone, password: hashed, roleId, isActive: isActive !== undefined ? isActive : true }).returning();
        delete (user as any).password;
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, email, phone, password, roleId, isActive } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'User ID required' });

        const updateData: any = { updatedAt: new Date() };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (roleId !== undefined) updateData.roleId = roleId;
        if (isActive !== undefined) updateData.isActive = isActive;

        const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
        if (!user) return res.status(404).json({ success: false, msg: 'User not found' });
        delete (user as any).password;
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const pageNum = queryToPositiveInt(req.query.page, 1);
        const limitNum = queryToPositiveInt(req.query.limit, 50);
        const search = queryToOptionalString(req.query.search);
        const rows = search
            ? await db
                .select()
                .from(users)
                .leftJoin(roles, eq(users.roleId, roles.id))
                .where(
                    or(
                        ilike(users.name, `%${search}%`),
                        ilike(users.email, `%${search}%`),
                        ilike(users.phone, `%${search}%`)
                    )
                )
                .orderBy(desc(users.createdAt))
            : await db.select().from(users).leftJoin(roles, eq(users.roleId, roles.id)).orderBy(desc(users.createdAt));
        const data = rows.map(row => ({ ...row.users, role: row.roles, password: undefined }));
        const total = data.length;
        const paginated = data.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        res.json({ success: true, data: paginated, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'User ID required' });

        const row = await db.select().from(users).where(eq(users.id, id)).leftJoin(roles, eq(users.roleId, roles.id)).limit(1);
        if (!row[0]) return res.status(404).json({ success: false, msg: 'User not found' });
        const user = { ...row[0].users, role: row[0].roles, password: undefined };
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'User ID required' });

        if (id === req.user?.id) return res.status(400).json({ success: false, msg: 'Cannot delete own account' });
        await db.delete(userSessions).where(eq(userSessions.userId, id));
        const result = await db.delete(users).where(eq(users.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'User not found' });
        res.json({ success: true, msg: 'User deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteUsers = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });
        if (ids.includes(req.user!.id)) return res.status(400).json({ success: false, msg: 'Cannot delete own account' });
        for (const id of ids) await db.delete(userSessions).where(eq(userSessions.userId, id));
        const result = await db.delete(users).where(inArray(users.id, ids));
        res.json({ success: true, msg: `${result.rowCount} users deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
