import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

/**
 * Save captured JSON response as a fixture file.
 * @param {string} filename - Target fixture filename (e.g. 'search.json')
 * @param {any} data - Data payload to save
 */
export async function saveFixture(filename, data) {
  try {
    await fs.mkdir(FIXTURES_DIR, { recursive: true });
    const targetPath = path.join(FIXTURES_DIR, filename);
    await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');
    return targetPath;
  } catch (err) {
    console.error(`Failed to save fixture ${filename}:`, err.message);
    throw err;
  }
}
