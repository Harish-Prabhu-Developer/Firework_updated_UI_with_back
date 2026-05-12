import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = Router();
router.use(authenticate);

router.get('/', checkPermission('settings', 'read'), getSettings);
router.put('/', checkPermission('settings', 'update'), updateSettings);

export default router;