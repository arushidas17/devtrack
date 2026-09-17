import * as analyticsService from '../services/analytics.service.js';

/**
 * Main Combined Dashboard Endpoint
 * GET /api/dashboard
 */
export const getDashboardData = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const dashboard = await analyticsService.getDashboardSummary(userId, token);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Top Languages Breakdown
 * GET /api/analytics/languages
 */
export const getLanguageAnalytics = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const languages = await analyticsService.getLanguagesAnalytics(userId, token);

    res.json({
      success: true,
      data: languages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Repository Activity Rankings
 * GET /api/analytics/repositories
 */
export const getRepositoryRankings = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const rankings = await analyticsService.getRepositoryRankings(userId, token);

    res.json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pull Request Analytics (Total, Merged, Open, Closed, Merge Rate)
 * GET /api/analytics/pull-requests
 */
export const getPullRequestAnalytics = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const stats = await analyticsService.getPullRequestAnalytics(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Issue Analytics (Total, Open, Closed, Resolution Rate)
 * GET /api/analytics/issues
 */
export const getIssueAnalytics = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const stats = await analyticsService.getIssueAnalytics(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
