/* 演示数据播种（食管癌）。
 *
 * 唯一数据源是 `demo/build-demo-data.mjs` 的 `buildDemoProfiles()`（两个产物 prototypes/v0.2/demo-data.js
 * 与 demo/demo-data.sqlite 也从它生成）。这里只是把同一份纯数据写进**用户资料目录里那个库**，
 * 不新增、不改写任何数值——演示数据一旦在这里多出一条，原型与开发版就会各说一套。
 *
 * 幂等：库里已经有 subjects 就整批跳过（开发版启动时可能跑很多次，不能每次都复制一份档案）。
 * 事务：整批在一个事务里，中途失败整体回滚，不留"半个档案"。
 *
 * 与胃癌 seedDemo 的差异只在不同业务表：perioperative_rows / resection_rows / meal_log /
 * dumping_rows / peritoneal_rows / hp_rows 换成食管癌的 pathway_rows / segment_rows /
 * surgery_rows / swallow_rows / access_rows / dilation_rows / access_events /
 * nutrition_rows / supplement_rows / monitor_rows / endoscopy_rows（schema/0001_initial.sql）。
 *
 * 两个字段口径（H6 的教训，别图省事）：
 * 1. 所有 INSERT 写显式列名 + 显式问号数，不用位置式 VALUES；
 * 2. docs / candidates 在 demo-data 里是**定长数组**（id, 名称, 日期/值, 类型/来源, 状态），
 *    这里按 d[0]…d[4] 取，不要写 d.id（那是胃癌那套对象形状）。
 */

import { buildDemoProfiles } from '../demo/build-demo-data.mjs';

const j = (v) => (v === undefined ? null : JSON.stringify(v));
const flag = (v) => (v ? 1 : 0);

