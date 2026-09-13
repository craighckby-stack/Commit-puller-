/**
 * @file test-events.cjs
 * @description Utility script to fetch and display recent GitHub push events for a target user.
 */

'use strict';

/**
 * Configuration parameters for GitHub API communications.
 * @type {Readonly<{ GITHUB_API_BASE_URL: string, DEFAULT_TARGET_USERNAME: string, USER_AGENT: string, ACCEPT_HEADER: string }>}
 */
const CONFIG = Object.freeze({
  GITHUB_API_BASE_URL: 'https://api.github.com',
  DEFAULT_TARGET_USERNAME: 'craighckby',
  USER_AGENT: 'EMG-Core-Events-Tester/1.0',
  ACCEPT_HEADER: 'application/vnd.github.v3+json',
});

/**
 * Identifier map for GitHub Event types.
 * @type {Readonly<{ PUSH: string }>}
 */
const GITHUB_EVENT_TYPES = Object.freeze({
  PUSH: 'PushEvent',
});

/**
 * Fetches public activity events for a target GitHub username.
 *
 * @param {string} username - Target GitHub account username.
 * @returns {Promise<Array<Record<string, unknown>>>} List of public GitHub event objects.
 * @throws {Error} If HTTP response status indicates failure.
 */
async function fetchUserEvents(username) {
  const sanitizedUsername = encodeURIComponent(username);
  const endpointUrl = `${CONFIG.GITHUB_API_BASE_URL}/users/${sanitizedUsername}/events`;

  const response = await fetch(endpointUrl, {
    headers: {
      'User-Agent': CONFIG.USER_AGENT,
      'Accept': CONFIG.ACCEPT_HEADER,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch events for user "${username}": ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Filters a list of raw GitHub events down to PushEvent types.
 *
 * @param {Array<Record<string, unknown>>} events - Raw GitHub API event list.
 * @returns {Array<Record<string, unknown>>} Array of filtered push events.
 */
function extractPushEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  return events.filter((event) => event?.type === GITHUB_EVENT_TYPES.PUSH);
}

/**
 * Formats event objects into a standard JSON output string.
 *
 * @param {Array<Record<string, unknown>>} events - Array of events to format.
 * @returns {string} Formatted JSON output string.
 */
function formatEventsAsJson(events) {
  return JSON.stringify(events, null, 2);
}

/**
 * Entry point to orchestrate fetching, filtering, and logging the latest push event.
 *
 * @param {string} [username=CONFIG.DEFAULT_TARGET_USERNAME] - GitHub username to inspect.
 * @returns {Promise<void>}
 */
async function run(username = CONFIG.DEFAULT_TARGET_USERNAME) {
  try {
    const rawEvents = await fetchUserEvents(username);
    const pushEvents = extractPushEvents(rawEvents);
    const latestPushEvents = pushEvents.slice(0, 1);

    console.log(formatEventsAsJson(latestPushEvents));
  } catch (error) {
    console.error('Error executing GitHub event retrieval:', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  CONFIG,
  GITHUB_EVENT_TYPES,
  fetchUserEvents,
  extractPushEvents,
  formatEventsAsJson,
  run,
};