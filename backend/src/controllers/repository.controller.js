import * as repositoryService from '../services/repository.service.js';

/**
 * Get all repositories for user
 * GET /api/repositories
 */
export const getRepositories = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const repositories = await repositoryService.getRepositories(userId, token);

    res.json({
      success: true,
      count: repositories.length,
      repositories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single repository details by ID or name
 * GET /api/repositories/:id
 */
export const getRepositoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const details = await repositoryService.getRepositoryDetails(id, token);

    if (!details) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync repositories from GitHub API into DB
 * POST /api/repositories/sync
 */
export const syncRepositories = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const synced = await repositoryService.syncUserRepositories(userId, token);

    res.json({
      success: true,
      message: 'Repositories successfully synced from GitHub',
      count: synced.length,
      repositories: synced,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get commits for a repository
 * GET /api/repositories/:id/commits
 */
export const getRepositoryCommits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const commits = await repositoryService.getRepositoryCommits(id, token);

    res.json({
      success: true,
      count: commits.length,
      commits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pull requests for a repository
 * GET /api/repositories/:id/pull-requests
 */
export const getRepositoryPullRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const pullRequests = await repositoryService.getRepositoryPullRequests(id, token);

    res.json({
      success: true,
      count: pullRequests.length,
      pullRequests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get issues for a repository
 * GET /api/repositories/:id/issues
 */
export const getRepositoryIssues = async (req, res, next) => {
  try {
    const { id } = req.params;
    const token = req.user?.access_token || process.env.GITHUB_ACCESS_TOKEN || 'demo_token';

    const issues = await repositoryService.getRepositoryIssues(id, token);

    res.json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    next(error);
  }
};
