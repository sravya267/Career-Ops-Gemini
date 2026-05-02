// One-time script: fills the CV template with Sravya's real data and writes
// cv-base.html. Upload the result to GCS:
//   gsutil cp cv-base.html gs://career-ops-cvs-0651419186/templates/cv-base.html
//
// Run: node prepare-cv-base.mjs

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath }               from 'url';
import { join, dirname }               from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dir, '../templates/cv-template.html'), 'utf-8');

// ── Personal data (edit here to update your CV) ───────────────────────────────

const NAME             = 'Sravya Thoomu';
const PHONE            = '(919) 579-8832';
const EMAIL            = 'sthoomu@gmail.com';
const LINKEDIN_URL     = 'https://www.linkedin.com/in/sravya-thoomu/';
const LINKEDIN_DISPLAY = 'linkedin.com/in/sravya-thoomu';
const LOCATION         = 'Remote — India';
const PAGE_WIDTH       = '860px';

// ── Summary — {{ROLE}} and {{COMPANY}} are filled per-job by cv-generator ─────

const SUMMARY = `\
<div style="font-size:10px;color:hsl(187,74%,32%);font-weight:600;margin-bottom:6px;letter-spacing:0.01em;">\
Targeting: {{ROLE}} · {{COMPANY}} &nbsp;·&nbsp; \
<a href="{{APPLY_URL}}" style="color:hsl(187,74%,32%);">Apply ↗</a></div>\
Fullstack data and analytics professional with 14+ years of end-to-end experience designing scalable \
data pipelines, deploying predictive and AI/ML models, and translating complex datasets into \
executive-facing insights. Proven expertise in Python, SQL, PySpark, and cloud platforms (GCP, Azure, AWS), \
with deep fluency in ETL/ELT architecture, data governance, NLP and LLM-powered automation, and advanced \
analytics. Experienced leading cross-functional teams and engaging directly with senior business stakeholders \
to define analytics strategy, implement sophisticated models within existing workflows, and drive measurable \
business outcomes.`;

// ── Core Competencies ─────────────────────────────────────────────────────────

const COMPETENCIES = [
  'Data Engineering & ETL', 'Cloud Platforms (GCP · Azure · AWS)', 'Python & PySpark',
  'ML/AI & NLP/LLMs', 'Snowflake & Databricks', 'Apache Airflow',
  'SQL & Analytics', 'Data Governance & Quality', 'Predictive Modeling',
  'Executive Dashboards', 'Cross-functional Leadership', 'Stakeholder Engagement',
].map(c => `<span class="competency-tag">${c}</span>`).join('\n      ');

// ── Experience ────────────────────────────────────────────────────────────────

