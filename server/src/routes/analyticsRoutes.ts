import { Router, type Router as ExpressRouter } from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router: ExpressRouter = Router();

router.get('/', authenticate, getDashboardAnalytics);

export default router;
