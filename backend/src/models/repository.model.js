import { query, isDbConnected, inMemoryStore } from '../config/database.js';

export const RepositoryModel = {
  /**
   * Find repositories by User ID
   */
  async findByUserId(userId) {
    if (isDbConnected()) {
      const res = await query(
        'SELECT * FROM repositories WHERE user_id = $1 ORDER BY stars DESC, updated_at DESC',
        [userId]
      );
      return res.rows;
    }
    const repos = [];
    for (const repo of inMemoryStore.repositories.values()) {
      if (repo.user_id === Number(userId) || String(repo.user_id) === String(userId)) {
        repos.push(repo);
      }
    }
    return repos.sort((a, b) => (b.stars || 0) - (a.stars || 0));
  },

  /**
   * Find repository by ID or GitHub Repo ID
   */
  async findById(id) {
    if (isDbConnected()) {
      const res = await query('SELECT * FROM repositories WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }
    for (const repo of inMemoryStore.repositories.values()) {
      if (repo.id === Number(id) || String(repo.id) === String(id) || repo.name?.toLowerCase() === String(id).toLowerCase()) {
        return repo;
      }
    }
    return null;
  },

  /**
   * Upsert a repository record
   */
  async upsert(repoData) {
    const {
      githubRepoId,
      github_repo_id,
      userId,
      user_id,
      name,
      fullName,
      full_name,
      description,
      language,
      stars,
      forks,
      openIssuesCount,
      open_issues_count,
      isPrivate,
      is_private,
      htmlUrl,
      html_url,
      defaultBranch,
      default_branch,
      languagesData,
      languages_data,
    } = repoData;

    const gRepoId = githubRepoId || github_repo_id;
    const uId = userId || user_id || 1;
    const fName = fullName || full_name || `arushidas17/${name}`;
    const openIssues = openIssuesCount !== undefined ? openIssuesCount : (open_issues_count || 0);
    const priv = isPrivate !== undefined ? isPrivate : (is_private || false);
    const hUrl = htmlUrl || html_url || `https://github.com/arushidas17/${name}`;
    const branch = defaultBranch || default_branch || 'main';
    const langData = languagesData || languages_data || {};

    if (isDbConnected()) {
      const queryText = `
        INSERT INTO repositories (
          github_repo_id, user_id, name, full_name, description, language,
          stars, forks, open_issues_count, is_private, html_url, default_branch,
          languages_data, last_synced_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
        ON CONFLICT (github_repo_id) DO UPDATE SET
          name = EXCLUDED.name,
          full_name = EXCLUDED.full_name,
          description = EXCLUDED.description,
          language = EXCLUDED.language,
          stars = EXCLUDED.stars,
          forks = EXCLUDED.forks,
          open_issues_count = EXCLUDED.open_issues_count,
          is_private = EXCLUDED.is_private,
          html_url = EXCLUDED.html_url,
          default_branch = EXCLUDED.default_branch,
          languages_data = EXCLUDED.languages_data,
          last_synced_at = NOW(),
          updated_at = NOW()
        RETURNING *;
      `;
      const res = await query(queryText, [
        gRepoId,
        uId,
        name,
        fName,
        description || '',
        language || 'JavaScript',
        stars || 0,
        forks || 0,
        openIssues,
        priv,
        hUrl,
        branch,
        JSON.stringify(langData),
      ]);
      return res.rows[0];
    }

    // In-memory fallback
    const key = String(gRepoId);
    let repo = inMemoryStore.repositories.get(key);
    if (!repo) {
      repo = {
        id: inMemoryStore.repositories.size + 1,
        github_repo_id: gRepoId,
        created_at: new Date().toISOString(),
      };
    }

    repo = {
      ...repo,
      user_id: Number(uId),
      name,
      full_name: fName,
      description: description || '',
      language: language || 'JavaScript',
      stars: Number(stars) || 0,
      forks: Number(forks) || 0,
      open_issues_count: Number(openIssues) || 0,
      is_private: Boolean(priv),
      html_url: hUrl,
      default_branch: branch,
      languages_data: langData,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryStore.repositories.set(key, repo);
    return repo;
  },

  /**
   * Count total repositories for a user
   */
  async countByUserId(userId) {
    if (isDbConnected()) {
      const res = await query('SELECT COUNT(*) as count FROM repositories WHERE user_id = $1', [userId]);
      return parseInt(res.rows[0]?.count || '0', 10);
    }
    const userRepos = await this.findByUserId(userId);
    return userRepos.length;
  },
};

export const findRepositoriesByUser = (userId) => RepositoryModel.findByUserId(userId);
export const findRepositoryById = (id) => RepositoryModel.findById(id);
export const countRepositoriesByUser = (userId) => RepositoryModel.countByUserId(userId);
export const upsertRepository = (repoData) => RepositoryModel.upsert(repoData);