const EXPERIENCE = `
<div class="job">
  <div class="job-header">
    <span class="job-company">Data and Analytics Consultant</span>
    <span class="job-period">Dec 2025 – Present</span>
  </div>
  <div class="job-role">Data Engineering & ML/AI · Independent</div>
  <ul>
    <li>Designed and built an AI-powered K-2 math worksheet generation application, independently owning the full project lifecycle from requirements through production deployment using Python and FastAPI.</li>
    <li>Applied ML algorithms to implement spiral and fluency learning models that adapt to individual student performance data, continuously improving generated content based on learner feedback loops.</li>
    <li>Integrated prompt engineering and GenAI automation to dynamically generate differentiated content, demonstrating practical LLM application skills directly transferable to enterprise workflow automation.</li>
  </ul>
</div>

<div class="job">
  <div class="job-header">
    <span class="job-company">Jones Lang LaSalle (JLL)</span>
    <span class="job-period">Dec 2012 – Dec 2025</span>
  </div>
  <div class="job-role">Technical Data Analytics Lead · Fortune 500 Commercial Real Estate</div>
  <ul>
    <li><strong>Leadership:</strong> Led data scientists and engineers across a global Fortune 500 organization; received three consecutive VIP Awards for data infrastructure and team development.</li>
    <li><strong>Data Engineering:</strong> Architected metadata-driven ETL pipelines on Azure integrating 10+ source systems into analysis-ready data marts, significantly reducing manual processing time and outages.</li>
    <li>Designed and orchestrated cloud data pipelines using modular Python frameworks across GCP and Azure, managing scheduling, dependency resolution, and failure alerting via Airflow.</li>
    <li>Built and optimized Spark and PySpark transformation workflows for large-scale datasets, with performance tuning and automated end-to-end testing.</li>
    <li>Constructed Snowflake and Databricks data warehouse and data lake solutions, enforcing schema standards, data versioning, and downstream analytics support.</li>
    <li><strong>AI/ML:</strong> Developed NLP solutions using LLMs trained on internal datasets to automate categorization and sentiment analysis at scale.</li>
    <li>Built predictive models for financial market analysis, site attendance forecasting, workspace optimization, and customer segmentation using historical data and economic indicators.</li>
    <li><strong>Impact:</strong> Delivered DaVinci Award-winning pipeline automation saving <strong>$200K+ annually</strong>; built executive data quality dashboards with automated alerting across business units.</li>
  </ul>
</div>

<div class="job">
  <div class="job-header">
    <span class="job-company">Mediamath</span>
    <span class="job-period">Feb 2015 – Oct 2015</span>
  </div>
  <div class="job-role">Data Science and Engineering Manager</div>
  <ul>
    <li>Developed Python and R ML models for customer segmentation, behavior prediction, and revenue optimization supporting programmatic advertising campaigns.</li>
    <li>Performed advanced time-series forecasting and statistical analysis; built batch data pipelines and automated reporting workflows delivering measurable efficiency gains.</li>
  </ul>
</div>

<div class="job">
  <div class="job-header">
    <span class="job-company">Ford Motor Company</span>
    <span class="job-period">Aug 2010 – Dec 2012</span>
  </div>
  <div class="job-role">Safety Optimization Analyst</div>
  <ul>
    <li>Developed quantitative mathematical models and optimization algorithms applying regression analysis, numerical approximation, and sensitivity analysis to complex vehicle safety engineering datasets.</li>
    <li>Built SQL-based data extraction pipelines and R forecasting models; automated recurring statistical reporting workflows reducing analyst turnaround time.</li>
  </ul>
</div>`.trim();

// ── Projects ──────────────────────────────────────────────────────────────────

const PROJECTS = `
<div class="project">
  <span class="project-title">AI Math Worksheet Generator</span>
  <span class="project-badge">Production</span>
  <div class="project-desc">Full-stack AI application generating differentiated K-2 math worksheets. Independently owned end-to-end from architecture through production deployment. ML-driven spiral learning and fluency models adapt content to individual student performance.</div>
  <div class="project-tech">Python · FastAPI · GenAI · Prompt Engineering · scikit-learn</div>
</div>

<div class="project">
  <span class="project-title">Career-Ops AI Job Search Pipeline</span>
  <span class="project-badge">Open Source</span>
  <div class="project-desc">Automated job search system scanning 31+ company ATS boards, scoring with Gemini AI, storing results in BigQuery, generating tailored CVs to GCS, and serving an interactive dashboard via Cloud Run.</div>
  <div class="project-tech">Node.js · GCP · BigQuery · Cloud Run · Gemini API · Cloud Scheduler</div>
</div>`.trim();

// ── Education ─────────────────────────────────────────────────────────────────

const EDUCATION = `
<div class="edu-item">
  <div class="edu-header">
    <span class="edu-title">M.S. Machine Learning and Optimization &nbsp;<span class="edu-org">· Clemson University</span></span>
    <span class="edu-year">2008 – 2010</span>
  </div>
  <div class="edu-desc">Thesis: <em>Design Decisions Under Uncertainty</em> — Applied ML, optimization, and approximation techniques to complex engineering problems. Research Assistant, Automotive Research Center.</div>
</div>`.trim();

