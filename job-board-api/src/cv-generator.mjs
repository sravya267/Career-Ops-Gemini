import { Storage } from '@google-cloud/storage';
import { tailorCV } from './cv-tailor.mjs';
import { config }   from './config.mjs';

let _storage;
function gcs() {
  if (!_storage) _storage = new Storage({ projectId: config.bqProject });
  return _storage;
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// Generates ATS-clean HTML — simple semantic structure, no JS, no custom
// fonts, no CSS that breaks ATS parsers. Still readable for humans.
function buildATSHtml(job, score, tailored) {
  const { summary, bullets, keywords, cvData } = tailored;

  // Group selected bullets by company to preserve experience structure
  const grouped = {};
  for (const b of bullets) {
    const key = `${b.company}|||${b.role}|||${b.period}|||${b.context}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b.text);
  }

  const expHtml = Object.entries(grouped).map(([key, blist]) => {
    const [company, role, period, context] = key.split('|||');
    return `
  <div class="job">
    <div class="job-header">
      <strong class="company">${esc(company)}</strong>
      <span class="period">${esc(period)}</span>
    </div>
    <div class="role">${esc(role)}${context ? ` <span class="context">· ${esc(context)}</span>` : ''}</div>
    <ul>${blist.map(b => `\n      <li>${esc(b)}</li>`).join('')}
    </ul>
  </div>`;
  }).join('\n');

  const skillsHtml = Object.entries(cvData.skills || {}).map(([cat, val]) =>
    `  <div><span class="skill-cat">${esc(cat)}:</span> ${esc(val)}</div>`
  ).join('\n');

  const competenciesText = (cvData.competencies || []).join(' · ');

  const keywordsHtml = keywords.length
    ? `\n<section class="ats-keywords">\n  <h2>Skills &amp; Keywords</h2>\n  <p>${keywords.map(esc).join(' · ')}</p>\n</section>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(cvData.name)} | ${esc(job.title)} | ${esc(job.company)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #111;
         margin: 0.75in 1in; line-height: 1.5; max-width: 7.5in; }
  h1   { font-size: 20pt; margin: 0 0 3px; letter-spacing: -0.01em; }
  h2   { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.08em;
         border-bottom: 1.5px solid #111; margin: 14px 0 7px; }
  .contact { font-size: 10pt; color: #333; margin-bottom: 12px; }
  .contact a { color: #333; }
  .targeting { font-size: 10pt; font-weight: bold; color: #1a6060;
               margin-bottom: 12px; padding: 6px 10px;
               background: #f0fafa; border-left: 3px solid #1a6060; }
  .targeting a { color: #1a6060; }
  .job { margin-bottom: 13px; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; }
  .company { font-size: 11.5pt; }
  .period  { font-size: 10pt; color: #555; white-space: nowrap; }
  .role    { font-size: 10.5pt; color: #333; margin-bottom: 3px; }
  .context { font-weight: normal; color: #666; }
  ul { margin: 4px 0 0; padding-left: 18px; }
  li { margin-bottom: 3px; font-size: 10.5pt; }
  .skill-cat { font-weight: bold; }
  .skills div { margin-bottom: 4px; font-size: 10.5pt; }
  .edu-row { display: flex; justify-content: space-between; align-items: baseline; }
  .edu-note { font-size: 10pt; color: #555; margin-top: 2px; }
  .ats-keywords p { font-size: 10pt; color: #333; }
  @media print {
    body { margin: 0.5in 0.75in; }
    .targeting { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<h1>${esc(cvData.name)}</h1>
<div class="contact">
  ${esc(cvData.email)} &nbsp;|&nbsp;
  ${esc(cvData.phone)} &nbsp;|&nbsp;
  <a href="${esc(cvData.linkedin_url || '#')}">${esc(cvData.linkedin)}</a> &nbsp;|&nbsp;
  ${esc(cvData.location)}
</div>

<div class="targeting">
  Targeting: <strong>${esc(job.title)}</strong> at <strong>${esc(job.company)}</strong>
  &nbsp;·&nbsp; Score: ${score.score}/100
  &nbsp;·&nbsp; <a href="${esc(job.url)}">Apply ↗</a>
</div>

<section>
  <h2>Professional Summary</h2>
  <p>${esc(summary)}</p>
</section>

<section>
  <h2>Core Competencies</h2>
  <p>${esc(competenciesText)}</p>
</section>

<section>
  <h2>Professional Experience</h2>
  ${expHtml}
</section>

<section>
  <h2>Education</h2>
  ${(cvData.education || []).map(e => `
  <div>
    <div class="edu-row">
      <strong>${esc(e.degree)}</strong>
      <span style="font-size:10pt;color:#555">${esc(e.period)}</span>
    </div>
    <div style="color:#333">${esc(e.school)}</div>
    ${e.note ? `<div class="edu-note">${esc(e.note)}</div>` : ''}
  </div>`).join('')}
</section>

<section class="skills">
  <h2>Technical Skills</h2>
${skillsHtml}
</section>
${keywordsHtml}

</body>
</html>`;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function generateCV(job, score) {
  const bucket = gcs().bucket(config.gcsBucket);

  // Tailor content with Gemini (falls back to generic if key missing)
  const tailored = await tailorCV(job, score);
  if (!tailored) throw new Error('cv-tailor returned null — check GEMINI_API_KEY and cv-data.json in GCS');

  const html  = buildATSHtml(job, score, tailored);
  const slug  = `${slugify(job.company)}-${slugify(job.title)}`;
  const dest  = `cvs/${job.id}-${slug}.html`;

  await bucket.file(dest).save(html, {
    contentType: 'text/html; charset=utf-8',
    metadata:    { cacheControl: 'no-cache' },
    public:      true,
  });

  return `https://storage.googleapis.com/${config.gcsBucket}/${dest}`;
}

export async function generateCVBatch(jobs, scores) {
  if (!config.gcsBucket) {
    console.log('[cv] GCS_BUCKET not set — skipping CV generation');
    return [];
  }

  const scoreMap = new Map(scores.map(s => [s.job_id, s]));
  const results  = [];

  for (const job of jobs) {
    const score = scoreMap.get(job.id);
    if (!score || score.score < config.cvMinScore) continue;

    try {
      const url = await generateCV(job, score);
      results.push({ job_id: job.id, cv_url: url, generated_at: new Date().toISOString() });
      console.log(`  [cv] ${job.company} / ${job.title} → ${url}`);
    } catch (err) {
      console.error(`  [cv] error ${job.company} / ${job.title}: ${err.message}`);
    }
  }

  console.log(`[cv] generated ${results.length} CVs`);
  return results;
}
