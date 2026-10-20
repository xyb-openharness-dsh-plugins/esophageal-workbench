'use strict';
/* 小咽宝 EsopPal v0.1.0 — 交互原型。患者数据全部为模拟；临床试验列表为真实登记摘录（状态未核实）。
   不读写真实文件、不调用模型或宿主 API。视觉体系沿用家族原型（淋巴瘤 v0.1 → 小畅宝 v0.2 → 小咽宝 v0.1），
   品牌色重映射为小咽宝长春花蓝 #7C83BC（docs/BRIEF.md 2026-10-18：无专属 Logo，先走文字标识 + periwinkle）。

   与胃癌原型的三处结构差异（改前先看，两边不许互相抄）：
   1. 一级页 11 个：SPEC §4 的 10 个 + 脚手架要求的「资料库」（records，Q8）；
   2. 胃癌的「进食与营养」一页拆成两页：「吞咽与进食通路」（怎么吃进去）+「营养支持」（吃了多少），
      E-A9：四癌种中唯一双营养入口，与胃癌 G-A8 刻意相反，不许"统一"掉；
   3. 一图秀默认是体重 + 白蛋白两条数值线 + 吞咽六档分类节点（只画点不连线，E-A7）。 */

const APP_INFO = {
  version: '0.1.0',
  build: '2026-10-21',
  channel: 'prototype',
  channelLabel: '交互原型 · 未接入 DSH'
};
APP_INFO.displayVersion = `v${APP_INFO.version}`;

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidSeq = 0;
const uid = (p) => p + (++uidSeq);

/* ---------------- icons & nav ---------------- */
const icons = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  badge: 'M12 3l7 4v10l-7 4-7-4V7ZM9 12l2 2 4-4',
  drip: 'M12 3v6m0 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM7 7h10',
  /* 胃镜：一根带弯头的软管，用于「胃镜随访」「影像与胃镜」 */
  scope: 'M4 6c6 0 8 3 12 3h4M18 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM8 6v3m4-3v2',
  /* 切除方式：胃形轮廓 + 一条虚线示意切除范围 */
  cut: 'M8 4c0 4 1 5 4 8 2-2 3-3 3-6 0-3-2-4-4-4-1 0-2 1-3 2ZM11 12c0 3-1 5-4 7M4 21h16',
  lab: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10',
  chart: 'M4 3v17h17M7 14l4-5 4 3 5-7',
  leaf: 'M20 4c-9.4 0-15 4.1-15 9.6A5.4 5.4 0 0 0 10.4 19C16 19 20 13.4 20 4ZM5.5 18.6C8 13.4 12 10.6 17 9.6',
  heart: 'M12 20.3c-4.6-2.9-7.4-5.6-7.4-9A4.1 4.1 0 0 1 12 8.4a4.1 4.1 0 0 1 7.4 2.9c0 3.4-2.8 6.1-7.4 9Z',
  calendar: 'M4 5h16v16H4ZM8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2',
  flask: 'M9 3h6v5l5 9a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-9Z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  chat: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-6 5V5ZM8 8h8M8 11h5',
  /* 吞咽与进食通路：食管轮廓 + 一路向下的食团（三点） */
  swallow: 'M9 3c-1.5 3-4 5.5-4 9a4 4 0 0 0 8 0c0-3.5-2.5-6-4-9ZM12 21h1m3 0h1m3 0h1'
};
/* 看板任务卡用的是页面键（records / review / labs），图标表里叫 folder / calendar / lab；
   这里做一次别名，避免拼错键时静默输出 d="undefined" 的空 path（控制台会报 moveto 错误）。 */
const ICON_ALIAS = { records: 'folder', review: 'calendar', labs: 'lab', timeline: 'chart', mind: 'heart', nutrition: 'leaf', treatment: 'drip', subtype: 'badge', trials: 'flask', dashboard: 'home', swallow: 'swallow', prep: 'calendar', scope: 'scope', cut: 'cut' };
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[k] || icons[ICON_ALIAS[k]] || icons.badge}"/></svg>`;

/* 11 个一级页：SPEC §4 的 10 个 + 「资料库」（Q8，家族脚手架要求）。
   顺序照 SPEC：看板 → 资料库 → 我的分型 → 治疗历程 → 吞咽与进食通路 → 检查与指标
   → 一图秀 → 营养支持 → 心理支持 → 复诊准备 → 临床研究。
   「吞咽与进食通路」与「营养支持」并列存在（E-A9），不是重复入口。 */
const PAGES = [
  ['dashboard', '看板', 'home'], ['records', '病情整理', 'folder'], ['subtype', '我的分型', 'badge'],
  ['treatment', '治疗历程', 'drip'], ['swallow', '吞咽与进食通路', 'swallow'], ['labs', '检查与指标', 'lab'],
  ['timeline', '病情一图秀', 'chart'], ['nutrition', '营养支持', 'leaf'], ['mind', '心理支持', 'heart'],
  ['review', '复诊准备', 'calendar'], ['trials', '临床研究', 'flask']
];
const SUBPAGES = {
  records: ['资料库', '整理草稿 / 核对', '病情档案', '指标检测', '病情汇总'],
  subtype: ['病理与分段', '分期与分子', '会诊与二次意见'],
  treatment: ['治疗路径', '疗程与周期', '免疫巩固 / 维持', '手术与吻合口'],
  swallow: ['吞咽自查', '通路档案', '扩张与事件'],
  labs: ['体重与白蛋白', '肿瘤标志物', '影像与内镜'],
  timeline: ['数值曲线', '分类与事件', '数据口径'],
  nutrition: ['进食量记录', '补充剂与医嘱'],
  mind: ['当下感受', '进食社交与形象', '家庭沟通'],
  review: ['复诊节奏', '随访与第二原发监测', '就诊准备'],
  trials: ['2026 线索', '已收藏', '入组问题']
};
const SUBTITLES = {
  dashboard: '吞咽、通路、体重与每一次复查放在一起，让下一次讨论有据可查。',
  records: '上传 → 解析 → 确认指标 → 入库；原件永远保留，接受之前都只是候选。',
  subtype: '病理类型（鳞 / 腺）与部位分段是两个独立事实，分开建档；这里保存原文，不替你解释病理。',
  treatment: '路径三选一（手术 / 根治性放化疗 / 系统治疗），改过的路径留着不覆盖。',
  swallow: '六档自查只描述"能吃什么"；通路与扩张按事实记录，不排利弊、不建议时机。',
  labs: '体重与白蛋白是主线；标志物与影像按报告原文逐次归档。',
  timeline: '体重、白蛋白与吞咽放回同一段时间里，看见变化发生在哪一步。',
  nutrition: '这一页记"吃了多少"——份量、食物、症状；不给食谱也不给剂量。',
  mind: '害怕、疲惫、不想说话都算正常反应；这里的内容默认只属于你。',
  review: '该带什么、该问什么，提前写下来，诊室里就不用凭记忆。',
  trials: '线索不是推荐；先弄清入组条件，再决定要不要问。'
};

/* ---------------- 数据层（由 demo/build-demo-data.mjs 生成；改数据请改生成器重跑） ---------------- */
const D = window.DEMO_DATA;
const PROFILES = {}, METRICS = {}, EVENTS = {}, DASH_KEYS = {}, DOCS = {}, CANDS = {};
for (const [k, p] of Object.entries(D.profiles)) {
  /* 字段逐条显式列出：生成器加字段时这里会同步补，不会静默丢字段。
     食管癌专属：pathway / segment / surgery / swallow / access / dilation / accessEvents /
     nutrition / supplements / monitor / endoscopy（胃癌那套 perioperative/resection/mealLog/
     dumping/peritoneal/hp 不许抄回来）。 */
  PROFILES[k] = { name: p.name, sex: p.sex, age: p.age, meta: p.meta, headline: p.headline, stage: p.stage, mindset: p.mindset,
    molecular: p.molecular, path: p.path, lines: p.lines, cycles: p.cycles, rhythm: p.rhythm,
    pathway: p.pathway || null, segment: p.segment || null, surgery: p.surgery || null,
    swallow: p.swallow || null, access: p.access || null, dilation: p.dilation || null,
    accessEvents: p.accessEvents || null, nutrition: p.nutrition || null,
    supplements: p.supplements || [], monitor: p.monitor || null, endoscopy: p.endoscopy || null,
    viewpoints: p.viewpoints, activity: p.activity, familyTalk: p.familyTalk,
    docs: p.docs || [], candidates: p.candidates || [], pathology: p.pathology || null };
  METRICS[k] = {};
  for (const m of p.metrics) METRICS[k][m.key] = m;
  /* 事件在 demo-data 里是 [日期, 名称] 定长数组；一图秀泳道与时间域都按 {d,label} 读，
     不归一化会让 dataBounds() 拿到 undefined → toISOString 抛 RangeError、整页渲染中断。 */
  EVENTS[k] = (p.events || []).map(e => Array.isArray(e) ? { d: e[0], label: e[1] } : e);
  DASH_KEYS[k] = p.dash_keys;
  /* 资料与候选在 demo-data 里是定长数组（id / 名称 / 日期 / 类型 / 状态），
     必须显式映射：直接展开数组只会得到 0..4 的数字键，页面里读 d.name 全是 undefined。 */
  DOCS[k] = (p.docs || []).map(d => ({ id: d[0], name: d[1], fileName: d[1], date: d[2], type: d[3], status: d[4] }));
  CANDS[k] = (p.candidates || []).map(c => ({ id: c[0], name: c[1], value: c[2], source: c[3],
    status: c[4] === '已接受' ? 'accepted' : 'candidate' }));
}
const TRIALS = D.trials;

/* ---------------- state ---------------- */
/* 一图秀默认：体重 + 白蛋白两条数值线 + 吞咽六档（分类节点，不连线）——Q3 / E-A7。
   进页面先看"吃得好不好、体重掉没掉"，而不是标志物。 */
const state = { view: 'dashboard', profile: 'A', agentOpen: false, agentSize: 'std', sel: ['wt', 'alb', 'swallow'],
  range: 'all', zoom: 100, toggles: { treatment: true, keypoints: true }, pin: null, saved: [], sub: {},
  query: '', parsing: false, parseError: false, loaded: {}, parsingName: '', lastUpload: null, uploads: 0 };
/* 换档案后的默认选择必须与初始状态同构：两条数值线（体重 / 白蛋白）+ 吞咽分类节点。
   只挑数值会把吞咽丢掉，一图秀就退化成两条线，E-A7 的分类节点看不见。 */
const defaultSel = (k) => {
  const num = (DASH_KEYS[k] || []).filter((c) => { const m = METRICS[k][c]; return m && typeof m.points.find(p => typeof p.v === 'number')?.v === 'number'; }).slice(0, 2);
  const mm = METRICS[k] || {};
  const out = num.slice();
  if (mm.swallow && mm.swallow.points.length) out.push('swallow');
  return out.slice(0, 4);
};
const P = () => PROFILES[state.profile];
const M = () => METRICS[state.profile];

