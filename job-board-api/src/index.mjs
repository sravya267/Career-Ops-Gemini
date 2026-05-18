import 'dotenv/config';
import { createServer }  from 'http';
import { readFileSync }  from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { config }        from './config.mjs';
import { runPipeline }   from './pipeline.mjs';
import { getTopJobs, ensureSchema } from './storage.mjs';

const __dir     = dirname(fileURLToPath(import.meta.url));
const DASHBOARD = readFileSync(join(__dir, 'dashboard.html'), 'utf-8');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify(body));
}

// Track whether a pipeline run is in progress to prevent overlapping runs.
let running = false;

const server = createServer(async (req, res) => {
  const { method, url } = req;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if ((url === '/' || url === '') && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DASHBOARD);
    return;
  }

  if (url === '/health' && method === 'GET') {
    json(res, 200, { status: 'ok', ts: new Date().toISOString() });
    return;
  }

  if (url?.startsWith('/jobs') && method === 'GET') {
    const params  = new URL(url, 'http://localhost').searchParams;
    const minScore = parseInt(params.get('min_score') || '60', 10);
    const limit    = Math.min(parseInt(params.get('limit')     || '200', 10), 500);
    try {
      const jobs = await getTopJobs(minScore, limit);
      json(res, 200, jobs);
    } catch (err) {
      console.error('[server] /jobs error:', err.message);
      json(res, 500, { error: err.message });
    }
    return;
  }

  if (url === '/run' && method === 'POST') {
    if (running) {
      json(res, 409, { status: 'busy', message: 'pipeline already running' });
      return;
    }

    running = true;
    try {
      const result = await runPipeline();
      json(res, 200, { status: 'done', ...result });
    } catch (err) {
      console.error('[server] pipeline error:', err.message);
      json(res, 500, { error: err.message });
    } finally {
      running = false;
    }
    return;
  }

  json(res, 404, { error: 'not found' });
});

server.listen(config.port, () =>
  console.log(`career-ops job-board-api listening on :${config.port}`)
);

// Graceful shutdown
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    console.log(`[server] ${sig} received — shutting down`);
    server.close(() => process.exit(0));
  });
}
