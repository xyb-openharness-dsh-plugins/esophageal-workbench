/* 食管癌工作台 · 初始数据模型（0001）
 *
 * 家族四条契约（与肠癌、胃癌同源，改这里等于改契约）：
 *   1. 看法恒不为结论（viewpoints 只是记录，is_conclusion 恒 0，故不设该列而由读模型保证）；
 *   2. 四点位 1–4 点且缺健侧不生成差值（NULL ≠ 0）；
 *   3. 更正只新增版本，不覆盖（pathway_rows 留旧路径）；
 *   4. 事实四层不合并（文档 / 候选 / 记录 / 指标分表存放）。
 *
 * 迁移只增不改：本文件已冻结（sha256 见 freeze-contract.md），
 * 要加结构只能新增 0002_*.sql，改这里会被 scripts/check-schema.mjs 拦下。
 *
 * 与胃癌模型的差异（勿互相抄回）：
 *   - 胃癌的 perioperative/resection/meal_log/dumping/peritoneal/hp 六张表，
 *     换成食管癌的 pathway/segment/surgery/swallow/access/dilation/access_events/
 *     nutrition/monitor/endoscopy 九张表；supplement_rows 两边都有（食管癌权重更高）。
 *   - 食管癌保留独立的 nutrition_rows（SPEC A15 / Q7：四癌种唯一双营养入口，
 *     「吞咽与进食通路」记"怎么吃进去"，「营养支持」记"吃了多少"，两页并存不许合并掉）。
 *   - pathway_rows 的 phase（当前/既往）是 E-A3 的载体：切路径只新增不覆盖。
 *   - monitor_rows 是食管癌独有：鳞癌烟酒人群的第二原发（头颈/肺）监测安排，
 *     只记医生安排，不给患癌风险提示（SPEC E6 / E-A11）。
 *   - endoscopy_rows 在食管癌里语义扩为「内镜与影像随访」（食管造影 / CT / 胃镜逐次记录），
 *     与 monitor_rows（未来安排）分工：这张记已发生，那张记下次。
 */

/* ---------- 档案级 ---------- */

CREATE TABLE subjects (
  profile_key      TEXT PRIMARY KEY,
  name             TEXT,
  sex              TEXT,
  age              INTEGER,
  meta             TEXT,
  headline         TEXT,
  stage            TEXT,
  mindset          TEXT,
  /* 档案级标量 */
  dash_keys        TEXT,          -- JSON 数组：看板指标卡顺序
  path             TEXT,          -- JSON 数组：路径条（病理类型 / 分段 / 分期 / 治疗路径）
  activity         TEXT,
  family_talk      TEXT,
  /* 分节标题（与读模型里的 { title, rows } 结构对应；NULL 表示该档案没有这一节） */
  pathology_title  TEXT,
  pathology_status TEXT,
  subtype_title    TEXT,
  segment_title    TEXT,
  pathway_title    TEXT,
  surgery_title    TEXT,
  swallow_title    TEXT,
  access_title     TEXT,
  nutrition_title  TEXT,
  monitor_title    TEXT,
  endoscopy_title  TEXT
);

/* ---------- 指标 ---------- */

CREATE TABLE metrics (
  profile_key TEXT,
  key         TEXT,
  name        TEXT,
  unit        TEXT,
  cat         TEXT,
  color       TEXT,
  dec         INTEGER,          -- 数值指标的小数位；NULL 表示分类/文字指标
  kind        TEXT,             -- 'numeric' | 'grade' | 'qual'（分类指标）
  band_low    REAL,
  band_high   REAL,
  note        TEXT,
  PRIMARY KEY (profile_key, key)
);

CREATE TABLE metric_points (
  profile_key TEXT,
  metric_key  TEXT,
  d           TEXT,             -- 采样日期 YYYY-MM-DD
  v_num       REAL,             -- 数值指标
  v_text      TEXT,             -- 分类/文字指标原值
  src         TEXT,             -- 来源（报告名 / 场合）
  ord         INTEGER,
  PRIMARY KEY (profile_key, metric_key, d, ord)
);