/* ---------------- helpers ---------------- */
const fmtDate = (d) => d;
const delta = (m) => {
  if (!m.points || m.points.length < 2) return null;
  const a = m.points[m.points.length - 1], b = m.points[m.points.length - 2];
  if (typeof a.v !== 'number' || typeof b.v !== 'number') return null;
  const d = a.v - b.v;
  return { text: (d > 0 ? '+' : '') + d.toFixed(m.dec ?? 1), up: d > 0, from: b.d };
};
function sparkline(m, w = 200, h = 44) {
  const pts = (m.points || []).filter(p => typeof p.v === 'number');
  if (pts.length < 2) return '';
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (hi === lo) { hi += 1; lo -= 1; }
  const X = i => 4 + (w - 8) * i / (pts.length - 1);
  const Y = v => h - 5 - (h - 10) * (v - lo) / (hi - lo);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const dots = pts.map((p, i) => `<circle class="sp-dot" cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.6" fill="${m.color}"/>`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path class="base" d="M4 ${h - 5}H${w - 4}"/><path class="sp-line" d="${path}" stroke="${m.color}"/>${dots}</svg>`;
}
/* 3D 翻面（24-METRIC-TREND-TAB-DESIGN §5）：点整卡转 180°，再点返回；
   data-flipped 是唯一的视觉开关，aria-pressed 只为兼容旧样式保留；
   两面互换 aria-hidden，隐藏面不进读屏顺序。分类记录（data-static）不翻。 */
function flipCard(key) {
  const el = document.querySelector(`[data-mcard="${key}"]`);
  if (!el || el.dataset.static) return;
  const on = el.dataset.flipped !== 'true';
  el.dataset.flipped = String(on);
  el.setAttribute('aria-pressed', String(on));
  const front = el.querySelector('[data-face="front"]');
  const back = el.querySelector('[data-face="back"]');
  if (front) front.setAttribute('aria-hidden', String(on));
  if (back) back.setAttribute('aria-hidden', String(!on));
}
function mcard(key, m) {
  const last = (m.points || []).slice(-1)[0];
  if (!last) return '';
  const numeric = typeof last.v === 'number' && m.dec !== null;
  const d = delta(m);
  const cat = `<span class="cat"><i style="background:${m.color}"></i>${esc(m.cat)}</span>`;
  if (!numeric) {
    return `<div class="mcard" data-mcard="${key}" data-static="1" role="group" aria-roledescription="指标卡"
      aria-label="${esc(m.name)}：${esc(String(last.v))}（分类记录，只按原文记录，不连折线）">
      <span class="mface front" data-face="front">${cat}<span class="name">${esc(m.name)}</span>
      <span class="na">${esc(last.v)}</span>
      <span class="meta"><span>${esc(last.src)}</span><span class="hint">分类记录</span></span></span></div>`;
  }
  const band = m.band ? `<span class="rec">参考 ${m.band[0]}–${m.band[1]} ${esc(m.unit)}</span>` : `<span class="rec">${esc(last.d)} · ${esc(last.src)}</span>`;
  return `<div class="mcard" role="group" tabindex="0" data-mcard="${key}" data-flipped="false" aria-roledescription="指标卡"
    aria-label="${esc(m.name)} 最近 ${last.v.toFixed(m.dec ?? 1)} ${esc(m.unit)}（${esc(last.d)}）；点一下翻面看趋势">
    <span class="mcard-inner">
    <span class="mface front" data-face="front">${cat}<span class="name">${esc(m.name)}</span>
      <span class="val"><span data-countup="${last.v}" data-dec="${m.dec ?? 1}">${last.v.toFixed(m.dec ?? 1)}</span><small>${esc(m.unit)}</small></span>
      ${d ? `<span class="delta">较上次 <em>${d.text}${m.unit ? ' ' + esc(m.unit) : ''}</em>（${esc(d.from)}）</span>` : ''}
      ${band}</span>
    <span class="mface back" data-face="back" aria-hidden="true">${cat}<span class="name">${esc(m.name)}</span>
      ${sparkline(m, 190, 40)}
      <span class="meta"><span>${esc(m.note)}</span><span class="hint">轻点翻回</span></span></span>
    </span></div>`;
}
/* ---------------- 一图秀引擎（统一画布 · 多序列归一化 · 移植淋巴瘤基因） ---------------- */
const CW = 980, CH = 420, CX0 = 62, CX1 = 954, CY0 = 132, CY1 = 366;
const CAT_ORDER = ['营养', '吞咽与症状', '肿瘤标志物', '血象', '生化', '电解质'];
const fmtNum = (v, dec) => typeof v === 'number' ? v.toFixed(dec ?? 1) : String(v ?? '');
const shortDate = (d) => d.slice(5).replace('-', '.');
const longDate = (d) => d;
const numPts = (m) => (m.points || []).filter(p => typeof p.v === 'number');
const addDays = (d, n) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);

function dataBounds() {
  const ds = [];
  for (const m of Object.values(M())) for (const p of m.points) ds.push(p.d);
  for (const e of (EVENTS[state.profile] || [])) ds.push(e.d);
  ds.sort();
  return [Date.parse(ds[0]), Date.parse(ds[ds.length - 1])];
}
function domain() {
  const [s, e] = dataBounds();
  const months = { '3m': 3, '6m': 6, '12m': 12 }[state.range];
  const start = months ? new Date(new Date(e).setMonth(new Date(e).getMonth() - months)) : new Date(s);
  const span = e - start.getTime();
  const kept = span * state.zoom / 100;
  return [e - kept, e];
}
const inDomain = (d, t0, t1) => { const t = Date.parse(d); return t >= t0 && t <= t1; };
const xOf = (t, t0, t1) => CX0 + (t - t0) / Math.max(1, t1 - t0) * (CX1 - CX0);

/* 单调三次插值（Fritsch-Carlson，同 d3 curveMonotoneX）：
   只平滑折线，且保证曲线段不越过相邻数据点的 y 范围——不会出现"过冲鼓包"式变形 */
function smoothPath(coords) {
  const n = coords.length;
  if (!n) return '';
  if (n === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  const dx = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    const ddx = coords[i + 1].x - coords[i].x;
    dx.push(ddx);
    slope.push(ddx ? (coords[i + 1].y - coords[i].y) / ddx : 0);
  }
  const tan = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) tan.push(0);           // 拐点处切线置平，防鼓包
    else {
      const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
      tan.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])); // 调和加权，保证单调
    }
  }
  tan.push(slope[n - 2]);
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = coords[i].x + dx[i] / 3, c1y = coords[i].y + tan[i] * dx[i] / 3;
    const c2x = coords[i + 1].x - dx[i] / 3, c2y = coords[i + 1].y - tan[i + 1] * dx[i] / 3;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${coords[i + 1].x.toFixed(1)} ${coords[i + 1].y.toFixed(1)}`;
  }
  return d;
}

/* 治疗条：周期带（化疗周期）+ 评估标记（手术/MDT/基线），两行独立于数据区 */
function bandsFor(t0, t1) {
  const p = P(), items = [];
  p.cycles.forEach((c, i) => {
    const from = c[1];
    const to = c[4] && p.cycles[i + 1] ? p.cycles[i + 1][1] : addDays(from, 21);
    items.push({ kind: 'cycle', from, to, label: c[0], color: '#1b4f8a' });
  });
  (EVENTS[state.profile] || []).forEach((e) => {
    if (/手术|MDT|基线/.test(e.label)) items.push({ kind: 'mark', from: e.d, to: e.d, label: e.label, color: e.label.includes('手术') ? '#a03d5c' : '#9a6410' });
  });
  return items.filter((tr) => Date.parse(tr.to) >= t0 && Date.parse(tr.from) <= t1)
    .sort((a, b) => Date.parse(a.from) - Date.parse(b.from))
    .map((tr, lane) => { const s = Math.max(Date.parse(tr.from), t0), e2 = Math.min(Date.parse(tr.to), t1); return { ...tr, x1: xOf(s, t0, t1), x2: xOf(e2, t0, t1), lane }; });
}

