import { execWebcmd } from '../wrapper.js';
import { saveFixture } from './helpers.js';

/**
 * Test showtimes command (`district showtimes <movie> [options] -f json`).
 * @param {string} movie - Movie title or URL (e.g. "Kalki 2898 AD" or movie ID)
 * @param {object} [options] - Filter flags
 * @param {string} [options.city] - Filter city
 * @param {string} [options.cinema] - Filter cinema / theatre name
 * @param {string} [options.language] - Filter movie language
 * @param {number} [options.maxPrice] - Filter max price
 * @param {boolean} [saveAsFixture=false] - Save fixture to src/fixtures/showtimes.json
 * @returns {Promise<{ result: any, savedFixturePath?: string }>}
 */
export async function testShowtimes(movie = 'Kalki 2898 AD', options = {}, saveAsFixture = false) {
  const args = ['district', 'showtimes', movie, '-f', 'json'];

  if (options.city) {
    args.push('--city', options.city);
  }
  if (options.date) {
    args.push('--date', options.date);
  }
  if (options.cinema) {
    args.push('--cinema', options.cinema);
  }
  if (options.language) {
    args.push('--language', options.language);
  }
  if (options.maxPrice) {
    args.push('--max-price', String(options.maxPrice));
  }

  const result = await execWebcmd(args, { timeoutMs: 45000 });

  let savedFixturePath;
  if (saveAsFixture && result.data) {
    savedFixturePath = await saveFixture('showtimes.json', result.data);
  }

  return {
    result,
    savedFixturePath
  };
}
