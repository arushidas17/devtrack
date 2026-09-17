import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { initDatabase, isDbConnected } from './config/database.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import repositoryRoutes from './routes/repository.routes.js';
import activityRoutes from './routes/activity.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { getDashboardData } from './controllers/analytics.controller.js';
import { optionalAuth } from './middleware/auth.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// 1. Security & Core Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev mode
  },
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global Rate Limiter for /api/ routes
app.use('/api/', apiLimiter);

// 2. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DevTrack Backend API',
    version: '1.0.0',
    database: isDbConnected() ? 'PostgreSQL (Connected)' : 'In-Memory Store (Dev Fallback)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);

// Direct convenient mapping for GET /api/dashboard
app.get('/api/dashboard', optionalAuth, getDashboardData);

// 4. Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the DevTrack Backend API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      dashboard: '/api/dashboard',
      repositories: '/api/repositories',
      activity: '/api/activity',
      analytics: '/api/analytics',
    },
  });
});

// 5. 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 6. Server Initialization
const startServer = async () => {
  // Initialize Database (or Fallback store)
  await initDatabase();

  const server = app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 DevTrack Backend Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
    console.log(`📁 Repositories: http://localhost:${PORT}/api/repositories`);
    console.log(`🔒 Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`==============================================\n`);
  });

  // Handle unhandled promise rejections & exceptions
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });

  return server;
};

startServer();

export default app;
