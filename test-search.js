/**
 * @fileoverview Utility script for querying and retrieving GitHub commit history via the REST API.
 */

/**
 * Configuration settings for GitHub Commit Search API requests.
 */
const GITHUB_API_CONFIG = Object.freeze({
  baseUrl: 'https://api.github.com/search/commits',
  defaultAuthorQuery: 'author:craighckby',
  defaultResultLimit: 3,
  headers: Object.freeze({
    Accept: 'application/vnd.github.cloak-preview+json',
    'User-Agent': 'GitHub-Commit-Search-Client'
  }),
  sort: 'author-date',
  order: 'desc'
});

const DEFAULT_AUTHOR_QUERY = GITHUB_API_CONFIG.defaultAuthorQuery;
const DEFAULT_RESULT_LIMIT = GITHUB_API_CONFIG.defaultResultLimit;

/**
 * Constructs the target URL object for GitHub commit search requests.
 *
 * @param {string} [query=DEFAULT_AUTHOR_QUERY] - Search query parameter.
 * @param {number} [perPage=DEFAULT_RESULT_LIMIT] - Maximum number of records per page.
 * @returns {URL} Fully formatted API endpoint URL.
 */
function buildCommitSearchUrl(query = DEFAULT_AUTHOR_QUERY, perPage = DEFAULT_RESULT_LIMIT) {
  const searchUrl = new URL(GITHUB_API_CONFIG.baseUrl);

  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('sort', GITHUB_API_CONFIG.sort);
  searchUrl.searchParams.set('order', GITHUB_API_CONFIG.order);
  searchUrl.searchParams.set('per_page', String(perPage));

  return searchUrl;
}

/**
 * Fetches matching commit records from the GitHub Search API.
 *
 * @param {string} [query=DEFAULT_AUTHOR_QUERY] - GitHub search query.
 * @param {number} [limit=DEFAULT_RESULT_LIMIT] - Maximum results to retrieve.
 * @returns {Promise<Record<string, unknown>>} JSON response payload.
 */
async function searchGitHubCommits(query = DEFAULT_AUTHOR_QUERY, limit = DEFAULT_RESULT_LIMIT) {
  const requestUrl = buildCommitSearchUrl(query, limit);

  const response = await fetch(requestUrl, {
    headers: GITHUB_API_CONFIG.headers
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error (${response.status} ${response.statusText}): Request to '${requestUrl.hostname}' failed.`);
  }

  return response.json();
}

/**
 * Main application entrypoint executing the commit search operation.
 *
 * @returns {Promise<void>}
 */
async function run() {
  try {
    const searchResults = await searchGitHubCommits();
    console.log(JSON.stringify(searchResults, null, 2));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to search GitHub commits:', errorMessage);
    process.exitCode = 1;
  }
}

run();