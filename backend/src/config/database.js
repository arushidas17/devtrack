import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

let pool = null;
let isDatabaseConnected = false;

// In-memory store fallback when PostgreSQL is not running
export const inMemoryStore = {
  users: new Map(),
  repositories: new Map(),
  commits: new Map(),
  pullRequests: new Map(),
  issues: new Map(),
  analyticsCache: new Map()
};

/**
 * Initializes PostgreSQL connection pool and creates tables
 */
export const initDatabase = async () => {
  const connectionString = process.env.DATABASE_URL;
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

  try {
    pool = new Pool({
      connectionString: connectionString || undefined,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'devtrack',
      ssl,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      max: 10
    });

    // Test connectivity
    const client = await pool.connect();
    client.release();
    isDatabaseConnected = true;
    console.log('✅ PostgreSQL connected successfully');

    // Run schema creation
    await createSchema();
  } catch (err) {
    isDatabaseConnected = false;
    console.warn(`⚠️ PostgreSQL connection not available (${err.message}). Running with in-memory persistence fallback.`);
  }
};

/**
 * Creates DevTrack database schema tables if they don't exist
 */
const createSchema = async () => {
  if (!pool || !isDatabaseConnected) return;

  const schemaQuery = `
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      github_id VARCHAR(100) UNIQUE NOT NULL,
      username VARCHAR(100) NOT NULL,
      name VARCHAR(150),
      email VARCHAR(255),
      avatar_url TEXT,
      bio TEXT,
      github_url TEXT,
      access_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Repositories Table
    CREATE TABLE IF NOT EXISTS repositories (
      id SERIAL PRIMARY KEY,
      github_repo_id BIGINT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      description TEXT,
      language VARCHAR(100),
      stars INTEGER DEFAULT 0,
      forks INTEGER DEFAULT 0,
      open_issues_count INTEGER DEFAULT 0,
      is_private BOOLEAN DEFAULT FALSE,
      html_url TEXT,
      default_branch VARCHAR(100) DEFAULT 'main',
      languages_data JSONB DEFAULT '{}'::jsonb,
      last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Commits Table
    CREATE TABLE IF NOT EXISTS commits (
      id SERIAL PRIMARY KEY,
      sha VARCHAR(100) UNIQUE NOT NULL,
      repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      author_name VARCHAR(150),
      author_email VARCHAR(255),
      author_date TIMESTAMP WITH TIME ZONE NOT NULL,
      html_url TEXT,
      additions INTEGER DEFAULT 0,
      deletions INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Pull Requests Table
    CREATE TABLE IF NOT EXISTS pull_requests (
      id SERIAL PRIMARY KEY,
      github_pr_id BIGINT UNIQUE NOT NULL,
      repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      state VARCHAR(50) NOT NULL, -- 'open', 'closed', 'merged'
      is_merged BOOLEAN DEFAULT FALSE,
      author_username VARCHAR(100),
      html_url TEXT,
      created_at_github TIMESTAMP WITH TIME ZONE,
      closed_at_github TIMESTAMP WITH TIME ZONE,
      merged_at_github TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Issues Table
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      github_issue_id BIGINT UNIQUE NOT NULL,
      repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      number INTEGER NOT NULL,
      title TEXT NOT NULL,
      state VARCHAR(50) NOT NULL, -- 'open', 'closed'
      author_username VARCHAR(100),
      html_url TEXT,
      comments_count INTEGER DEFAULT 0,
      created_at_github TIMESTAMP WITH TIME ZONE,
      closed_at_github TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high-speed analytics queries
    CREATE INDEX IF NOT EXISTS idx_repos_user_id ON repositories(user_id);
    CREATE INDEX IF NOT EXISTS idx_commits_repo_id ON commits(repository_id);
    CREATE INDEX IF NOT EXISTS idx_commits_user_date ON commits(user_id, author_date);
    CREATE INDEX IF NOT EXISTS idx_prs_repo_state ON pull_requests(repository_id, state);
    CREATE INDEX IF NOT EXISTS idx_issues_repo_state ON issues(repository_id, state);
  `;

  try {
    await pool.query(schemaQuery);
    console.log('✅ PostgreSQL schema verified and ready');
  } catch (err) {
    console.error('❌ Schema initialization error:', err.message);
  }
};

/**
 * Execute parameterized query against PostgreSQL or in-memory fallback
 */
export const query = async (text, params) => {
  if (pool && isDatabaseConnected) {
    return pool.query(text, params);
  }
  return null;
};

export const isDbConnected = () => isDatabaseConnected;
export const getPool = () => pool;
