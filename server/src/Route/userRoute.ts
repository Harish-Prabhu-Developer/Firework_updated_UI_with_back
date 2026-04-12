import express from 'express';
import { 
    getRoles, 
    addRole, 
    updateRole, 
    deleteRole, 
    getRolePermissions, 
    updateRolePermissions,
    getPermissionMetadata,
    getUsers,
    addUser,
    updateUserAccount,
    deleteUserAccount
} from '../Controller/userController.js';

const router = express.Router();

// User Accounts CRUD
router.get('/', getUsers);
router.post('/', addUser);
router.put('/:id', updateUserAccount);
router.delete('/:id', deleteUserAccount);

// Roles CRUD
router.get('/roles', getRoles);
router.post('/roles', addRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// Role Permissions CRUD
router.get('/roles/:roleId/permissions', getRolePermissions);
router.post('/role-permissions', updateRolePermissions);

// Metadata for UI Matrix
router.get('/permission-metadata', getPermissionMetadata);

export default router;