/* 分子/病理标志物：食管癌查 HER2（腺癌）、PD-L1 CPS、MSI/MMR、CLDN18.2。
   四态 state：ok 已检测 / na 未检测 / warn 需关注 / pending 待出。未检测不得写成"阴性"。 */
CREATE TABLE molecular (
  profile_key TEXT,
  k           TEXT,
  v           TEXT,
  src         TEXT,
  state       TEXT,
  note        TEXT,
  ord         INTEGER
);

/* ---------- 病情与时间轴 ---------- */

CREATE TABLE events (
  profile_key TEXT,
  d           TEXT,
  label       TEXT
);

CREATE TABLE rhythm (
  profile_key TEXT,
  item        TEXT,
  freq        TEXT,
  guideline   TEXT,
  next        TEXT,
  ord         INTEGER
);

CREATE TABLE cycles (
  profile_key TEXT,
  name        TEXT,
  date        TEXT,
  drugs       TEXT,
  status      TEXT,
  done        INTEGER,
  ord         INTEGER
);

CREATE TABLE treatment_lines (
  profile_key TEXT,
  name        TEXT,
  detail      TEXT,
  done        INTEGER,
  ord         INTEGER
);

/* ---------- 食管癌专属（九张 + 两张通用扩展） ---------- */

/* 治疗路径三选一（SPEC A3）：手术路径 / 根治性放化疗 dCRT / 系统治疗。
   切换路径时新增一行并留旧路径，不覆盖：phase 只取「当前 / 既往」；
   是否手术、何时切换由医生决定，表里只存事实与医生原话。 */
CREATE TABLE pathway_rows (
  profile_key TEXT,
  phase       TEXT,             -- 当前 / 既往
  name        TEXT,             -- 路径名（如「根治性同步放化疗 + 免疫巩固」）
  window      TEXT,             -- 起止窗口
  detail      TEXT,             -- 方案细节
  note        TEXT,             -- 医生原话 / 切换原因（只记录，不判断）
  ord         INTEGER
);

/* 部位分段 + Siewert 记录位（SPEC A2）：
   item 取 颈段 / 胸上段 / 胸中段 / 胸下段 / EGJ；EGJ 档案另记 Siewert 类型（医生给出）。 */
CREATE TABLE segment_rows (
  profile_key TEXT,
  item        TEXT,
  value       TEXT,
  note        TEXT,
  ord         INTEGER
);

/* 病理资料：kind 取 'row'（已确认条目）/ 'gap'（缺口，待核对） */
CREATE TABLE pathology_rows (
  profile_key TEXT,
  kind        TEXT,
  a           TEXT,
  b           TEXT,
  ord         INTEGER
);

/* 手术与吻合口（SPEC A3「手术与吻合口」子页）：
   kind=术式（Ivor Lewis / McKeown / 左开胸…），recon=消化道重建方式与吻合口位置，
   institution=机构。只记录做了什么，不给"该不该手术"的判断（SPEC 明确不做）。 */
CREATE TABLE surgery_rows (
  profile_key TEXT,
  d           TEXT,
  kind        TEXT,
  recon       TEXT,
  institution TEXT,
  note        TEXT,
  ord         INTEGER
);

/* 吞咽自查六档（SPEC A4）：普食 / 软食 / 半流 / 流食 / 水呛 / 完全梗阻。
   self=1 表示该条是患者自查记录 —— 分级由内镜/影像评估与医生给，自查条目必须固定标注
   「自查，不是医生评估」（渲染层保证，不在数据层省掉）。 */
CREATE TABLE swallow_rows (
  profile_key TEXT,
  d           TEXT,
  level       TEXT,
  note        TEXT,
  self        INTEGER,
  ord         INTEGER
);

/* 进食通路档案（SPEC A5）：经口 / 支架 / 鼻饲 / 胃造瘘 / 空肠造瘘。
   可并列多条（先后切换），各带起止日期；记录医生建议原话 + 患者实际在用，
   不给利弊排序、不推荐品牌型号。 */