/** 把 buildDemoProfiles() 的数据写进库。返回写入计数（便于启动日志与测试）。 */
export function seedDemo(db, input) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('seedDemo 需要一个已打开的数据库');
  const data = input || buildDemoProfiles();

  const already = db.prepare('SELECT COUNT(*) AS n FROM subjects').get().n;
  if (already > 0) return { skipped: true, subjects: 0, metrics: 0, points: 0, trials: 0 };

  const counts = { skipped: false, subjects: 0, metrics: 0, points: 0, trials: 0 };

  db.exec('BEGIN');
  try {
    /* 列名顺序与 schema/0001_initial.sql 一致；按位置写会因为列数不匹配直接报错（这是想要的）。 */
    const insSubject = db.prepare(`INSERT INTO subjects
      (profile_key, name, sex, age, meta, headline, stage, mindset, dash_keys, path,
       activity, family_talk, pathology_title, pathology_status, subtype_title, segment_title,
       pathway_title, surgery_title, swallow_title, access_title, nutrition_title, monitor_title, endoscopy_title,
       dilation_title, access_events_title)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insMetric = db.prepare(`INSERT INTO metrics (profile_key, key, name, unit, cat, color, dec, kind, band_low, band_high, note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    const insPoint = db.prepare('INSERT INTO metric_points (profile_key, metric_key, d, v_num, v_text, src, ord) VALUES (?,?,?,?,?,?,?)');
    const insMolecular = db.prepare('INSERT INTO molecular (profile_key, k, v, src, state, note, ord) VALUES (?,?,?,?,?,?,?)');
    const insEvent = db.prepare('INSERT INTO events (profile_key, d, label) VALUES (?,?,?)');
    const insRhythm = db.prepare('INSERT INTO rhythm (profile_key, item, freq, guideline, next, ord) VALUES (?,?,?,?,?,?)');
    const insCycle = db.prepare('INSERT INTO cycles (profile_key, name, date, drugs, status, done, ord) VALUES (?,?,?,?,?,?,?)');
    const insLine = db.prepare('INSERT INTO treatment_lines (profile_key, name, detail, done, ord) VALUES (?,?,?,?,?)');
    const insPathway = db.prepare('INSERT INTO pathway_rows (profile_key, phase, name, window, detail, note, ord) VALUES (?,?,?,?,?,?,?)');
    const insSegment = db.prepare('INSERT INTO segment_rows (profile_key, item, value, note, ord) VALUES (?,?,?,?,?)');
    const insSurgery = db.prepare('INSERT INTO surgery_rows (profile_key, d, kind, recon, institution, note, ord) VALUES (?,?,?,?,?,?,?)');
    const insSwallow = db.prepare('INSERT INTO swallow_rows (profile_key, d, level, note, self, ord) VALUES (?,?,?,?,?,?)');
    const insAccess = db.prepare('INSERT INTO access_rows (profile_key, kind, start, end, doctor_text, in_use, note, ord) VALUES (?,?,?,?,?,?,?,?)');
    const insDilation = db.prepare('INSERT INTO dilation_rows (profile_key, d, times, institution, note, ord) VALUES (?,?,?,?,?,?)');
    const insAccessEvent = db.prepare('INSERT INTO access_events (profile_key, d, kind, detail, ord) VALUES (?,?,?,?,?)');
    const insNutrition = db.prepare('INSERT INTO nutrition_rows (profile_key, d, slot, amount, foods, symptoms, note, ord) VALUES (?,?,?,?,?,?,?,?)');
    const insSupp = db.prepare('INSERT INTO supplement_rows (profile_key, item, order_text, start, end, source, ord) VALUES (?,?,?,?,?,?,?)');
    const insMonitor = db.prepare('INSERT INTO monitor_rows (profile_key, item, freq, last, next, note, ord) VALUES (?,?,?,?,?,?,?)');
    const insEndo = db.prepare('INSERT INTO endoscopy_rows (profile_key, d, kind, finding, next, note, ord) VALUES (?,?,?,?,?,?,?)');
    const insView = db.prepare('INSERT INTO viewpoints (profile_key, d, mood, text, ord) VALUES (?,?,?,?,?)');
    const insTrial = db.prepare('INSERT OR IGNORE INTO trials (nct_id, title, phase, status, sponsor, url) VALUES (?,?,?,?,?,?)');
    const insDoc = db.prepare('INSERT INTO documents (profile_key, id, name, date, type, status, ord) VALUES (?,?,?,?,?,?,?)');
    const insCand = db.prepare('INSERT INTO candidate_fields (profile_key, id, name, value, source, status, ord) VALUES (?,?,?,?,?,?,?)');
    const insPath = db.prepare('INSERT INTO pathology_rows (profile_key, kind, a, b, ord) VALUES (?,?,?,?,?)');
    const insMeta = db.prepare('INSERT OR IGNORE INTO demo_meta (k, v) VALUES (?,?)');

    for (const [key, p] of Object.entries(data.profiles)) {
      insSubject.run(key, p.name, p.sex, p.age, p.meta, p.headline, p.stage, p.mindset,
        j(p.dash_keys), j(p.path), p.activity ?? null, p.familyTalk ?? null,
        p.pathology ? p.pathology.title : null, p.pathology ? p.pathology.status : null,
        p.subtypeTitle ?? null,
        p.segment ? p.segment.title : null,
        p.pathway ? p.pathway.title : null,
        p.surgery ? p.surgery.title : null,
        p.swallow ? p.swallow.title : null,
        p.access ? p.access.title : null,
        p.nutrition ? p.nutrition.title : null,
        p.monitor ? p.monitor.title : null,
        p.endoscopy ? p.endoscopy.title : null,
        /* 0002 追加的两列：扩张记录 / 通路相关事件（有 rows 就必须有 title，否则读模型还原成 null） */
        p.dilation ? p.dilation.title : null,
        p.accessEvents ? p.accessEvents.title : null);
      counts.subjects++;

      for (const m of p.metrics) {
        insMetric.run(key, m.key, m.name, m.unit ?? null, m.cat ?? null, m.color ?? null,
          m.dec ?? null, m.dec === null ? (m.kind || 'qual') : 'numeric',
          m.band ? m.band[0] : null, m.band ? m.band[1] : null, m.note ?? null);
        counts.metrics++;
        for (const [pi, pt] of (m.points || []).entries()) {
          const num = typeof pt.v === 'number' ? pt.v : null;
          const txt = typeof pt.v === 'number' ? null : (pt.v === undefined ? null : String(pt.v));
          insPoint.run(key, m.key, pt.d, num, txt, pt.src ?? null, pi);
          counts.points++;
        }
      }

      (p.molecular || []).forEach((r, i) => insMolecular.run(key, r.k, r.v, r.src, r.state, r.note ?? null, i));
      (p.events || []).forEach((e) => insEvent.run(key, e[0], e[1]));
      (p.rhythm || []).forEach((r, i) => insRhythm.run(key, r[0], r[1], r[2], r[3], i));
      (p.cycles || []).forEach((c, i) => insCycle.run(key, c[0], c[1], c[2], c[3], flag(c[4]), i));
      (p.lines || []).forEach((l, i) => insLine.run(key, l.name, l.detail, flag(l.done), i));
      if (p.pathway) p.pathway.rows.forEach((r, i) => insPathway.run(key, r[0], r[1], r[2], r[3], r[4], i));
      if (p.segment) p.segment.rows.forEach((r, i) => insSegment.run(key, r[0], r[1], r[2], i));
      if (p.surgery) p.surgery.rows.forEach((r, i) => insSurgery.run(key, r[0], r[1], r[2], r[3], r[4], i));
      if (p.swallow) p.swallow.rows.forEach((r, i) => insSwallow.run(key, r[0], r[1], r[2], flag(r[3]), i));
      /* in_use 是列名不是关键字 using（SQLite 保留字，建表会直接报 near "using"）；
         这里 r[4] 是 demo 数据里的「当前在用」标记。 */
      if (p.access) p.access.rows.forEach((r, i) => insAccess.run(key, r[0], r[1], r[2] ?? null, r[3], flag(r[4]), r[5], i));
      if (p.dilation) p.dilation.rows.forEach((r, i) => insDilation.run(key, r[0], r[1], r[2], r[3], i));
      if (p.accessEvents) p.accessEvents.rows.forEach((r, i) => insAccessEvent.run(key, r[0], r[1], r[2], i));
      if (p.nutrition) p.nutrition.rows.forEach((r, i) => insNutrition.run(key, r[0], r[1], r[2], r[3], r[4], r[5], i));
      (p.supplements || []).forEach((r, i) => insSupp.run(key, r[0], r[1], r[2], r[3] ?? null, r[4], i));
      if (p.monitor) p.monitor.rows.forEach((r, i) => insMonitor.run(key, r[0], r[1], r[2] ?? null, r[3], r[4], i));
      if (p.endoscopy) p.endoscopy.rows.forEach((r, i) => insEndo.run(key, r[0], r[1], r[2], r[3], r[4], i));
      (p.viewpoints || []).forEach((v, i) => insView.run(key, v[0], v[1], v[2], i));
      (p.docs || []).forEach((d, i) => insDoc.run(key, d[0], d[1], d[2], d[3], d[4], i));
      (p.candidates || []).forEach((c, i) => insCand.run(key, c[0], c[1], c[2], c[3], c[4], i));
      if (p.pathology) {
        (p.pathology.rows || []).forEach((r, i) => insPath.run(key, 'row', r[0], r[1], i));
        (p.pathology.gaps || []).forEach((r, i) => insPath.run(key, 'gap', r[0], r[1], i));
      }
    }

    for (const t of data.trials || []) {
      const r = insTrial.run(t.id, t.title, t.phase, t.status, t.sponsor, t.url);
      if (r && r.changes) counts.trials++;
    }
    for (const [k, v] of data.meta || []) insMeta.run(k, v);

    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* 回滚失败也要把原始错误抛出去 */ }
    throw new Error(`播种演示数据失败（已回滚）：${error.message}`);
  }
  return counts;
}

/** 库的演示档案是否已播种过。启动流程用它决定要不要 seedDemo。 */
export function hasDemoData(db) {
  try {
    return db.prepare('SELECT COUNT(*) AS n FROM subjects').get().n > 0;
  } catch {
    return false;
  }
}
