import express from 'express';
import { 
    createInvoice, 
    getAllInvoices, 
    getInvoiceById, 
    updateInvoice, 
    deleteInvoice,
    getInvoicePDF
} from '../Controller/invoiceController.js';

const invoiceRoute = express.Router();

invoiceRoute.post('/', createInvoice);
invoiceRoute.get('/', getAllInvoices);
invoiceRoute.get('/pdf/:invoiceNumber', getInvoicePDF);
invoiceRoute.get('/:id', getInvoiceById);
invoiceRoute.put('/:id', updateInvoice);
invoiceRoute.delete('/:id', deleteInvoice);

export default invoiceRoute;
