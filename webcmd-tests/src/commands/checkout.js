import { execWebcmd } from '../wrapper.js';

/**
 * Test checkout command (`district checkout <show> --seats <seats> --payment review -f json`).
 * @param {string} showId - Show ID or URL
 * @param {string|string[]} seats - Seat label(s) e.g. "I22,I21" or ["I22", "I21"]
 * @param {object} [options]
 * @param {string} [options.payment="review"] - Payment mode ("review" or "upi-qr")
 * @param {string} [options.formatId] - Format ID
 * @param {string} [options.contentId] - Content ID
 * @returns {Promise<{ result: any }>}
 */
export async function testCheckout(showId, seats, options = {}) {
  const seatStr = Array.isArray(seats) ? seats.join(',') : seats;
  const paymentMode = options.payment || 'review';
  const args = ['district', 'checkout', showId, '--seats', seatStr, '--payment', paymentMode, '-f', 'json'];

  if (options.formatId) {
    args.push('--format-id', options.formatId);
  }
  if (options.contentId) {
    args.push('--content-id', options.contentId);
  }

  args.push('--window', 'foreground');
  args.push('--timeout', '80');

  const result = await execWebcmd(args, { timeoutMs: 100000 });
  return { result };
}