function monthTicks(t0, t1) {
  const out = []; const d = new Date(t0); let cur = new Date(d.getFullYear(), d.getMonth(), 1);
  if (cur.getTime() < t0) cur.setMonth(cur.getMonth() + 1);
  while (cur.getTime() <= t1) {
    const x = xOf(cur.getTime(), t0, t1);
    if (x > CX0 + 6 && x < CX1 - 6) out.push({ x, label: `${cur.getMonth() + 1}月` });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  if (out.length > 7) return out.filter((_, i) => i % 2 === 0);
  return out;
}

function seriesFor(code, t0, t1) {
  const m = M()[code];
  if (!m) return null;
  const nums = numPts(m);
  /* 分类序列（吞咽六档 / 每餐份量 / 分级）：没有数值轴，只在图上画节点与档位文字，
     绝不连折线——连线会造出"从软食顺利滑到流食"的假趋势（E-A7 / 口径页）。 */
  if (!nums.length) {
    const lv = SWALLOW_LEVELS.includes(m.points[0] && m.points[0].v) ? SWALLOW_LEVELS : null;
    const pts = (m.points || []).filter((p) => inDomain(p.d, t0, t1));
    let lo = 0, hi = 1;
    if (lv) { lo = 0; hi = lv.length - 1; }
    return { code, m, lo, hi, span: Math.max(hi - lo, 1), pts, qual: true, levels: lv };
  }
  const all = nums.map((p) => p.v);
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || Math.max(Math.abs(hi) * 0.08, 1);
  const pts = nums.filter((p) => inDomain(p.d, t0, t1));
  return { code, m, lo, hi, span, pts, qual: false };
}

function chartSVG(t0, t1) {
  const bands = state.toggles.treatment ? bandsFor(t0, t1) : [];
  const all = state.sel.filter((c) => M()[c]).map((c) => seriesFor(c, t0, t1)).filter((s) => s && s.pts.length);
  if (!all.length) return `<div class="empty"><h3>这个时间窗里没有所选指标</h3><p>扩大时间范围，或在左侧加选一个指标。</p></div>`;
  const series = all.filter((s) => !s.qual);
  const quals = all.filter((s) => s.qual);
  const yOf = (s, v) => CY1 - (v - s.lo) / s.span * (CY1 - CY0);
  const grid = [0, 1, 2, 3, 4].map((i) => { const y = CY0 + i * (CY1 - CY0) / 4; return `<line class="grid" x1="${CX0}" x2="${CX1}" y1="${y}" y2="${y}"/>`; }).join('');

  /* 周期标签两行错位：21 天一格的条宽只有 ~30px，而「dCRT-1」这类标签约 29px，
     单行排下来相邻标签只差 1px，糊成一串。按 labelEnd 记两行末尾，放不下就换行往下 9px。 */
  const labelEnd = [-1e9, -1e9];
  const strip = bands.map((b) => {
    if (b.kind === 'mark') {
      const x = b.x1.toFixed(1), row = 64;
      return `<g><path d="M ${x} ${row - 4} l4 4 -4 4 -4 -4 Z" fill="${b.color}"/>
        <text x="${(+x + 8).toFixed(1)}" y="${row + 3.5}" font-size="9.5" fill="${b.color}" font-weight="600">${esc(b.label)}</text></g>`;
    }
    const w = Math.max(b.x2 - b.x1, 7).toFixed(1);
    const estW = String(b.label).length * 5.4 + 3;
    let row = labelEnd[0] + 4 <= b.x1 ? 0 : 1;
    if (row === 1 && labelEnd[1] + 4 > b.x1) { row = 0; }   // 两行都挤：宁可压一点，也不换第三行
    labelEnd[row] = Math.max(labelEnd[row], b.x1 + estW);
    const ty = 30 - row * 9;
    return `<g><rect x="${b.x1.toFixed(1)}" y="36" width="${w}" height="8" rx="4" fill="${b.color}" opacity=".3"/>
      <text x="${(b.x1 + 1).toFixed(1)}" y="${ty}" font-size="9" fill="${b.color}" font-weight="500">${esc(b.label)}</text></g>`;
  }).join('');

  const markLines = bands.filter((b) => b.kind === 'mark').map((b) =>
    `<line x1="${b.x1.toFixed(1)}" x2="${b.x1.toFixed(1)}" y1="${CY0}" y2="${CY1}" stroke="${b.color}" stroke-width="1.2" stroke-dasharray="3 6" opacity=".45"/>`).join('');

  /* 末点标签：按 y 排序强制最小间距 13px，右端左锚定，防叠字（家族统一规范） */
  const lastPos = series.map((s) => {
    const c = s.pts.map((p) => ({ x: xOf(Date.parse(p.d), t0, t1), y: yOf(s, p.v) }));
    const last = c[c.length - 1];
    return { s, x: last.x, y: last.y, v: s.pts[s.pts.length - 1].v };
  }).sort((a, b) => a.y - b.y);
  let cursor = -Infinity;
  for (const it of lastPos) { it.ly = Math.max(it.y, cursor + 13); cursor = it.ly; }
  const overflow = lastPos.length ? Math.max(0, lastPos[lastPos.length - 1].ly - (CY1 + 2)) : 0;
  if (overflow) for (const it of lastPos) it.ly -= overflow;

  const lines = series.map((s) => {
    const coords = s.pts.map((p) => ({ x: xOf(Date.parse(p.d), t0, t1), y: yOf(s, p.v) }));
    const path = s.pts.length > 1 ? `<path class="line" d="${smoothPath(coords)}" stroke="${s.m.color}" pathLength="1"/>` : '';
    const points = coords.map((c, i) => {
      const p = s.pts[i];
      const isLast = i === s.pts.length - 1;
      const r = isLast ? 5.2 : (i === 0 ? 4.6 : 4);
      const active = state.pin && state.pin.code === s.code && state.pin.date === p.d;
      return `<circle class="pt${active ? ' active' : ''}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="${s.m.color}" data-action="pin" data-code="${s.code}" data-date="${p.d}"/>`;
    }).join('');
    const lp = lastPos.find((x) => x.s === s);
    const nearRight = lp.x > CX1 - 44;
    const lx = nearRight ? lp.x - 8 : lp.x + 8;
    const label = state.toggles.keypoints
      ? `<text class="delta-tag" x="${lx.toFixed(1)}" y="${(lp.ly + 4).toFixed(1)}" text-anchor="${nearRight ? 'end' : 'start'}" fill="${s.m.color}">${fmtNum(lp.v, s.m.dec)}</text>` : '';
    return `<g>${path}${points}${label}</g>`;
  }).join('');

  /* 分类序列：节点画在数据区右半边的一条"档位带"上，纵向按档位序排；
     每个节点带小方块 + 档位文字，节点之间不连线。多条分类序列时横向错开 8px，避免完全重叠。 */
  const qualLayer = quals.map((s, qi) => {
    const lv = s.levels || [];
    const n = Math.max(lv.length - 1, 1);
    return s.pts.map((p) => {
      const x = xOf(Date.parse(p.d), t0, t1) + qi * 8 - 4;
      const idx = Math.max(0, lv.indexOf(p.v));
      const y = CY1 - idx / n * (CY1 - CY0);
      const active = state.pin && state.pin.code === s.code && state.pin.date === p.d;
      return `<g class="qual-pt${active ? ' active' : ''}">
        <rect x="${(x - 4).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" rx="2" fill="${s.m.color}" opacity=".85" data-action="pin" data-code="${s.code}" data-date="${p.d}"/>
        <text x="${(x + 6).toFixed(1)}" y="${(y + 3.2).toFixed(1)}" font-size="8.5" fill="${s.m.color}" font-weight="600">${esc(p.v)}</text></g>`;
    }).join('');
  }).join('');

  const ticks = monthTicks(t0, t1).map((t) => `<line class="axis" x1="${t.x.toFixed(1)}" x2="${t.x.toFixed(1)}" y1="${CY1}" y2="${CY1 + 5}"/><text class="tick" x="${t.x.toFixed(1)}" y="${CY1 + 18}" text-anchor="middle">${t.label}</text>`).join('');
  const rowLabels = state.toggles.treatment
    ? `<text x="6" y="34" font-size="9" fill="#8fa1b5">周期</text><text x="6" y="68" font-size="9" fill="#8fa1b5">评估</text>`
    : '';

  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="所选指标的时序图，共 ${all.length} 条序列（其中 ${quals.length} 条为分类节点）">
    ${grid}${ticks}${markLines}${strip}${rowLabels}${lines}${qualLayer}
    <text class="tick" x="${CX0}" y="${CY1 + 36}">数值线按各自全部记录的最小值–最大值归一化，不代表数值可比；分类序列只画节点、不连线</text>
  </svg>`;
}

const pageHead = (sub) => `<div class="page-head"><div><h1>${esc(PAGES.find(p => p[0] === state.view)[1])}</h1><p>${esc(SUBTITLES[state.view])}</p></div></div>${sub ? `<div class="subnav" role="tablist">${SUBPAGES[state.view].map((s, i) => `<button role="tab" aria-selected="${(state.sub[state.view] || 0) === i}" data-sub="${i}">${esc(s)}</button>`).join('')}</div>` : ''}`;
const row = (b, p, right = '') => `<div class="row"><div class="row-main"><div><b>${b}</b>${p ? `<p>${p}</p>` : ''}</div></div>${right}</div>`;
const pill = (t, c = '') => `<span class="pill ${c}">${esc(t)}</span>`;

/* ---------------- views ---------------- */

/* 吞咽六档（SPEC A4）：从"能吃"到"完全梗阻"固定顺序，页面任何地方都不许重排。
   自查条目一律带「自查」标签；分级本身由内镜/影像评估与医生给。 */
const SWALLOW_LEVELS = ['普食', '软食', '半流', '流食', '水呛', '完全梗阻'];

/* 一刀切的职责边界提示（E-A9）：两个营养入口各写一句常驻，防止用户重复录入。 */
const NUTRI_BOUNDARY = '这一页记「吃了多少」（份量、食物、症状）；「怎么吃进去」（吞咽档位、通路、扩张）在「吞咽与进食通路」页。两页数据不互相复制。';

function vDashboard() {
  const p = P(), m = M();
  const next = p.rhythm[0];
  const alertNext = `<div class="alert-strip"><div><b>下一次节点：${esc(next[0])}</b><p>${esc(next[3])}</p></div><button class="soft" data-action="go-review">看复诊节奏</button></div>`;
  const tasks = [
    ['swallow', '记一次今天能吃什么', '六档自查：普食 / 软食 / 半流 / 流食 / 水呛 / 完全梗阻', 'go-swallow'],
    ['records', '报告看不懂？先理资料', '上传 → 解析 → 核对 → 入库，原件始终保留', 'go-records'],
    ['chat', '和 AI 理一理这一页', '生成可预览的提示词草稿；发送前你确认', 'agent-open'],
    ['review', '准备下次复诊清单', '想问的事 + 我的看法，两区分开导出', 'go-review'],
    ['labs', '本周期的检查结果', '体重、白蛋白与血象已录入', 'go-labs'],
  ].map(t => `<button class="task-entry" data-action="${t[3]}"><span class="entry-icon">${icon(t[0])}</span><b>${t[1]}</b><span>${t[2]}</span><span class="arrow">›</span></button>`).join('');
  const rhythm = `<div class="card"><div class="card-head"><h2>复诊节奏（按 ${esc(p.stage)} 取值）</h2><span class="source-link">以医生安排为准</span></div>
    ${p.rhythm.map(r => row(`<b>${r[0]}</b>`, `${r[1]} — ${r[2]}`, `<small>${esc(r[3])}</small>`)).join('')}
    <p class="small-note">以上为医生安排与常见节奏的摘录，仅供准备讨论；实际安排以你的医生为准。</p></div>`;
  const cards = (DASH_KEYS[state.profile] || []).filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  return `<div class="page-enter">${pageHead()}
  <div class="hero"><div><span class="eyebrow">当前情况</span><h1>${esc(p.headline)}</h1><p>${esc(p.mindset)}</p>
    <div class="actions"><button class="primary" data-action="go-timeline">看病情一图秀</button><button class="soft" data-action="go-swallow">吞咽与进食通路</button><button class="soft hero-ai" data-action="agent-open">${icon('chat')}AI 对话</button></div></div>
    <div class="hero-mascot" aria-hidden="true"><span style="font-size:56px">🫧</span></div></div>
  ${alertNext}
  <div class="intent"><i>✓</i><span>工作台只做<b>记录与整理</b>；诊断、方案调整由医生决定。页面里全部资料为<b>演示数据</b>。</span></div>
  <div class="section-title"><h2>接下来可以做的事</h2></div>
  <div class="task-grid">${tasks}</div>
  <div class="dash-cols"><div class="stack">${swallowCard(m, p)}${rhythm}</div>
  <div class="stack">
    ${nutritionCard(m, p)}
    <div class="card"><div class="card-head"><h2>最近指标</h2><span class="source-link">轻点卡片翻面</span></div>
    <div class="metric-grid">${cards}</div></div></div></div></div>`;
}

/* 吞咽与进食状态卡（SPEC §3：看板首卡）。左边是六档自查，右边是当前在用的通路。
   只呈现"现在能吃什么、靠什么吃"，不判断严重程度、不给通路选择建议。 */
function swallowCard(m, p) {
  const last = (p.swallow && p.swallow.rows[0]) || null;
  const lv = last ? last[1] : null;
  const idx = lv ? SWALLOW_LEVELS.indexOf(lv) : -1;
  const scale = SWALLOW_LEVELS.map((s, i) => `<span class="pill ${i === idx ? 'yellow' : 'grey'}" style="opacity:${idx >= 0 && i > idx ? .55 : 1}">${esc(s)}</span>`).join('');
  const using = ((p.access && p.access.rows) || []).filter(r => r[4]);
  const accessLine = using.length
    ? using.map(r => `<b>${esc(r[0])}</b>（${esc(r[1])} 起）`).join(' ＋ ')
    : '<b>暂无通路记录</b>';
  return `<div class="card accent"><div class="card-head"><h2>吞咽与进食状态</h2><span class="source-link">自查，不是医生评估</span></div>
    <div class="metric-grid">${m.swallow ? mcard('swallow', m.swallow) : ''}${m.meal ? mcard('meal', m.meal) : ''}</div>
    <div class="chips" style="margin:4px 0 12px">${scale}</div>
    ${last ? row(`<b>最近一次自查 · ${esc(last[0])}</b>`, `${esc(lv)}　${esc(last[2])}`, pill(last[3] ? '自查' : '医生记录', last[3] ? 'grey' : 'green')) : row('<b>还没有自查记录</b>', '愿意的时候再记；六档只描述"能吃什么"，不是功能分级。')}
    ${row('<b>当前在用通路</b>', accessLine)}
    <div class="actions"><button class="soft" data-action="go-swallow">看通路档案</button></div></div>`;
}

/* 营养状态卡（食管癌权重最高）：体重 + 白蛋白 + 最近一餐 + 补充剂条数。
   与「吞咽与进食通路」分工：这里只回答"吃了多少"。 */
function nutritionCard(m, p) {
  const meal = (p.nutrition && p.nutrition.rows[0]) || null;
  const sup = (p.supplements || []).length;
  return `<div class="card"><div class="card-head"><h2>营养状态</h2><span class="source-link">体重 + 进食 · 只记不评</span></div>
    <div class="metric-grid">${m.wt ? mcard('wt', m.wt) : ''}${m.alb ? mcard('alb', m.alb) : ''}${m.pa ? mcard('pa', m.pa) : ''}</div>
    ${meal ? row(`<b>最近一餐 · ${esc(meal[0])} ${esc(meal[1])}</b>`, `${esc(meal[2])} · ${esc(meal[3])}；症状：${esc(meal[4])}`) : row('<b>还没有进食量记录</b>', '愿意的时候再记；漏记不催不补。')}
    ${row('<b>在用营养补充</b>', sup ? `${sup} 项，均按医嘱原文记录（无剂量推荐、无品牌推荐）` : '暂无在用补充剂')}
    <div class="actions"><button class="soft" data-action="go-nutrition">去营养支持</button></div></div>`;
}

/* 标志物四态（SPEC A1）：ok 已检测 / na 未检测 / warn 需关注 / pending 待出。
   未检测与待出都不能显示成「阴性」。 */
const MARK_STATE = { ok: ['green', '已检测'], warn: ['yellow', '需关注'], pending: ['violet', '待出'], na: ['grey', '未检测'] };

/* 我的分型 3 页签：病理与分段 / 分期与分子 / 会诊与二次意见。
   E-A1 类型与分段是双主键；E-A2 EGJ 档案必须显示 Siewert 记录位。 */
/* ---------------- 病情整理（资料库 / 整理草稿 / 病情档案 / 指标检测 / 病情汇总） ----------------
   Q8：SPEC §4 只列了 10 个一级页，按家族脚手架补的第 11 个就是这一页。
   链路固定：上传 → 解析 → 确认指标 → 入库；原件永远保留，接受之前都只是候选。
   四条不许越过的线：
     ① 「已接受」只表示转录逐字核对过，不等于医学审核——文案不写「确认无误」；
     ② 解析失败不产生候选，原件留着重试（不留半份草稿）；
     ③ 候选只改状态，不改原文、不覆盖旧版本；
     ④ 病理 / 分段 / 分子是分开的事实，未检测不等于阴性。 */
const fmtSize = (n) => (!n ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const todayISO = () => new Date().toISOString().slice(0, 10);
const DOC_TYPES = ['内镜报告', '病理报告', '影像报告', '化验单', '治疗记录', '营养门诊记录', '其他'];
const DOC_PILL = { 已解析: 'green', 已入库: 'green', 待核对: 'yellow', 解析失败: 'red' };
const CAND_LABEL = { candidate: '待确认', accepted: '已接受' };

function docsTable() {
  const q = (state.query || '').trim().toLowerCase();
  const rows = DOCS[state.profile].filter((d) => !q || `${d.id} ${d.name} ${d.type}`.toLowerCase().includes(q));
  if (!rows.length) return `<p class="small-note" style="margin:0">${q ? '没有匹配的材料；换个词再试。' : '还没有导入任何材料。'}</p>`;
  return `<div class="table-wrap"><table><thead><tr><th>材料</th><th>日期</th><th>类型</th><th>状态</th><th>操作</th></tr></thead><tbody>
    ${rows.map((d) => `<tr>
      <td><b>${esc(d.name)}</b><div class="small-note" style="margin:0">${esc(d.id)}${d.size ? ` · ${fmtSize(d.size)}` : ''}${d.note ? ` · ${esc(d.note)}` : ''}</div></td>
      <td>${esc(d.date)}</td>
      <td>${esc(d.type)}</td>
      <td>${pill(d.status, DOC_PILL[d.status] || 'grey')}</td>
      <td>${d.status === '解析失败'
        ? '<button class="soft" data-action="retry">重试解析</button>'
        : `<button class="source-link" data-action="source" data-doc="${esc(d.id)}">看原件</button>`}</td>
    </tr>`).join('')}
  </tbody></table></div>`;
}

/* 选文件：原型不读真实文件内容，只取文件名 / 大小 / 修改日期做一条演示记录。
   真实版在这里算 sha256 去重（同 subject + sha256 重复导入不重置解析状态）。 */
function ingestFiles(list) {
  const files = Array.from(list || []);
  if (!files.length) return;
  for (const f of files) {
    if (f.size > 40 * 1024 * 1024) { toast(`「${f.name}」超过 40 MB 上限，未导入`); continue; }
    DOCS[state.profile].unshift({
      id: `u${state.uploads + 1}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name, fileName: f.name, size: f.size,
      date: todayISO(), type: '其他', status: '待核对',
      note: '刚导入 · 未解析'
    });
    state.uploads += 1;
    state.lastUpload = DOCS[state.profile][0].id;
  }
  render();
  toast(`已导入 ${files.length} 份材料（演示）；原件不会被改动，解析结果先当候选`);
}

