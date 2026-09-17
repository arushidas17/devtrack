/**
 * Normalizes raw GitHub user profile payload
 */
export const normalizeGitHubUser = (rawUser, accessToken = '') => {
  if (!rawUser) return null;
  return {
    githubId: String(rawUser.id),
    username: rawUser.login || 'developer',
    name: rawUser.name || rawUser.login || 'DevTrack User',
    email: rawUser.email || `${rawUser.login || 'dev'}@users.noreply.github.com`,
    avatarUrl: rawUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    bio: rawUser.bio || 'Software Engineer building with DevTrack',
    githubUrl: rawUser.html_url || `https://github.com/${rawUser.login || 'developer'}`,
    publicReposCount: rawUser.public_repos || 0,
    followersCount: rawUser.followers || 0,
    followingCount: rawUser.following || 0,
    accessToken
  };
};

/**
 * Normalizes raw GitHub repository payload
 */
export const normalizeGitHubRepo = (rawRepo, userId = null) => {
  if (!rawRepo) return null;
  return {
    githubRepoId: rawRepo.id,
    userId,
    name: rawRepo.name,
    fullName: rawRepo.full_name,
    description: rawRepo.description || 'No description provided',
    language: rawRepo.language || 'Plain Text',
    stars: rawRepo.stargazers_count || 0,
    forks: rawRepo.forks_count || 0,
    openIssuesCount: rawRepo.open_issues_count || 0,
    isPrivate: Boolean(rawRepo.private),
    htmlUrl: rawRepo.html_url,
    defaultBranch: rawRepo.default_branch || 'main',
    pushedAt: rawRepo.pushed_at || rawRepo.updated_at,
    languagesData: {}
  };
};

/**
 * Normalizes raw GitHub commit payload
 */
export const normalizeGitHubCommit = (rawCommit, repoId = null, userId = null) => {
  if (!rawCommit) return null;
  const commitData = rawCommit.commit || {};
  const authorData = commitData.author || {};

  return {
    sha: rawCommit.sha,
    repositoryId: repoId,
    userId,
    message: commitData.message ? commitData.message.split('\n')[0] : 'Update',
    authorName: authorData.name || rawCommit.author?.login || 'Developer',
    authorEmail: authorData.email || '',
    authorDate: authorData.date || new Date().toISOString(),
    htmlUrl: rawCommit.html_url || '',
    additions: rawCommit.stats?.additions || 0,
    deletions: rawCommit.stats?.deletions || 0
  };
};

/**
 * Normalizes raw GitHub pull request payload
 */
export const normalizeGitHubPR = (rawPR, repoId = null, userId = null) => {
  if (!rawPR) return null;
  const isMerged = Boolean(rawPR.merged_at);
  const state = isMerged ? 'merged' : rawPR.state;

  return {
    githubPrId: rawPR.id,
    repositoryId: repoId,
    userId,
    number: rawPR.number,
    title: rawPR.title,
    state,
    isMerged,
    authorUsername: rawPR.user?.login || 'contributor',
    htmlUrl: rawPR.html_url,
    createdAtGitHub: rawPR.created_at,
    closedAtGitHub: rawPR.closed_at,
    mergedAtGitHub: rawPR.merged_at
  };
};

/**
 * Normalizes raw GitHub issue payload
 */
export const normalizeGitHubIssue = (rawIssue, repoId = null, userId = null) => {
  if (!rawIssue || rawIssue.pull_request) return null; // Exclude PRs returned in issues endpoint

  return {
    githubIssueId: rawIssue.id,
    repositoryId: repoId,
    userId,
    number: rawIssue.number,
    title: rawIssue.title,
    state: rawIssue.state,
    authorUsername: rawIssue.user?.login || 'reporter',
    htmlUrl: rawIssue.html_url,
    commentsCount: rawIssue.comments || 0,
    createdAtGitHub: rawIssue.created_at,
    closedAtGitHub: rawIssue.closed_at
  };
};
