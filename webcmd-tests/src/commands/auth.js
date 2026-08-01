import { execWebcmd } from '../wrapper.js';

/**
 * Check district session authentication status via `district whoami`.
 * @returns {Promise<{ loggedIn: boolean, accountInfo: any, rawResult: any }>}
 */
export async function testAuthStatus() {
  const args = ['district', 'whoami', '-f', 'json'];
  try {
    const result = await execWebcmd(args, { timeoutMs: 15000 });
    const data = result.data;
    
    // Check if output indicates logged_in
    let loggedIn = false;
    if (Array.isArray(data) && data.length > 0) {
      loggedIn = Boolean(data[0].logged_in ?? data[0].logged_into_district);
    } else if (data && typeof data === 'object') {
      loggedIn = Boolean(data.logged_in || data.user_id || data.email || data.phone_number);
    }

    return {
      success: true,
      loggedIn,
      accountInfo: data,
      rawResult: result
    };
  } catch (err) {
    return {
      success: false,
      loggedIn: false,
      error: err
    };
  }
}
