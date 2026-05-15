import { Router, type Router as ExpressRouter } from 'express';
import {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    getInvoiceToken,
    updateInvoice,
    getInvoicePDF,
    deleteInvoice,
    bulkDeleteInvoices,
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();

// Public route for PDF generation (uses encrypted token, handles slashes in Base64)
// Public route for PDF generation (uses encrypted token, handles all characters in Base64)
router.get('/pdf/*', getInvoicePDF);

router.use(authenticate);

router.post('/', checkPermission('invoices', 'create'), createInvoice);
router.get('/', checkPermission('invoices', 'read'), getAllInvoices);
router.get('/:id/token', checkPermission('invoices', 'read'), getInvoiceToken);
router.get('/:id', checkPermission('invoices', 'read'), getInvoiceById);
router.put('/:id', checkPermission('invoices', 'update'), updateInvoice);

router.delete('/:id', checkPermission('invoices', 'delete'), deleteInvoice);
router.post('/bulk-delete', checkPermission('invoices', 'bulkDelete'), bulkDeleteInvoices);

export default router;