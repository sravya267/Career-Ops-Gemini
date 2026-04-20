import express from 'express';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseApplications, computeStats } from './lib/parser.mjs';
import { createReadFile, isGCS } from './lib/storage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const PORT      = process.env.PORT || 3000;

const app = express();
const readFile = createReadFile();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/applications', async (_req, res) => {
  try {
    const apps = await parseApplications(readFile);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    const apps = await parseApplications(readFile);
    res.json(computeStats(apps));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patterns and follow-ups rely on local scripts that read from disk.
// In GCS mode they gracefully return empty — full data is in /api/applications.
app.get('/api/patterns', (_req, res) => {
  if (isGCS()) return res.json({});
  execFile('node', ['analyze-patterns.mjs'], { cwd: ROOT, timeout: 30000 }, (err, stdout) => {
    if (err || !stdout.trim()) return res.json({});
    try { res.json(JSON.parse(stdout)); } catch { res.json({}); }
  });
});

app.get('/api/followups', (_req, res) => {
  if (isGCS()) return res.json({ metadata: { overdue: 0, urgent: 0 }, entries: [] });
  execFile('node', ['followup-cadence.mjs'], { cwd: ROOT, timeout: 30000 }, (err, stdout) => {
    if (err || !stdout.trim()) return res.json({ metadata: { overdue: 0, urgent: 0 }, entries: [] });
    try { res.json(JSON.parse(stdout)); } catch { res.json({ metadata: { overdue: 0, urgent: 0 }, entries: [] }); }
  });
});

app.get('/api/report', async (req, res) => {
  const { p } = req.query;
  if (!p) return res.status(400).json({ error: 'Missing ?p= param' });

  // Security: only allow relative paths that don't escape root
  if (p.includes('..') || path.isAbsolute(p)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const text = await readFile(p);
    res.type('text/plain').send(text);
  } catch {
    res.status(404).json({ error: 'Report not found' });
  }
});

app.listen(PORT, () => {
  const mode = isGCS() ? `GCS bucket: ${process.env.GCS_BUCKET}` : 'local filesystem';
  console.log(`career-ops dashboard → http://localhost:${PORT}  [${mode}]`);
});
