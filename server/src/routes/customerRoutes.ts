import { Router } from 'express';
import {
    createCustomer,
    updateCustomer,
    getAllCustomers,
    getCustomerById,
    deleteCustomer,
    bulkDeleteCustomers,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.post('/', checkPermission('customers', 'create'), createCustomer);
router.put('/:id', checkPermission('customers', 'update'), updateCustomer);
router.get('/', checkPermission('customers', 'read'), getAllCustomers);
router.get('/:id', checkPermission('customers', 'read'), getCustomerById);
router.delete('/:id', checkPermission('customers', 'delete'), deleteCustomer);
router.post('/bulk-delete', checkPermission('customers', 'bulkDelete'), bulkDeleteCustomers);

export default router;