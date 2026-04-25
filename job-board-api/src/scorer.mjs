import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './config.mjs';

// Model preference order: best quality first, free-tier fallbacks after.
// Rate limits are conservative to avoid 429s.
const MODEL_TIERS = [
  { model: 'gemini-2.5-pro',   rateLimitMs: 1000,  label: 'Pro subscription'      },
  { model: 'gemini-2.5-flash', rateLimitMs: 6000,  label: 'free tier (10 RPM)'    },
  { model: 'gemini-2.0-flash', rateLimitMs: 4000,  label: 'free tier (15 RPM)'    },
];

let _activeModel  = null;   // GenerativeModel instance
let _rateLimitMs  = 4000;
let _lastCallAt   = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function throttle() {
  const wait = _rateLimitMs - (Date.now() - _lastCallAt);
  if (wait > 0) await sleep(wait);
  _lastCallAt = Date.now();
}

// Probe each model tier once per container instance.
// Respects GEMINI_MODEL env var as a hard override (skips probing).
async function resolveModel() {
  if (_activeModel) return _activeModel;
  if (!config.geminiKey) throw new Error('GEMINI_API_KEY is not set');

  const client = new GoogleGenerativeAI(config.geminiKey);
  const genConfig = { temperature: 0.1, maxOutputTokens: 512 };

  // Hard override via env var — trust the user, skip probing
  if (process.env.GEMINI_MODEL) {
    _rateLimitMs = 1000;
    _activeModel = client.getGenerativeModel({ model: config.geminiModel, generationConfig: genConfig });
    console.log(`Using model (env override): ${config.geminiModel}`);
    return _activeModel;
  }

  // Auto-detect: probe each tier with a minimal call
  for (const tier of MODEL_TIERS) {
    try {
      const m = client.getGenerativeModel({
        model: tier.model,
        generationConfig: { maxOutputTokens: 1 },
      });
      await m.generateContent('ping');
      _rateLimitMs = tier.rateLimitMs;
      _activeModel = client.getGenerativeModel({ model: tier.model, generationConfig: genConfig });
      console.log(`Auto-selected model: ${tier.model} (${tier.label}, ${1000 / tier.rateLimitMs * 60} RPM)`);
      return _activeModel;
    } catch (err) {
      const is404 = err.message?.includes('404') || err.message?.includes('not found');
      const is403 = err.message?.includes('403') || err.message?.includes('permission');
      if (is404 || is403) {
        console.log(`  ${tier.model} unavailable (${err.message.slice(0, 60)}), trying next...`);
        continue;
      }
      throw err; // unexpected error — bubble up
    }
  }
  throw new Error('No working Gemini model found. Check your GEMINI_API_KEY.');
}

function buildPrompt(job) {
  const desc = (job.description || '').slice(0, 3000) || '[no description available]';
  return `You are evaluating a job posting for a candidate with very specific priorities.

CANDIDATE PROFILE:
${config.candidateProfile || '[not configured — score based on role title and seniority only]'}

SCORING PRIORITIES (in order of importance):
1. REMOTE WORK — candidate requires fully remote. If the role is onsite or hybrid only, cap score at 30.
2. WORK-LIFE BALANCE — look for signals: flexible hours, async culture, no-crunch, reasonable expectations.
3. JOB SECURITY — prefer roles where the candidate BUILDS AI/data infrastructure (pipelines, platforms, governance) over roles that compete with AI. Stable companies (profitable, government, enterprise) score higher than high-risk startups.
4. SKILLS MATCH — data engineering, cloud platforms (GCP/Azure/AWS), Python, PySpark, SQL, ML/AI, Airflow, Snowflake, Databricks.
5. IC ROLE — individual contributor only. If the role is primarily managerial (hiring, performance reviews, org design), cap score at 40.
6. REAL ESTATE / PROPTECH BONUS — candidate has deep real estate domain expertise (14+ years at JLL, a Fortune 500 commercial real estate firm). Add +10 to the score if the company operates in real estate, proptech, commercial real estate, property management, facilities, construction tech, or related sectors (e.g. CoStar, Yardi, RealPage, VTS, Procore, Cushman & Wakefield, CBRE, Colliers, Prologis, Zillow, Redfin, Opendoor, WeWork, Compass, Jones Lang LaSalle). This domain expertise is a rare differentiator.

JOB POSTING:
Company: ${job.company}
Title: ${job.title}
Location: ${job.location || 'Not specified'}
Description:
${desc}

Return valid JSON ONLY (no markdown fences, no explanation):
{
  "score": <integer 0-100, applying all priorities above>,
  "remote": <"yes"|"hybrid"|"no"|"unclear">,
  "wlb_signals": "<brief: any WLB signals found — flexible hours, async, 4-day week, unlimited PTO, etc. or 'none mentioned'>",
  "ai_proof": <true if role builds data/AI infrastructure that AI depends on; false if AI could replace this role>,
  "stability": <"high"|"medium"|"low" — based on company type and funding stage>,
  "seniority": <"senior"|"mid"|"junior"|"unclear">,
  "missing_skills": [<up to 3 strings the candidate likely lacks>],
  "summary": "<one sentence: score rationale focusing on remote + WLB + stability>"
}`;
}

