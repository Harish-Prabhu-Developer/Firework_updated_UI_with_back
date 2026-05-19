import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { roles, rolePermissions, modules, permissionActions } from '../db/schema/users.js';
import { eq, and } from 'drizzle-orm';

/**
 * Maps route-level action keys (used in checkPermission call sites)
 * → the `action` varchar value stored in the `permission_actions` table.
 *
 * DB stores: 'View' | 'Create' | 'Update' | 'Delete' | 'Bulk Delete' | 'Export' | 'Import'
 *
 * Call sites:
 *   checkPermission('categories', 'read')        → looks up 'View'
 *   checkPermission('categories', 'create')      → looks up 'Create'
 *   checkPermission('roles',      'bulkDelete')  → looks up 'Bulk Delete'
 *   checkPermission('products',   'export')      → looks up 'Export'
 */
const ACTION_MAP: Record<string, string> = {
    // Lowercase aliases used in route files
    read: 'View',
    view: 'View',
    create: 'Create',
    update: 'Update',
    edit: 'Update',
    delete: 'Delete',
    remove: 'Delete',
    bulkdelete: 'Bulk Delete',
    bulkDelete: 'Bulk Delete',
    'bulk-delete': 'Bulk Delete',
    export: 'Export',
    import: 'Import',

    // Exact slugs (pass-through, already correct)
    View: 'View',
    Create: 'Create',
    Update: 'Update',
    Delete: 'Delete',
    'Bulk Delete': 'Bulk Delete',
    Export: 'Export',
    Import: 'Import',
};

export const checkPermission = (moduleSlug: string, actionKey: string) => {
    // Resolve the action slug; fall through to the raw value if not in map
    const resolvedAction = ACTION_MAP[actionKey] ?? ACTION_MAP[actionKey.toLowerCase()] ?? actionKey;

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
                .select({ name: roles.name, isActive: roles.isActive })
                .from(roles)
                .where(eq(roles.id, roleId))
                .limit(1);

            if (!role || !role.isActive) {
                return res.status(403).json({ success: false, msg: 'Role not found or disabled' });
            }

            if (role.name.toLowerCase() === 'super admin') {
                return next();
            }

            // ── Resolve module by slug ──────────────────────────────────────
            // moduleSlug here is the modules.slug column value (e.g. 'categories', 'roles')
            const [moduleRow] = await db
                .select()
                .from(modules)
                .where(eq(modules.slug, moduleSlug))
                .limit(1);

            if (!moduleRow) {
                return res.status(403).json({
                    success: false,
                    msg: `Module '${moduleSlug}' is not registered`,
                });
            }

            // ── Resolve action by the `action` slug column ──────────────────
            const [actionRow] = await db
                .select()
                .from(permissionActions)
                .where(eq(permissionActions.action, resolvedAction))
                .limit(1);

            if (!actionRow) {
                return res.status(403).json({
                    success: false,
                    msg: `Action '${resolvedAction}' is not registered`,
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
                        eq(rolePermissions.actionId, actionRow.id),
                    ),
                )
                .limit(1);

            const isGranted = Boolean(permission?.isAllowed || permission?.allowAll);

            if (!isGranted) {
                return res.status(403).json({
                    success: false,
                    msg: `Permission denied: '${resolvedAction}' on '${moduleRow.name}'`,
                });
            }

            return next();
        } catch (error) {
            console.error('[checkPermission] error:', error);
            return res.status(500).json({ success: false, msg: 'Permission check failed' });
        }
    };
};