import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const reScore = /(\d+\.?\d*)\/5/;
const reReportLink = /\[(\d+)\]\(([^)]+)\)/;
const reReportURL = /^\*\*URL:\*\*\s*(https?:\/\/\S+)/m;
const reBatchID = /^\*\*Batch ID:\*\*\s*(\d+)/m;
const reArchetype = /\*\*Arquetipo(?:\s+detectado)?(?::\*\*|\*\*\s*\|)\s*(.+)/i;
const reTlDr = /\*\*TL;DR(?::\*\*|\*\*\s*\|)\s*(.+)/i;
const reRemote = /\*\*Remote\*\*\s*\|\s*(.+)/i;
const reComp = /\*\*Comp\*\*\s*\|\s*(.+)/i;

function normalizeStatus(raw) {
  let s = raw.replace(/\*\*/g, '').trim().toLowerCase();
  // Strip trailing date like "applied 2026-03-12"
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

function loadReportMeta(reportPath) {
  try {
    const full = path.resolve(ROOT, reportPath);
    // Security: ensure path stays within ROOT
    if (!full.startsWith(ROOT + path.sep) && full !== ROOT) return {};
    const text = fs.readFileSync(full, 'utf8');
    const header = text.slice(0, 2000);
    const result = {};

    const urlM = reReportURL.exec(header);
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
  } catch {
    return {};
  }
}

export function parseApplications() {
  let filePath = path.join(ROOT, 'data', 'applications.md');
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    try {
      filePath = path.join(ROOT, 'applications.md');
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return [];
    }
  }

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

    if (app.reportPath) {
      const meta = loadReportMeta(app.reportPath);
      Object.assign(app, meta);
    }

    apps.push(app);
  }

  return apps;
}

export function computeStats(apps) {
  const byStatus = {};
  let totalScore = 0;
  let scored = 0;
  let topScore = 0;
  let withPDF = 0;

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

  // Funnel: ordered stages
  const funnelOrder = ['evaluated', 'applied', 'responded', 'interview', 'offer'];
  const funnel = funnelOrder.map(stage => ({ stage, count: byStatus[stage] || 0 }));

  // Score buckets: [4.5-5, 4.0-4.4, 3.5-3.9, 3.0-3.4, <3.0]
  const buckets = [
    { label: '4.5–5.0', count: 0 },
    { label: '4.0–4.4', count: 0 },
    { label: '3.5–3.9', count: 0 },
    { label: '3.0–3.4', count: 0 },
    { label: '<3.0', count: 0 },
  ];
  for (const app of apps) {
    if (app.score <= 0) continue;
    if (app.score >= 4.5) buckets[0].count++;
    else if (app.score >= 4.0) buckets[1].count++;
    else if (app.score >= 3.5) buckets[2].count++;
    else if (app.score >= 3.0) buckets[3].count++;
    else buckets[4].count++;
  }

  return { total: apps.length, byStatus, avgScore, topScore, withPDF, funnel, buckets };
}