function parseResponse(text) {
  // gemini-2.5-pro (thinking model) prepends reasoning before the JSON.
  // Find the first complete {...} block anywhere in the response.
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error(`  parse-error: no JSON found. Response: ${text.slice(0, 200)}`);
    return { score: -1, missing_skills: '', salary_mentioned: false, remote: 'unclear',
             wlb_signals: 'none mentioned', ai_proof: false, stability: 'medium',
             seniority: 'unclear', summary: 'parse-error: no JSON in response' };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score:            Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
      missing_skills:   (parsed.missing_skills || []).slice(0, 3).join(', '),
      salary_mentioned: false,
      remote:           ['yes', 'hybrid', 'no', 'unclear'].includes(parsed.remote) ? parsed.remote : 'unclear',
      wlb_signals:      String(parsed.wlb_signals || 'none mentioned').slice(0, 200),
      ai_proof:         Boolean(parsed.ai_proof),
      stability:        ['high', 'medium', 'low'].includes(parsed.stability) ? parsed.stability : 'medium',
      seniority:        ['senior', 'mid', 'junior', 'unclear'].includes(parsed.seniority) ? parsed.seniority : 'unclear',
      summary:          String(parsed.summary || '').slice(0, 200),
    };
  } catch (e) {
    console.error(`  parse-error: ${e.message}. Text: ${jsonMatch[0].slice(0, 200)}`);
    return { score: -1, missing_skills: '', salary_mentioned: false, remote: 'unclear',
             wlb_signals: 'none mentioned', ai_proof: false, stability: 'medium',
             seniority: 'unclear', summary: 'parse-error: invalid JSON' };
  }
}

export async function scoreJob(job) {
  const model = await resolveModel();
  await throttle();
  const result = await model.generateContent(buildPrompt(job));
  return parseResponse(result.response.text());
}

export async function scoreBatch(jobs) {
  if (!jobs.length) return [];

  // Resolve model once before the loop so the probe log appears upfront
  await resolveModel();
  console.log(`Scoring ${jobs.length} jobs...`);
  const scored = [];

  for (const job of jobs) {
    try {
      const s = await scoreJob(job);
      scored.push({ job_id: job.id, ...s, scored_at: new Date().toISOString() });
      console.log(`  scored ${job.company}/${job.title}: ${s.score}`);
    } catch (err) {
      console.error(`  score failed ${job.company}/${job.title}: ${err.message}`);
      scored.push({
        job_id: job.id, score: -1, missing_skills: '', salary_mentioned: false,
        remote: 'unclear', wlb_signals: 'none mentioned', ai_proof: false,
        stability: 'medium', seniority: 'unclear',
        summary: `error: ${err.message}`.slice(0, 200),
        scored_at: new Date().toISOString(),
      });
    }
  }

  return scored;
}
