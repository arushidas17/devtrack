import dotenv from 'dotenv';
dotenv.config();

const scopesList = ['read:user', 'user:email', 'repo'];

export const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback',
  get redirectUri() {
    return this.callbackUrl;
  },
  apiToken: process.env.GITHUB_API_TOKEN || '',
  apiBaseUrl: 'https://api.github.com',
  oauthAuthorizeUrl: 'https://github.com/login/oauth/authorize',
  get oauthUrl() {
    return 'https://github.com/login/oauth';
  },
  oauthTokenUrl: 'https://github.com/login/oauth/access_token',
  scopes: scopesList.join(' '),
  scopesList,
  userAgent: 'DevTrack-Analytics-Engine'
};

/**
 * Returns request headers configured for GitHub API requests
 * @param {string} [accessToken] - User OAuth token or fallback token
 */
export const getGitHubHeaders = (accessToken = '') => {
  const token = accessToken || githubConfig.apiToken;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': githubConfig.userAgent
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
