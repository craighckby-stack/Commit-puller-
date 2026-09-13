/**
 * Configuration constants for the GitHub API commit search.
 */
const GITHUB_API_BASE_URL = 'https://api.github.com/search/commits';
const DEFAULT_AUTHOR_QUERY = 'author:craighckby';
const DEFAULT_RESULT_LIMIT = 3;

/**
 * Standard HTTP headers required for GitHub Search API requests.
 */
const DEFAULT_REQUEST_HEADERS = Object.freeze({
  Accept: 'application/vnd.github.cloak-preview+json',
  'User-Agent': 'GitHub-Commit-Search-Client'
});

/**
 * Builds the URL for searching commits via GitHub REST API.
 *
 * @param {string} [query=DEFAULT_AUTHOR_QUERY] - GitHub search query parameter.
 * @param {number} [perPage=DEFAULT_RESULT_LIMIT] - Number of results per page.
 * @returns {URL} Fully constructed API URL object.
 */
function buildCommitSearchUrl(query = DEFAULT_AUTHOR_QUERY, perPage = DEFAULT_RESULT_LIMIT) {
  const searchUrl = new URL(GITHUB_API_BASE_URL);

  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('sort', 'author-date');
  searchUrl.searchParams.set('order', 'desc');
  searchUrl.searchParams.set('per_page', String(perPage));

  return searchUrl;
}

/**
 * Executes a search request against the GitHub Commits Search API.
 *
 * @param {string} [query=DEFAULT_AUTHOR_QUERY] - GitHub search query parameter.
 * @param {number} [limit=DEFAULT_RESULT_LIMIT] - Maximum number of commits to fetch.
 * @returns {Promise<Record<string, unknown>>} Parsed JSON response from GitHub API.
 */
async function searchGitHubCommits(query = DEFAULT_AUTHOR_QUERY, limit = DEFAULT_RESULT_LIMIT) {
  const requestUrl = buildCommitSearchUrl(query, limit);

  const response = await fetch(requestUrl, {
    headers: DEFAULT_REQUEST_HEADERS
  });

  if (!response.ok) {
    throw new Error(`GitHub API HTTP error! status: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Main execution entrypoint for fetching and displaying commit search results.
 *
 * @returns {Promise<void>}
 */
async function run() {
  try {
    const commitData = await searchGitHubCommits();
    console.log(JSON.stringify(commitData, null, 2));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to search GitHub commits:', errorMessage);
    process.exitCode = 1;
  }
}

run();