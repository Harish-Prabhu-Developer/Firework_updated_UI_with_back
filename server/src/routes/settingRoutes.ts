import { Router, type Router as ExpressRouter } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router: ExpressRouter = Router();

router.get('/', getSettings);
router.post('/', authenticate, checkPermission('settings', 'update'), updateSettings);
router.put('/', authenticate, checkPermission('settings', 'update'), updateSettings);

export default router;