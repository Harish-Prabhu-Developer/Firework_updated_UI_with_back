import { Router, type Router as ExpressRouter } from 'express';
import { sendContactEmail } from '../controllers/contactController.js';

const router: ExpressRouter = Router();

router.post('/', sendContactEmail);

export default router;
