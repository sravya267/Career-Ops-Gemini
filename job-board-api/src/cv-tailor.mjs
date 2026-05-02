// cv-tailor.mjs — uses Gemini to select the most relevant experience bullets
// and write a targeted summary for each job. Reads cv-data.json from GCS.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Storage }            from '@google-cloud/storage';
import { config }             from './config.mjs';

let _cvData;   // cached after first GCS read

async function loadCVData() {
  if (_cvData) return _cvData;
  const [buf] = await new Storage({ projectId: config.bqProject })
    .bucket(config.gcsBucket)
    .file('templates/cv-data.json')
    .download();
  _cvData = JSON.parse(buf.toString('utf8'));
  return _cvData;
}

function buildPrompt(job, score, cvData) {
  let idx = 0;
  const numbered = cvData.experience.flatMap(e =>
    e.bullets.map(b => `${idx++}. [${e.company} | ${e.role}] ${b}`)
  );

  const desc = (job.description || '').slice(0, 2500)
    || `Title: ${job.title}. Company: ${job.company}. Location: ${job.location || 'Remote'}.`;

  return `You are tailoring a CV for a job application. Be concise and precise.

CANDIDATE: Sravya Thoomu — 14yr senior data/analytics professional
CANDIDATE BASE SUMMARY: ${cvData.base_summary}

JOB: ${job.title} at ${job.company}
REMOTE: ${score.remote || 'unclear'} | SENIORITY: ${score.seniority || 'senior'} | SCORE: ${score.score}/100
MISSING: ${score.missing_skills || 'none'}

JOB DESCRIPTION:
${desc}

ALL EXPERIENCE BULLETS (numbered):
${numbered.join('\n')}

Return JSON with exactly these fields:
{
  "summary": "3 sentences. Sentence 1: strong value statement with years of experience. Sentence 2: specific skills/tech matching this JD. Sentence 3: domain context or impact. Include 4-5 exact keywords from the JD. No fluff.",
  "bullet_indices": [6 to 8 integers from the numbered list above, most relevant to this JD, ordered by relevance],
  "ats_keywords": ["10-14 exact ATS keyword phrases from the JD that the candidate genuinely has experience with"]
}`;
}

export async function tailorCV(job, score) {
  if (!config.geminiKey || !config.gcsBucket) return null;

  try {
    const cvData = await loadCVData();
    const client = new GoogleGenerativeAI(config.geminiKey);
    const model  = client.getGenerativeModel({
      model: config.geminiModel || 'gemini-2.5-flash',
      generationConfig: { temperature: 0.15, maxOutputTokens: 1024, responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(buildPrompt(job, score, cvData));
    const parts  = result.response.candidates?.[0]?.content?.parts || [];
    const text   = parts.length
      ? parts.filter(p => !p.thought).map(p => p.text || '').join('')
      : result.response.text();

    const parsed = JSON.parse((text.match(/\{[\s\S]*\}/) || ['{}'])[0]);

    const allBullets = cvData.experience.flatMap(e =>
      e.bullets.map(b => ({ company: e.company, role: e.role, period: e.period, context: e.context || '', text: b }))
    );

    const selected = (parsed.bullet_indices || [])
      .filter(i => Number.isInteger(i) && i >= 0 && i < allBullets.length)
      .slice(0, 8)
      .map(i => allBullets[i]);

    return {
      summary:     parsed.summary || cvData.base_summary,
      bullets:     selected.length ? selected : allBullets.slice(0, 6),
      keywords:    parsed.ats_keywords || [],
      cvData,
    };
  } catch (err) {
    console.error(`  [cv-tailor] ${err.message}`);
    return null;
  }
}
