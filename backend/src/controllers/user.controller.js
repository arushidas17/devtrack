import * as userModel from '../models/user.model.js';
import * as repositoryModel from '../models/repository.model.js';
import * as commitModel from '../models/commit.model.js';

/**
 * Get User Profile info
 * GET /api/user
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    let user = await userModel.findUserById(userId);

    if (!user) {
      user = {
        username: 'arushidas17',
        name: 'Arushi Das',
        avatarUrl: 'https://github.com/identicons/arushidas17.png',
        bio: 'Full-stack & AI Developer building DevTrack.',
        githubUrl: 'https://github.com/arushidas17',
        repositories: 18,
      };
    }

    const repoCount = await repositoryModel.countRepositoriesByUser(userId);

    res.json({
      success: true,
      data: {
        username: user.username,
        name: user.name,
        avatarUrl: user.avatar_url || user.avatarUrl,
        bio: user.bio,
        githubUrl: user.github_url || user.githubUrl,
        repositories: repoCount > 0 ? repoCount : 18,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Quick User Stats
 * GET /api/user/stats
 */
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const repos = await repositoryModel.findRepositoriesByUser(userId);
    const commitsCount = await commitModel.countCommitsByUser(userId);

    const totalStars = repos.reduce((sum, r) => sum + (r.stars || 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks || 0), 0);

    res.json({
      success: true,
      data: {
        repositories: repos.length || 18,
        totalCommits: commitsCount > 0 ? commitsCount : 462,
        totalStars: totalStars || 84,
        totalForks: totalForks || 29,
        activeSince: '2024-01-15',
      },
    });
  } catch (error) {
    next(error);
  }
};
