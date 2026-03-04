/* ═══════════════════════════════════════
   Credit Risk Intelligence System — JS
═══════════════════════════════════════ */

// ── PAGE SWITCH ──────────────────────────────────────────────
function showPage(id, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (navEl) navEl.classList.add('active');
}

// ── GAUGE DRAWING ────────────────────────────────────────────
function drawGauge(pct) {
  const canvas = document.getElementById('gauge');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H - 6, r = H - 18;
  const segs = [
    { f: 0,    t: 0.35, c: '#10b981' },
    { f: 0.35, t: 0.65, c: '#f59e0b' },
    { f: 0.65, t: 1,    c: '#ef4444' }
  ];
  segs.forEach(s => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI + s.f * Math.PI, Math.PI + s.t * Math.PI);
    ctx.lineWidth = 14; ctx.strokeStyle = s.c; ctx.lineCap = 'butt'; ctx.stroke();
  });
  ctx.beginPath(); ctx.arc(cx, cy, r - 16, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  const ang = Math.PI + (pct / 100) * Math.PI;
  const nl = r - 20;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + nl * Math.cos(ang), cy + nl * Math.sin(ang));
  ctx.lineWidth = 2; ctx.strokeStyle = '#1a1a1a'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
  const color = pct < 35 ? '#10b981' : pct < 65 ? '#f59e0b' : '#ef4444';
  const pctEl = document.getElementById('gauge-pct');
  pctEl.style.color = color;
  pctEl.textContent = pct + '%';
  const badge = document.getElementById('gauge-badge');
  if (pct < 35) {
    badge.textContent = '低違約風險 SAFE'; badge.style.borderColor = '#10b981'; badge.style.color = '#10b981';
  } else if (pct < 65) {
    badge.textContent = '中度風險 MODERATE'; badge.style.borderColor = '#f59e0b'; badge.style.color = '#f59e0b';
  } else {
    badge.textContent = '高違約風險 HIGH RISK'; badge.style.borderColor = '#ef4444'; badge.style.color = '#ef4444';
  }
}

// ── RENDER RESPONSE DATA ─────────────────────────────────────
function renderData(d) {
  // Gauge
  drawGauge(d.prob);

  // 自動標籤
  const box  = document.getElementById('auto-label-box');
  const icon = document.getElementById('auto-label-icon');
  const txt  = document.getElementById('auto-label-text');
  const colors = { safe: '#10b981', warn: '#f59e0b', danger: '#ef4444' };
  const icons  = { safe: '◆', warn: '▲', danger: d.prob < 70 ? '●' : '！' };
  const c = colors[d.label_level];
  box.style.borderColor = c; box.style.color = c;
  icon.textContent = icons[d.label_level];
  txt.textContent  = d.label;

  // 主要因子
  const fc = document.getElementById('factors-container');
  fc.innerHTML = '';
  d.factors.forEach(f => {
    const color = f.dir === 'risk' ? '#ef4444' : '#10b981';
    fc.innerHTML += `
      <div class="factor-row">
        <div class="factor-name">${f.name}</div>
        <div class="factor-track"><div class="factor-fill" style="width:${f.w}%;background:${color}"></div></div>
        <div class="factor-pct">${f.w}%</div>
      </div>`;
  });

  // 歷史特徵
  document.getElementById('history-grid').innerHTML = d.history.map(i =>
    `<div class="hist-item"><div class="hist-key">${i.k}</div><div class="hist-val">${i.v}</div></div>`
  ).join('');

  // 象限
  ['hh','hl','ll','lh'].forEach(k =>
    document.getElementById('q-' + k).classList.toggle('active-quad', k === d.quadrant)
  );
  document.getElementById('qdb-title').textContent  = d.quad_info.title;
  document.getElementById('qdb-desc').textContent   = d.quad_info.desc;
  document.getElementById('qdb-action').textContent = d.quad_info.action;
}

// ── COLLECT INPUTS & CALL API ────────────────────────────────
async function updateAll() {
  const limit = +document.getElementById('sl-limit').value;
  const age   = +document.getElementById('sl-age').value;
  const pay   = +document.getElementById('sl-pay').value;
  const hist  = +document.getElementById('sl-history').value;
  const util  = +document.getElementById('sl-util').value;

  // 顯示標籤值
  document.getElementById('val-limit').textContent   = limit.toLocaleString();
  document.getElementById('val-age').textContent     = age;
  document.getElementById('val-history').textContent = hist;
  document.getElementById('val-util').textContent    = util + '%';
  document.getElementById('val-pay').textContent     = pay <= 0 ? '準時' : `逾期${pay}月`;

  const payload = {
    limit, age, pay, hist, util,
    sex: document.getElementById('sl-sex').value,
    edu: document.getElementById('sl-edu').value,
    mar: document.getElementById('sl-marriage').value,
  };

  try {
    const res  = await fetch('/api/risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    renderData(data);
  } catch (err) {
    console.error('API error:', err);
  }
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateAll();
});
