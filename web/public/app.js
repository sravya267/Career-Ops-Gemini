/* career-ops dashboard — vanilla JS */
'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let allApps = [];
let stats   = {};
let charts  = {};
let currentApp = null;

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  document.getElementById('btn-refresh').addEventListener('click', loadAll);
  document.getElementById('search').addEventListener('input', renderTable);
  document.getElementById('filter-status').addEventListener('change', renderTable);
  document.getElementById('sort-by').addEventListener('change', renderTable);
  document.getElementById('report-close').addEventListener('click', closePanel);
  document.getElementById('overlay').addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
});

async function loadAll() {
  try {
    const [appsRes, statsRes, followupsRes] = await Promise.all([
      fetch('/api/applications'),
      fetch('/api/stats'),
      fetch('/api/followups'),
    ]);
    allApps = await appsRes.json();
    stats   = await statsRes.json();
    const followups = await followupsRes.json();

    renderStatCards();
    renderCharts();
    renderTable();
    renderFollowupBadge(followups);
  } catch (err) {
    console.error('Load error:', err);
  }
}

// ── Stat cards ─────────────────────────────────────────────────────────────
function renderStatCards() {
  set('stat-total',     stats.total ?? 0);
  set('stat-applied',   (stats.byStatus?.applied ?? 0) + (stats.byStatus?.responded ?? 0));
  set('stat-interview', stats.byStatus?.interview ?? 0);
  set('stat-offer',     stats.byStatus?.offer ?? 0);
  set('stat-avg',       stats.avgScore ? `${stats.avgScore}/5` : '—');
  set('stat-pdf',       stats.withPDF ?? 0);
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Follow-up badge ────────────────────────────────────────────────────────
function renderFollowupBadge(data) {
  const badge = document.getElementById('followup-badge');
  const n = (data?.metadata?.overdue ?? 0) + (data?.metadata?.urgent ?? 0);
  if (n > 0) {
    badge.textContent = `${n} follow-up${n > 1 ? 's' : ''} due`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ── Charts ─────────────────────────────────────────────────────────────────
const MOCHA = {
  blue:    '#89b4fa', green:  '#a6e3a1', yellow: '#f9e2af',
  red:     '#f38ba8', peach:  '#fab387', mauve:  '#cba6f7',
  teal:    '#94e2d5', lavender:'#b4befe', surface1:'#45475a',
  subtext0:'#a6adc8',
};

function renderCharts() {
  renderFunnelChart();
  renderScoreChart();
  renderStatusChart();
}

function destroyChart(key) {
  if (charts[key]) { charts[key].destroy(); delete charts[key]; }
}

function renderFunnelChart() {
  destroyChart('funnel');
  const funnel = stats.funnel ?? [];
  const labels = funnel.map(f => capitalize(f.stage));
  const data   = funnel.map(f => f.count);
  const colors = [MOCHA.subtext0, MOCHA.blue, MOCHA.teal, MOCHA.yellow, MOCHA.green];

  charts.funnel = new Chart(document.getElementById('chart-funnel'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderRadius: 4, borderSkipped: false }],
    },
    options: {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: MOCHA.subtext0 }, grid: { color: '#313244' } },
        y: { ticks: { color: MOCHA.subtext0 }, grid: { display: false } },
      },
      animation: { duration: 400 },
    },
  });
}

function renderScoreChart() {
  destroyChart('scores');
  const buckets = stats.buckets ?? [];
  charts.scores = new Chart(document.getElementById('chart-scores'), {
    type: 'bar',
    data: {
      labels: buckets.map(b => b.label),
      datasets: [{
        data: buckets.map(b => b.count),
        backgroundColor: [MOCHA.green, MOCHA.teal, MOCHA.blue, MOCHA.yellow, MOCHA.red],
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: MOCHA.subtext0 }, grid: { display: false } },
        y: { ticks: { color: MOCHA.subtext0, stepSize: 1 }, grid: { color: '#313244' } },
      },
      animation: { duration: 400 },
    },
  });
}

function renderStatusChart() {
  destroyChart('status');
  const byStatus = stats.byStatus ?? {};
  const order  = ['evaluated','applied','responded','interview','offer','rejected','discarded','skip'];
  const palette = [MOCHA.subtext0, MOCHA.blue, MOCHA.teal, MOCHA.yellow, MOCHA.green, MOCHA.red, MOCHA.surface1, MOCHA.surface1];
  const labels = [], data = [], colors = [];

  order.forEach((s, i) => {
    const v = byStatus[s];
    if (v) { labels.push(capitalize(s)); data.push(v); colors.push(palette[i]); }
  });

  // Any unexpected statuses
  Object.entries(byStatus).forEach(([s, v]) => {
    if (!order.includes(s) && v) { labels.push(capitalize(s)); data.push(v); colors.push(MOCHA.mauve); }
  });

  charts.status = new Chart(document.getElementById('chart-status'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#1e1e2e' }] },
    options: {
      plugins: {
        legend: {
          position: 'right',
          labels: { color: MOCHA.subtext0, font: { size: 11 }, padding: 10, boxWidth: 12 },
        },
      },
      animation: { duration: 400 },
    },
  });
}

