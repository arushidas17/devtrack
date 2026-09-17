import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// GitHub OAuth entrypoint
router.get('/github', authLimiter, authController.initiateGithubAuth);

// GitHub OAuth redirect callback
router.get('/github/callback', authController.handleGithubCallback);

// Current user profile from JWT session
router.get('/me', requireAuth, authController.getCurrentUser);

// Logout
router.post('/logout', authController.logout);

// Instant local dev login for previewing dashboard (only in development)
router.get('/dev-login', authController.devLogin);

export default router;
