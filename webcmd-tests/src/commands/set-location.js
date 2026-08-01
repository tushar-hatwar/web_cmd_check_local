import { execWebcmd } from '../wrapper.js';

/**
 * Test set-location command (`district set-location <location> -f json`).
 * @param {string} location - Location string (e.g. "Bengaluru")
 * @returns {Promise<{ result: any }>}
 */
export async function testSetLocation(location = 'Bengaluru') {
  const args = ['district', 'set-location', location, '-f', 'json'];
  const result = await execWebcmd(args, { timeoutMs: 60000 });
  return { result };
}
