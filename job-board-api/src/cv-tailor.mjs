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
CANDIDATE: Sravya Thoomu — data/analytics professional
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
  "summary": "3-4 sentences. Sentence 1: Lead with quantified impact (revenue/cost/efficiency %) + years as senior data/analytics professional. Sentence 2: Specific tech stack (SQL, Python, BI tools, cloud platforms—Snowflake, BigQuery, dbt, etc.) matching this JD exactly. Sentence 3: Industry context (fintech, SaaS, healthcare, e-commerce, etc.) and problem-solving approach. Include 6-8 exact phrases or keywords from the JD. Tone: confident, metrics-first, outcome-focused. No fluff.",
  
  "bullet_indices": [Select 7-10 bullet numbers. Prioritize: (1) bullets with quantified results (%, $, time saved); (2) exact tech matches (if JD says 'Snowflake', prioritize that over generic 'data warehouse'); (3) complexity signals (cross-functional, large-scale datasets, production systems); (4) domain overlap (fintech bullets for fintech jobs, SaaS for SaaS). Order by relevance to THIS job's core pain points. Reject bullets that are too junior, vague, or don't differentiate.],
  
  "ats_keywords": [List 12-16 keywords/phrases from the JD that match candidate skills. Prioritize in this order: (1) tools/languages (Python, SQL, Tableau, Snowflake, BigQuery, dbt, Looker, Power BI, AWS, GCP, Azure); (2) methodologies (A/B testing, experimentation, statistical modeling, data governance, ETL, ELT); (3) domain terms (cohort analysis, churn prediction, attribution modeling, RFM segmentation, funnel analysis); (4) seniority signals (lead, architect, mentorship, strategy, roadmap). Include exact phrases from JD where possible (e.g., if JD says 'build data pipelines at scale', use that exact phrase). Exclude vague terms (strong, strategic, analytical) unless they appear 3+ times in the JD. Return only keywords the candidate genuinely has evidence for in the CV bullets.],
  
  "rewritten_bullets": [For each selected bullet_index, rewrite it to incorporate 2-3 exact phrases or keywords from the JD while preserving the original impact metrics. Example: Original: 'Built ELT pipeline processing 500M rows daily'. Rewritten for 'data infrastructure' JD: 'Architected dbt-based ELT infrastructure processing 500M rows daily, enabling 40% faster analytics queries'. Keep the metric, add JD terminology, stay under 1 line (≤150 chars).]
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
      .slice(0, 10)
      .map(i => allBullets[i]);

    // Merge rewritten bullets with original bullets if available
    const finalBullets = selected.length
      ? selected.map((bullet, idx) => ({
          ...bullet,
          text: (parsed.rewritten_bullets && parsed.rewritten_bullets[idx])
            ? parsed.rewritten_bullets[idx]
            : bullet.text
        }))
      : allBullets.slice(0, 8);

    return {
      summary:     parsed.summary || cvData.base_summary,
      bullets:     finalBullets,
      keywords:    parsed.ats_keywords || [],
      cvData,
    };
  } catch (err) {
    console.error(`  [cv-tailor] ${err.message}`);
    return null;
  }
}
