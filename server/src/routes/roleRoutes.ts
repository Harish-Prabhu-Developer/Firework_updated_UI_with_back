import { Router, type Router as ExpressRouter } from 'express';
import {
    createRole,
    updateRole,
    getAllRoles,
    getRoleById,
    deleteRole,
    bulkDeleteRoles,
    getAllModules,
    getAllActions,
    assignPermission,
    getRolePermissions,
    saveRolePermissions,
    getMyPermissions,
} from '../controllers/roleController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();
router.use(authenticate);

router.get('/my-permissions', getMyPermissions);
router.get('/modules/all', checkPermission('roles', 'read'), getAllModules);
router.get('/actions/all', checkPermission('roles', 'read'), getAllActions);
router.get('/:id/permissions', checkPermission('roles', 'read'), getRolePermissions);
router.post('/:id/permissions', checkPermission('roles', 'update'), saveRolePermissions);
router.post('/bulk-delete', checkPermission('roles', 'bulkDelete'), bulkDeleteRoles);
router.post('/permissions/assign', checkPermission('roles', 'update'), assignPermission);

router.post('/', checkPermission('roles', 'create'), createRole);
router.put('/:id', checkPermission('roles', 'update'), updateRole);
router.get('/', checkPermission('roles', 'read'), getAllRoles);
router.get('/:id', checkPermission('roles', 'read'), getRoleById);
router.delete('/:id', checkPermission('roles', 'delete'), deleteRole);

export default router;
