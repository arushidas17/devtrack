import * as activityService from '../services/activity.service.js';

/**
 * Get Recent Activity Feed
 * GET /api/activity
 */
export const getActivityFeed = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const limit = parseInt(req.query.limit, 10) || 15;

    const activities = await activityService.getUserActivityFeed(userId, limit);

    res.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Weekly Commit Distribution
 * GET /api/activity/weekly
 */
export const getWeeklyActivity = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const weeklyData = await activityService.getWeeklyActivityData(userId);

    res.json({
      success: true,
      data: weeklyData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Yearly Contribution Heatmap
 * GET /api/activity/heatmap
 */
export const getHeatmapData = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const heatmap = await activityService.getHeatmapData(userId);

    res.json({
      success: true,
      count: heatmap.length,
      data: heatmap,
    });
  } catch (error) {
    next(error);
  }
};
