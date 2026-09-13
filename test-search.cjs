/**
 * @file test-search.cjs
 * @description Standalone verification utility for querying the GitHub Commits Search API.
 */

'use strict';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const GITHUB_COMMIT_SEARCH_ACCEPT_HEADER = 'application/vnd.github.cloak-preview+json';
const DEFAULT_USER_AGENT = 'EMG-Search-Test-Agent';

/**
 * Default search options for the GitHub Commits Search API.
 * @type {Readonly<{perPage: number, sort: string, order: string}>}
 */
const DEFAULT_SEARCH_OPTIONS = Object.freeze({
  perPage: 3,
  sort: 'author-date',
  order: 'desc',
});

/**
 * Builds the URL and parameters for the GitHub commits search endpoint.
 *
 * @param {string} query - The search query string.
 * @param {Object} [options] - Optional search parameters.
 * @param {number} [options.perPage] - Results per page.
 * @param {string} [options.sort] - Sort field.
 * @param {string} [options.order] - Sort order ('asc' | 'desc').
 * @returns {URL} Fully qualified search endpoint URL.
 */
function buildCommitSearchUrl(query, options = {}) {
  const { perPage, sort, order } = { ...DEFAULT_SEARCH_OPTIONS, ...options };
  const searchUrl = new URL('/search/commits', GITHUB_API_BASE_URL);

  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('sort', sort);
  searchUrl.searchParams.set('order', order);
  searchUrl.searchParams.set('per_page', String(perPage));

  return searchUrl;
}

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
  const requestUrl = buildCommitSearchUrl(query, options);

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: GITHUB_COMMIT_SEARCH_ACCEPT_HEADER,
      'User-Agent': DEFAULT_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed [${response.status} ${response.statusText}]: GET ${requestUrl.pathname}`
    );
  }

  return response.json();
}

/**
 * Main execution entry point.
 *
 * @returns {Promise<void>}
 */
async function run() {
  const targetAuthorQuery = 'author:craighckby';

  try {
    const searchResult = await searchGitHubCommits(targetAuthorQuery);
    const primaryRecord = searchResult.items?.[0] ?? searchResult;

    console.log(JSON.stringify(primaryRecord, null, 2));
  } catch (error) {
    console.error('Error executing GitHub search:', error);
  }
}

run();