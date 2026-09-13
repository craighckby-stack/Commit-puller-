const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_COMMIT_SEARCH_ACCEPT_HEADER = 'application/vnd.github.cloak-preview+json';
const DEFAULT_USER_AGENT = 'EMG-Search-Test-Agent';

/**
 * Executes a search query against the GitHub Commits API endpoint.
 *
 * @param {string} query - The search query parameter.
 * @param {Object} [options={}] - Search query options.
 * @param {number} [options.perPage=3] - Results per page.
 * @param {string} [options.sort='author-date'] - Property to sort by.
 * @param {string} [options.order='desc'] - Sort direction.
 * @returns {Promise<Object>} Search result payload.
 */
async function searchGitHubCommits(query, options = {}) {
  const { perPage = 3, sort = 'author-date', order = 'desc' } = options;

  const searchParams = new URLSearchParams({
    q: query,
    sort,
    order,
    per_page: String(perPage)
  });

  const requestUrl = `${GITHUB_API_BASE_URL}/search/commits?${searchParams.toString()}`;

  const response = await fetch(requestUrl, {
    headers: {
      'Accept': GITHUB_COMMIT_SEARCH_ACCEPT_HEADER,
      'User-Agent': DEFAULT_USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed with status ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Main execution entry point.
 */
async function run() {
  try {
    const authorQuery = 'author:craighckby';
    const searchData = await searchGitHubCommits(authorQuery);

    const primaryRecord = searchData.items?.[0] ?? searchData;
    console.log(JSON.stringify(primaryRecord, null, 2));
  } catch (error) {
    console.error('Error executing GitHub search:', error);
  }
}

run();