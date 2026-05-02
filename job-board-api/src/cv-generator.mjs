import { Storage } from '@google-cloud/storage';
import { config }  from './config.mjs';

let _storage;
function gcs() {
  if (!_storage) _storage = new Storage({ projectId: config.bqProject });
  return _storage;
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// Fills only the job-specific placeholders. Everything else (name, experience,
// education, skills) must already be filled in the base HTML stored in GCS.
function fillTemplate(html, job, score) {
  return html
    .replace(/\{\{COMPANY\}\}/g,      job.company   || '')
    .replace(/\{\{ROLE\}\}/g,         job.title     || '')
    .replace(/\{\{LOCATION\}\}/g,     job.location  || 'Remote')
    .replace(/\{\{APPLY_URL\}\}/g,    job.url       || '')
    .replace(/\{\{REMOTE\}\}/g,       score.remote  || 'unclear')
    .replace(/\{\{SENIORITY\}\}/g,    score.seniority || '')
    .replace(/\{\{SCORE\}\}/g,        String(score.score ?? ''))
    .replace(/\{\{MISSING\}\}/g,      score.missing_skills
      ? `Skills to address: ${score.missing_skills}` : '')
    .replace(/\{\{SUMMARY_TEXT\}\}/g, score.summary || '');
}

export async function generateCV(job, score) {
  const bucket = gcs().bucket(config.gcsBucket);

  const [baseHtmlBuf] = await bucket.file(config.cvBaseHtmlPath).download();
  const filled = fillTemplate(baseHtmlBuf.toString('utf8'), job, score);

  const dest = `cvs/${job.id}-${slugify(job.company)}-${slugify(job.title)}.html`;
  await bucket.file(dest).save(filled, {
    contentType:  'text/html; charset=utf-8',
    metadata:     { cacheControl: 'no-cache' },
    public:       true,
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
