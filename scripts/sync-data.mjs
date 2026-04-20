#!/usr/bin/env node
/**
 * Sync local data files to GCS so the Cloud Run dashboard can read them.
 *
 * Usage:
 *   GCS_BUCKET=my-bucket node scripts/sync-data.mjs
 *   GCS_BUCKET=my-bucket node scripts/sync-data.mjs --dry-run
 *
 * Uploads:
 *   data/applications.md  → gs://<bucket>/data/applications.md
 *   reports/*.md          → gs://<bucket>/reports/…
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT    = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET  = process.env.GCS_BUCKET;
const DRY_RUN = process.argv.includes('--dry-run');

if (!BUCKET) {
  console.error('Error: GCS_BUCKET env var is required.\n  GCS_BUCKET=my-bucket node scripts/sync-data.mjs');
  process.exit(1);
}

const { Storage } = await import('@google-cloud/storage');
const storage = new Storage();
const bucket  = storage.bucket(BUCKET);

async function uploadFile(localAbs, relPath) {
  if (DRY_RUN) {
    console.log(`  [dry-run] would upload ${relPath}`);
    return;
  }
  await bucket.upload(localAbs, { destination: relPath });
  console.log(`  ✓ ${relPath}`);
}

async function syncDir(relDir) {
  const absDir = path.join(ROOT, relDir);
  if (!fs.existsSync(absDir)) {
    console.log(`  skip ${relDir}/ (not found locally)`);
    return;
  }
  const files = fs.readdirSync(absDir).filter(f => f.endsWith('.md') || f.endsWith('.tsv'));
  for (const file of files) {
    await uploadFile(path.join(absDir, file), `${relDir}/${file}`);
  }
}

console.log(`Syncing to gs://${BUCKET}${DRY_RUN ? ' [dry-run]' : ''}…\n`);
console.log('data/');
await syncDir('data');
console.log('\nreports/');
await syncDir('reports');
console.log('\nDone.');
