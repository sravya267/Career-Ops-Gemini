// One-time script: generates cv-data.json (structured CV for Gemini tailoring)
// and cv-base.html (visual preview). Upload both to GCS, then run /generate-cvs.
//
//   node job-board-api/prepare-cv-base.mjs
//   gsutil cp job-board-api/cv-data.json gs://career-ops-cvs-0651419186/templates/cv-data.json
//   gsutil cp job-board-api/cv-base.html gs://career-ops-cvs-0651419186/templates/cv-base.html

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const BASE_SUMMARY = 'Fullstack data and analytics professional with 14+ years of end-to-end experience designing scalable data pipelines, deploying predictive and AI/ML models, and translating complex datasets into executive-facing insights. Proven expertise in Python, SQL, PySpark, and cloud platforms (GCP, Azure, AWS), with deep fluency in ETL/ELT architecture, data governance, NLP and LLM-powered automation, and advanced analytics. Experienced leading cross-functional teams and engaging directly with senior business stakeholders to define analytics strategy, implement sophisticated models within existing workflows, and drive measurable business outcomes.';

// ── Structured CV data — used by cv-tailor.mjs for Gemini bullet selection ───

const cvData = {
  name:         'Sravya Thoomu',
  email:        'sthoomu@gmail.com',
  phone:        '(919) 579-8832',
  linkedin:     'linkedin.com/in/sravya-thoomu',
  linkedin_url: 'https://www.linkedin.com/in/sravya-thoomu/',
  location:     'Remote — India',
  base_summary: BASE_SUMMARY,

  competencies: [
    'Data Engineering & ETL', 'Cloud Platforms (GCP · Azure · AWS)', 'Python & PySpark',
    'ML/AI & NLP/LLMs', 'Snowflake & Databricks', 'Apache Airflow',
    'SQL & Analytics', 'Data Governance & Quality', 'Predictive Modeling',
    'Executive Dashboards', 'Cross-functional Leadership', 'Stakeholder Engagement',
  ],

  experience: [
    {
      company: 'Data and Analytics Consultant',
      role:    'Data Engineering & ML/AI · Independent',
      period:  'Dec 2025 – Present',
      context: '',
      bullets: [
        'Designed and built an AI-powered K-2 math worksheet generation application, independently owning the full project lifecycle from requirements through production deployment using Python and FastAPI.',
        'Applied ML algorithms to implement spiral and fluency learning models that adapt to individual student performance data, continuously improving generated content based on learner feedback loops.',
        'Integrated prompt engineering and GenAI-powered automation to dynamically generate differentiated worksheet content, demonstrating practical LLM application skills directly transferable to enterprise workflow automation.',
      ],
    },
    {
      company: 'Jones Lang LaSalle (JLL)',
      role:    'Technical Data Analytics Lead',
      period:  'Dec 2012 – Dec 2025',
      context: 'Fortune 500 Commercial Real Estate',
      bullets: [
        'Led data scientists and engineers across a global Fortune 500 organization, setting technical direction, mentoring team members, and aligning deliverables to business priorities. Received three consecutive VIP Awards.',
        'Partnered with Finance, Operations, and Product leadership to translate ambiguous business problems into analytics solutions, presenting findings and strategy recommendations to executive management.',
        'Facilitated cross-functional governance council meetings to define data contracts, quality standards, and validation checkpoints.',
        'Architected metadata-driven ETL pipelines on Azure integrating 10+ source systems into analysis-ready data marts, significantly reducing manual processing time and outages.',
        'Designed and orchestrated cloud data pipelines using modular Python frameworks across GCP and Azure, managing scheduling, dependency resolution, and failure alerting via Airflow.',
        'Built and optimized Spark and PySpark transformation workflows for large-scale structured and unstructured datasets, with performance tuning and automated end-to-end testing.',
        'Constructed Snowflake and Databricks data warehouse and data lake solutions, enforcing schema standards, data versioning, and downstream analytics support.',
        'Developed and maintained automated Alteryx ETL workflows to standardize data preparation across HR, facilities, and financial source systems.',
        'Delivered a DaVinci Award-winning pipeline automation solution saving $200K+ annually through intelligent orchestration, eliminating manual monitoring and minimizing outages.',
        'Implemented end-to-end validation frameworks across pre-ingestion, post-transformation, and post-load stages, ensuring completeness, business logic compliance, and auditability.',
        'Built executive and operational data quality dashboards with automated alerting providing real-time visibility into data quality metrics.',
        'Developed NLP solutions using large language models trained on internal datasets to automate categorization and sentiment analysis at scale.',
        'Built predictive models for financial market analysis, site attendance forecasting, workspace optimization, and customer segmentation.',
        'Delivered executive dashboards via Tableau and Power BI with KPI frameworks supporting data-driven storytelling for senior leadership.',
      ],
    },
    {
      company: 'Mediamath',
      role:    'Data Science and Engineering Manager',
      period:  'Feb 2015 – Oct 2015',
      context: 'Programmatic Advertising',
      bullets: [
        'Developed Python and R ML models for customer segmentation, behavior prediction, and revenue optimization supporting programmatic advertising campaigns.',
        'Performed advanced time-series forecasting and statistical analysis; implemented automated reporting pipelines for campaign performance across advertiser accounts.',
        'Built batch data pipelines and automated reporting workflows delivering measurable efficiency gains.',
      ],
    },
    {
      company: 'Ford Motor Company',
      role:    'Safety Optimization Analyst',
      period:  'Aug 2010 – Dec 2012',
      context: 'Automotive Engineering',
      bullets: [
        'Developed quantitative mathematical models and optimization algorithms applying regression analysis and sensitivity analysis to complex vehicle safety engineering datasets.',
        'Conducted multivariate trade-off studies to identify optimal design parameters under uncertainty, translating simulation outputs into actionable engineering recommendations.',
        'Built SQL-based data extraction pipelines and R forecasting models for market growth forecasting, price optimization, and demand curve modeling.',
        'Developed segmentation and classification models to identify high-value customer cohorts, improving prediction accuracy for revenue projections.',
        'Automated recurring statistical reporting workflows in R, reducing analyst turnaround time and standardizing outputs.',
      ],
    },
  ],

  education: [
    {
      degree: 'M.S. Machine Learning and Optimization',
      school: 'Clemson University',
      period: '2008 – 2010',
      note:   'Thesis: Design Decisions Under Uncertainty — Applied ML, optimization, and approximation techniques to complex engineering problems. Research Assistant, Automotive Research Center.',
    },
  ],

  skills: {
    'Languages':        'Python (pandas, NumPy, PySpark, scikit-learn, FastAPI, TensorFlow), SQL, R, MATLAB',
    'Cloud':            'GCP, Azure, AWS, Snowflake, Databricks, Cloud Run, Cloud Functions',
    'Data Engineering': 'Apache Airflow, Spark/PySpark, Alteryx, dbt, Fivetran, metadata-driven ETL, batch & real-time pipelines',
    'AI/ML':            'Predictive modeling, time-series forecasting, NLP/LLMs, Hugging Face, clustering, A/B testing, prompt engineering, GenAI',
    'Visualization':    'Tableau, Power BI, Streamlit, Plotly/Dash, D3.js, executive dashboards & KPI frameworks',
    'Governance':       'End-to-end validation frameworks, data contracts, automated quality dashboards, multi-stage ETL governance',
    'Tooling':          'GitHub, Jira, Jupyter, VS Code, Agile, Claude Code, GitHub Copilot, API integration',
  },
};

// ── Write cv-data.json ────────────────────────────────────────────────────────

writeFileSync(join(__dir, 'cv-data.json'), JSON.stringify(cvData, null, 2), 'utf-8');
console.log('✓ cv-data.json written');
console.log('\nUpload to GCS:');
console.log('  gsutil cp job-board-api/cv-data.json gs://career-ops-cvs-0651419186/templates/cv-data.json');