function vRecords() {
  const p = P(), m = M();
  const i = state.sub.records || 0;
  const docs = DOCS[state.profile];
  const cands = CANDS[state.profile];
  const pending = cands.filter((c) => c.status !== 'accepted');
  const groups = CAT_ORDER.map((cat) => ({ cat, codes: Object.keys(m).filter((k) => m[k].cat === cat && m[k].points.length) })).filter((g) => g.codes.length);

  /* 1) 资料库 —— 文件目录列表 + 上传 + 解析状态 */
  const library = `<div class="toolbar">
      <input data-action="records-search" aria-label="搜索材料名称" placeholder="搜索材料名称 / 编号" value="${esc(state.query)}">
      <div class="chips" style="margin:0">${pill(`共 ${docs.length} 份`, 'violet')}${pill(`${pending.length} 项待核对`, pending.length ? 'yellow' : 'grey')}</div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-head"><h2>导入一份材料</h2><span class="source-link">原件保留 · 去重按文件内容</span></div>
      <input id="file-picker" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv,.docx" hidden>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:1 1 220px"><span class="form-label">文件（PDF / 图片 / TXT / MD / Office）</span>
          <button class="soft" data-action="pick-file" style="width:100%">选择本机文件…</button></div>
        <div style="flex:0 1 170px"><span class="form-label">资料类型</span>
          <select id="doc-kind" style="width:100%">${DOC_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></div>
        <button class="primary" data-action="load-report">载入一份示例报告</button>
      </div>
      <p class="small-note">单份上限 40 MB。扫描件 / 图片 / PDF / Office 才需要走云端解析；TXT / MD / CSV 在本机抽取。解析失败时原件仍保留，可重试或手工补录（不会产生半份草稿）。</p>
      ${state.parsing ? '<p class="small-note" style="color:var(--violet-deep)">正在解析…（演示耗时约 1 秒）</p>' : ''}
      ${state.parseError ? '<div class="notice danger">上一份解析失败：<b>没有产生任何候选</b>，原件还在，重试不会重复入库。</div>' : ''}
    </div>
    <div class="card" id="docs-table">${docsTable()}</div>
    <div class="help-box">文件本身存在你选的资料目录 <code>documents/</code> 下，库里只记相对路径与哈希；删掉目录就是删掉资料，工作台不另外藏副本。</div>`;

  /* 2) 整理草稿 / 核对 —— 候选逐条核，接受只写记录不写审核人 */
  const draft = `<div class="flow-steps"><span>原始材料</span><span class="fs-arrow">→</span><span class="on">整理草稿</span><span class="fs-arrow">→</span><span>按需核对</span><span class="fs-arrow">→</span><span>指标 / 病程</span></div>
    <div class="notice violet">草稿里的每一项都要你看过才进档案。<b>核对 ≠ 医学审核</b>；日期不拿导入时间顶替，缺日期时会明确要你填。</div>
    ${pending.length ? '' : `<div class="empty"><h3>没有待核对的草稿</h3><p>导入并解析一份材料后，抽出来的字段先放在这里等你逐项确认。</p></div>`}
    ${cands.length ? `<div class="card"><div class="card-head"><h2>本档案的候选字段</h2><span class="source-link">共 ${cands.length} 项 · 待确认 ${pending.length} 项</span></div>
      <div class="table-wrap"><table><thead><tr><th>项目</th><th>材料中的内容</th><th>来源</th><th>状态</th><th>操作</th></tr></thead><tbody>
        ${cands.map((c) => `<tr>
          <td><b>${esc(c.name)}</b></td>
          <td>${esc(c.value)}</td>
          <td>${esc(c.source)}</td>
          <td>${pill(CAND_LABEL[c.status] || c.status, c.status === 'accepted' ? 'green' : 'yellow')}</td>
          <td>${c.status === 'accepted'
            ? '<span class="small-note" style="margin:0">已接受 · 版本保留</span>'
            : `<button class="ok" data-action="candidate" data-id="${esc(c.id)}">核对这一项</button>`}</td>
        </tr>`).join('')}
      </tbody></table></div>
      <p class="small-note">接受一条只写「记录 + 事实表」，审核人一栏保持空；同名同值重复出现会合并成一条，不会长出两份。</p></div>`
      : ''}`;

  /* 3) 病情档案 —— 病理 / 分段 / 分子分列，未检测单独一栏 */
  const path = p.pathology;
  const mol = (p.molecular || []).map((x) => row(`<b>${esc(x.k)}</b>`, esc(x.v), pill(x.state === 'ok' ? '已出' : '未检测', x.state === 'ok' ? 'green' : 'grey'))).join('');
  const gaps = ((path && path.gaps) || []).map((g) => row(`<b>${esc(g[0])}</b>`, esc(g[1]), pill('缺', 'grey'))).join('');
  /* 分段是独立事实（E-A2）：segment 自带 title 与逐段 rows（颈段 / 胸上 / 胸中 / 胸下 / EGJ / Siewert），
     逐行照抄报告原文；不要用 primary / siewert 这类不存在的字段，否则只剩一个空标题。 */
  const seg = p.segment ? `<div class="section-title" style="margin-top:14px"><h2 style="font-size:14px">${esc(p.segment.title)}</h2><span class="source-link">照内镜 / 影像原文</span></div>
    ${(p.segment.rows || []).map((r) => row(`<b>${esc(r[0])}</b>`, `${esc(r[1])}`, `<small style="max-width:200px;text-align:right">${esc(r[2] || '')}</small>`)).join('')}` : '';
  const profileTab = `<div class="grid two">
      <div class="card"><div class="card-head"><h2>${esc((path && path.title) || '病理')}</h2>${pill((path && path.status) || '未录入', 'violet')}</div>
        ${((path && path.rows) || []).map((r) => row(`<b>${esc(r[0])}</b>`, esc(r[1]))).join('') || row('<b>还没有病理转录</b>', '从病理报告逐项抄写；这里只存原文，不替你解释分型。')}
        ${seg}
        <p class="small-note">鳞癌与腺癌的分型、部位分段、Siewert 类型是三件不同的事，各自按报告原文记录，不互相推导。</p></div>
      <div class="card"><div class="card-head"><h2>分子与免疫组化</h2><span class="source-link">未检测 ≠ 阴性</span></div>
        ${mol || row('<b>还没有分子检测记录</b>', '医生开了才做；没做就写未检测。')}
        <p class="small-note">「未检测」保留原样，不填默认值、不当成阴性；补做与否由医生决定。</p></div>
    </div>
    <div class="card" style="margin-top:14px"><div class="card-head"><h2>这份档案还缺什么</h2><span class="source-link">缺 = 没录入，不代表要补做检查</span></div>
      ${row('<b>病理转录</b>', path ? '已有记录' : '未录入：可从病理报告逐项抄写', pill(path ? '已有' : '缺', path ? 'green' : 'grey'))}
      ${row('<b>资料原件</b>', docs.length ? `已导入 ${docs.length} 份` : '还没有导入材料', pill(docs.length ? '已有' : '缺', docs.length ? 'green' : 'grey'))}
      ${row('<b>待核对候选</b>', pending.length ? `${pending.length} 项等你看过` : '没有待核对内容', pill(pending.length ? '待办' : '已有', pending.length ? 'yellow' : 'green'))}
      ${gaps}
    </div>`;

  /* 4) 指标检测 —— 与一图秀同一套卡片，翻面看参考区间 */
  const metricsTab = `<div class="notice">趋势只呈现记录，不代表疗效、复发或诊断判断。分类指标（吞咽档位、进食感受）只记档位，不做数值比较。</div>
    <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <button class="primary" data-action="add-meal">＋ 手工补录一个值</button>
      <button class="soft" data-action="go-timeline">去一图秀看趋势</button></div>
    ${groups.map((g) => `<div class="metric-group"><div class="metric-group-head"><h3>${esc(g.cat)}</h3><span>${g.codes.length} 项</span></div>
      <div class="metric-grid">${g.codes.map((k) => mcard(k, m[k])).join('')}</div></div>`).join('') || '<div class="empty"><h3>这个档案还没有指标记录</h3><p>导入一份化验单并核对，或手工补录一个值。</p></div>'}
    <div class="help-box">点一张卡原地翻面看最近几次与参考区间；卡片位置和尺寸不变。没有记录的指标不在这里列出，避免「没显示 = 正常」的误读。</div>`;

  /* 5) 病情汇总 —— 只统计数量，不下结论 */
  const accepted = cands.filter((c) => c.status === 'accepted').length;
  const summary = `<div class="notice plain">汇总只回答「记了多少」；不评价控制得好不好，也不预测走向。</div>
    <div class="grid two">
      <div class="card"><div class="card-head"><h2>资料与核对</h2><span class="source-link">本档案</span></div>
        ${row('<b>材料份数</b>', `${docs.length} 份`)}
        ${row('<b>候选字段</b>', `${cands.length} 项 · 已接受 ${accepted} 项`)}
        ${row('<b>待核对</b>', `${pending.length} 项`)}
        ${row('<b>指标项数</b>', `${Object.keys(m).length} 项 · 记录 ${Object.values(m).reduce((n, x) => n + x.points.length, 0)} 个点`)}
      </div>
      <div class="card"><div class="card-head"><h2>下一步能做什么</h2><span class="source-link">自己决定</span></div>
        ${row('<b>继续整理</b>', '把没核对的候选逐条看过', '<button class="source-link" data-action="go-rec-sub" data-sub-i="1">去核对</button>')}
        ${row('<b>看趋势</b>', '体重、白蛋白与吞咽放在同一段时间里', '<button class="source-link" data-action="go-timeline">去一图秀</button>')}
        ${row('<b>准备复诊</b>', '把想问的两三条写在最前面', '<button class="source-link" data-action="go-review">去复诊准备</button>')}
        <p class="small-note">导出只带已接受的事实；未核对的候选不进上下文，也不进导出文件。</p>
      </div>
    </div>`;

  const bodies = [library, draft, profileTab, metricsTab, summary];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

function vSubtype() {
  const p = P();
  const i = state.sub.subtype || 0;
  const matrix = p.molecular.map(x => {
    const [cls, label] = MARK_STATE[x.state] || MARK_STATE.na;
    return `<div class="row"><div class="row-main"><div><b>${esc(x.k)}</b><p>${esc(x.note)}</p></div></div>
      <div style="text-align:right">${pill(label, cls)}<small style="display:block;margin-top:4px">${esc(x.v)}</small><small style="display:block">${esc(x.src)}</small></div></div>`;
  }).join('');
  const seg = p.segment ? `<div class="section-title"><h2>${esc(p.segment.title)}</h2><span class="source-link">逐段记录，不合并</span></div>
    <div class="card">${p.segment.rows.map(r => row(`<b>${esc(r[0])}</b>`, esc(r[1]), `<small style="max-width:200px;text-align:right">${esc(r[2])}</small>`)).join('')}
    <p class="small-note">部位分段与病理类型一起决定治疗路径的方向；EGJ 病例的 Siewert 类型由医生给出，工作台不自动推算。分段结论以胃镜与影像报告原文为准。</p></div>`
    : `<div class="empty"><h3>本档案没有分段记录</h3><p>分段依赖胃镜与影像报告；报告未归档前这里保持空态，不填默认值。</p></div>`;
  const pathology = `<div class="subtype-hero"><div><span class="code">病理与分期档案</span><h2>${esc(p.stage)}</h2><span class="en">${esc(p.path[0])} · 依据：病理报告原件（已归档）</span>
    <div class="subtype-meta">${p.path.map(s => pill(s, 'violet')).join('')}</div></div>
    <div class="path-tree">${p.path.map((s, j) => `<div class="${j === 0 ? 'on' : ''} ${j > 0 ? 'lv' + Math.min(j, 3) : ''}">${esc(s)}</div>`).join('')}</div></div>
    <p class="small-note">病理类型（鳞 / 腺）与部位分段是两个独立事实，分档案保存；不同标本、不同时间的结论分别保留，不用新报告覆盖旧记录。</p>`;
  const stageCard = `<div class="section-title"><h2>分期与分子</h2><span class="source-link">未检测 ≠ 阴性 · 待出 ≠ 阴性</span></div>
    <div class="card">${matrix}
    <p class="small-note">四项标志物各自独立成立：HER2 的 IHC 2+ 属交界，需 FISH 复核；PD-L1 CPS 不同抗体与判读标准的结果不合并；MSI/MMR 与 CLDN18.2 各记各的状态。未检测原样显示"未检测"，在检显示"待出"，都不补成阴性——是否补做与解读由医生判断。</p></div>`;
  const gaps = p.pathology && p.pathology.gaps && p.pathology.gaps.length
    ? `<div class="card"><div class="card-head"><h2>资料缺口</h2><span class="source-link">缺口本身也是一条记录</span></div>
      ${p.pathology.gaps.map(g => row(`<b>${esc(g[0])}</b>`, esc(g[1]))).join('')}
      <p class="small-note">缺口不补默认值：没做的检查就是没做，写清楚比猜一个结果更有用。</p></div>` : '';
  const consult = `<div class="section-title"><h2>会诊与二次意见</h2></div>
    <div class="card">${row('<b>2026-05-26 · 多学科讨论（MDT）</b>', '由「新辅助 + 手术」改为根治性放化疗；讨论结论与医生原话记在「治疗历程 · 治疗路径」。', pill('已存档', 'green'))}
    ${row('<b>2026-06-18 · 营养门诊</b>', '置管与营养补充医嘱；只记医嘱原文，不给食谱与剂量。', pill('已存档', 'green'))}
    ${row('<b>2026-09-16 · 消化内镜</b>', '支架上端狭窄的处理经过；扩张事实记在「吞咽与进食通路 · 扩张与事件」。', pill('已存档', 'green'))}
    <p class="small-note">二次意见不是"换医生"，是带着原件去核对方案；工作台只帮你把材料理好。</p></div>`;
  const bodies = [
    `${pathology}${p.pathology ? `<div class="section-title"><h2>${esc(p.pathology.title)}</h2><span class="source-link">${esc(p.pathology.status)}</span></div>
      <div class="card">${p.pathology.rows.map(r => row(`<b>${esc(r[0])}</b>`, esc(r[1]))).join('')}</div>` : ''}${seg}`,
    `${stageCard}${gaps}`,
    consult
  ];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 治疗历程 4 页签：治疗路径 / 疗程与周期 / 免疫巩固 / 手术与吻合口。
   E-A3：路径三选一，切换只新增不覆盖（既往 + 当前两行并列）。 */
function vTreatment() {
  const p = P();
  const i = state.sub.treatment || 0;
  const pathRows = p.pathway ? p.pathway.rows : [];
  const current = pathRows.find(r => r[0] === '当前') || pathRows[0];
  const past = pathRows.filter(r => r[0] === '既往');
  const pathCard = `<div class="section-title"><h2>${esc(p.pathway ? p.pathway.title : '治疗路径')}</h2><span class="source-link">切换只新增，不覆盖</span></div>
    <div class="plan-card"><div><span class="eyebrow">当前路径</span><div class="big">${esc(current ? current[1] : '—')}<small>${esc(current ? current[2] : '')}</small></div>
      <div class="progress"><i style="width:${Math.round(p.cycles.filter(c => c[4]).length / Math.max(p.cycles.length, 1) * 100)}%"></i></div></div>
      <button class="primary" data-action="go-timeline">与指标对照</button></div>
    ${current ? `<div class="card">${row(`<b>${esc(current[1])}</b>`, `${esc(current[3])}`, pill('当前', 'green'))}
      ${row('<b>医生原话</b>', esc(current[4]))}</div>` : ''}
    ${past.length ? `<div class="section-title"><h2>既往路径（保留原样）</h2><span class="source-link">改路径不是删除历史</span></div>
      <div class="card">${past.map(r => row(`<b>${esc(r[1])}</b>`, `${esc(r[2])}　${esc(r[3])}`, pill('既往', 'grey')) + row('<b>切换原因 / 医生原话</b>', esc(r[4]))).join('')}
      <p class="small-note">路径切换（手术 / 根治性放化疗 / 系统治疗）由医生决定；工作台把"哪天、为什么改"原样留着，方便下次讨论时有据可查。</p></div>` : ''}`;
  const cycles = `<div class="section-title"><h2>疗程与周期</h2><span class="source-link">来自出院小结与输液记录</span></div>
    <div class="table-wrap"><table class="cycle-table"><thead><tr><th>周期</th><th>日期</th><th>用药 / 处理</th><th>状态</th></tr></thead><tbody>
    ${p.cycles.map(c => `<tr class="${c[4] ? 'done' : 'next'}"><td><b>${esc(c[0])}</b></td><td class="num">${esc(c[1])}</td><td>${esc(c[2])}</td><td>${pill(c[3], c[4] ? 'green' : 'violet')}</td></tr>`).join('')}</tbody></table></div>
    <p class="small-note">更正只新增版本，不覆盖旧记录；放疗剂量与分次按放疗计划单原文抄录，本页不推算。</p>`;
  /* 免疫巩固（SPEC E4 / E-A12）：只记周期与起止，不评价疗效。 */
  const consolCycles = p.cycles.filter(c => /巩固|辅助/.test(c[0]));
  const consolidation = `<div class="section-title"><h2>免疫巩固 / 维持期</h2><span class="source-link">只记周期，不评价疗效</span></div>
    ${consolCycles.length ? `<div class="card">${consolCycles.map(c => row(`<b>${esc(c[0])} · ${esc(c[1])}</b>`, esc(c[2]), pill(c[3], c[4] ? 'green' : 'violet'))).join('')}
      <p class="small-note">巩固期的开始与结束时间由医生安排。这一页只记录"打了哪些周期、哪次推迟"，<b>不做疗效评价，也不把"打完几周期"读成"效果更好"</b>——影像与内镜结论在「检查与指标」页按报告原文显示。</p></div>`
    : `<div class="empty"><h3>本档案没有巩固 / 维持期记录</h3><p>巩固期只出现在根治性放化疗或术后辅助路径里；本档案当前路径没有这一阶段，保持空态。</p></div>`}`;
  /* 手术与吻合口（SPEC A3）：术式 / 重建 / 吻合口 / 机构。A 未手术 → 空态。 */
  const surgery = p.surgery ? `<div class="section-title"><h2>${esc(p.surgery.title)}</h2><span class="source-link">术式与重建方式照手术记录原文</span></div>
    <div class="card">${p.surgery.rows.map(r => row(`<b>${esc(r[0])} · ${esc(r[1])}</b>`, `${esc(r[2])}　机构：${esc(r[3])}`, `<small style="max-width:220px;text-align:right">${esc(r[4])}</small>`)).join('')}
    <p class="small-note">吻合口位置与重建方式决定后续吞咽与反流的记录口径；工作台只抄录手术记录，不评价术式选择，也不回答"能不能手术"。</p></div>`
    : `<div class="empty"><h3>本档案未手术</h3><p>该档案走的是根治性放化疗路径（医生在多学科讨论后确定）。手术记录、吻合方式与吻合口相关事件在术后才会出现在这里，因此保持空态，不填默认值。</p></div>`;
  const bodies = [pathCard, cycles, consolidation, surgery];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 吞咽与进食通路 3 页签（食管癌独有的一级页）。
   E-A4 六档自查固定标注；E-A5 通路可并列多条、各带起止、不排利弊；E-A6 扩张只存事实。 */
function vSwallow() {
  const p = P(), m = M();
  const i = state.sub.swallow || 0;
  const rows = (p.swallow && p.swallow.rows) || [];
  const scale = `<div class="card"><div class="card-head"><h2>六档自查量表</h2><span class="source-link">自查，不是医生评估</span></div>
    <div class="chips" style="margin:0 0 6px">${SWALLOW_LEVELS.map((s, j) => `<span class="pill ${j === 0 ? 'green' : j >= 4 ? 'yellow' : 'grey'}">${j + 1}. ${esc(s)}</span>`).join('')}</div>
    <p class="small-note" style="margin:6px 0 0">这六档只描述"现在能吃什么"，不是吞咽功能分级，也不是病情判断。真正影响处理的是内镜 / 影像评估与医生的判断——把这里的记录带去门诊即可。</p></div>`;
  const table = rows.length ? `<div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>档位</th><th>说明</th><th>来源</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${pill(esc(r[1]), r[1] === '完全梗阻' || r[1] === '水呛' ? 'yellow' : 'grey')}</td><td>${esc(r[2])}</td><td>${r[3] ? pill('自查', 'grey') : pill('医生 / 内镜', 'green')}</td></tr>`).join('')}</tbody></table></div>
      <p class="small-note">按时间倒序；<b>自查档位是"你觉得能吃什么"，医生的内镜描述另记一条</b>，两者不互相覆盖。吞咽突然变差时，把最近两条记录一起带给医生，比自己描述更准确。</p>`
    : `<div class="empty"><h3>还没有吞咽自查记录</h3><p>愿意的时候再记；一次只填一个档位，不要求每天填。</p></div>`;
  const accessRows = (p.access && p.access.rows) || [];
  const access = accessRows.length ? `${accessRows.map(r => `<div class="card" style="margin-bottom:10px"><div class="card-head"><h2>${esc(r[0])}</h2>${r[4] ? pill('当前在用', 'green') : pill('已停用', 'grey')}</div>
      ${row('<b>起止</b>', `${esc(r[1])} → ${esc(r[2] || '至今')}`)}
      ${row('<b>医生建议原话</b>', esc(r[3]))}
      ${row('<b>备注</b>', esc(r[5]))}</div>`).join('')}
      <p class="small-note">通路可以并列多条（例如支架 + 经口，或造瘘 + 经口），各自记录起止；<b>这里不给利弊排序、不推荐品牌型号</b>。换通路、拔管、取支架的时机由医生决定。</p>`
    : `<div class="empty"><h3>还没有通路记录</h3><p>经口 / 支架 / 鼻饲 / 胃造瘘 / 空肠造瘘都可以记，起止日期写清即可。</p></div>`;
  const dil = (p.dilation && p.dilation.rows) || [];
  const ev = (p.accessEvents && p.accessEvents.rows) || [];
  const dilationCard = dil.length ? `<div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>次序</th><th>机构</th><th>备注</th></tr></thead><tbody>
      ${dil.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td><small>${esc(r[3])}</small></td></tr>`).join('')}</tbody></table></div>
      <p class="small-note">只存事实：哪天做的、第几次、在哪家机构。<b>不建议扩张时机，也不比较扩张方式</b>——是否再扩、间隔多久由内镜医生判断。</p>`
    : `<div class="empty"><h3>本档案没有扩张记录</h3><p>扩张记录只在发生过时才有条目；空态不代表"不需要"，也不代表"该做"。</p></div>`;
  const eventCard = ev.length ? `<div class="card">${ev.map(r => row(`<b>${esc(r[0])} · ${esc(r[1])}</b>`, esc(r[2]))).join('')}
      <p class="small-note">误吸、呛咳、支架移位、堵管、置管处渗液按发生日期记录并写下处理经过（医生做的）；<b>不判断严重度，也不给处理建议</b>。频繁发生的条目，复诊时优先提出。</p></div>`
    : `<div class="empty"><h3>没有通路相关事件</h3><p>发生时才记；没有记录通常是好事，但不代表可以跳过复诊。</p></div>`;
  const bodies = [
    `${scale}<div class="section-title"><h2>吞咽自查序列</h2><span class="source-link">按时间倒序 · 六档</span></div><div class="card">${table}
      <div class="actions"><button class="primary" data-action="add-swallow">记一次今天能吃什么</button></div></div>`,
    `<div class="notice violet">${esc(NUTRI_BOUNDARY)}</div>
      <div class="section-title"><h2>通路档案</h2><span class="source-link">可并列多条 · 各带起止</span></div>${access}`,
    `<div class="section-title"><h2>扩张记录</h2><span class="source-link">只记事实</span></div><div class="card">${dilationCard}</div>
      <div class="section-title"><h2>通路相关事件</h2><span class="source-link">只记发生与处理经过</span></div>${eventCard}`
  ];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 检查与指标 3 页签：体重与白蛋白 / 肿瘤标志物 / 影像与内镜。
   E-A8：SCC-Ag 只在鳞癌档案出现；腺癌档案这一页不出现该指标（不是显示为空，是根本不渲染）。 */
/* 按类别取一组指标卡（与一图秀同一套 mcard，翻面/分类不连线规则一致）。
   cats 为空表示全部类别；整组没记录时给空态，不渲染空网格。 */
function metricSections(cats) {
  const m = M();
  const list = CAT_ORDER.filter((c) => !cats || cats.includes(c))
    .map((cat) => ({ cat, codes: Object.keys(m).filter((k) => m[k].cat === cat && m[k].points.length) }))
    .filter((g) => g.codes.length);
  if (!list.length) return '<div class="empty"><h3>这一组还没有记录</h3><p>没有记录不是阴性；导入化验单并逐项核对后才会出现在这里。</p></div>';
  return list.map((g) => `<div class="metric-group"><div class="metric-group-head"><h3>${esc(g.cat)}</h3><span>${g.codes.length} 项</span></div>
    <div class="metric-grid">${g.codes.map((k) => mcard(k, m[k])).join('')}</div></div>`).join('');
}

function vLabs() {
  const i = state.sub.labs || 0;
  if (i === 0) return `<div class="page-enter">${pageHead(true)}${metricSections(['营养'])}
    <p class="small-note">体重与白蛋白是食管癌最该盯的两条线（营养不良负担四癌种最重）。同一实验室、同一方法才可比；卡片背面写参考区间与口径，缺失不等于正常。</p></div>`;
  if (i === 1) return `<div class="page-enter">${pageHead(true)}${metricSections(['肿瘤标志物'])}
    <p class="small-note">标志物单次波动不等于病情变化；不同医院的检测方法与参考区间不合并。${M().scc ? 'SCC-Ag 与 CYFRA21-1 是鳞癌常用项，' : '本档案是腺癌，SCC-Ag 不作为常规项，'}标志物本身不足以判断疗效——影像与内镜结论以报告原文为准。</p></div>`;
  const p = P();
  const rows = (p.endoscopy && p.endoscopy.rows) || [];
  return `<div class="page-enter">${pageHead(true)}
    <div class="section-title"><h2>内镜与影像随访</h2><span class="source-link">逐次记录，结论以报告原文为准</span></div>
    <div class="card">${rows.length
      ? rows.map(r => row(`<b>${esc(r[0])} · ${esc(r[1])}</b>`, `${esc(r[2])}${r[3] && r[3] !== '—' ? `　下次：${esc(r[3])}` : ''}`, `<small style="max-width:180px;text-align:right">${esc(r[4] || '')}</small>`)).join('')
      : '<p>本档案暂无内镜与影像记录。</p>'}
      <p class="small-note">胃镜、食管造影、CT 按发生日期逐条归档；工作台<b>不解读影像、不做分期判断</b>，也不把"没查到新病灶"改写成疗效评价。</p></div>
    <div class="section-title"><h2>检查前准备</h2><span class="source-link">以医院要求为准</span></div>
    <div class="card">${row('<b>胃镜</b>', '是否空腹、是否停用抗凝药，按医院内镜中心的要求执行；本页不替代医院告知。')}
      ${row('<b>增强 CT</b>', '是否需要空腹、肾功能与过敏史告知，按影像科要求执行。')}
      <p class="small-note">各家医院要求不同，这里不写统一流程；以预约单与医院告知为准。</p></div></div>`;
}

/* 病情一图秀 3 页签：数值曲线 / 分类与事件 / 数据口径。
   默认序列是体重 + 白蛋白（双数值线）+ 吞咽（分类节点，不连线），见 Q3 / E-A7。 */
function vTimeline() {
  const m = M();
  const i = state.sub.timeline || 0;
  const [t0, t1] = domain();
  const series = state.sel.filter((c) => m[c]).map((c) => seriesFor(c, t0, t1)).filter((s) => s.pts.length);
  const groups = CAT_ORDER.map((cat) => ({ cat, codes: Object.keys(m).filter((k) => m[k].cat === cat) })).filter((g) => g.codes.length);
  const pinData = state.pin && m[state.pin.code] ? m[state.pin.code].points.find((p) => p.d === state.pin.date) : null;
  const [bs, be] = dataBounds();
  const rng = `${shortDate(new Date(bs).toISOString().slice(0, 10))} – ${shortDate(new Date(be).toISOString().slice(0, 10))}`;
  const rangeChips = `<div class="chips" style="margin:0 0 14px" aria-label="时间范围">${[['3m', '近 3 月'], ['6m', '近 6 月'], ['12m', '近 12 月'], ['all', '全期']].map(([k, l]) => `<button class="chip" aria-pressed="${state.range === k}" data-action="range" data-range="${k}">${l}</button>`).join('')}</div>`;
  const rail = `<aside class="rail" aria-label="筛选与指标选择">
      <details class="pick" ${state.sel.length && (typeof window !== 'undefined' && window.innerWidth > 900 ? 'open' : '')}>
        <summary>选择指标 <small>最多 4 个 · 已选 ${state.sel.length}</small></summary>
        <div class="metric-list">
          ${groups.map((g) => `<div class="cat-label">${esc(g.cat)}</div>${g.codes.filter((c) => m[c].points.length).map((c) => `<label class="metric-pick"><input type="checkbox" ${state.sel.includes(c) ? 'checked' : ''} data-pick="${c}"><i style="background:${m[c].color}"></i><span>${esc(m[c].name)}</span><small>${m[c].points.length} 次</small></label>`).join('')}`).join('')}
        </div>
      </details>
      <section><h3>显示</h3>
        <div class="chips">
          <button class="chip" aria-pressed="${state.toggles.treatment}" data-action="toggle" data-key="treatment">治疗节点</button>
          <button class="chip" aria-pressed="${state.toggles.keypoints}" data-action="toggle" data-key="keypoints">末点数值</button>
        </div>
      </section>
      <section><h3>时间窗缩放</h3>
        <div class="zoom"><input type="range" min="40" max="100" value="${state.zoom}" data-action="zoom" aria-label="时间窗缩放"><span>${state.zoom}%</span></div>
        <p class="small-note">右端锚定最新记录；40% 表示只看最近四成时间。</p>
      </section>
      <section><h3>口径</h3><p class="small-note">数值线按该指标全部记录的最小值–最大值归一化，只用于同屏回顾，不能比较不同指标的绝对值；分类序列（吞咽）只画节点，不连线。</p></section>
    </aside>`;
  const chartPanel = `<div class="chart-panel">
        <div class="chart-top">
          <div><h2 style="font-size:15px">${series.length} 条序列 · ${state.range === 'all' ? '全期' : '近 ' + state.range.replace('m', ' 月')}</h2><p class="small-note">点击数据点固定详情；治疗条与数据区分离，不压曲线。</p></div>
          <span class="pill grey">${rng}</span>
        </div>
        <div class="legend">${series.map((s) => `<span><i style="background:${s.m.color}"></i><b>${esc(s.m.name)}</b><span class="range">${s.qual ? '分类节点 · 不连线' : `${fmtNum(s.lo, s.m.dec)}–${fmtNum(s.hi, s.m.dec)} ${esc(s.m.unit)}`}</span></span>`).join('')}</div>
        <p class="scroll-hint small-note">图表可左右滑动</p>
        <div class="chart-wrap">${chartSVG(t0, t1)}</div>
        ${pinData ? `<div class="pin"><div><b>${esc(m[state.pin.code].name)} · ${fmtNum(pinData.v, m[state.pin.code].dec)} ${esc(m[state.pin.code].unit || '')}</b><p>${esc(longDate(pinData.d))} · 来源：${esc(pinData.src)}</p></div><button class="icon-button" data-action="unpin" aria-label="关闭详情">×</button></div>` : ''}
      </div>`;
  const cardGroups = `<div class="section-title"><h2>指标卡片</h2><span class="source-link">点一张卡翻到背面；每张卡互不影响</span></div>
      ${groups.map((g) => `<div class="metric-group"><div class="metric-group-head"><h3>${esc(g.cat)}</h3><span>${g.codes.length} 项</span></div><div class="metric-grid">${g.codes.map((k) => mcard(k, m[k])).join('')}</div></div>`).join('')}`;
  const events = EVENTS[state.profile] || [];
  const bodies = [
    `${rangeChips}<div class="overview">${rail}<div class="timeline-main">${chartPanel}${cardGroups}</div></div>`,
    `<div class="overview">${rail}<div class="timeline-main">
      <div class="section-title"><h2>分类记录</h2><span class="source-link">只按原文记录，不连线</span></div>
      ${groups.filter((g) => g.codes.some((k) => !numPts(m[k]).length)).map((g) => `<div class="metric-group"><div class="metric-group-head"><h3>${esc(g.cat)}</h3><span>${g.codes.filter((k) => !numPts(m[k]).length).length} 项</span></div><div class="metric-grid">${g.codes.filter((k) => !numPts(m[k]).length).map((k) => mcard(k, m[k])).join('')}</div></div>`).join('')
        || '<div class="empty" style="margin-top:0"><p>本档案没有分类记录。</p></div>'}
      <div class="section-title"><h2>治疗与随访事件</h2><span class="source-link">按时间正序</span></div>
      <div class="card">${events.map((e) => row(`<b>${esc(e.d)}</b>`, esc(e.label))).join('')}
        <p class="small-note">事件按日期留痕，不排序重要性，也不从中推导结论。</p></div>
    </div></div>`,
    `<div class="card"><div class="card-head"><h2>这张图怎么读</h2></div>
      ${row('<b>两条数值线</b>', '体重与白蛋白各自按自身全部记录的最小值–最大值拉伸到同一高度，只用于同屏看"什么时候降、什么时候回升"，不能比较两者绝对值。')}
      ${row('<b>吞咽为什么不连线</b>', '六档是分类值，没有数值轴。连成折线会造出"从软食顺利滑到流食"的假趋势；所以只画节点、只标档位。')}
      ${row('<b>治疗节点在下方泳道</b>', '周期条与评估标记与数据区分离，不压曲线；节点只标日期与名称，不评价疗效。')}
      ${row('<b>换医院 / 换方法</b>', '不同来源的结果以来源标注区分，不合并成一条连续曲线。')}
      ${row('<b>缺失不是结果</b>', '某段时间没有点，就是没查；不插值、不补齐、不把空档读成"稳定"。')}
      <p class="small-note">取值范围 ${rng}；右端锚定最新记录。缩放只改变看的时间窗，不改变数值。</p></div>`
  ];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 营养支持（E-A9：与「吞咽与进食通路」并列的第二营养入口，记"吃了多少"）。
   2 页签：进食量记录 / 补充剂与医嘱。整页不给食谱、不给剂量、不推荐品牌。 */
function vNutrition() {
  const m = M(), p = P();
  const i = state.sub.nutrition || 0;
  const rows = (p.nutrition && p.nutrition.rows) || [];
  const mealCard = rows.length ? `<div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期 · 餐次</th><th>份量</th><th>吃了什么</th><th>症状</th><th>备注</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td><b>${esc(r[0])}</b> ${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${r[4] === '无' ? pill('无', 'grey') : pill(esc(r[4]), 'yellow')}</td><td><small>${esc(r[5])}</small></td></tr>`).join('')}</tbody></table></div>
      <p class="small-note">只记餐次、份量与你的原话；不做热量换算、不做食材替换建议、不给食谱——表结构里就没有这些字段，页面也不补。</p>`
    : `<div class="empty"><h3>还没有进食量记录</h3><p>愿意的时候再记；漏记不催不补。默认只记"不寻常的一餐"就够了。</p></div>`;
  const sups = (p.supplements || []);
  const supCard = sups.length ? `${sups.map(r => row(`<b>${esc(r[0])}</b>`, esc(r[1]), `<small>${esc(r[2])}${(r[3] && r[3] !== '—') ? ' → ' + esc(r[3]) : ''} · ${esc(r[4])}</small>`)).join('')}
      <p class="small-note">只显示医嘱原文与起止时间，<b>不给剂量推荐、不推荐品牌</b>；是否调整由医生或营养师决定。</p>`
    : `<div class="empty"><h3>暂无在用补充剂</h3><p>医生开了什么、吃到什么时候，会按医嘱原文记在这里。</p></div>`;
  const bodies = [
    `<div class="notice violet">${esc(NUTRI_BOUNDARY)}</div>
     <div class="section-title"><h2>营养指标</h2><span class="source-link">数值线 · 翻面看参考区间</span></div>
     <div class="card"><div class="metric-grid">${m.wt ? mcard('wt', m.wt) : ''}${m.alb ? mcard('alb', m.alb) : ''}${m.pa ? mcard('pa', m.pa) : ''}${m.ferritin ? mcard('ferritin', m.ferritin) : ''}${m.vitd ? mcard('vitd', m.vitd) : ''}</div>
     <p class="small-note">这些指标与补充剂医嘱是同一条线，但没有"某个数值就该补多少"的对应规则——对应关系由医生判断。</p></div>
     <div class="section-title"><h2>进食量记录</h2><span class="source-link">漏记不催不补 · 只记事实</span></div><div class="card">${mealCard}
     <div class="actions"><button class="primary" data-action="add-meal">记一笔进食量</button></div></div>`,
    `<div class="notice violet">${esc(NUTRI_BOUNDARY)}</div>
     <div class="section-title"><h2>营养补充与管饲医嘱</h2><span class="source-link">医嘱驱动 · 无剂量建议</span></div>
     <div class="card">${supCard}</div>
     <div class="section-title"><h2>体重下降时先做什么</h2></div>
     <div class="card">${row('<b>把最近三条进食记录带上</b>', '份量、食物、吃的时候有没有哽噎或呛咳——这比"最近瘦了"更有用。')}
       ${row('<b>把体重与白蛋白的趋势带上</b>', '一图秀里可以直接截图；同一台秤、同一时间称的数值更可比。')}
       ${row('<b>问清楚要不要转营养门诊</b>', '是否需要管饲、是否调整补充剂由医生或营养师决定；工作台不做这项判断。')}
       <p class="small-note">这一页不提供食谱与剂量，也不推荐任何营养液品牌。</p></div>`
  ];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

/* 心理支持 3 页签：当下感受 / 进食社交与形象 / 家庭沟通。 */
function vMind() {
  const p = P();
  const i = state.sub.mind || 0;
  const feels = p.viewpoints.filter(v => !/进食|社交|形象/.test(v[1]));
  const body = p.viewpoints.filter(v => /进食|社交|形象/.test(v[1]));
  const notice = `<div class="notice violet">这里的内容<b>默认私密</b>：不进导出、不进看板摘要；只有你显式开放时才会出现在就诊材料里。</div>`;
  const bodies = [
    `<div class="card"><div class="card-head"><h2>当下感受</h2>${pill('私密', 'violet')}</div>
      ${feels.map(v => row(`<b>${esc(v[0])} · ${esc(v[1])}</b>`, esc(v[2]), pill('不是医生结论', 'grey'))).join('')}
      <div class="actions"><button class="soft" data-action="add-viewpoint">记一条感受</button></div></div>`,
    `<div class="card"><div class="card-head"><h2>进食社交与形象</h2>${pill('私密', 'violet')}</div>
      ${body.length ? body.map(v => row(`<b>${esc(v[0])}</b>`, esc(v[2]))).join('') : row('<b>暂无记录</b>', '愿意的时候再写；这条只属于你。')}
      <p class="small-note">吃慢了、要汤水送、在外面不敢点菜，这些顾虑在食管癌治疗期很常见；记录只属于你，是否与家人、医生分享由你决定。</p></div>`,
    `<div class="card"><div class="card-head"><h2>想对家人说 / 家庭沟通</h2></div>
      ${row('<b>待沟通</b>', esc(p.familyTalk))}
      <p class="small-note">怎么跟家人说病情、说到什么程度，没有标准答案；这里只留你想说的话。</p></div>`
  ];
  return `<div class="page-enter">${pageHead(true)}${notice}
  <div class="dash-cols"><div class="stack">${bodies[i] || bodies[0]}</div>
  <div class="stack"><div class="card"><div class="card-head"><h2>本周活动</h2></div>
    ${row('<b>活动量</b>', esc(p.activity))}
    <p class="small-note">运动以你能承受的强度为准；是否调整由医生或康复师决定。</p></div></div></div></div>`;
}

/* 复诊准备 3 页签：复诊节奏 / 随访与第二原发监测 / 就诊准备。
   E-A11：第二原发（头颈 / 肺）只记录医生安排，不给患癌风险提示。 */
function vReview() {
  const p = P();
  const i = state.sub.review || 0;
  const rhythm = p.rhythm.map(r => row(`<b>${esc(r[0])}</b>`, `${esc(r[1])} — ${esc(r[2])}`, `<small>${esc(r[3])}</small>`)).join('');
  const mon = (p.monitor && p.monitor.rows) || [];
  const monitorCard = mon.length ? `<div class="card">${mon.map(r => row(`<b>${esc(r[0])}</b>`, `${esc(r[1])}${r[2] && r[2] !== '—' ? `　上次：${esc(r[2])}` : ''}　下次：${esc(r[3])}`, `<small style="max-width:220px;text-align:right">${esc(r[4])}</small>`)).join('')}
    <p class="small-note">第二原发监测（头颈 / 肺）这一栏只抄录医生的安排与原话，<b>不做风险提示、不推导该不该查</b>。没有这一项安排的档案不会出现该行。</p></div>`
    : `<div class="empty"><h3>本档案没有随访安排记录</h3><p>随访间隔由分期、治疗方式与病理结果决定；工作台只记录医生给出的节点。</p></div>`;
  const prep = `<div class="card"><div class="card-head"><h2>这次想问的</h2><span class="source-link">按重要性自己排</span></div>
    ${row('<b>吞咽</b>', '最近一次自查档位；有没有呛咳、有没有突然变差。')}
    ${row('<b>吃饭</b>', '最近三顿吃了多少；体重这两周的变化。')}
    ${row('<b>治疗</b>', '下次治疗日期；这周期有没有推迟、为什么。')}
    ${row('<b>检查</b>', '上次内镜 / CT 的结论原文；下次安排在什么时候。')}
    <p class="small-note">清单只是提示，不用每条都问；把最想问的两三条写在最前面即可。</p></div>
    <div class="card"><div class="card-head"><h2>我的看法（不是医生结论）</h2></div>
    ${(p.viewpoints || []).slice(0, 2).map(v => row(`<b>${esc(v[0])} · ${esc(v[1])}</b>`, esc(v[2]), pill('不是医生结论', 'grey'))).join('') || row('<b>还没有记录</b>', '在「心理支持」里写下的感受会出现在这里。')}
    <p class="small-note">"我的看法"与医生的结论分开保存，导出时也分开；这样讨论时不会把感受当成诊断。</p></div>`;
  const bodies = [
    `<div class="section-title"><h2>复诊节奏</h2><span class="source-link">以医生安排为准</span></div><div class="card">${rhythm}
      <p class="small-note">以上为医生安排与常见节奏摘录，仅供准备讨论；实际安排以你的医生为准。</p></div>`,
    `<div class="section-title"><h2>随访与第二原发监测</h2><span class="source-link">只记医生安排</span></div>${monitorCard}
      <div class="section-title"><h2>已发生的检查</h2><span class="source-link">结论以报告原文为准</span></div>
      <div class="card">${((p.endoscopy && p.endoscopy.rows) || []).map(r => row(`<b>${esc(r[0])} · ${esc(r[1])}</b>`, esc(r[2]), `<small>${esc(r[4] || '')}</small>`)).join('') || '<p>暂无记录。</p>'}
      <p class="small-note">同一份记录在「检查与指标 · 影像与内镜」也可见，两处不各写一份。</p></div>`,
    prep
  ];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

function vTrials() {
  const i = state.sub.trials || 0;
  const list = TRIALS.map(t => `<div class="card" style="margin-bottom:10px"><div class="card-head"><h2>${esc(t.id)}</h2>${pill(t.status, /招募|进行/.test(t.status) ? 'green' : 'grey')}</div>
    ${row(`<b>${esc(t.title)}</b>`, `${esc(t.phase)} · ${esc(t.sponsor)}`, `<a class="source-link" href="${esc(t.url)}" target="_blank" rel="noopener">登记页</a>`)}</div>`).join('');
  const saved = state.saved.length ? state.saved.map(id => { const t = TRIALS.find(x => x.id === id); return t ? `<div class="card" style="margin-bottom:10px">${row(`<b>${esc(t.id)}</b>`, esc(t.title), `<a class="source-link" href="${esc(t.url)}" target="_blank" rel="noopener">登记页</a>`)}</div>` : ''; }).join('') : `<div class="empty"><h3>还没有收藏</h3><p>在看线索时点"收藏"，会留在这里，方便复诊前一起看。</p></div>`;
  const qs = ['我的病理类型（鳞 / 腺）和分段，是否影响这条试验的入组条件？', '这条试验要求既往治疗到什么程度？我现在符合吗？', '如果参加，随访地点和频率对我的生活影响有多大？', '不参加的话，标准治疗是什么？两者我该怎么权衡？'];
  const bodies = [
    `<div class="notice">线索不是推荐：下面 ${TRIALS.length} 条来自 2026 年首次公示的真实登记摘录，<b>状态为登记状态，未核实、也不等于入组资格</b>。</div>${list}`,
    saved,
    `<div class="card"><div class="card-head"><h2>入组前该问的问题</h2><span class="source-link">按顺序问，不跳步</span></div>
      ${qs.map(q => row(`<b>${esc(q)}</b>`, ''))}
      <p class="small-note">工作台不排序、不预测、不替你判断哪条更好；是否入组由研究团队评估与你自己决定。</p></div>`
  ];
  return `<div class="page-enter">${pageHead(true)}${bodies[i] || bodies[0]}</div>`;
}

const VIEWS = { dashboard: vDashboard, records: vRecords, subtype: vSubtype, treatment: vTreatment, swallow: vSwallow, labs: vLabs, timeline: vTimeline, nutrition: vNutrition, mind: vMind, review: vReview, trials: vTrials };

/* ---------------- agent dock（dsh 原生会话挂载位） ---------------- */
const FORBIDDEN = ['建议治疗', '可能复发', '预后良好', '治愈率', '可以停药', '无需就医', '推荐方案', '生存率'];
const PAGE_CONTEXT = {
  dashboard: () => ({ facts: [`${P().name}：${P().headline}`,
    P().swallow ? `最近一次吞咽自查：${P().swallow.rows[0][1]}（${P().swallow.rows[0][0]}）` : '暂无吞咽自查',
    `当前在用通路：${((P().access && P().access.rows) || []).filter(r => r[4]).map(r => r[0]).join('、') || '未记录'}`],
    missing: ['下次复查的具体日期', '最近的进食量记录'] }),
  records: () => ({ facts: [`资料库 ${DOCS[state.profile].length} 份；待核对候选 ${CANDS[state.profile].filter(c => c.status !== 'accepted').length} 条`], missing: [] }),
  subtype: () => ({ facts: [`病理类型：${P().path[0]}；分段：${P().path[1]}；分期：${P().stage}`,
    ...P().molecular.map(x => `${x.k}：${x.v}（${x.src}）`)],
    missing: P().molecular.filter(x => x.state === 'na').map(x => `${x.k} 检测状态`) }),
  treatment: () => ({ facts: (P().pathway ? P().pathway.rows : []).map(r => `${r[0]}路径：${r[1]}（${r[2]}）`), missing: ['下次评估的具体结论'] }),
  swallow: () => ({ facts: (P().swallow ? P().swallow.rows.slice(0, 3) : []).map(r => `${r[0]} 吞咽：${r[1]}`),
    missing: ['最近一次内镜的原文结论'] }),
  labs: () => ({ facts: Object.values(M()).filter(m => m.points && m.points.length).map(m => `${m.name} 最近：${String(m.points.slice(-1)[0].v)}（${m.points.slice(-1)[0].d}）`),
    missing: [M().scc ? 'SCC-Ag 与影像的对照结论' : 'CLDN18.2 检测结果（外送中）'] }),
  timeline: () => ({ facts: ['一图秀当前勾选：' + state.sel.map(k => M()[k].name).join('、')], missing: [] }),
  nutrition: () => ({ facts: (P().nutrition ? P().nutrition.rows.slice(0, 3) : []).map(r => `${r[0]} ${r[1]}：${r[2]}，${r[3]}，症状：${r[4]}`),
    missing: ['营养门诊的下一次安排'] }),
  mind: () => ({ facts: ['本页内容默认私密，提示词不携带具体感受原文'], missing: [] }),
  review: () => ({ facts: P().rhythm.map(r => `${r[0]}：${r[1]}（${r[2]}）`), missing: ['想问清单中 1 条待确认'] }),
  trials: () => ({ facts: ['2026 线索共 ' + TRIALS.length + ' 条（真实登记摘录，状态未核实）'], missing: [] })
};

function buildPrompt() {
  const ctx = PAGE_CONTEXT[state.view]();
  const title = PAGES.find(p => p[0] === state.view)[1];
  return [`【来自小咽宝工作台 · ${title}页】`, `档案：${P().name}（${P().meta}）——演示数据`, '',
    '本页已核对的事实：', ...ctx.facts.map(f => '- ' + f), '',
    '尚未核对 / 待确认：', ...(ctx.missing.length ? ctx.missing.map(f => '- ' + f) : ['- （无）']), '',
    '边界：以上是记录整理，不是医疗建议；请基于原文与医生沟通，不要求工作台外推结论。'].join('\n');
}
function mockReply() {
  return '根据你整理的本页事实：这些记录显示治疗在按计划推进，监测节奏也有依据。你提到的未确认事项（未检测标志物、下次影像日期），适合在下次门诊清单里逐条向医生确认。本回复不构成医疗建议。';
}
function renderAgent() {
  const dock = $('#agent-dock'), grid = $('#work-grid'), btn = $('#agent-toggle');
  dock.hidden = !state.agentOpen;
  grid.classList.toggle('agent-open', state.agentOpen);
  grid.classList.toggle('agent-wide', state.agentOpen && state.agentSize === 'wide');
  btn.setAttribute('aria-expanded', String(state.agentOpen));
  $('#agent-state').textContent = state.agentOpen ? '已打开' : '未进入激活';
  $('#agent-toggle i').classList.toggle('grey', !state.agentOpen);
  $('#agent-toggle i').classList.toggle('on', state.agentOpen);
  $('#agent-dot').classList.toggle('on', state.agentOpen);
  $$('.agent-sizes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === state.agentSize)));
  const body = $('#agent-body');
  if (!body.dataset.built) {
    body.innerHTML = `<div class="agent-note"><b>dsh 原生会话挂载位</b><br>原生会话仅在 DSH Desktop 内可用；当前为浏览器预览，这里保留宿主会话的挂载点（#dsh-conversation-slot），不模拟聊天窗口。</div>
      <div id="dsh-conversation-slot" aria-live="polite"></div>`;
    body.dataset.built = '1';
  }
}
function agentBuild() {
  const slot = $('#dsh-conversation-slot');
  slot.innerHTML = `<div class="agent-card"><h4>提示词预览（发送前可读 · 由你在宿主会话发送）</h4><pre>${esc(buildPrompt())}</pre></div>`;
}
function agentDemo() {
  const slot = $('#dsh-conversation-slot');
  const text = mockReply();
  const hits = FORBIDDEN.filter(w => text.includes(w));
  slot.innerHTML = `<div class="agent-card"><h4>模拟回复 · 红线自检</h4><pre>${esc(text)}</pre>
    <div class="agent-check">${hits.length ? hits.map(h => `<span class="hit">命中禁用词：${esc(h)}</span>`).join('') : '<span class="pass">✓ 未命中禁用词表（' + FORBIDDEN.length + ' 项）</span><span class="pass">✓ 免责语句在否定语境中出现</span>'}</div></div>`;
}

/* ---------------- dialogs / toast ---------------- */
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('visible'), 2200); }
function openDialog(eyebrow, title, body, foot = '') {
  $('#dialog-eyebrow').textContent = eyebrow; $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = body; $('#dialog-foot').innerHTML = foot;
  $('#dialog').showModal();
}
const closeDialog = () => $('#dialog').close();

function dlgProfiles() {
  openDialog('小咽宝', '切换演示档案', Object.entries(PROFILES).map(([k, p]) => `
    <button class="profile-row ${state.profile === k ? 'on' : ''}" data-pick-profile="${k}">
      <div><b>${esc(p.name)}的资料</b><p>${esc(p.meta)} · ${esc(p.headline)}</p></div><span class="profile-caret">${state.profile === k ? '当前' : '切换'}</span></button>`).join(''),
    '<button data-action="close">取消</button>');
}
function dlgSettings() {
  openDialog('小咽宝', '设置', `<div class="cfg-tabs" role="tablist">
  <button role="tab" aria-selected="true" data-action="cfg-tab" data-tab="ws">资料目录</button><button role="tab" aria-selected="false" data-action="cfg-tab" data-tab="parse">文档解析</button><button role="tab" aria-selected="false" data-action="cfg-tab" data-tab="kb">临床数据库</button></div>
  <div class="cfg-block" style="margin-top:16px" data-tab="ws"><h3>工作区资料目录</h3><div class="path-row"><code>~/Documents/EsopPalWorkspace（演示值）</code><button class="soft">选择…</button></div>
  <p class="small-note">患者数据只存入你明确选择的目录；工作台不把资料上传云端。</p></div>
  <div class="cfg-block" style="margin-top:12px" data-tab="parse" hidden><h3>文档解析（MinerU）</h3><div class="token-row"><code class="masked">MINERU_TOKEN 已配置（掩码：mr-****）</code></div>
  <p class="small-note">Token 只存本机 .secrets/（mode 600）；解析结果永远是候选，核对后才入档。</p></div>
  <div class="cfg-block" style="margin-top:12px" data-tab="kb" hidden><h3>2026 临床数据库</h3><div class="path-row"><code>esophageal_cancer_trials_2026.sqlite · 200 条（演示）</code></div>
  <p class="small-note">离线快照；中国注册库未采集，覆盖未知。</p></div>`, '<button class="primary" data-action="close">完成</button>');
}
function dlgAbout() {
  openDialog('小咽宝', '关于', `<div class="about"><div class="brand no-mark" style="zoom:2.2"></div><div class="about-meta">
    <div class="about-ver"><b>v${APP_INFO.version}</b>${pill(APP_INFO.channelLabel, 'violet')}</div>
    <dl><div><dt>构建</dt><dd>${APP_INFO.build}</dd></div><div><dt>形态</dt><dd>交互原型（单机多文件）· 全部患者数据为模拟</dd></div>
    <div><dt>数据</dt><dd>2026 临床试验：真实登记摘录（ClinicalTrials.gov），状态未核实</dd></div>
    <div><dt>家族</dt><dd>小 X 宝家族 · EsopPal 小咽宝</dd></div></dl></div></div>`, '<button class="primary" data-action="close">关闭</button>');
}
function dlgHelp() {
  openDialog('小咽宝', '原型操作说明', `<div class="cfg-block">顶栏「AI 对话」按钮打开右侧<b>原生会话挂载位</b>（可 × 隐藏、窄/标准/宽三档）。「整理本页要点」生成发送前可读的提示词；「模拟回复自检」演示文本层红线扫描。</div>
  <div class="cfg-block" style="margin-top:12px">「检查与指标」「看板」里的数值卡<b>轻点翻面</b>看参考区间；分类记录（吞咽档位、每餐份量、进食感受）不翻面、不连线。「病情一图秀」左侧可勾选指标、拖动缩放。</div>
  <div class="cfg-block" style="margin-top:12px">左上角头像可切换<b>两个演示档案</b>：沈志远（胸中段鳞癌 Ⅲ 期 · 根治性同步放化疗 + 免疫巩固 · 食管支架在置）、顾晓兰（EGJ 腺癌 Siewert Ⅱ · Ivor Lewis 术后 · FLOT 辅助化疗中）。</div>`, '<button class="primary" data-action="close">知道了</button>');
}
function dlgExport() {
  const p = P();
  const md = ['# 复诊准备（演示导出）', '', `档案：${p.name}（${p.meta}）`, '', '## 事实区（已核对）', ...p.rhythm.map(r => `- ${r[0]}：${r[1]}（${r[2]}）`), '', '## 想问的事 / 我的看法（不是医生结论）', '- （按页面勾选结果导出；私密条目默认不含）', '', '> 本文件由工作台整理，不构成医疗建议。'].join('\n');
  openDialog('小咽宝', '导出编辑（Markdown）', `
    <textarea id="export-edit" aria-label="导出内容，可直接编辑" style="width:100%;min-height:320px;font:12px/1.7 ui-monospace,SFMono-Regular,monospace;padding:12px;border:1px solid #d8e0ea;border-radius:10px;background:#fff;color:#213139;resize:vertical">${esc(md)}</textarea>
    <p class="small-note">直接在上方编辑；「我的看法」区永远带"不是医生结论"标注。保存到资料目录的是编辑后的全文。</p>`,
    '<button class="soft" data-action="close">取消</button><button class="primary" data-action="export-save">保存到资料目录</button>');
}

/* ---------------- render root ---------------- */
/* 数字刷动：渲染后从 0 滚动到目标值（easeOutCubic，650ms；reduced-motion 直接显示终值） */
function animateCountups(root) {
  if (!root || typeof root.querySelectorAll !== 'function' || typeof requestAnimationFrame !== 'function') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const DUR = 650;
  root.querySelectorAll('[data-countup]').forEach((el) => {
    const target = parseFloat(el.dataset.countup);
    if (!isFinite(target)) return;
    const dec = el.dataset.dec === undefined ? 1 : +el.dataset.dec;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / DUR);
      const ease = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * ease).toFixed(dec);
      if (k < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec);
    };
    el.textContent = (0).toFixed(dec);
    requestAnimationFrame(step);
  });
}

function render() {
  const p = P();
  $('#nav').innerHTML = PAGES.map(([id, label, ic]) => {
    const count = id === 'trials' ? TRIALS.length : null;
    return `<button class="nav-button" data-nav="${id}" ${state.view === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(label)}</span>${count ? `<span class="nav-count">${count}</span>` : ''}</button>`;
  }).join('');
  $('#breadcrumb').textContent = PAGES.find(x => x[0] === state.view)[1];
  $('#profile-name').textContent = `${p.name}的资料`;
  $('#profile-meta').textContent = p.meta;
  $('#profile-avatar').textContent = p.name[0];
  $('#main').innerHTML = (VIEWS[state.view] || vDashboard)();
  $('#main').classList.remove('page-enter');
  animateCountups($('#main'));
  renderAgent();
  if (state.agentOpen) $('#agent-body').dataset.built = ''; // 换页后重建挂载位提示
}

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { state.view = nav.dataset.nav; location.hash = state.view; render(); $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); return; }
  const sub = e.target.closest('[data-sub]');
  if (sub) { state.sub[state.view] = +sub.dataset.sub; render(); return; }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    const k = pick.dataset.pick;
    if (pick.checked) {
      if (state.sel.length >= 4) { pick.checked = false; toast('最多同时看 4 个指标；取消一个再加。'); return; }
      if (!state.sel.includes(k)) state.sel.push(k);
    } else {
      if (state.sel.length === 1) { pick.checked = true; toast('至少留一个指标。'); return; }
      state.sel = state.sel.filter(x => x !== k);
    }
    render(); return;
  }
  const pp = e.target.closest('[data-pick-profile]');
  if (pp) { state.profile = pp.dataset.pickProfile; state.sel = defaultSel(pp.dataset.pickProfile); state.pin = null; closeDialog(); render(); toast(`已切换到 ${P().name}的资料（演示）`); return; }
  const card = e.target.closest('.mcard[data-mcard]');
  if (card && !card.dataset.static) { flipCard(card.dataset.mcard); return; }
  const act = e.target.closest('[data-action]')?.dataset.action;
  if (!act) return;
  const map = {
    profiles: dlgProfiles, settings: dlgSettings, about: dlgAbout, help: dlgHelp,
    close: closeDialog, 'open-store': () => toast('资料目录已激活（演示）'),
    'go-review': () => { state.view = 'review'; location.hash = 'review'; render(); },
    'go-labs': () => { state.view = 'labs'; location.hash = 'labs'; render(); },
    'go-timeline': () => { state.view = 'timeline'; location.hash = 'timeline'; render(); },
    'go-subtype': () => { state.view = 'subtype'; location.hash = 'subtype'; render(); },
    'go-trials': () => { state.view = 'trials'; location.hash = 'trials'; render(); },
    'go-records': () => { state.view = 'records'; location.hash = 'records'; render(); },
    'go-rec-sub': (el) => { state.view = 'records'; state.sub.records = +el.dataset.subI; location.hash = 'records'; render(); },
    'go-nutrition': () => { state.view = 'nutrition'; location.hash = 'nutrition'; render(); },
    'go-swallow': () => { state.view = 'swallow'; location.hash = 'swallow'; render(); },
    source: (el) => {
      const d = el.dataset.doc ? DOCS[state.profile].find((x) => x.id === el.dataset.doc) : null;
      const line = d ? `${d.fileName || d.name}${d.size ? ` · ${fmtSize(d.size)}` : ''}（${d.date}）` : el.dataset.source || '';
      openDialog('小咽宝', '原文出处', `<p style="font-size:12.5px">${esc(line)}</p><p class="small-note">原件存放在你选的资料目录 imports/ 下；工作区不改动原文，也不替你解释它。</p>`, '<button class="primary" data-action="close">关闭</button>');
    },
    'pick-file': () => { const inp = $('#file-picker'); if (inp && typeof inp.click === 'function') inp.click(); else toast('当前浏览器不支持选择本机文件'); },
    'export-save': () => {
      const ta = $('#export-edit');
      const txt = ta ? ta.value.trim() : '';
      if (!txt) { toast('导出内容是空的；先填一点内容再保存。'); return; }
      const docs = DOCS[state.profile];
      docs.unshift({ id: 'ex' + Date.now().toString(36), name: `复诊准备 · ${P().name} · ${todayISO()}`, fileName: `复诊准备-${todayISO()}.md`, size: new Blob([txt]).size, date: todayISO(), type: '其他', status: '待核对', note: '生成文件 · 由导出创建，可在草稿里核对' });
      closeDialog();
      toast('已保存到资料目录 exports/（演示）；在「病情整理 · 资料库」可见');
    },
    'load-report': () => {
      if (state.parsing) return;
      if (state.loaded[state.profile]) { toast('模拟报告已载入，没有重复新增'); return; }
      state.parsing = true; state.parseError = false; render();
      setTimeout(() => {
        DOCS[state.profile].push({ id: 'dx' + state.profile, name: '复查记录 · 新模拟报告', date: '2026-10-18', type: '其他', status: '待核对' });
        CANDS[state.profile].push({ id: 'cx' + state.profile, name: '下次随访安排', value: '2027-01 前后（示例，以医生安排为准）', source: '复查记录 · 新模拟报告 · 第 1 页', status: 'candidate' });
        state.loaded[state.profile] = true; state.parsing = false;
        if (state.view === 'records') render();
        toast('解析完成：候选已放入「整理草稿 / 核对」');
      }, 900);
    },
    'parse-fail': () => {
      const d = DOCS[state.profile].find((x) => x.id === state.lastUpload);
      if (d) d.status = '解析失败';
      state.parseError = true; render();
      toast(d ? `「${d.name}」解析失败：未产生候选，原件保留，可重试` : '模拟解析失败：未产生候选，原件保留');
    },
    retry: () => { state.parseError = false; toast('模拟重试完成；原件始终保留'); render(); },
    candidate: (el) => {
      const c = CANDS[state.profile].find((x) => x.id === el.dataset.id);
      if (!c) return;
      openDialog('小咽宝', '核对这一项内容',
        `<div class="notice">核对表示"转录已逐字检查过"，不等于医学审核。</div>
        <label style="display:block;margin-top:10px"><span class="form-label">${esc(c.name)}</span><input id="cand-input" style="width:100%" value="${esc(c.value)}" maxlength="160"></label>
        <p class="small-note">来源：${esc(c.source)}。暂时不确定就保留待核对状态，不会丢。</p>`,
        `<button class="soft" data-action="close">现在先不核对</button><button class="primary" data-action="cand-save" data-id="${esc(c.id)}">接受这条记录</button>`);
    },
    'cand-save': (el) => {
      const c = CANDS[state.profile].find((x) => x.id === el.dataset.id);
      const v = $('#cand-input') ? $('#cand-input').value.trim() : '';
      if (c && v) { c.value = v; c.status = 'accepted'; }
      closeDialog(); render(); toast('已接受：写入演示数据库（record + 事实表），候选留版本不覆盖');
    },
    'add-review-question': () => {
      const q = state.profile === 'A' ? '请帮我核实：病理报告的脉管 / 神经侵犯结论，以及 CLDN18.2 有没有必要补做。' : '请帮我核实：MDT-2 影像评估的腹膜病灶范围与结论原文，以及 CLDN18.2 检测结果。';
      state.questions = state.questions || [];
      if (!state.questions.includes(q)) state.questions.push(q);
      render(); toast('已加入复诊准备的问题清单');
    },
    'add-swallow': () => { state.view = 'swallow'; state.sub.swallow = 0; location.hash = 'swallow'; render(); toast('六档自查只描述"能吃什么"，不是功能分级'); },
    'add-meal': () => toast('原型内不落库；真实版在这里记一笔进食（餐次 / 份量 / 症状）'),
    'add-viewpoint': () => toast('感受会记为"一条信息"，标注不是医生结论'),
    'add-line': () => toast('新增治疗线需核对方案原件后建立'),
    'export-nutrition': () => toast('就诊展示：最近 10 条进食记录 + 在用补充剂（演示）'),
    'export-review': dlgExport,
    'toggle-ask': (el) => { el.textContent = el.textContent.includes('✓') ? '标记已问' : '已问过 ✓'; },
    'save-trial': (el) => { const id = el.closest('[data-action]').dataset.id ?? el.dataset.id; if (state.saved.includes(id)) { state.saved = state.saved.filter(x => x !== id); } else state.saved.push(id); render(); },
    'ask-trial': (el) => { const id = el.closest('[data-action]').dataset.id ?? el.dataset.id; const t = TRIALS.find(x => x.id === id); state.questions = state.questions || []; const q = `${t.id}：入组条件是否包含我的分期与既往治疗？`; if (!state.questions.includes(q)) state.questions.push(q); render(); toast('已加入入组问题清单'); },
    range: (el) => { state.range = el.dataset.range; render(); },
    toggle: (el) => { state.toggles[el.dataset.key] = !state.toggles[el.dataset.key]; render(); },
    pin: (el) => { state.pin = { code: el.dataset.code, date: el.dataset.date }; render(); },
    unpin: () => { state.pin = null; render(); },
    zoom: () => {},
    agent: () => { state.agentOpen = !state.agentOpen; renderAgent(); },
    'agent-open': () => { state.agentOpen = true; renderAgent(); toast('AI 对话面板已打开；× 只是收起，不会结束会话'); },
    'agent-build': agentBuild,
    'agent-demo': agentDemo
  };
  if (act === 'agent-size') { state.agentSize = e.target.closest('[data-action]').dataset.size; renderAgent(); return; }
  if (act === 'cfg-tab') {
    const el = e.target.closest('[data-action]');
    document.querySelectorAll('.cfg-tabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b === el)));
    document.querySelectorAll('.cfg-block[data-tab]').forEach((b) => { b.hidden = b.dataset.tab !== el.dataset.tab; });
    return;
  }
  if (map[act]) map[act](e.target.closest('[data-action]'));
});
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-action="zoom"]')) { const sib = e.target.nextElementSibling; if (sib) sib.textContent = e.target.value + '%'; }
  if (e.target.matches('[data-action="records-search"]')) {
    state.query = e.target.value;
    const wrap = $('#docs-table'); if (wrap) wrap.innerHTML = docsTable();
  }
});
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'file-picker') { ingestFiles(e.target.files); e.target.value = ''; return; }
  const el = e.target.closest('[data-action]');
  if (el && el.dataset.action === 'zoom') { state.zoom = Number(el.value); render(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#dialog').open) { closeDialog(); return; }
  const card = e.target.closest && e.target.closest('.mcard[data-mcard]:not([data-static])');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flipCard(card.dataset.mcard); }
});
$('#font-toggle').addEventListener('click', () => { const on = document.body.classList.toggle('large'); $('#font-toggle').setAttribute('aria-pressed', String(on)); });
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== state.view && VIEWS[v]) { state.view = v; render(); } });

const initialHash = location.hash.slice(1);
if (VIEWS[initialHash]) state.view = initialHash;
render();
