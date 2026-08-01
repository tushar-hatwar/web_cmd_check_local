import { execWebcmd } from '../wrapper.js';
import { saveFixture } from './helpers.js';

/**
 * Test seats command (`district seats <show> [options] -f json`).
 * @param {string} showId - Show ID or show URL
 * @param {object} [options] - Constraint options
 * @param {number} [options.count] - Number of seats (1-10)
 * @param {boolean} [options.together] - Require adjacent seats
 * @param {string} [options.seatClass] - Seat class filter (e.g. premium, recliner)
 * @param {number} [options.maxPrice] - Maximum price per seat
 * @param {string} [options.formatId] - Format ID override
 * @param {string} [options.contentId] - Content ID override
 * @param {boolean} [saveAsFixture=false] - Save fixture to src/fixtures/seats.json
 * @returns {Promise<{ result: any, savedFixturePath?: string }>}
 */
export async function testSeats(showId, options = {}, saveAsFixture = false) {
  const args = ['district', 'seats', showId, '-f', 'json'];

  if (options.count) {
    args.push('--count', String(options.count));
  }
  if (options.together !== undefined) {
    args.push('--together', String(options.together));
  }
  if (options.seatClass) {
    args.push('--class', options.seatClass);
  }
  if (options.maxPrice) {
    args.push('--max-price', String(options.maxPrice));
  }
  if (options.formatId) {
    args.push('--format-id', options.formatId);
  }
  if (options.contentId) {
    args.push('--content-id', options.contentId);
  }

  // District's default internal Playwright timeout is 30s. We pass 60s to give slow
  // seat layouts (or captchas) more time to resolve.
  args.push('--timeout', '60');

  // Wrapper timeout slightly higher than internal timeout
  const result = await execWebcmd(args, { timeoutMs: 75000 });

  let savedFixturePath;
  if (saveAsFixture && result.data) {
    savedFixturePath = await saveFixture('seats.json', result.data);
  }

  return {
    result,
    savedFixturePath
  };
}

/**
 * Test seats error case (e.g. non-existent show ID).
 * @returns {Promise<{ error: any }>}
 */
export async function testSeatsInvalidShow() {
  const args = ['district', 'seats', 'non_existent_show_999', '-f', 'json'];
  try {
    const result = await execWebcmd(args, { timeoutMs: 15000 });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}
