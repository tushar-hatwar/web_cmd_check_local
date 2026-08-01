import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../src/fixtures');

const FIXTURE_SCHEMAS = {
  'search.json': {
    name: 'Search Fixture',
    validate: (data) => {
      if (!Array.isArray(data)) return 'Data is not an array';
      if (data.length > 0) {
        const item = data[0];
        if (!item || typeof item !== 'object') return 'Item in array is not an object';
      }
      return null;
    }
  },
  'locations.json': {
    name: 'Locations Fixture',
    validate: (data) => {
      if (!Array.isArray(data)) return 'Data is not an array';
      if (data.length > 0) {
        const item = data[0];
        if (!item || typeof item !== 'object') return 'Item in array is not an object';
      }
      return null;
    }
  },
  'showtimes.json': {
    name: 'Showtimes Fixture',
    validate: (data) => {
      if (!Array.isArray(data)) return 'Data is not an array';
      if (data.length > 0) {
        const item = data[0];
        if (!item || typeof item !== 'object') return 'Item in array is not an object';
      }
      return null;
    }
  },
  'seats.json': {
    name: 'Seats Fixture',
    validate: (data) => {
      if (!Array.isArray(data)) return 'Data is not an array';
      if (data.length > 0) {
        const item = data[0];
        if (!item || typeof item !== 'object') return 'Item in array is not an object';
      }
      return null;
    }
  }
};

export async function verifyFixtures() {
  console.log('=== WebCMD Fixture Verifier ===\n');
  let checked = 0;
  let passed = 0;
  let missing = 0;

  for (const [filename, schema] of Object.entries(FIXTURE_SCHEMAS)) {
    checked++;
    const filePath = path.join(FIXTURES_DIR, filename);
    try {
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(rawContent);
      const err = schema.validate(data);
      if (err) {
        console.log(`❌ ${filename}: Invalid structure - ${err}`);
      } else {
        const count = Array.isArray(data) ? data.length : 1;
        console.log(`✅ ${filename}: Valid ${schema.name} (${count} items parsed)`);
        passed++;
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(`⚠️  ${filename}: Not captured yet (file missing)`);
        missing++;
      } else {
        console.log(`❌ ${filename}: JSON parse error - ${err.message}`);
      }
    }
  }

  console.log(`\nVerification Summary: ${passed}/${checked} valid, ${missing} missing.`);
  return { checked, passed, missing };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifyFixtures().catch(err => {
    console.error('Fixture verification failed:', err);
    process.exit(1);
  });
}
