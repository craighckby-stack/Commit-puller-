/**
 * @file test-events.cjs
 * Fetch and display recent GitHub push events for a target user.
 */

const GITHUB_API_BASE_URL = 'https://api.github.com';
const DEFAULT_TARGET_USERNAME = 'craighckby';
const USER_AGENT_HEADER = 'EMG-Core-Events-Tester/1.0';

/**
 * Fetches public events for a given GitHub username.
 *
 * @param {string} username - Target GitHub account username.
 * @returns {Promise<Array<Object>>} List of public GitHub event objects.
 */
async function fetchUserEvents(username) {
  const endpointUrl = `${GITHUB_API_BASE_URL}/users/${encodeURIComponent(username)}/events`;
  const response = await fetch(endpointUrl, {
    headers: {
      'User-Agent': USER_AGENT_HEADER,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events for user "${username}": ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Filters a list of GitHub events down to PushEvent types.
 *
 * @param {Array<Object>} events - Raw GitHub API event list.
 * @returns {Array<Object>} Filtered push events.
 */
function extractPushEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }
  return events.filter((event) => event?.type === 'PushEvent');
}

/**
 * Entry point to orchestrate fetching and logging the latest push event.
 */
async function run() {
  try {
    const events = await fetchUserEvents(DEFAULT_TARGET_USERNAME);
    const pushEvents = extractPushEvents(events);
    const latestPushEvent = pushEvents.slice(0, 1);

    console.log(JSON.stringify(latestPushEvent, null, 2));
  } catch (error) {
    console.error('Error executing GitHub event retrieval:', error);
    process.exitCode = 1;
  }
}

run();