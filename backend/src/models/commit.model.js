import { query, isDbConnected, inMemoryStore } from '../config/database.js';

export const CommitModel = {
  async findByRepoId(repoId, limit = 50) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM commits WHERE repository_id = $1 ORDER BY author_date DESC LIMIT $2',
        [repoId, limit]
      );
      return res.rows;
    }
    const commits = [];
    for (const c of inMemoryStore.commits.values()) {
      if (c.repository_id === Number(repoId) || String(c.repository_id) === String(repoId)) {
        commits.push(c);
      }
    }
    return commits
      .sort((a, b) => new Date(b.author_date).getTime() - new Date(a.author_date).getTime())
      .slice(0, limit);
  },

  async findByUserId(userId, limit = 100) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM commits WHERE user_id = $1 ORDER BY author_date DESC LIMIT $2',
        [userId, limit]
      );
      return res.rows;
    }
    const commits = [];
    for (const c of inMemoryStore.commits.values()) {
      if (c.user_id === Number(userId) || String(c.user_id) === String(userId)) {
        commits.push(c);
      }
    }
    return commits
      .sort((a, b) => new Date(b.author_date).getTime() - new Date(a.author_date).getTime())
      .slice(0, limit);
  },

  async upsert(commitData) {
    const { sha, repositoryId, userId, message, authorName, authorEmail, authorDate, htmlUrl, additions, deletions } = commitData;

    if (isDbConnected()) {
      const queryText = `
        INSERT INTO commits (sha, repository_id, user_id, message, author_name, author_email, author_date, html_url, additions, deletions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (sha) DO UPDATE SET
          message = EXCLUDED.message,
          author_name = EXCLUDED.author_name,
          author_email = EXCLUDED.author_email,
          additions = EXCLUDED.additions,
          deletions = EXCLUDED.deletions
        RETURNING *;
      `;
      const res = await query(queryText, [sha, repositoryId, userId, message, authorName, authorEmail, authorDate, htmlUrl, additions || 0, deletions || 0]);
      return res.rows[0];
    }

    // In-memory
    let commit = inMemoryStore.commits.get(sha);
    if (!commit) {
      commit = {
        id: inMemoryStore.commits.size + 1,
        sha,
        created_at: new Date().toISOString(),
      };
    }

    commit = {
      ...commit,
      repository_id: Number(repositoryId),
      user_id: Number(userId),
      message,
      author_name: authorName,
      author_email: authorEmail,
      author_date: authorDate,
      html_url: htmlUrl,
      additions: additions || 0,
      deletions: deletions || 0,
    };

    inMemoryStore.commits.set(sha, commit);
    return commit;
  },

  async countByUserId(userId) {
    if (isDbConnected()) {
      const res = await query('SELECT COUNT(*) as count FROM commits WHERE user_id = $1', [userId]);
      return parseInt(res.rows[0]?.count || '0', 10);
    }
    const userCommits = await this.findByUserId(userId, 10000);
    return userCommits.length;
  },
};

export const findCommitsByRepoId = (repoId, limit) => CommitModel.findByRepoId(repoId, limit);
export const findCommitsByUserId = (userId, limit) => CommitModel.findByUserId(userId, limit);
export const countCommitsByUser = (userId) => CommitModel.countByUserId(userId);
export const upsertCommit = (commitData) => CommitModel.upsert(commitData);
