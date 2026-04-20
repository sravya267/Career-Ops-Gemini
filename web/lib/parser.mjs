import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const reScore      = /(\d+\.?\d*)\/5/;
const reReportLink = /\[(\d+)\]\(([^)]+)\)/;
const reArchetype  = /\*\*Arquetipo(?:\s+detectado)?(?::\*\*|\*\*\s*\|)\s*(.+)/i;
const reTlDr       = /\*\*TL;DR(?::\*\*|\*\*\s*\|)\s*(.+)/i;
const reRemote     = /\*\*Remote\*\*\s*\|\s*(.+)/i;
const reComp       = /\*\*Comp\*\*\s*\|\s*(.+)/i;
const reReportURL  = /^\*\*URL:\*\*\s*(https?:\/\/\S+)/m;

export function normalizeStatus(raw) {
  let s = raw.replace(/\*\*/g, '').trim().toLowerCase();
  const dateIdx = s.indexOf(' 202');
  if (dateIdx > 0) s = s.slice(0, dateIdx).trim();

  if (s.includes('no aplicar') || s.includes('no_aplicar') || s === 'skip' || s.includes('geo blocker')) return 'skip';
  if (s.includes('interview') || s.includes('entrevista')) return 'interview';
  if (s === 'offer' || s.includes('oferta')) return 'offer';
  if (s.includes('responded') || s.includes('respondido')) return 'responded';
  if (s.includes('applied') || s.includes('aplicado') || s === 'enviada' || s === 'aplicada' || s === 'sent') return 'applied';
  if (s.includes('rejected') || s.includes('rechazado') || s === 'rechazada') return 'rejected';
  if (s.includes('discarded') || s.includes('descartado') || s === 'descartada' || s === 'cerrada' || s === 'cancelada' || s.startsWith('duplicado') || s.startsWith('dup')) return 'discarded';
  if (s.includes('evaluated') || s.includes('evaluada') || s === 'condicional' || s === 'hold' || s === 'monitor' || s === 'evaluar' || s === 'verificar') return 'evaluated';
  return s;
}

function cleanCell(s) {
  return s.trim().replace(/\|$/, '').trim();
}

function loadReportMeta(text) {
  const result = {};
  const urlM = reReportURL.exec(text);
  if (urlM) result.jobURL = urlM[1];

  const archM = reArchetype.exec(text);
  if (archM) result.archetype = cleanCell(archM[1]);

  const tldrM = reTlDr.exec(text);
  if (tldrM) {
    let t = cleanCell(tldrM[1]);
    if (t.length > 120) t = t.slice(0, 117) + '...';
    result.tldr = t;
  }

  const remM = reRemote.exec(text);
  if (remM) result.remote = cleanCell(remM[1]);

  const compM = reComp.exec(text);
  if (compM) result.comp = cleanCell(compM[1]);

  return result;
}

function parseContent(content) {
  const apps = [];
  let rowNum = 0;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('# ') || line.startsWith('|---') || line.startsWith('| #') || line.startsWith('|--')) continue;
    if (!line.startsWith('|')) continue;

    let fields;
    if (line.includes('\t')) {
      fields = line.replace(/^\|/, '').trim().split('\t').map(p => p.replace(/\|/g, '').trim());
    } else {
      fields = line.replace(/^\||\|$/g, '').split('|').map(p => p.trim());
    }

    if (fields.length < 8) continue;

    rowNum++;
    const app = {
      number: rowNum,
      date: fields[1],
      company: fields[2],
      role: fields[3],
      scoreRaw: fields[4],
      score: 0,
      status: normalizeStatus(fields[5]),
      statusRaw: fields[5],
      hasPDF: fields[6].includes('✅'),
      reportNumber: '',
      reportPath: '',
      notes: fields[8] || '',
      jobURL: '',
      archetype: '',
      tldr: '',
      remote: '',
      comp: '',
    };

    const scoreM = reScore.exec(fields[4]);
    if (scoreM) app.score = parseFloat(scoreM[1]);

    const repM = reReportLink.exec(fields[7]);
    if (repM) {
      app.reportNumber = repM[1];
      app.reportPath = repM[2];
    }

    apps.push(app);
  }

  return apps;
}

/**
 * Parse applications. readFileFn is async: (relativePath: string) => Promise<string>.
 * Falls back to local filesystem if not provided.
 */
export async function parseApplications(readFileFn) {
  const read = readFileFn ?? localReadFile;

  let content;
  try {
    content = await read('data/applications.md');
  } catch {
    try {
      content = await read('applications.md');
    } catch {
      return [];
    }
  }

  const apps = parseContent(content);

  for (const app of apps) {
    if (!app.reportPath) continue;
    try {
      const reportText = await read(app.reportPath);
      Object.assign(app, loadReportMeta(reportText));
    } catch { /* report missing, skip */ }
  }

  return apps;
}

export function computeStats(apps) {
  const byStatus = {};
  let totalScore = 0, scored = 0, topScore = 0, withPDF = 0;

  for (const app of apps) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    if (app.score > 0) {
      totalScore += app.score;
      scored++;
      if (app.score > topScore) topScore = app.score;
    }
    if (app.hasPDF) withPDF++;
  }

  const avgScore = scored > 0 ? +(totalScore / scored).toFixed(2) : 0;

  const funnelOrder = ['evaluated', 'applied', 'responded', 'interview', 'offer'];
  const funnel = funnelOrder.map(stage => ({ stage, count: byStatus[stage] || 0 }));

  const buckets = [
    { label: '4.5–5.0', count: 0 },
    { label: '4.0–4.4', count: 0 },
    { label: '3.5–3.9', count: 0 },
    { label: '3.0–3.4', count: 0 },
    { label: '<3.0',    count: 0 },
  ];
  for (const app of apps) {
    if (app.score <= 0) continue;
    if (app.score >= 4.5)      buckets[0].count++;
    else if (app.score >= 4.0) buckets[1].count++;
    else if (app.score >= 3.5) buckets[2].count++;
    else if (app.score >= 3.0) buckets[3].count++;
    else                       buckets[4].count++;
  }

  return { total: apps.length, byStatus, avgScore, topScore, withPDF, funnel, buckets };
}

// Default local readFile used when no readFileFn is passed
async function localReadFile(relPath) {
  return fs.readFile(path.join(ROOT, relPath), 'utf8');
}