// ── Skills ────────────────────────────────────────────────────────────────────

const SKILLS = `
<div class="skills-grid">
  <div class="skill-item"><span class="skill-category">Languages:</span> Python (pandas, NumPy, PySpark, scikit-learn, FastAPI, TensorFlow), SQL, R, MATLAB</div>
  <div class="skill-item"><span class="skill-category">Cloud:</span> GCP, Azure, AWS, Snowflake, Databricks, Cloud Run, Cloud Functions</div>
  <div class="skill-item"><span class="skill-category">Data Engineering:</span> Apache Airflow, Spark/PySpark, Alteryx, dbt, Fivetran, metadata-driven ETL, batch &amp; real-time pipelines</div>
  <div class="skill-item"><span class="skill-category">AI/ML:</span> Predictive modeling, time-series forecasting, NLP/LLMs, Hugging Face, clustering, A/B testing, prompt engineering, GenAI &amp; MCP integrations</div>
  <div class="skill-item"><span class="skill-category">Visualization:</span> Tableau, Power BI, Streamlit, Plotly/Dash, D3.js, executive dashboards &amp; KPI frameworks</div>
  <div class="skill-item"><span class="skill-category">Governance:</span> End-to-end validation frameworks, data contracts, automated quality dashboards, multi-stage ETL governance</div>
  <div class="skill-item"><span class="skill-category">Tooling:</span> GitHub, Jira, Jupyter, VS Code, Agile, Claude Code, GitHub Copilot, API integration</div>
</div>`.trim();

// ── Fill template ─────────────────────────────────────────────────────────────

const filled = template
  .replace(/\{\{LANG\}\}/g,              'en')
  .replace(/\{\{NAME\}\}/g,              NAME)
  .replace(/\{\{PAGE_WIDTH\}\}/g,        PAGE_WIDTH)
  .replace(/\{\{PHONE\}\}/g,             PHONE)
  .replace(/\{\{EMAIL\}\}/g,             EMAIL)
  .replace(/\{\{LINKEDIN_URL\}\}/g,      LINKEDIN_URL)
  .replace(/\{\{LINKEDIN_DISPLAY\}\}/g,  LINKEDIN_DISPLAY)
  .replace(/\{\{PORTFOLIO_URL\}\}/g,     '#')
  .replace(/\{\{PORTFOLIO_DISPLAY\}\}/g, '')
  .replace(/\{\{LOCATION\}\}/g,          LOCATION)
  .replace(/\{\{SECTION_SUMMARY\}\}/g,       'Professional Summary')
  .replace(/\{\{SUMMARY_TEXT\}\}/g,          SUMMARY)
  .replace(/\{\{SECTION_COMPETENCIES\}\}/g,  'Core Competencies')
  .replace(/\{\{COMPETENCIES\}\}/g,          COMPETENCIES)
  .replace(/\{\{SECTION_EXPERIENCE\}\}/g,    'Experience')
  .replace(/\{\{EXPERIENCE\}\}/g,            EXPERIENCE)
  .replace(/\{\{SECTION_PROJECTS\}\}/g,      'Projects')
  .replace(/\{\{PROJECTS\}\}/g,              PROJECTS)
  .replace(/\{\{SECTION_EDUCATION\}\}/g,     'Education')
  .replace(/\{\{EDUCATION\}\}/g,             EDUCATION)
  .replace(/\{\{SECTION_CERTIFICATIONS\}\}/g,'')   // hide empty section
  .replace(/\{\{CERTIFICATIONS\}\}/g,        '')
  .replace(/\{\{SECTION_SKILLS\}\}/g,        'Technical Skills')
  .replace(/\{\{SKILLS\}\}/g,                SKILLS);

writeFileSync(join(__dir, 'cv-base.html'), filled, 'utf-8');
console.log('✓ cv-base.html written');
console.log('  Upload: gsutil cp job-board-api/cv-base.html gs://career-ops-cvs-0651419186/templates/cv-base.html');
