import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { roles, modules, permissionActions, rolePermissions } from '../db/schema/users.js';
import { eq, and, inArray } from 'drizzle-orm';
import { bodyToStringArray, paramToString } from '../utils/request.js';

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name) return res.status(400).json({ success: false, msg: 'Name required' });
        const [role] = await db.insert(roles).values({ name, description, isActive: isActive !== undefined ? isActive : true }).returning();
        res.status(201).json({ success: true, data: role });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        const { name, description, isActive } = req.body;
        if (!id) return res.status(400).json({ success: false, msg: 'Role ID required' });

        const [role] = await db.update(roles).set({ name, description, isActive }).where(eq(roles.id, id)).returning();
        if (!role) return res.status(404).json({ success: false, msg: 'Role not found' });
        res.json({ success: true, data: role });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllRoles = async (req: Request, res: Response) => {
    try {
        const all = await db.select().from(roles);
        res.json({ success: true, data: all });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getRoleById = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Role ID required' });

        const [role] = await db.select().from(roles).where(eq(roles.id, id));
        if (!role) return res.status(404).json({ success: false, msg: 'Role not found' });
        const perms = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, role.id));
        res.json({ success: true, data: { ...role, permissions: perms } });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const id = paramToString(req.params.id);
        if (!id) return res.status(400).json({ success: false, msg: 'Role ID required' });

        const result = await db.delete(roles).where(eq(roles.id, id));
        if (!result.rowCount) return res.status(404).json({ success: false, msg: 'Role not found' });
        res.json({ success: true, msg: 'Role deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const bulkDeleteRoles = async (req: Request, res: Response) => {
    try {
        const ids = bodyToStringArray(req.body.ids);
        if (ids.length === 0) return res.status(400).json({ success: false, msg: 'IDs required' });

        const result = await db.delete(roles).where(inArray(roles.id, ids));
        res.json({ success: true, msg: `${result.rowCount} roles deleted` });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllModules = async (req: Request, res: Response) => {
    try {
        const all = await db.select().from(modules);
        res.json({ success: true, data: all });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getAllActions = async (req: Request, res: Response) => {
    try {
        const all = await db.select().from(permissionActions);
        res.json({ success: true, data: all });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const assignPermission = async (req: Request, res: Response) => {
    try {
        const { roleId, moduleId, actionId, isAllowed, allowAll } = req.body;
        if (!roleId || !moduleId || !actionId) return res.status(400).json({ success: false, msg: 'Missing required fields' });

        const existing = await db.select().from(rolePermissions).where(
            and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.moduleId, moduleId), eq(rolePermissions.actionId, actionId))
        ).limit(1);

        let result;
        if (existing[0]) {
            result = await db.update(rolePermissions).set({ isAllowed: isAllowed ?? false, allowAll: allowAll ?? false }).where(eq(rolePermissions.id, existing[0].id)).returning();
        } else {
            result = await db.insert(rolePermissions).values({ roleId, moduleId, actionId, isAllowed: isAllowed ?? false, allowAll: allowAll ?? false }).returning();
        }
        res.json({ success: true, data: result[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getRolePermissions = async (req: Request, res: Response) => {
    try {
        const roleId = paramToString(req.params.id);
        if (!roleId) return res.status(400).json({ success: false, msg: 'Role ID required' });

        const perms = await db.select({
            moduleId: rolePermissions.moduleId,
            moduleName: modules.name,
            moduleSlug: modules.slug,
            actionId: rolePermissions.actionId,
            actionName: permissionActions.name,
            actionSlug: permissionActions.action,
            isAllowed: rolePermissions.isAllowed,
            allowAll: rolePermissions.allowAll,
        })
            .from(rolePermissions)
            .leftJoin(modules, eq(rolePermissions.moduleId, modules.id))
            .leftJoin(permissionActions, eq(rolePermissions.actionId, permissionActions.id))
            .where(eq(rolePermissions.roleId, roleId));

        res.json({ success: true, data: perms });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const saveRolePermissions = async (req: Request, res: Response) => {
    try {
        const roleId = paramToString(req.params.id);
        const permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
        if (!roleId) return res.status(400).json({ success: false, msg: 'Role ID required' });

        const saved = [];
        for (const permission of permissions) {
            const { moduleId, actionId } = permission;
            if (!moduleId || !actionId) continue;

            const existing = await db.select().from(rolePermissions).where(
                and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.moduleId, moduleId), eq(rolePermissions.actionId, actionId))
            ).limit(1);

            const values = {
                isAllowed: Boolean(permission.isAllowed),
                allowAll: Boolean(permission.allowAll),
            };

            if (existing[0]) {
                const [row] = await db.update(rolePermissions).set(values).where(eq(rolePermissions.id, existing[0].id)).returning();
                saved.push(row);
            } else {
                const [row] = await db.insert(rolePermissions).values({ roleId, moduleId, actionId, ...values }).returning();
                saved.push(row);
            }
        }

        res.json({ success: true, data: saved });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};

export const getMyPermissions = async (req: Request, res: Response) => {
    try {
        const roleId = req.user!.roleId;
        if (!roleId) return res.status(401).json({ success: false, msg: 'Role not assigned to user' });

        const perms = await db.select({
            moduleName: modules.name,
            actionName: permissionActions.action,
            isAllowed: rolePermissions.isAllowed,
            allowAll: rolePermissions.allowAll
        })
        .from(rolePermissions)
        .leftJoin(modules, eq(rolePermissions.moduleId, modules.id))
        .leftJoin(permissionActions, eq(rolePermissions.actionId, permissionActions.id))
        .where(eq(rolePermissions.roleId, roleId));

        // Format to { moduleName: { actionName: boolean } }
        const permissionMap: any = {};
        perms.forEach(p => {
            if (!p.moduleName) return;
            if (!permissionMap[p.moduleName]) permissionMap[p.moduleName] = {};
            permissionMap[p.moduleName][p.actionName!] = p.isAllowed || p.allowAll;
        });

        res.json({ success: true, data: permissionMap });
    } catch (error: any) {
        res.status(500).json({ success: false, msg: error.message });
    }
};
