import { Router, type Router as ExpressRouter } from 'express';
import {
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    deleteUser,
    bulkDeleteUsers,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();
router.use(authenticate);

router.post('/', checkPermission('users', 'create'), createUser);
router.put('/:id', checkPermission('users', 'update'), updateUser);
router.get('/', checkPermission('users', 'read'), getAllUsers);
router.get('/:id', checkPermission('users', 'read'), getUserById);
router.delete('/:id', checkPermission('users', 'delete'), deleteUser);
router.post('/bulk-delete', checkPermission('users', 'bulkDelete'), bulkDeleteUsers);

export default router;