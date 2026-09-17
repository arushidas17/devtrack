import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/activity - Recent activity stream (commits, PRs, issues)
router.get('/', optionalAuth, activityController.getActivityFeed);

// GET /api/activity/weekly - Weekly commit distribution (Mon-Sun)
router.get('/weekly', optionalAuth, activityController.getWeeklyActivity);

// GET /api/activity/heatmap - Year-long contribution heatmap
router.get('/heatmap', optionalAuth, activityController.getHeatmapData);

export default router;
