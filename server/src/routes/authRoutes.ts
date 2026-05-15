import { Router, type Router as ExpressRouter } from 'express';
import { login, getProfile, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router: ExpressRouter = Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;