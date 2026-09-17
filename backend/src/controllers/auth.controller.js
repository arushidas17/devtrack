import { githubConfig } from '../config/github.js';
import * as githubService from '../services/github.service.js';
import * as userModel from '../models/user.model.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.middleware.js';

/**
 * Redirect user to GitHub OAuth authorization page
 */
export const initiateGithubAuth = (req, res) => {
  if (!githubConfig.clientId) {
    console.error('❌ GITHUB_CLIENT_ID is not configured in backend environment.');
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'GitHub OAuth Client ID is not configured on the server. Please check your backend .env file.',
    });
  }

  const state = Math.random().toString(36).substring(2, 15);
  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.callbackUrl,
    scope: typeof githubConfig.scopes === 'string' ? githubConfig.scopes : 'read:user user:email repo',
    state,
  });

  const authUrl = `${githubConfig.oauthAuthorizeUrl}?${params.toString()}`;
  return res.redirect(authUrl);
};

/**
 * Handle GitHub OAuth callback
 */
export const handleGithubCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth authorization rejection / cancellation by user
    if (error) {
      console.warn('⚠️ GitHub OAuth authorization denied or cancelled:', error, error_description);
      const errParam = encodeURIComponent(error);
      const descParam = encodeURIComponent(error_description || 'GitHub authorization was declined');
      return res.redirect(`${frontendUrl}/dashboard?error=${errParam}&message=${descParam}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/dashboard?error=missing_code&message=${encodeURIComponent('No authorization code received from GitHub')}`);
    }

    // 1. Exchange code for real access token
    const accessToken = await githubService.exchangeCodeForToken(code);

    // 2. Fetch real authenticated user profile from GitHub
    const profile = await githubService.getUserProfile(accessToken);

    if (!profile || !profile.githubId) {
      throw new Error('Failed to retrieve valid GitHub profile details');
    }

    // 3. Upsert user in database (PostgreSQL or In-Memory fallback)
    const user = await userModel.upsertUser({
      github_id: profile.githubId,
      username: profile.username,
      name: profile.name || profile.username,
      email: profile.email || `${profile.username}@users.noreply.github.com`,
      avatar_url: profile.avatarUrl,
      bio: profile.bio || '',
      github_url: profile.githubUrl,
      access_token: accessToken,
    });

    // 4. Generate JWT session token
    const token = generateToken(user);
    setAuthCookie(res, token);

    // 5. If JSON response requested (e.g., direct API test)
    if (req.headers.accept?.includes('application/json') && !req.headers.accept?.includes('text/html')) {
      return res.json({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          githubId: user.github_id || user.githubId,
          username: user.username,
          name: user.name || user.username,
          email: user.email,
          avatarUrl: user.avatar_url || user.avatarUrl,
          bio: user.bio || '',
          githubUrl: user.github_url || user.githubUrl,
        },
        token,
      });
    }

    // 6. Redirect to frontend dashboard with success and session token
    return res.redirect(`${frontendUrl}/dashboard?auth=success&token=${token}`);
  } catch (error) {
    console.error('❌ GitHub OAuth Callback Error:', error.message);
    const msg = encodeURIComponent(error.message || 'Authentication failed');
    return res.redirect(`${frontendUrl}/dashboard?error=auth_failed&message=${msg}`);
  }
};

/**
 * Get currently authenticated user details
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Not authenticated',
      });
    }

    const dbUser = (await userModel.findUserById(user.id)) || user;

    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: dbUser.id,
        githubId: dbUser.github_id || dbUser.githubId,
        username: dbUser.username,
        name: dbUser.name || dbUser.username,
        email: dbUser.email,
        avatarUrl: dbUser.avatar_url || dbUser.avatarUrl,
        bio: dbUser.bio || '',
        githubUrl: dbUser.github_url || dbUser.githubUrl,
        createdAt: dbUser.created_at || dbUser.createdAt,
        updatedAt: dbUser.updated_at || dbUser.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: error.message,
    });
  }
};

/**
 * Logout and clear session cookie
 */
export const logout = (req, res) => {
  clearAuthCookie(res);
  return res.json({
    success: true,
    authenticated: false,
    message: 'Logged out successfully',
  });
};

/**
 * Development test session (available only in development mode for instant dashboard viewing)
 */
export const devLogin = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  const username = req.query.username || 'arushidas17';

  const user = await userModel.upsertUser({
    github_id: '1048291',
    username,
    name: 'Arushi Das',
    email: `${username}@devtrack.io`,
    avatar_url: `https://github.com/identicons/${username}.png`,
    bio: 'Software Engineer building with DevTrack',
    github_url: `https://github.com/${username}`,
    access_token: 'dev_preview_token',
  });

  const token = generateToken(user);
  setAuthCookie(res, token);

  return res.redirect(`${frontendUrl}/dashboard?auth=success&token=${token}`);
};
