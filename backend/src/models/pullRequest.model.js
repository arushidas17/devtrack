import { query, isDbConnected, inMemoryStore } from '../config/database.js';

export const PullRequestModel = {
  /**
   * Find pull requests by repository ID
   */
  async findByRepoId(repoId, limit = 50) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM pull_requests WHERE repository_id = $1 ORDER BY created_at_github DESC LIMIT $2',
        [repoId, limit]
      );
      return res.rows;
    }
    const prs = [];
    for (const pr of inMemoryStore.pullRequests.values()) {
      if (pr.repository_id === Number(repoId) || String(pr.repository_id) === String(repoId)) {
        prs.push(pr);
      }
    }
    return prs
      .sort((a, b) => new Date(b.created_at_github).getTime() - new Date(a.created_at_github).getTime())
      .slice(0, limit);
  },

  /**
   * Find all pull requests by User ID
   */
  async findByUserId(userId) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM pull_requests WHERE user_id = $1 ORDER BY created_at_github DESC',
        [userId]
      );
      return res.rows;
    }
    const prs = [];
    for (const pr of inMemoryStore.pullRequests.values()) {
      if (pr.user_id === Number(userId) || String(pr.user_id) === String(userId)) {
        prs.push(pr);
      }
    }
    return prs;
  },

  /**
   * Upsert a pull request record
   */
  async upsert(prData) {
    const {
      githubPrId,
      repositoryId,
      userId,
      number,
      title,
      state,
      isMerged,
      authorUsername,
      htmlUrl,
      createdAtGitHub,
      closedAtGitHub,
      mergedAtGitHub
    } = prData;

    if (isDbConnected()) {
      const queryText = `
        INSERT INTO pull_requests (
          github_pr_id, repository_id, user_id, number, title, state, is_merged,
          author_username, html_url, created_at_github, closed_at_github, merged_at_github
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (github_pr_id) DO UPDATE SET
          title = EXCLUDED.title,
          state = EXCLUDED.state,
          is_merged = EXCLUDED.is_merged,
          closed_at_github = EXCLUDED.closed_at_github,
          merged_at_github = EXCLUDED.merged_at_github
        RETURNING *;
      `;
      const res = await query(queryText, [
        githubPrId,
        repositoryId,
        userId,
        number,
        title,
        state,
        Boolean(isMerged),
        authorUsername,
        htmlUrl,
        createdAtGitHub,
        closedAtGitHub,
        mergedAtGitHub
      ]);
      return res.rows[0];
    }

    const key = String(githubPrId);
    let pr = inMemoryStore.pullRequests.get(key);
    if (!pr) {
      pr = {
        id: inMemoryStore.pullRequests.size + 1,
        github_pr_id: githubPrId,
        created_at: new Date().toISOString()
      };
    }

    pr = {
      ...pr,
      repository_id: Number(repositoryId),
      user_id: Number(userId),
      number,
      title,
      state,
      is_merged: Boolean(isMerged),
      author_username: authorUsername,
      html_url: htmlUrl,
      created_at_github: createdAtGitHub,
      closed_at_github: closedAtGitHub,
      merged_at_github: mergedAtGitHub
    };

    inMemoryStore.pullRequests.set(key, pr);
    return pr;
  }
};