CREATE TABLE access_rows (
  profile_key TEXT,
  kind        TEXT,
  start       TEXT,
  end         TEXT,
  doctor_text TEXT,
  in_use      INTEGER,          -- 1 = 当前在用（列名不用 using：SQLite 保留字）
  note        TEXT,
  ord         INTEGER
);

/* 扩张记录（SPEC A6）：只存事实（日期 / 次数 / 机构），不给扩张时机建议。 */
CREATE TABLE dilation_rows (
  profile_key TEXT,
  d           TEXT,
  times       TEXT,
  institution TEXT,
  note        TEXT,
  ord         INTEGER
);

/* 通路相关事件：误吸 / 呛咳 / 支架移位 / 堵管 / 置管处渗液等。
   只记发生事实与处理经过（医生做的），不判断严重度、不给处理建议。 */
CREATE TABLE access_events (
  profile_key TEXT,
  d           TEXT,
  kind        TEXT,
  detail      TEXT,
  ord         INTEGER
);

/* 营养支持页的进食量记录（与「吞咽与进食通路」区分：这里记"吃了多少"）。
   份量与食物按患者自述，不做热量换算、不给食谱。 */
CREATE TABLE nutrition_rows (
  profile_key TEXT,
  d           TEXT,
  slot        TEXT,
  amount      TEXT,
  foods       TEXT,
  symptoms    TEXT,
  note        TEXT,
  ord         INTEGER
);

/* 营养补充 / 管饲医嘱留痕（SPEC：营养权重四癌种最高）。
   只显示医嘱原文与起止，无剂量推荐、无品牌。 */
CREATE TABLE supplement_rows (
  profile_key TEXT,
  item        TEXT,
  order_text  TEXT,
  start       TEXT,
  end         TEXT,
  source      TEXT,
  ord         INTEGER
);

/* 监测安排（SPEC E6 / §4 复诊准备）：胃镜随访、影像随访、
   鳞癌烟酒人群的第二原发监测（头颈 / 肺）—— 只记医生安排，不给患癌风险提示。 */
CREATE TABLE monitor_rows (
  profile_key TEXT,
  item        TEXT,
  freq        TEXT,
  last        TEXT,
  next        TEXT,
  note        TEXT,
  ord         INTEGER
);

/* 内镜与影像随访（逐次记录，与 monitor_rows 分工：这张记已发生的，那张记下次安排）。
   kind 取 胃镜 / 食管造影 / 胸腹盆 CT / PET-CT；finding 抄报告结论原文，next 写下一次建议
   （医生写的那句，不改写成我们的建议）。 */
CREATE TABLE endoscopy_rows (
  profile_key TEXT,
  d           TEXT,
  kind        TEXT,
  finding     TEXT,
  next        TEXT,
  note        TEXT,
  ord         INTEGER
);

/* ---------- 通用 ---------- */

CREATE TABLE viewpoints (
  profile_key TEXT,
  d           TEXT,
  mood        TEXT,
  text        TEXT,
  ord         INTEGER
);

CREATE TABLE trials (
  nct_id  TEXT PRIMARY KEY,
  title   TEXT,
  phase   TEXT,
  status  TEXT,
  sponsor TEXT,
  url     TEXT
);

CREATE TABLE documents (
  profile_key TEXT,
  id          TEXT,
  name        TEXT,
  date        TEXT,
  type        TEXT,
  status      TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE candidate_fields (
  profile_key TEXT,
  id          TEXT,
  name        TEXT,
  value       TEXT,
  source      TEXT,
  status      TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, id)
);

CREATE TABLE demo_meta (
  k TEXT PRIMARY KEY,
  v TEXT
);

CREATE INDEX idx_points      ON metric_points (profile_key, metric_key);
CREATE INDEX idx_swallow     ON swallow_rows  (profile_key, d);
CREATE INDEX idx_docs        ON documents     (profile_key);