// ── Table ──────────────────────────────────────────────────────────────────
function renderTable() {
  const query  = document.getElementById('search').value.trim().toLowerCase();
  const status = document.getElementById('filter-status').value;
  const sortBy = document.getElementById('sort-by').value;

  let rows = allApps.slice();

  if (query)  rows = rows.filter(a => (a.company + ' ' + a.role).toLowerCase().includes(query));
  if (status) rows = rows.filter(a => a.status === status);

  rows.sort((a, b) => {
    switch (sortBy) {
      case 'score-desc': return (b.score || 0) - (a.score || 0);
      case 'score-asc':  return (a.score || 0) - (b.score || 0);
      case 'date-desc':  return b.date.localeCompare(a.date);
      case 'date-asc':   return a.date.localeCompare(b.date);
      case 'company-asc':return a.company.localeCompare(b.company);
      case 'status-asc': return statusPriority(a.status) - statusPriority(b.status);
      default: return 0;
    }
  });

  const tbody = document.getElementById('apps-tbody');
  document.getElementById('row-count').textContent = `${rows.length} of ${allApps.length}`;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty">No applications match the current filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(app => `
    <tr data-report="${escHtml(app.reportPath)}" data-company="${escHtml(app.company)}" data-role="${escHtml(app.role)}" data-job-url="${escHtml(app.jobURL || '')}">
      <td>${app.number}</td>
      <td>${app.date}</td>
      <td>
        <div class="company">${escHtml(app.company)}</div>
      </td>
      <td>
        <div class="role">${escHtml(app.role)}</div>
      </td>
      <td class="td-score ${scoreClass(app.score)}">${app.scoreRaw || '—'}</td>
      <td><span class="pill ${pillClass(app.status)}">${escHtml(app.status)}</span></td>
      <td class="td-pdf">${app.hasPDF ? '✅' : '—'}</td>
      <td class="td-archetype">${escHtml(app.archetype || '')}</td>
      <td class="td-tldr" title="${escHtml(app.tldr || '')}">${escHtml(app.tldr || '')}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => openPanel(tr));
  });
}

// ── Report panel ───────────────────────────────────────────────────────────
async function openPanel(tr) {
  const reportPath = tr.dataset.report;
  const company    = tr.dataset.company;
  const role       = tr.dataset.role;
  const jobURL     = tr.dataset.jobUrl;

  document.getElementById('report-title').textContent = `${company} — ${role}`;

  const extLink = document.getElementById('report-link');
  if (jobURL) {
    extLink.href = jobURL;
    extLink.classList.remove('hidden');
  } else {
    extLink.classList.add('hidden');
  }

  document.getElementById('report-body').innerHTML = '<p style="color:var(--subtext0)">Loading…</p>';
  document.getElementById('report-panel').classList.remove('hidden');
  document.getElementById('overlay').classList.remove('hidden');

  if (!reportPath) {
    document.getElementById('report-body').innerHTML = '<p style="color:var(--subtext0)">No evaluation report available for this entry.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/report?p=${encodeURIComponent(reportPath)}`);
    if (!res.ok) throw new Error('Not found');
    const md = await res.text();
    document.getElementById('report-body').innerHTML = marked.parse(md);
  } catch {
    document.getElementById('report-body').innerHTML = '<p style="color:var(--red)">Could not load report.</p>';
  }
}

function closePanel() {
  document.getElementById('report-panel').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
  currentApp = null;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function scoreClass(score) {
  if (!score) return 'score-none';
  if (score >= 4.0) return 'score-high';
  if (score >= 3.0) return 'score-mid';
  return 'score-low';
}

function pillClass(status) {
  const map = {
    evaluated: 'pill-evaluated', applied: 'pill-applied',
    responded: 'pill-responded', interview: 'pill-interview',
    offer: 'pill-offer', rejected: 'pill-rejected',
    discarded: 'pill-discarded', skip: 'pill-skip',
  };
  return map[status] ?? 'pill-default';
}

function statusPriority(s) {
  const order = ['interview','offer','responded','applied','evaluated','skip','rejected','discarded'];
  const i = order.indexOf(s);
  return i === -1 ? 99 : i;
}
