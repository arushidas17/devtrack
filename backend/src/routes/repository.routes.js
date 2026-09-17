import { Router } from 'express';
import * as repoController from '../controllers/repository.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/repositories - List all repositories
router.get('/', optionalAuth, repoController.getRepositories);

// POST /api/repositories/sync - Sync latest repos and data from GitHub
router.post('/sync', optionalAuth, repoController.syncRepositories);

// GET /api/repositories/:id - Get details of specific repository (info + commits + PRs + issues + languages)
router.get('/:id', optionalAuth, repoController.getRepositoryById);

// GET /api/repositories/:id/commits - Get commits for specific repository
router.get('/:id/commits', optionalAuth, repoController.getRepositoryCommits);

// GET /api/repositories/:id/pull-requests - Get pull requests for specific repository
router.get('/:id/pull-requests', optionalAuth, repoController.getRepositoryPullRequests);

// GET /api/repositories/:id/issues - Get issues for specific repository
router.get('/:id/issues', optionalAuth, repoController.getRepositoryIssues);

export default router;
