import { execWebcmd } from '../wrapper.js';
import { saveFixture } from './helpers.js';

/**
 * Test locations command (`district locations <query> -f json`).
 * @param {string} query - City or area search query (e.g. "Bengaluru")
 * @param {boolean} [saveAsFixture=false] - Save response to src/fixtures/locations.json
 * @returns {Promise<{ result: any, savedFixturePath?: string }>}
 */
export async function testLocations(query = 'Bengaluru', saveAsFixture = false) {
  const args = ['district', 'locations', query, '-f', 'json'];
  const result = await execWebcmd(args, { timeoutMs: 30000 });

  let savedFixturePath;
  if (saveAsFixture && result.data) {
    savedFixturePath = await saveFixture('locations.json', result.data);
  }

  return {
    result,
    savedFixturePath
  };
}

/**
 * Test locations with an invalid or unknown query.
 * @param {string} invalidQuery
 */
export async function testLocationsInvalid(invalidQuery = 'XyzNonExistentCity999') {
  const args = ['district', 'locations', invalidQuery, '-f', 'json'];
  try {
    const result = await execWebcmd(args, { timeoutMs: 15000 });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}
