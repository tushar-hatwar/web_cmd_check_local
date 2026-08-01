import { execWebcmd } from '../wrapper.js';
import { saveFixture } from './helpers.js';

/**
 * Test search command (`district search <query> -f json`).
 * @param {string} query - Search query string (e.g., "Kalki", "Pushpa")
 * @param {boolean} [saveAsFixture=false] - Save response to src/fixtures/search.json
 * @returns {Promise<{ result: any, savedFixturePath?: string }>}
 */
export async function testSearch(query = 'Kalki', saveAsFixture = false) {
  const args = ['district', 'search', query, '-f', 'json'];
  const result = await execWebcmd(args, { timeoutMs: 30000 });

  let savedFixturePath;
  if (saveAsFixture && result.data) {
    savedFixturePath = await saveFixture('search.json', result.data);
  }

  return {
    result,
    savedFixturePath
  };
}

/**
 * Test search error handling with an invalid/empty query.
 * @returns {Promise<{ error: any }>}
 */
export async function testSearchError() {
  // Intentional invalid flag to test error handling
  const args = ['district', 'search', '--invalid-flag-xyz-123', '-f', 'json'];
  try {
    const result = await execWebcmd(args, { timeoutMs: 10000 });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}
