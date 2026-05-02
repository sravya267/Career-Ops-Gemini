import 'dotenv/config';
import { createServer } from 'http';
import { config }       from './config.mjs';
import { runPipeline }  from './pipeline.mjs';
import { getTopJobs }   from './storage.mjs';

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

    json(res, 202, { status: 'started', ts: new Date().toISOString() });

    running = true;
    runPipeline()
      .then(r  => console.log('[server] pipeline complete:', JSON.stringify(r)))
      .catch(e => console.error('[server] pipeline error:', e.message))
      .finally(() => { running = false; });
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
