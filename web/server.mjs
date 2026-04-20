import express from 'express';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseApplications, computeStats } from './lib/parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/applications', (_req, res) => {
  try {
    const apps = parseApplications();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (_req, res) => {
  try {
    const apps = parseApplications();
    res.json(computeStats(apps));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patterns', (_req, res) => {
  execFile('node', ['analyze-patterns.mjs'], { cwd: ROOT, timeout: 30000 }, (err, stdout) => {
    if (err || !stdout.trim()) return res.json({});
    try { res.json(JSON.parse(stdout)); } catch { res.json({}); }
  });
});

app.get('/api/followups', (_req, res) => {
  execFile('node', ['followup-cadence.mjs'], { cwd: ROOT, timeout: 30000 }, (err, stdout) => {
    if (err || !stdout.trim()) return res.json({ metadata: { overdue: 0, urgent: 0 }, entries: [] });
    try { res.json(JSON.parse(stdout)); } catch { res.json({ metadata: { overdue: 0, urgent: 0 }, entries: [] }); }
  });
});

app.get('/api/report', (req, res) => {
  const { p } = req.query;
  if (!p) return res.status(400).json({ error: 'Missing path param ?p=' });

  // Security: resolve and ensure path stays within ROOT
  const resolved = path.resolve(ROOT, p);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  fs.readFile(resolved, 'utf8', (err, text) => {
    if (err) return res.status(404).json({ error: 'Report not found' });
    res.type('text/plain').send(text);
  });
});

app.listen(PORT, () => {
  console.log(`career-ops dashboard → http://localhost:${PORT}`);
});
