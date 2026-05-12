import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { roles, rolePermissions, modules, permissionActions } from '../db/schema/users.js';
import { eq, and } from 'drizzle-orm';

/**
 * Maps route-level action keys to the `action` column value stored in
 * the `permission_actions` table.
 *
 * DB stores slugs like: 'read', 'create', 'update', 'delete', …
 * (matches the `action` varchar column, NOT the human-readable `name` column)
 *
 * Call site: checkPermission('categories', 'read')
 *            checkPermission('roles', 'bulkDelete')
 */
const ACTION_MAP: Record<string, string> = {
    read:       'View',
    create:     'Create',
    update:     'Update',
    delete:     'Delete',
    bulkDelete: 'Bulk Delete',
    export:     'Export',
    import:     'Import',
};

export const checkPermission = (moduleSlug: string, actionKey: string) => {
    const resolvedAction = ACTION_MAP[actionKey] ?? actionKey;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, msg: 'Unauthorized' });
            }

            const { roleId } = req.user;
            if (!roleId) {
                return res.status(403).json({ success: false, msg: 'No role assigned to user' });
            }

            // ── Super Admin bypass ──────────────────────────────────────────
            const [role] = await db
                .select({ name: roles.name })
                .from(roles)
                .where(eq(roles.id, roleId))
                .limit(1);

            if (role?.name?.toLowerCase() === 'super admin') {
                return next();
            }

            // ── Resolve module ──────────────────────────────────────────────
            const [moduleRow] = await db
                .select()
                .from(modules)
                .where(eq(modules.slug, moduleSlug))
                .limit(1);

            if (!moduleRow) {
                return res.status(403).json({
                    success: false,
                    msg: `Module '${moduleSlug}' not found`,
                });
            }

            // ── Resolve action ──────────────────────────────────────────────
            const [actionRow] = await db
                .select()
                .from(permissionActions)
                .where(eq(permissionActions.action, resolvedAction))
                .limit(1);

            if (!actionRow) {
                return res.status(403).json({
                    success: false,
                    msg: `Action '${resolvedAction}' not found`,
                });
            }

            // ── Check permission matrix ─────────────────────────────────────
            const [permission] = await db
                .select()
                .from(rolePermissions)
                .where(
                    and(
                        eq(rolePermissions.roleId, roleId),
                        eq(rolePermissions.moduleId, moduleRow.id),
                        eq(rolePermissions.actionId, actionRow.id)
                    )
                )
                .limit(1);

            const isGranted = Boolean(permission?.isAllowed || permission?.allowAll);

            if (!isGranted) {
                return res.status(403).json({
                    success: false,
                    msg: `Permission denied: '${actionKey}' on '${moduleSlug}'`,
                });
            }

            next();
        } catch (error) {
            console.error('[checkPermission] error:', error);
            return res.status(500).json({ success: false, msg: 'Permission check failed' });
        }
    };
};