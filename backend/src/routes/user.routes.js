import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/user - Get authenticated or default user profile
router.get('/', optionalAuth, userController.getUserProfile);

// GET /api/user/stats - Get user statistics summary
router.get('/stats', optionalAuth, userController.getUserStats);

export default router;
