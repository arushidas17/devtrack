import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/dashboard - High-level aggregated dashboard summary
router.get('/dashboard', optionalAuth, analyticsController.getDashboardData);

// GET /api/analytics - Full analytics overview (alias to dashboard)
router.get('/', optionalAuth, analyticsController.getDashboardData);

// GET /api/analytics/languages - Top programming languages breakdown
router.get('/languages', optionalAuth, analyticsController.getLanguageAnalytics);

// GET /api/analytics/repositories - Repository rankings & activity score
router.get('/repositories', optionalAuth, analyticsController.getRepositoryRankings);

// GET /api/analytics/pull-requests - PR stats & merge rate
router.get('/pull-requests', optionalAuth, analyticsController.getPullRequestAnalytics);

// GET /api/analytics/issues - Issue stats & resolution rate
router.get('/issues', optionalAuth, analyticsController.getIssueAnalytics);

export default router;
