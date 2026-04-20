/**
 * Storage abstraction: local filesystem (dev) or Google Cloud Storage (production).
 * Set GCS_BUCKET env var to switch to GCS mode.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

let _bucket = null;

async function getBucket() {
  if (_bucket) return _bucket;
  const { Storage } = await import('@google-cloud/storage');
  const storage = new Storage();
  _bucket = storage.bucket(process.env.GCS_BUCKET);
  return _bucket;
}

/**
 * Returns an async readFile function compatible with parser.mjs.
 * In GCS mode: reads from gs://<GCS_BUCKET>/<relPath>
 * In local mode: reads from <ROOT>/<relPath>
 */
export function createReadFile() {
  if (process.env.GCS_BUCKET) {
    return async (relPath) => {
      const bucket = await getBucket();
      const [content] = await bucket.file(relPath).download();
      return content.toString('utf8');
    };
  }
  return async (relPath) => fs.readFile(path.join(ROOT, relPath), 'utf8');
}

export const isGCS = () => Boolean(process.env.GCS_BUCKET);

/**
 * Upload a local file to GCS at the same relative path.
 * Used by scripts/sync-data.mjs.
 */
export async function uploadFile(localAbsPath, relPath) {
  const bucket = await getBucket();
  await bucket.upload(localAbsPath, { destination: relPath });
}
