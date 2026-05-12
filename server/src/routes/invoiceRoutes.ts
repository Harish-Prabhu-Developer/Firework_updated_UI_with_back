import { Router } from 'express';
import {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    getInvoicePDF,
    deleteInvoice,
    bulkDeleteInvoices,
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.post('/', checkPermission('invoices', 'create'), createInvoice);
router.get('/', checkPermission('invoices', 'read'), getAllInvoices);
router.get('/:id', checkPermission('invoices', 'read'), getInvoiceById);
router.put('/:id', checkPermission('invoices', 'update'), updateInvoice);
router.get('/pdf/:encryptedId', getInvoicePDF);
router.delete('/:id', checkPermission('invoices', 'delete'), deleteInvoice);
router.post('/bulk-delete', checkPermission('invoices', 'bulkDelete'), bulkDeleteInvoices);

export default router;