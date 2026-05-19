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

/**
 * GET /roles/my-permissions
 *
 * Returns the permission map for the currently authenticated user's role.
 *
 * Response shape:
 * {
 *   success: true,
 *   data: {
 *     roleName: "Cashier",
 *     isSuperAdmin: false,
 *     permissions: {
 *       "Categories": { "View": true,  "Create": true,  "Update": false, "Delete": false, "Bulk Delete": false, "Export": true,  "Import": false },
 *       "Products":   { "View": true,  "Create": false, ... },
 *       ...
 *     }
 *   }
 * }
 *
 * The `permissions` object is keyed by modules.name and then by
 * permissionActions.action (the slug column), e.g. "View", "Create",
 * "Update", "Delete", "Bulk Delete", "Export", "Import".
 * This matches exactly what the frontend hasPermission() checks against.
 */
export const getMyPermissions = async (req: Request, res: Response) => {
    try {
        const roleId = req.user!.roleId;
        if (!roleId) {
            return res.status(401).json({ success: false, msg: 'No role assigned to this user' });
        }

        // Fetch the role name so the frontend can set currentRole
        const [roleRow] = await db
            .select({ name: roles.name, isActive: roles.isActive })
            .from(roles)
            .where(eq(roles.id, roleId))
            .limit(1);

        if (!roleRow) {
            return res.status(403).json({ success: false, msg: 'Role not found' });
        }

        if (!roleRow.isActive) {
            return res.status(403).json({ success: false, msg: 'Role is disabled' });
        }

        const roleName = roleRow.name;
        const isSuperAdmin = roleName.toLowerCase() === 'super admin';

        // Super Admin: no DB lookup needed — return a sentinel map
        // The frontend already bypasses checks for Super Admin, but we
        // also return it explicitly so the client can store the role name.
        if (isSuperAdmin) {
            return res.json({
                success: true,
                data: {
                    roleName,
                    isSuperAdmin: true,
                    permissions: {},   // frontend ignores this for super admin
                },
            });
        }

        // Fetch permission rows for this role, joining module name + action slug
        const perms = await db
            .select({
                moduleName: modules.name,
                // Use the `action` column (slug) not the `name` column (human label)
                // because hasPermission() on the frontend does case-insensitive match
                // against the slug: "View", "Create", "Update", "Delete", etc.
                actionSlug: permissionActions.action,
                isAllowed: rolePermissions.isAllowed,
                allowAll: rolePermissions.allowAll,
            })
            .from(rolePermissions)
            .leftJoin(modules, eq(rolePermissions.moduleId, modules.id))
            .leftJoin(permissionActions, eq(rolePermissions.actionId, permissionActions.id))
            .where(eq(rolePermissions.roleId, roleId));

        // Build { "ModuleName": { "ActionSlug": boolean } }
        const permissionMap: Record<string, Record<string, boolean>> = {};

        perms.forEach(p => {
            if (!p.moduleName || !p.actionSlug) return;

            if (!permissionMap[p.moduleName]) {
                permissionMap[p.moduleName] = {};
            }

            // isAllowed OR allowAll → granted
            permissionMap[p.moduleName][p.actionSlug] =
                Boolean(p.isAllowed) || Boolean(p.allowAll);
        });

        return res.json({
            success: true,
            data: {
                roleName,
                isSuperAdmin: false,
                permissions: permissionMap,
            },
        });
    } catch (error: any) {
        console.error('[getMyPermissions] error:', error);
        return res.status(500).json({ success: false, msg: error.message });
    }
};