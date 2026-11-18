import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protectRoute, logout);
router.get('/me', protectRoute, getMe);

export default router;
