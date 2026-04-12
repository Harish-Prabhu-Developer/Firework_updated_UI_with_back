import express from 'express';
import { register, login, refreshToken, logout, forceLogout } from '../Controller/authController.js';
import { authenticate, authorizeSuperAdmin } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Force logout specific user (Super Admin only)
router.post('/force-logout/:userId', authenticate, authorizeSuperAdmin, forceLogout);

export default router;
