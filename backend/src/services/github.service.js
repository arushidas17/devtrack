import axios from 'axios';
import { githubConfig, getGitHubHeaders } from '../config/github.js';
import {
  normalizeGitHubUser,
  normalizeGitHubRepo,
  normalizeGitHubCommit,
  normalizeGitHubPR,
  normalizeGitHubIssue
} from '../utils/github.utils.js';

export const GitHubService = {
  /**
   * Exchange GitHub OAuth temporary code for Access Token
   */
  async exchangeCodeForToken(code) {
    if (!githubConfig.clientId || !githubConfig.clientSecret) {
      throw new Error('GitHub OAuth credentials (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET) are not configured on the backend.');
    }

    try {
      const response = await axios.post(
        githubConfig.oauthTokenUrl,
        {
          client_id: githubConfig.clientId,
          client_secret: githubConfig.clientSecret,
          code,
          redirect_uri: githubConfig.callbackUrl
        },
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error_description || response.data.error);
      }

      if (!response.data.access_token) {
        throw new Error('No access token received from GitHub');
      }

      return response.data.access_token;
    } catch (err) {
      console.error('GitHub OAuth token exchange failed:', err.response?.data || err.message);
      throw new Error(err.response?.data?.error_description || err.message || 'Failed to exchange GitHub authorization code');
    }
  },

  /**
   * Fetch authenticated user's profile from GitHub API
   */
  async getUserProfile(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required to fetch GitHub user profile');
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/user`, {
        headers: getGitHubHeaders(accessToken)
      });
      const userData = response.data;

      // If email is private/null, query user/emails to get primary verified email
      if (!userData.email) {
        try {
          const emailsRes = await axios.get(`${githubConfig.apiBaseUrl}/user/emails`, {
            headers: getGitHubHeaders(accessToken)
          });
          const primaryEmail = (emailsRes.data || []).find(e => e.primary && e.verified) || (emailsRes.data || [])[0];
          if (primaryEmail && primaryEmail.email) {
            userData.email = primaryEmail.email;
          }
        } catch (emailErr) {
          console.warn('Could not fetch user emails from GitHub (scope user:email might be missing):', emailErr.message);
        }
      }

      return normalizeGitHubUser(userData, accessToken);
    } catch (err) {
      console.error('GitHub getUserProfile failed:', err.response?.data || err.message);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch user profile from GitHub');
    }
  },

  /**
   * Fetch public and private repositories accessible by the user
   */
  async getUserRepositories(accessToken, username = '') {
    if (!accessToken || accessToken === 'demo_devtrack_token_2026') {
      return this.getMockRepositories();
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/user/repos`, {
        params: {
          sort: 'updated',
          per_page: 30,
          affiliation: 'owner,collaborator'
        },
        headers: getGitHubHeaders(accessToken)
      });

      return (response.data || []).map(repo => normalizeGitHubRepo(repo));
    } catch (err) {
      console.warn('Live GitHub repo fetch failed, falling back to mock dataset:', err.message);
      return this.getMockRepositories();
    }
  },

  /**
   * Fetch single repository details
   */
  async getRepository(owner, repoName, accessToken) {
    if (!accessToken || accessToken === 'demo_devtrack_token_2026') {
      const mockList = this.getMockRepositories();
      return mockList.find(r => r.name.toLowerCase() === repoName.toLowerCase()) || mockList[0];
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/repos/${owner}/${repoName}`, {
        headers: getGitHubHeaders(accessToken)
      });
      return normalizeGitHubRepo(response.data);
    } catch (err) {
      throw new Error(`Failed to fetch repository ${owner}/${repoName}: ${err.message}`);
    }
  },

  /**
   * Fetch repository language breakdown
   */
  async getRepositoryLanguages(owner, repoName, accessToken) {
    if (!accessToken || accessToken === 'demo_devtrack_token_2026') {
      return {
        TypeScript: 145000,
        JavaScript: 82000,
        Python: 35000,
        CSS: 12000
      };
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/repos/${owner}/${repoName}/languages`, {
        headers: getGitHubHeaders(accessToken)
      });
      return response.data || {};
    } catch (err) {
      console.warn(`Could not fetch languages for ${owner}/${repoName}:`, err.message);
      return { JavaScript: 10000 };
    }
  },

  /**
   * Fetch commits for a repository
   */
  async getRepositoryCommits(owner, repoName, accessToken, limit = 30) {
    if (!accessToken || accessToken === 'demo_devtrack_token_2026') {
      return this.getMockCommits(repoName);
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/repos/${owner}/${repoName}/commits`, {
        params: { per_page: limit },
        headers: getGitHubHeaders(accessToken)
      });
      return (response.data || []).map(c => normalizeGitHubCommit(c));
    } catch (err) {
      console.warn(`Could not fetch live commits for ${owner}/${repoName}:`, err.message);
      return this.getMockCommits(repoName);
    }
  },

  /**
   * Fetch pull requests for a repository
   */
  async getRepositoryPullRequests(owner, repoName, accessToken) {
    if (!accessToken || accessToken === 'demo_devtrack_token_2026') {
      return this.getMockPullRequests(repoName);
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/repos/${owner}/${repoName}/pulls`, {
        params: { state: 'all', per_page: 30 },
        headers: getGitHubHeaders(accessToken)
      });
      return (response.data || []).map(pr => normalizeGitHubPR(pr));
    } catch (err) {
      console.warn(`Could not fetch live PRs for ${owner}/${repoName}:`, err.message);
      return this.getMockPullRequests(repoName);
    }
  },

  /**
   * Fetch issues for a repository
   */
  async getRepositoryIssues(owner, repoName, accessToken) {
    if (!accessToken || accessToken === 'demo_devtrack_token_2026') {
      return this.getMockIssues(repoName);
    }

    try {
      const response = await axios.get(`${githubConfig.apiBaseUrl}/repos/${owner}/${repoName}/issues`, {
        params: { state: 'all', per_page: 30 },
        headers: getGitHubHeaders(accessToken)
      });
      return (response.data || [])
        .map(i => normalizeGitHubIssue(i))
        .filter(Boolean);
    } catch (err) {
      console.warn(`Could not fetch live issues for ${owner}/${repoName}:`, err.message);
      return this.getMockIssues(repoName);
    }
  },

  /**
   * Mock Repositories for offline development & demo
   */
  getMockRepositories() {
    return [
      {
        githubRepoId: 901,
        name: 'DevTrack',
        fullName: 'arushidas17/DevTrack',
        description: 'Developer analytics & telemetry dashboard with automated insights',
        language: 'TypeScript',
        stars: 38,
        forks: 7,
        openIssuesCount: 3,
        isPrivate: false,
        htmlUrl: 'https://github.com/arushidas17/DevTrack',
        defaultBranch: 'main',
        languagesData: { TypeScript: 165000, CSS: 28000, HTML: 12000 }
      },
      {
        githubRepoId: 902,
        name: 'taskflow-engine',
        fullName: 'arushidas17/taskflow-engine',
        description: 'High-throughput asynchronous task orchestrator built with Node.js',
        language: 'JavaScript',
        stars: 24,
        forks: 4,
        openIssuesCount: 1,
        isPrivate: false,
        htmlUrl: 'https://github.com/arushidas17/taskflow-engine',
        defaultBranch: 'main',
        languagesData: { JavaScript: 92000, Python: 15000 }
      },
      {
        githubRepoId: 903,
        name: 'neural-classifier',
        fullName: 'arushidas17/neural-classifier',
        description: 'Computer vision model pipeline for automated code snippet classification',
        language: 'Python',
        stars: 19,
        forks: 2,
        openIssuesCount: 0,
        isPrivate: false,
        htmlUrl: 'https://github.com/arushidas17/neural-classifier',
        defaultBranch: 'main',
        languagesData: { Python: 120000, JupyterNotebook: 45000 }
      },
      {
        githubRepoId: 904,
        name: 'cloud-infra-terraform',
        fullName: 'arushidas17/cloud-infra-terraform',
        description: 'Terraform modules for multi-region Kubernetes deployments',
        language: 'HCL',
        stars: 12,
        forks: 1,
        openIssuesCount: 2,
        isPrivate: true,
        htmlUrl: 'https://github.com/arushidas17/cloud-infra-terraform',
        defaultBranch: 'main',
        languagesData: { HCL: 48000, Shell: 8000 }
      }
    ];
  },

  /**
   * Mock Commits for demo
   */
  getMockCommits(repoName = 'DevTrack') {
    const authors = ['Arushi Das', 'Alex Vance', 'Elena Rostova'];
    const messages = [
      'feat: integrate 3D mathematical canvas background and gyro system',
      'refactor: optimize database query execution plan for telemetry matrix',
      'fix: resolve GitHub OAuth callback token validation edge cases',
      'feat: add developer activity score algorithm and metric normalizer',
      'perf: tune React component render tree and memoize analytics charts',
      'docs: update backend API architecture blueprint and setup manual',
      'chore: configure PostgreSQL connection pool and migration scripts',
      'feat: add multi-repo language aggregation and breakdown API'
    ];

    return messages.map((msg, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - idx);
      return {
        sha: `sha_c789a${idx}f42${idx}09e1`,
        message: msg,
        authorName: authors[idx % authors.length],
        authorEmail: 'arushi.das@devtrack.io',
        authorDate: d.toISOString(),
        htmlUrl: `https://github.com/arushidas17/${repoName}/commit/c789a${idx}`,
        additions: Math.floor(Math.random() * 80) + 15,
        deletions: Math.floor(Math.random() * 20) + 2
      };
    });
  },

  /**
   * Mock PRs for demo
   */
  getMockPullRequests(repoName = 'DevTrack') {
    return [
      {
        githubPrId: 801,
        number: 42,
        title: 'feat: Add developer telemetry pipeline and activity scoring',
        state: 'merged',
        isMerged: true,
        authorUsername: 'arushidas17',
        htmlUrl: `https://github.com/arushidas17/${repoName}/pull/42`,
        createdAtGitHub: new Date(Date.now() - 86400000 * 2).toISOString(),
        closedAtGitHub: new Date(Date.now() - 86400000 * 1).toISOString(),
        mergedAtGitHub: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        githubPrId: 802,
        number: 41,
        title: 'fix: Resolve token cookie expiry on session refresh',
        state: 'merged',
        isMerged: true,
        authorUsername: 'arushidas17',
        htmlUrl: `https://github.com/arushidas17/${repoName}/pull/41`,
        createdAtGitHub: new Date(Date.now() - 86400000 * 4).toISOString(),
        closedAtGitHub: new Date(Date.now() - 86400000 * 3).toISOString(),
        mergedAtGitHub: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        githubPrId: 803,
        number: 40,
        title: 'feat: Implement rate limiting and helmet security headers',
        state: 'open',
        isMerged: false,
        authorUsername: 'alex-dev',
        htmlUrl: `https://github.com/arushidas17/${repoName}/pull/40`,
        createdAtGitHub: new Date(Date.now() - 86400000 * 1).toISOString(),
        closedAtGitHub: null,
        mergedAtGitHub: null
      }
    ];
  },

  /**
   * Mock Issues for demo
   */
  getMockIssues(repoName = 'DevTrack') {
    return [
      {
        githubIssueId: 701,
        number: 18,
        title: 'Enhance dark mode contrast ratio for SVG status badges',
        state: 'closed',
        authorUsername: 'elena-r',
        htmlUrl: `https://github.com/arushidas17/${repoName}/issues/18`,
        commentsCount: 4,
        createdAtGitHub: new Date(Date.now() - 86400000 * 5).toISOString(),
        closedAtGitHub: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        githubIssueId: 702,
        number: 19,
        title: 'Add support for GitLab multi-cloud enterprise sync',
        state: 'open',
        authorUsername: 'marcus-k',
        htmlUrl: `https://github.com/arushidas17/${repoName}/issues/19`,
        commentsCount: 7,
        createdAtGitHub: new Date(Date.now() - 86400000 * 3).toISOString(),
        closedAtGitHub: null
      }
    ];
  }
};

export const exchangeCodeForToken = (code) => GitHubService.exchangeCodeForToken(code);
export const getUserProfile = (accessToken) => GitHubService.getUserProfile(accessToken);
export const fetchUserProfile = (accessToken) => GitHubService.getUserProfile(accessToken);
export const getUserRepositories = (accessToken, username) => GitHubService.getUserRepositories(accessToken, username);
export default GitHubService;
