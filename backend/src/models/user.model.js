import { query, isDbConnected, inMemoryStore } from '../config/database.js';

export const UserModel = {
  async findByGitHubId(githubId) {
    if (isDbConnected()) {
      const res = await query('SELECT * FROM users WHERE github_id = $1 LIMIT 1', [String(githubId)]);
      return res.rows[0] || null;
    }
    return inMemoryStore.users.get(String(githubId)) || null;
  },

  async findById(id) {
    if (isDbConnected()) {
      const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }
    for (const user of inMemoryStore.users.values()) {
      if (user.id === Number(id) || String(user.id) === String(id)) {
        return user;
      }
    }
    return null;
  },

  async createOrUpdate(userData) {
    const { github_id, githubId, username, name, email, avatar_url, avatarUrl, bio, github_url, githubUrl, access_token, accessToken } = userData;
    const gId = String(github_id || githubId);
    const avUrl = avatar_url || avatarUrl || '';
    const ghUrl = github_url || githubUrl || `https://github.com/${username}`;
    const token = access_token || accessToken || '';

    if (isDbConnected()) {
      const existing = await this.findByGitHubId(gId);
      if (existing) {
        const updateQuery = `
          UPDATE users 
          SET username = $2, name = $3, email = $4, avatar_url = $5, bio = $6, github_url = $7, access_token = $8, updated_at = NOW()
          WHERE github_id = $1
          RETURNING *;
        `;
        const res = await query(updateQuery, [gId, username, name, email, avUrl, bio, ghUrl, token]);
        return res.rows[0];
      } else {
        const insertQuery = `
          INSERT INTO users (github_id, username, name, email, avatar_url, bio, github_url, access_token)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        const res = await query(insertQuery, [gId, username, name, email, avUrl, bio, ghUrl, token]);
        return res.rows[0];
      }
    }

    // In-memory fallback
    let user = inMemoryStore.users.get(gId);
    if (!user) {
      user = {
        id: inMemoryStore.users.size + 1,
        github_id: gId,
        created_at: new Date().toISOString(),
      };
    }

    user = {
      ...user,
      username,
      name: name || username,
      email: email || `${username}@users.noreply.github.com`,
      avatar_url: avUrl,
      bio: bio || '',
      github_url: ghUrl,
      access_token: token,
      updated_at: new Date().toISOString(),
    };

    inMemoryStore.users.set(gId, user);
    return user;
  },
};

export const findUserById = (id) => UserModel.findById(id);
export const findUserByGithubId = (githubId) => UserModel.findByGitHubId(githubId);
export const upsertUser = (userData) => UserModel.createOrUpdate(userData);
