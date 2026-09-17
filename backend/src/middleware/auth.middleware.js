import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'devtrack_super_secret_jwt_key_2026';
const COOKIE_NAME = 'devtrack_token';

/**
 * Middleware to require valid JWT authentication
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Authentication required. Please log in with GitHub.',
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User session expired or not found. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
  }
};

/**
 * Optional authentication middleware for public/preview endpoints
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignore error for optional auth
  }
  next();
};

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      githubId: user.github_id || user.githubId,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Set HTTP-only Cookie with JWT
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear Auth Cookie
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
};
