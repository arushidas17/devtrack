import { query, isDbConnected, inMemoryStore } from '../config/database.js';

export const IssueModel = {
  /**
   * Find issues by repository ID
   */
  async findByRepoId(repoId, limit = 50) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM issues WHERE repository_id = $1 ORDER BY created_at_github DESC LIMIT $2',
        [repoId, limit]
      );
      return res.rows;
    }
    const issues = [];
    for (const issue of inMemoryStore.issues.values()) {
      if (issue.repository_id === Number(repoId) || String(issue.repository_id) === String(repoId)) {
        issues.push(issue);
      }
    }
    return issues
      .sort((a, b) => new Date(b.created_at_github).getTime() - new Date(a.created_at_github).getTime())
      .slice(0, limit);
  },

  /**
   * Find all issues by User ID
   */
  async findByUserId(userId) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM issues WHERE user_id = $1 ORDER BY created_at_github DESC',
        [userId]
      );
      return res.rows;
    }
    const issues = [];
    for (const issue of inMemoryStore.issues.values()) {
      if (issue.user_id === Number(userId) || String(issue.user_id) === String(userId)) {
        issues.push(issue);
      }
    }
    return issues;
  },

  /**
   * Upsert an issue record
   */
  async upsert(issueData) {
    const {
      githubIssueId,
      repositoryId,
      userId,
      number,
      title,
      state,
      authorUsername,
      htmlUrl,
      commentsCount,
      createdAtGitHub,
      closedAtGitHub
    } = issueData;

    if (isDbConnected()) {
      const queryText = `
        INSERT INTO issues (
          github_issue_id, repository_id, user_id, number, title, state,
          author_username, html_url, comments_count, created_at_github, closed_at_github
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (github_issue_id) DO UPDATE SET
          title = EXCLUDED.title,
          state = EXCLUDED.state,
          comments_count = EXCLUDED.comments_count,
          closed_at_github = EXCLUDED.closed_at_github
        RETURNING *;
      `;
      const res = await query(queryText, [
        githubIssueId,
        repositoryId,
        userId,
        number,
        title,
        state,
        authorUsername,
        htmlUrl,
        commentsCount || 0,
        createdAtGitHub,
        closedAtGitHub
      ]);
      return res.rows[0];
    }

    const key = String(githubIssueId);
    let issue = inMemoryStore.issues.get(key);
    if (!issue) {
      issue = {
        id: inMemoryStore.issues.size + 1,
        github_issue_id: githubIssueId,
        created_at: new Date().toISOString()
      };
    }

    issue = {
      ...issue,
      repository_id: Number(repositoryId),
      user_id: Number(userId),
      number,
      title,
      state,
      author_username: authorUsername,
      html_url: htmlUrl,
      comments_count: Number(commentsCount) || 0,
      created_at_github: createdAtGitHub,
      closed_at_github: closedAtGitHub
    };

    inMemoryStore.issues.set(key, issue);
    return issue;
  }
};
