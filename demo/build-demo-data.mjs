/* 小咽宝 EsopPal · 演示数据生成器（唯一数据源）
   产出：demo/demo-data.sqlite（可 SQL 查询）+ prototypes/v0.2/demo-data.js（原型只读数据层）
   原则：全部患者数据为虚构模拟；试验表为真实登记摘录（状态未核实，以登记页为准）。
   运行：node demo/build-demo-data.mjs  —— 改数据只改这里，两个产物一起重生成。

   两种用法：
   1. 直接跑（CLI）：写上面两个产物；
   2. 被 import：只拿到 `buildDemoProfiles()` 返回的纯数据，一个字节都不碰磁盘
      —— 开发版的 `dsh/demo.js` 靠它把演示档案写进本机 sqlite，
      因此"演示数据"仍然只有这一份定义，不会长出第二个数据源。

   与胃癌生成器的结构差异（改前先看，两边的表不许互相抄）：
   - 一级页 11 个：在 SPEC §4 的 10 个之外补 `records`（资料库/上传→解析→确认指标→入库，
     这是家族脚手架要求，胃癌与肠癌也都有，SPEC 草案漏写）；
   - 胃癌的 perioperative/resection/meal_log/dumping/peritoneal/hp 换成食管癌的
     pathway/segment/surgery/swallow/access/dilation/access_events/nutrition/monitor/endoscopy；
   - 食管癌**保留**独立的 nutrition 页（SPEC A15 / Q7：四癌种唯一双营养入口，
     与胃癌 G-A8「不设营养支持页」刻意相反，不许"统一"掉）；
   - SCC-Ag（`scc`）只出现在 A 档案（鳞癌）；B 档案（腺癌）没有这个指标（E-A8）。

   列数纪律（H6）：所有 INSERT 一律写显式列名，禁止 `INSERT INTO t VALUES (?,?,…)`。
   胃癌那轮连续 6 次列数不匹配（`resection_rows` 8 列 / 7 值），就是位置式 INSERT 造成的；
   写完跑 `node scripts/check-demo-columns.mjs` 复核对齐。 */
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const P2 = join(ROOT, 'prototypes/v0.2');

/* ---------- 基础数据 ---------- */

const pts = (arr) => arr.map(([d, v, src]) => ({ d, v, src }));

const CAT_COLOR = {
  '肿瘤标志物': '#b4553a', '血象': '#a03d5c', '生化': '#8a6b1f', '电解质': '#2f6f66',
  '营养': '#6a55b8', '吞咽与症状': '#c2682f', '影像与内镜': '#3f6699',
};
const cat = (c) => ({ cat: c, color: CAT_COLOR[c] });

/* 按指标 key 独立配色：一图秀最多同屏 3–4 条，必须靠色相区分，不能只靠类别色。
   原则：类别大方向不变（标志物偏砖红、血象偏玫、生化偏金、电解质偏青、营养偏紫、
   吞咽症状偏橙、影像偏蓝），但同屏最常见的组合（体重/白蛋白/前白蛋白/SCC-Ag）跨色相拉开。 */
const KEY_COLOR = {
  scc: '#b4553a', cyfra: '#d08a4a', cea: '#8f3f28', ca199: '#c96b3f', ca724: '#a85724',
  hgb: '#a03d5c', wbc: '#c2687f', anc: '#8f2d4a', lym: '#d495a6', plt: '#b3556e',
  alt: '#8a6b1f', ast: '#a8862f', alp: '#bb9a4e', tbil: '#7d5410', cr: '#6d5320', bun: '#957a45',
  ldh: '#5f441c', crp: '#a87c0b', glu: '#3e8e7e',
  k: '#2f6f66', na: '#4d9187', ca: '#6fb0a5', mg: '#1f5c53',
  wt: '#6a55b8', alb: '#9382d4', pa: '#553f9e', ferritin: '#4a3f7d', vitd: '#8d7cc8',
  swallow: '#c2682f', meal: '#d4894f', esophagitis: '#a85724', cough: '#e09a5c', reflux: '#b8652c',
  endo: '#3f6699', imaging: '#4f7bab',
};

/* ---------- 公共化验 / 体征 ----------
   A、B 各写一组，日期与走势完全不同：
   A = 确诊 → 新辅助（FP）→ 改 dCRT → 免疫巩固 → 支架 + 扩张（体重先掉后回升）；
   B = 确诊 → FLOT 新辅助 → Ivor Lewis 手术 → 术后辅助（术后有一个明显低谷）。
   共用一份数组会让一边的"术前"标签落到另一边的放疗期里，所以宁可重复写。 */

const DA = ['2026-04-24', '2026-05-06', '2026-05-26', '2026-06-02', '2026-06-16', '2026-06-30',
  '2026-07-14', '2026-07-28', '2026-08-11', '2026-08-25', '2026-09-15', '2026-09-29', '2026-10-16'];
const LA = ['确诊时', '新辅助-1 前', '新辅助-2 后', 'dCRT 开始', 'dCRT 第 3 周', 'dCRT 结束',
  '巩固-1 前', '巩固-2 前', '巩固-3 前', '支架置入后', '扩张后', '巩固-6 前', '复诊'];
const zipA = (vals) => pts(DA.map((d, i) => [d, vals[i], LA[i]]));

const commonLabsA = () => [
  { key: 'wbc', name: '白细胞', unit: '10⁹/L', dec: 1, band: [3.5, 9.5], note: '不同医院参考区间不合并', ...cat('血象'),
    points: zipA([6.6, 6.2, 5.8, 5.5, 3.4, 4.2, 4.8, 5.1, 4.6, 4.9, 4.4, 4.7, 5.2]) },
  { key: 'anc', name: '中性粒细胞', unit: '10⁹/L', dec: 2, band: [1.8, 6.3], note: '同步放化疗期间最低；偏低时治疗可能推迟', ...cat('血象'),
    points: zipA([4.1, 3.8, 3.5, 3.2, 1.6, 2.3, 2.9, 3.1, 2.7, 3.0, 2.6, 2.8, 3.2]) },
  { key: 'lym', name: '淋巴细胞', unit: '10⁹/L', dec: 2, band: [1.1, 3.2], note: '放疗期间下降常见', ...cat('血象'),
    points: zipA([1.9, 1.8, 1.7, 1.6, 1.1, 1.2, 1.4, 1.5, 1.4, 1.5, 1.3, 1.4, 1.6]) },
  { key: 'plt', name: '血小板', unit: '10⁹/L', dec: 0, band: [125, 350], note: '—', ...cat('血象'),
    points: zipA([238, 232, 226, 218, 142, 158, 176, 188, 182, 190, 178, 186, 196]) },
  { key: 'hgb', name: '血红蛋白', unit: 'g/L', dec: 0, band: [130, 175], note: '不同医院参考区间不合并', ...cat('血象'),
    points: zipA([141, 138, 134, 131, 112, 116, 119, 122, 120, 124, 121, 125, 129]) },
  { key: 'alt', name: 'ALT', unit: 'U/L', dec: 0, band: [9, 50], note: '—', ...cat('生化'),
    points: zipA([26, 30, 28, 32, 46, 38, 34, 31, 29, 33, 30, 28, 27]) },
  { key: 'ast', name: 'AST', unit: 'U/L', dec: 0, band: [15, 40], note: '—', ...cat('生化'),
    points: zipA([23, 26, 25, 29, 41, 34, 30, 28, 26, 29, 27, 25, 24]) },
  { key: 'alp', name: '碱性磷酸酶', unit: 'U/L', dec: 0, band: [45, 125], note: '—', ...cat('生化'),
    points: zipA([84, 88, 90, 92, 104, 98, 94, 90, 88, 92, 89, 87, 86]) },
  { key: 'tbil', name: '总胆红素', unit: 'μmol/L', dec: 1, band: [3.4, 20.5], note: '—', ...cat('生化'),
    points: zipA([10.8, 11.4, 12.0, 12.6, 14.2, 13.1, 12.4, 11.8, 11.5, 12.0, 11.2, 10.9, 10.6]) },
  { key: 'cr', name: '肌酐', unit: 'μmol/L', dec: 0, band: [57, 111], note: '含铂方案期间关注', ...cat('生化'),
    points: zipA([76, 78, 79, 81, 86, 83, 80, 79, 78, 80, 77, 76, 75]) },
  { key: 'bun', name: '尿素', unit: 'mmol/L', dec: 1, band: [2.9, 8.2], note: '—', ...cat('生化'),
    points: zipA([5.2, 5.4, 5.6, 5.8, 6.4, 6.0, 5.7, 5.5, 5.4, 5.6, 5.3, 5.2, 5.1]) },
  { key: 'glu', name: '空腹血糖', unit: 'mmol/L', dec: 1, band: [3.9, 6.1], note: '进食少时偏低', ...cat('生化'),
    points: zipA([5.4, 5.6, 5.5, 5.3, 5.8, 5.6, 5.2, 5.0, 5.1, 4.9, 5.2, 5.0, 5.1]) },
  { key: 'ldh', name: 'LDH', unit: 'U/L', dec: 0, band: [120, 250], note: '—', ...cat('生化'),
    points: zipA([192, 198, 202, 208, 232, 220, 210, 204, 200, 206, 198, 196, 194]) },
  { key: 'crp', name: 'C 反应蛋白', unit: 'mg/L', dec: 1, band: [0, 8], note: '放疗期间升高常见，单次升高不等于感染', ...cat('生化'),
    points: zipA([9.2, 7.8, 6.4, 5.8, 14.6, 11.2, 8.4, 6.2, 4.8, 5.6, 4.2, 3.8, 3.4]) },
  { key: 'k', name: '血钾', unit: 'mmol/L', dec: 2, band: [3.5, 5.3], note: '进食少或呕吐后需复查', ...cat('电解质'),
    points: zipA([4.0, 3.9, 3.8, 3.9, 3.5, 3.6, 3.8, 3.9, 3.9, 3.8, 4.0, 3.9, 4.1]) },
  { key: 'na', name: '血钠', unit: 'mmol/L', dec: 0, band: [137, 147], note: '—', ...cat('电解质'),
    points: zipA([140, 140, 139, 139, 135, 137, 139, 140, 139, 140, 140, 141, 141]) },
  { key: 'ca', name: '血钙', unit: 'mmol/L', dec: 2, band: [2.11, 2.52], note: '与钙/维生素 D 补充同一条线', ...cat('电解质'),
    points: zipA([2.32, 2.30, 2.28, 2.26, 2.18, 2.21, 2.24, 2.26, 2.25, 2.27, 2.28, 2.30, 2.31]) },
  { key: 'mg', name: '血镁', unit: 'mmol/L', dec: 2, band: [0.75, 1.02], note: '含铂方案关注项', ...cat('电解质'),
    points: zipA([0.86, 0.85, 0.84, 0.83, 0.76, 0.78, 0.81, 0.82, 0.83, 0.82, 0.84, 0.85, 0.86]) },
  { key: 'wt', name: '体重', unit: 'kg', dec: 1, band: null, note: '四癌种中体重权重最高；持续下降需在就诊时提出', ...cat('营养'),
    points: zipA([68.4, 67.6, 66.8, 65.9, 63.2, 61.4, 60.8, 60.2, 60.5, 61.3, 62.6, 63.0, 63.4]) },
  { key: 'alb', name: '白蛋白', unit: 'g/L', dec: 1, band: [40, 55], note: '与体重一起看；不同医院参考区间不合并', ...cat('营养'),
    points: zipA([40.2, 39.4, 38.6, 37.8, 34.2, 32.6, 33.1, 33.8, 34.4, 35.2, 35.8, 36.0, 36.2]) },
  { key: 'pa', name: '前白蛋白', unit: 'g/L', dec: 2, band: [0.2, 0.4], note: '比白蛋白更早反映近期摄入', ...cat('营养'),
    points: zipA([0.24, 0.23, 0.22, 0.21, 0.15, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21]) },
  { key: 'ferritin', name: '铁蛋白', unit: 'ng/mL', dec: 0, band: [30, 400], note: '长期进食少时关注', ...cat('营养'),
    points: zipA([118, 112, 108, 104, 96, 92, 94, 98, 100, 104, 108, 110, 114]) },
  { key: 'vitd', name: '25-羟维生素 D', unit: 'ng/mL', dec: 1, band: [30, 100], note: '户外活动减少时偏低', ...cat('营养'),
    points: zipA([24.6, 24.0, 23.4, 23.0, 21.8, 21.2, 21.6, 22.4, 22.8, 23.2, 23.6, 24.0, 24.4]) },
];

const DB = ['2026-04-24', '2026-05-05', '2026-05-19', '2026-06-02', '2026-06-16', '2026-07-02',
  '2026-07-08', '2026-07-22', '2026-08-05', '2026-08-20', '2026-09-10', '2026-10-01', '2026-10-14'];
const LB = ['确诊时', 'FLOT-1 前', 'FLOT-2 前', 'FLOT-3 前', 'FLOT-4 前', '手术当天',
  '术后第 6 天', '出院前', '术后 5 周', '辅助-1 前', '辅助-2 前', '辅助-3 前', '复诊'];
const zipB = (vals) => pts(DB.map((d, i) => [d, vals[i], LB[i]]));

const commonLabsB = () => [
  { key: 'wbc', name: '白细胞', unit: '10⁹/L', dec: 1, band: [3.5, 9.5], note: '不同医院参考区间不合并', ...cat('血象'),
    points: zipB([6.2, 5.9, 5.6, 5.4, 5.2, 11.8, 8.6, 6.8, 5.6, 5.2, 4.8, 4.6, 4.9]) },
  { key: 'anc', name: '中性粒细胞', unit: '10⁹/L', dec: 2, band: [1.8, 6.3], note: '术后第 1 天应激性升高，不按化疗标准解读', ...cat('血象'),
    points: zipB([3.8, 3.6, 3.4, 3.2, 3.0, 9.4, 6.8, 4.6, 3.4, 3.0, 2.4, 2.2, 2.6]) },
  { key: 'lym', name: '淋巴细胞', unit: '10⁹/L', dec: 2, band: [1.1, 3.2], note: '—', ...cat('血象'),
    points: zipB([1.7, 1.6, 1.5, 1.4, 1.3, 0.9, 1.1, 1.3, 1.5, 1.6, 1.5, 1.4, 1.5]) },
  { key: 'plt', name: '血小板', unit: '10⁹/L', dec: 0, band: [125, 350], note: '—', ...cat('血象'),
    points: zipB([246, 238, 230, 224, 218, 178, 196, 216, 224, 212, 196, 188, 194]) },
  { key: 'hgb', name: '血红蛋白', unit: 'g/L', dec: 0, band: [130, 175], note: '术后下降，恢复需要时间', ...cat('血象'),
    points: zipB([132, 128, 124, 121, 118, 104, 108, 112, 116, 118, 114, 112, 114]) },
  { key: 'alt', name: 'ALT', unit: 'U/L', dec: 0, band: [9, 50], note: '—', ...cat('生化'),
    points: zipB([24, 32, 38, 42, 46, 38, 34, 31, 29, 36, 42, 38, 34]) },
  { key: 'ast', name: 'AST', unit: 'U/L', dec: 0, band: [15, 40], note: '—', ...cat('生化'),
    points: zipB([22, 28, 33, 37, 41, 34, 30, 28, 26, 32, 37, 34, 30]) },
  { key: 'alp', name: '碱性磷酸酶', unit: 'U/L', dec: 0, band: [45, 125], note: '—', ...cat('生化'),
    points: zipB([78, 82, 86, 90, 94, 88, 86, 84, 82, 86, 90, 88, 86]) },
  { key: 'tbil', name: '总胆红素', unit: 'μmol/L', dec: 1, band: [3.4, 20.5], note: '—', ...cat('生化'),
    points: zipB([10.2, 11.0, 11.8, 12.4, 13.0, 12.2, 11.8, 11.4, 11.0, 11.6, 12.2, 11.8, 11.4]) },
  { key: 'cr', name: '肌酐', unit: 'μmol/L', dec: 0, band: [41, 81], note: '女性参考区间与男性不同，不合并', ...cat('生化'),
    points: zipB([64, 66, 67, 68, 69, 78, 74, 70, 68, 70, 72, 70, 68]) },
  { key: 'bun', name: '尿素', unit: 'mmol/L', dec: 1, band: [2.9, 8.2], note: '—', ...cat('生化'),
    points: zipB([4.8, 5.0, 5.1, 5.2, 5.3, 6.6, 5.8, 5.4, 5.2, 5.4, 5.6, 5.4, 5.2]) },
  { key: 'glu', name: '空腹血糖', unit: 'mmol/L', dec: 1, band: [3.9, 6.1], note: '术后短期波动', ...cat('生化'),
    points: zipB([5.1, 5.2, 5.3, 5.2, 5.1, 6.8, 6.2, 5.8, 5.4, 5.3, 5.2, 5.1, 5.2]) },
  { key: 'ldh', name: 'LDH', unit: 'U/L', dec: 0, band: [120, 250], note: '—', ...cat('生化'),
    points: zipB([186, 192, 198, 204, 210, 246, 226, 210, 200, 208, 216, 208, 198]) },
  { key: 'crp', name: 'C 反应蛋白', unit: 'mg/L', dec: 1, band: [0, 8], note: '术后升高属预期；持续不降需就诊', ...cat('生化'),
    points: zipB([7.4, 6.8, 6.2, 5.8, 5.4, 62.4, 38.6, 16.2, 8.4, 6.2, 5.8, 4.6, 3.8]) },
  { key: 'k', name: '血钾', unit: 'mmol/L', dec: 2, band: [3.5, 5.3], note: '进食少或呕吐后需复查', ...cat('电解质'),
    points: zipB([4.2, 4.1, 4.0, 3.9, 3.8, 3.6, 3.7, 3.9, 4.0, 3.9, 3.8, 3.9, 4.0]) },
  { key: 'na', name: '血钠', unit: 'mmol/L', dec: 0, band: [137, 147], note: '—', ...cat('电解质'),
    points: zipB([141, 140, 140, 139, 139, 136, 138, 139, 140, 140, 139, 140, 141]) },
  { key: 'ca', name: '血钙', unit: 'mmol/L', dec: 2, band: [2.11, 2.52], note: '与钙/维生素 D 补充同一条线', ...cat('电解质'),
    points: zipB([2.34, 2.32, 2.30, 2.28, 2.26, 2.16, 2.19, 2.22, 2.24, 2.26, 2.25, 2.27, 2.28]) },
  { key: 'mg', name: '血镁', unit: 'mmol/L', dec: 2, band: [0.75, 1.02], note: '—', ...cat('电解质'),
    points: zipB([0.84, 0.83, 0.82, 0.81, 0.80, 0.74, 0.76, 0.79, 0.81, 0.82, 0.83, 0.84, 0.84]) },
  { key: 'wt', name: '体重', unit: 'kg', dec: 1, band: null, note: '术后体重下降常见；持续下降需在就诊时提出', ...cat('营养'),
    points: zipB([61.2, 60.6, 60.0, 59.4, 58.8, 57.2, 55.4, 54.2, 53.6, 53.2, 52.4, 52.6, 52.8]) },
  { key: 'alb', name: '白蛋白', unit: 'g/L', dec: 1, band: [40, 55], note: '与体重一起看', ...cat('营养'),
    points: zipB([39.8, 39.0, 38.4, 37.8, 37.2, 31.6, 32.4, 33.6, 34.8, 35.6, 36.4, 37.8, 38.6]) },
  { key: 'pa', name: '前白蛋白', unit: 'g/L', dec: 2, band: [0.2, 0.4], note: '比白蛋白更早反映近期摄入', ...cat('营养'),
    points: zipB([0.23, 0.22, 0.21, 0.20, 0.19, 0.12, 0.13, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20]) },
  { key: 'ferritin', name: '铁蛋白', unit: 'ng/mL', dec: 0, band: [15, 150], note: '胃部分切除后铁吸收下降，按医嘱复查', ...cat('营养'),
    points: zipB([86, 82, 78, 74, 70, 58, 56, 58, 62, 66, 70, 72, 74]) },
  { key: 'vitd', name: '25-羟维生素 D', unit: 'ng/mL', dec: 1, band: [30, 100], note: '—', ...cat('营养'),
    points: zipB([22.4, 22.0, 21.6, 21.2, 20.8, 18.6, 18.8, 19.4, 20.0, 20.6, 21.2, 21.6, 22.0]) },
];

/* ---------- 档案 A：胸中段鳞癌，新辅助 → 改 dCRT → 免疫巩固 ---------- */

const PROFILE_A = {
  name: '沈志远',
  sex: '男',
  age: 62,
  meta: '胸中段鳞癌 · Ⅲ期 · 仓库管理员',
  headline: '胸中段鳞癌 cT3N1M0，2026-05 由「新辅助 + 手术」改为根治性放化疗，7 月起免疫巩固',
  stage: 'cT3N1M0 Ⅲ期',
  mindset: '最担心「吃不下」，正在把每餐份量记下来',
  dash_keys: ['wt', 'alb', 'scc', 'swallow'],
  path: ['鳞癌', '胸中段', 'cT3N1M0', 'dCRT + 免疫巩固'],
  activity: '每天散步 30 分钟；吞咽差的时候改在早上走',
  familyTalk: '和爱人说好：复查结果先一起看，再决定怎么跟女儿说',

  molecular: [
    { k: 'PD-L1 CPS', v: 'CPS 15', src: '病理科 2026-04-30', state: 'ok', note: '22C3 检测' },
    { k: 'MSI / MMR', v: 'pMMR / MSS', src: '病理科 2026-04-30', state: 'ok', note: '—' },
    { k: 'HER2', v: '未检测', src: '—', state: 'na', note: '鳞癌不作为常规检测项；医生未开' },
    { k: 'CLDN18.2', v: '未检测', src: '—', state: 'na', note: '常规只对腺癌 / EGJ 关注' },
  ],

  /* 治疗线（治疗历程页顶部三条） */
  lines: [
    { name: '一线 · 新辅助化疗（FP）', detail: '顺铂 + 5-FU，2 周期（2026-04-28 → 2026-05-26）', done: true },
    { name: '一线 · 根治性同步放化疗', detail: '放疗 50.4 Gy/28 次 + 紫杉醇 / 卡铂周疗（2026-06-02 → 2026-07-10）', done: true },
    { name: '免疫巩固', detail: 'PD-1 抑制剂单药，每 3 周（2026-07-02 起）', done: false },
  ],

  cycles: [
    ['dCRT-1', '2026-06-02', '紫杉醇 50 mg/m² + 卡铂 AUC 1.5 周疗；放疗第 1 周', '已完成', true],
    ['dCRT-2', '2026-06-09', '同上；放疗第 2 周', '已完成', true],
    ['dCRT-3', '2026-06-16', '同上；放疗第 3 周（白细胞最低）', '已完成', true],
    ['dCRT-4', '2026-06-23', '同上；放疗第 4 周', '已完成', true],
    ['dCRT-5', '2026-06-30', '同上；放疗第 5 周', '已完成', true],
    ['巩固-1', '2026-07-02', 'PD-1 抑制剂 200 mg', '已完成', true],
    ['巩固-2', '2026-07-23', 'PD-1 抑制剂 200 mg', '已完成', true],
    ['巩固-3', '2026-08-13', 'PD-1 抑制剂 200 mg', '已完成', true],
    ['巩固-4', '2026-09-03', 'PD-1 抑制剂 200 mg', '已完成', true],
    ['巩固-5', '2026-09-24', 'PD-1 抑制剂 200 mg', '已完成', true],
    ['巩固-6', '2026-10-15', 'PD-1 抑制剂 200 mg', '已完成', true],
  ],

  /* 治疗路径三选一：既往一条 + 当前一条，切换留旧不覆盖（E-A3） */
  pathway: {
    title: '治疗路径（当前 / 既往）',
    rows: [
      ['既往', '新辅助化疗（FP）→ 计划手术', '2026-04-28 → 2026-05-26', '顺铂 + 5-FU，2 周期；原计划 2026-06-08 手术',
        '2026-05-26 多学科讨论后改为不手术。医生原话：「病变范围偏长、退缩不明显，建议走根治性放化疗」'],
      ['当前', '根治性同步放化疗 + 免疫巩固', '2026-06-02 → 进行中', '放疗 50.4 Gy/28 次 + 紫杉醇 / 卡铂周疗；2026-07-02 起 PD-1 抑制剂维持',
        '医生原话：「先做根治量放疗，结束后免疫维持，暂不考虑手术」'],
    ],
  },

  /* A 未手术：surgery = null（subjects.surgery_title 写 NULL，读模型返回 null） */
  surgery: null,

  /* 部位分段（E-A1 / E-A2）：逐段写，EGJ 档案才写 Siewert */
  segment: {
    title: '部位分段（内镜 + 食管造影 2026-04-26）',
    rows: [
      ['颈段', '未受累', '内镜报告原文摘录'],
      ['胸上段', '未受累', '同上'],
      ['胸中段', '主体病变：距门齿 28–32 cm，长约 4.5 cm', '内镜 + 食管造影'],
      ['胸下段', '下缘未累及', '同上'],
      ['EGJ', '未受累', '同上'],
      ['Siewert 分型', '不适用（病变不在 EGJ）', '内镜报告未描述'],
    ],
  },

  /* 吞咽自查六档（E-A4）：self=1 是患者自查，self=0 是医生/内镜评估 */
  swallow: {
    title: '吞咽自查（六档，按时间倒序）',
    rows: [
      ['2026-10-16', '软食', '能吃软饭、面条，需要汤水送', 1],
      ['2026-09-18', '软食', '支架后第 2 个月，比扩张后稳一些', 1],
      ['2026-08-22', '半流', '支架置入后第 2 天，米糊和蛋羹', 1],
      ['2026-08-18', '流食', '支架术前，喝米汤都费劲', 1],
      ['2026-08-16', '完全梗阻', '连水都咽不下去，当天联系了门诊', 1],
      ['2026-07-20', '流食', '巩固第 1 周期，只能喝匀浆', 1],
      ['2026-06-25', '水呛', '喝清水会呛，改成喝稠的', 1],
      ['2026-06-10', '流食', '放疗第 2 周，馒头咽不下去', 1],
      ['2026-05-20', '半流', '新辅助第 2 周期后', 1],
      ['2026-04-26', '软食', '内镜报告：管腔狭窄约 1/2，镜身可通过（原文摘录）', 0],
      ['2026-04-20', '软食', '确诊前，干饭要泡汤才咽得下', 1],
    ],
  },

  /* 进食通路档案（E-A5）：可并列多条，各带起止，不排利弊 */
  access: {
    title: '进食通路档案（可并列，按开始时间倒序）',
    rows: [
      ['食管支架', '2026-08-20', null, '医生原话：「狭窄段放个支架，先把通路打开，后面能不能取看复查」', 1, '内镜下置入覆膜支架'],
      ['鼻肠管（鼻饲）', '2026-06-18', '2026-08-20', '医生原话：「放疗期间吃得不够，先放鼻肠管把热量补上」', 0, '置管 63 天；支架置入当天拔除'],
      ['经口', '2026-04-20', null, '全程保留经口，按耐受调整食物质地', 1, '—'],
    ],
  },

  dilation: {
    title: '扩张记录（只记事实：日期 / 次数 / 机构）',
    rows: [
      ['2026-09-16', '第 3 次', '市第一人民医院 · 消化内镜中心', '支架上端再狭窄，球囊扩张至 12 mm'],
      ['2026-07-08', '第 2 次', '市第一人民医院 · 消化内镜中心', '放疗后狭窄加重，探条扩张'],
      ['2026-05-28', '第 1 次', '市第一人民医院 · 消化内镜中心', '新辅助后吞咽变差，探条扩张'],
    ],
  },

  accessEvents: {
    title: '通路相关事件（误吸 / 呛咳 / 移位 / 堵管）',
    rows: [
      ['2026-09-10', '支架上端再狭窄', '吞咽又变差，9 月 16 日做了第 3 次扩张'],
      ['2026-08-30', '支架后胸骨后胀感', '持续约 1 周，医生说常见，未做处理'],
      ['2026-07-15', '鼻肠管堵管', '营养液冲管后通畅'],
      ['2026-06-25', '呛咳', '喝清水呛到一次，之后改喝稠的（自查）'],
    ],
  },

  /* 营养支持页：记"吃了多少"（与通路页分工，E-A9） */
  nutrition: {
    title: '进食量记录（每餐份量按自述，不做热量换算）',
    rows: [
      ['2026-10-17', '午餐', '约七分饱', '软饭半碗 + 蒸蛋 + 豆腐', '无', '支架后第 2 个月'],
      ['2026-10-10', '早餐', '约五分饱', '小米粥 + 鸡蛋羹', '轻微哽噎', '—'],
      ['2026-09-20', '晚餐', '约六分饱', '烂面条 + 鱼肉', '无', '第 3 次扩张后 4 天'],
      ['2026-08-25', '午餐', '约五分饱', '米糊 + 肉末', '支架后仍有异物感', '—'],
      ['2026-07-25', '午餐', '约四分饱', '匀浆膳 300 mL（经鼻肠管）', '腹胀', '鼻饲期间'],
      ['2026-06-20', '晚餐', '约三分饱', '米汤 + 营养粉', '咽下费力', '放疗后期'],
    ],
  },

  supplements: [
    ['口服营养补充（ONS）', '医嘱原文：整蛋白型营养粉，每日 1–2 次，两餐之间冲服', '2026-06-18', '2026-08-20', '营养门诊 2026-06-18'],
    ['复合维生素', '医嘱原文：每日 1 片，随餐', '2026-06-02', null, '放疗科医嘱 2026-06-02'],
    ['钙 + 维生素 D', '医嘱原文：每日 1 片', '2026-06-02', null, '放疗科医嘱 2026-06-02'],
    ['蛋白粉（乳清）', '医嘱原文：每日 1 勺，加入流食', '2026-08-20', null, '营养门诊 2026-08-20'],
  ],

  monitor: {
    title: '随访安排与第二原发监测（只记医生安排）',
    rows: [
      ['胃镜随访', '每 3–6 个月（医生安排）', '2026-09-16', '2026-12 前后', 'dCRT 后随访；下次时间以门诊预约为准'],
      ['胸腹盆 CT', '每 6 个月（医生安排）', '2026-10-08', '2027-04 前后', '—'],
      ['头颈部检查（第二原发监测）', '每年 1 次（医生安排）', null, '2027-04 前后', '医生原话：「吸烟 30 年，头颈和肺一起随访」'],
      ['胸部低剂量 CT（第二原发监测）', '每年 1 次（医生安排）', '2026-10-08', '2027-10 前后', '同上'],
      ['体重与白蛋白', '每次复诊', '2026-10-16', '2026-11-13 前后', '营养门诊医嘱'],
    ],
  },

  endoscopy: {
    title: '内镜与影像随访（逐次记录，已发生的检查）',
    rows: [
      ['2026-10-08', '胸腹盆 CT', '原发灶较放疗前缩小，未见新发病灶（报告结论摘录）', '6 个月后复查', '影像科报告'],
      ['2026-09-16', '胃镜', '支架上端狭窄，镜身可通过；取活检 2 块（病理未见肿瘤）', '3 个月后复查', '内镜报告'],
      ['2026-06-20', '食管造影', '中段狭窄，钡剂通过缓慢，未见明确瘘（报告结论摘录）', '—', '放疗中评估'],
      ['2026-04-26', '胃镜 + 活检', '胸中段见溃疡型病变，长约 4.5 cm，距门齿 28–32 cm；活检：鳞状细胞癌', '—', '确诊检查'],
    ],
  },

  rhythm: [
    ['肿瘤科门诊', '每 3 周（巩固期）', '医生安排', '2026-11-05 前后'],
    ['胃镜', '每 3–6 个月', '医生安排', '2026-12 前后'],
    ['胸腹盆 CT', '每 6 个月', '医生安排', '2027-04 前后'],
    ['营养门诊', '每 4–6 周', '医生安排', '2026-11-13 前后'],
    ['血常规 + 生化', '每次治疗前', '医生安排', '2026-11-05 前后'],
  ],

  events: [
    ['2026-04-26', '确诊（胃镜活检）'],
    ['2026-04-28', '开始新辅助化疗'],
    ['2026-05-26', '路径改为根治性放化疗'],
    ['2026-06-02', '开始同步放化疗'],
    ['2026-06-18', '放置鼻肠管'],
    ['2026-07-02', '开始免疫巩固'],
    ['2026-08-20', '食管支架置入'],
    ['2026-09-16', '第 3 次扩张'],
  ],

  viewpoints: [
    ['2026-05-28', '还行', '今天能喝下半碗粥，比上周好'],
    ['2026-07-15', '有点累', '放疗结束后反而更没力气，不知道是不是正常'],
    ['2026-09-20', '踏实些', '支架之后能吃饭了，虽然还是要汤水送'],
  ],

  docs: [
    ['A-D1', '胃镜报告 2026-04-26.pdf', '2026-04-26', '内镜报告', '已解析'],
    ['A-D2', '病理报告 2026-04-30.pdf', '2026-04-30', '病理报告', '已解析'],
    ['A-D3', '放疗计划单 2026-06-02.pdf', '2026-06-02', '治疗记录', '已入库'],
    ['A-D4', '胸腹盆 CT 报告 2026-10-08.pdf', '2026-10-08', '影像报告', '已解析'],
    ['A-D5', '血常规 2026-10-16.jpg', '2026-10-16', '化验单', '待核对'],
  ],

  candidates: [
    ['A-C1', 'SCC-Ag', '1.8', '血生化报告 2026-10-16', '待确认'],
    ['A-C2', '白蛋白', '36.2', '血生化报告 2026-10-16', '待确认'],
    ['A-C3', '体重', '63.4', '营养门诊记录 2026-10-16', '已接受'],
  ],

  pathology: {
    title: '病理与免疫组化',
    status: '已出（2026-04-30）',
    rows: [
      ['病理类型', '鳞状细胞癌（中分化）'],
      ['取材方式', '胃镜活检（2026-04-26）'],
      ['免疫组化', 'CK5/6 (+)、p40 (+)、p63 (+)'],
      ['PD-L1', 'CPS 15（22C3）'],
      ['MMR', 'pMMR / MSS'],
    ],
    gaps: [
      ['HER2', '鳞癌未检测；如需系统治疗可按医生意见补做'],
      ['EBV', '未检测（医生未开）'],
    ],
  },

  /* A 专属指标：SCC-Ag / CYFRA21-1 只在鳞癌档案出现（E-A8） */
  extraMetrics: [
    { key: 'scc', name: 'SCC-Ag', unit: 'ng/mL', dec: 1, band: [0, 2.5], note: '鳞癌相关；单次波动不等于病情变化', ...cat('肿瘤标志物'),
      points: pts([
        ['2026-04-24', 4.6, '确诊时'], ['2026-05-26', 3.9, '新辅助后'], ['2026-06-30', 2.8, 'dCRT 结束'],
        ['2026-07-28', 2.2, '巩固-2 前'], ['2026-08-25', 1.9, '支架置入后'], ['2026-09-29', 1.8, '巩固-6 前'],
        ['2026-10-16', 1.7, '复诊']]) },
    { key: 'cyfra', name: 'CYFRA21-1', unit: 'ng/mL', dec: 1, band: [0, 3.3], note: '细胞角蛋白 19 片段；与 SCC-Ag 一起看', ...cat('肿瘤标志物'),
      points: pts([
        ['2026-04-24', 5.8, '确诊时'], ['2026-06-30', 3.6, 'dCRT 结束'],
        ['2026-08-25', 3.1, '支架置入后'], ['2026-10-16', 2.9, '复诊']]) },
    { key: 'cea', name: 'CEA', unit: 'ng/mL', dec: 1, band: [0, 5], note: '非鳞癌特异，作为对照看', ...cat('肿瘤标志物'),
      points: pts([
        ['2026-04-24', 2.4, '确诊时'], ['2026-06-30', 2.0, 'dCRT 结束'],
        ['2026-08-25', 1.8, '支架置入后'], ['2026-10-16', 1.7, '复诊']]) },
    { key: 'swallow', name: '吞咽等级', dec: null, kind: 'qual', band: null, note: '自查，不是医生评估（六档：普食 / 软食 / 半流 / 流食 / 水呛 / 完全梗阻）', ...cat('吞咽与症状'),
      points: pts([
        ['2026-04-20', '软食', '自查'], ['2026-05-20', '半流', '自查'], ['2026-06-10', '流食', '自查'],
        ['2026-06-25', '水呛', '自查'], ['2026-07-20', '流食', '自查'], ['2026-08-16', '完全梗阻', '自查'],
        ['2026-08-22', '半流', '自查'], ['2026-09-18', '软食', '自查'], ['2026-10-16', '软食', '自查']]) },
    { key: 'meal', name: '每餐份量', dec: null, kind: 'qual', band: null, note: '按自述记，不做热量换算', ...cat('吞咽与症状'),
      points: pts([
        ['2026-04-24', '约七分饱', '自查'], ['2026-06-30', '约三分饱', '自查'],
        ['2026-07-28', '约四分饱', '自查'], ['2026-08-25', '约五分饱', '自查'], ['2026-10-16', '约七分饱', '自查']]) },
    { key: 'esophagitis', name: '放射性食管炎', dec: null, kind: 'grade', band: null, note: '按医生记录的症状分级抄录，不做判断', ...cat('吞咽与症状'),
      points: pts([
        ['2026-06-02', '1 级', '放疗科记录'], ['2026-06-16', '2 级', '放疗科记录'],
        ['2026-06-30', '2 级', '放疗科记录'], ['2026-07-14', '1 级', '放疗科记录'], ['2026-08-11', '0 级', '放疗科记录']]) },
    { key: 'cough', name: '呛咳', dec: null, kind: 'qual', band: null, note: '自查；频繁发生要写进就诊清单', ...cat('吞咽与症状'),
      points: pts([
        ['2026-06-25', '偶有', '自查'], ['2026-07-14', '偶有', '自查'],
        ['2026-08-25', '无', '自查'], ['2026-10-16', '无', '自查']]) },
  ],
};

/* ---------- 档案 B：EGJ 腺癌 Siewert Ⅱ，围手术期路径 ---------- */

const PROFILE_B = {
  name: '顾晓兰',
  sex: '女',
  age: 55,
  meta: 'EGJ 腺癌 Siewert Ⅱ · 术后 · 中学教师',
  headline: 'EGJ 腺癌 Siewert Ⅱ，FLOT 新辅助后行 Ivor Lewis 手术，现术后辅助治疗',
  stage: 'ypT3N1M0 ⅢB 期（术后）',
  mindset: '术后最在意反流和体重，正在记录每餐',
  dash_keys: ['wt', 'alb', 'cea', 'swallow'],
  path: ['腺癌', 'EGJ Siewert Ⅱ', 'ypT3N1M0', '手术 + 术后辅助'],
  activity: '术后第 2 个月开始每天快走 20 分钟',
  familyTalk: '丈夫负责做饭，女儿周末回来帮忙记录',

  molecular: [
    { k: 'HER2', v: 'IHC 2+，FISH 无扩增', src: '病理科 2026-07-08', state: 'ok', note: '术后标本复核' },
    { k: 'PD-L1 CPS', v: 'CPS 5', src: '病理科 2026-07-08', state: 'ok', note: '22C3 检测' },
    { k: 'MSI / MMR', v: 'pMMR / MSS', src: '病理科 2026-07-08', state: 'ok', note: '—' },
    { k: 'CLDN18.2', v: '待出', src: '外送检测 2026-09-20', state: 'pending', note: '预计 2026-10 底出结果（待出 ≠ 阴性）' },
  ],

  lines: [
    { name: '一线 · 新辅助 FLOT', detail: '氟尿嘧啶 + 亚叶酸钙 + 奥沙利铂 + 多西他赛，4 周期（2026-04-28 → 2026-06-16）', done: true },
    { name: '手术', detail: 'Ivor Lewis 食管胃部分切除 + 胃代食管（2026-07-02）', done: true },
    { name: '术后辅助', detail: 'FLOT 方案，计划 4 周期（2026-08-20 起）', done: false },
  ],

  cycles: [
    ['FLOT-1', '2026-04-28', '氟尿嘧啶 + 亚叶酸钙 + 奥沙利铂 + 多西他赛', '已完成', true],
    ['FLOT-2', '2026-05-19', '同上', '已完成', true],
    ['FLOT-3', '2026-06-02', '同上', '已完成', true],
    ['FLOT-4', '2026-06-16', '同上（术前最后一周期）', '已完成', true],
    ['辅助-1', '2026-08-20', 'FLOT 方案', '已完成', true],
    ['辅助-2', '2026-09-10', 'FLOT 方案', '已完成', true],
    ['辅助-3', '2026-10-01', 'FLOT 方案', '已完成', true],
    ['辅助-4', '2026-10-22', 'FLOT 方案（计划）', '待开始', false],
  ],

  pathway: {
    title: '治疗路径（当前 / 既往）',
    rows: [
      ['既往', '新辅助 FLOT（术前）', '2026-04-28 → 2026-06-16', 'FLOT 4 周期',
        '2026-06-18 影像评估 PR。医生原话：「可以按计划手术」'],
      ['当前', '手术 + 术后辅助治疗', '2026-07-02 → 进行中', 'Ivor Lewis 食管胃部分切除 + 胃代食管；2026-08-20 起 FLOT 辅助',
        '医生原话：「术后病理 ypT3N1M0，建议完成 4 周期辅助」'],
    ],
  },

  surgery: {
    title: '手术与吻合口（2026-07-02）',
    rows: [
      ['2026-07-02', 'Ivor Lewis（右胸 + 上腹两切口）', '胃代食管，胸内弓上吻合（25 mm 管状胃）', '省肿瘤医院 · 胸外科', '手术记录摘录：出血约 200 mL，未输血'],
      ['2026-07-02', '淋巴结清扫', '胸腹二野清扫，送检 21 枚，阳性 3 枚', '省肿瘤医院 · 胸外科', '病理报告摘录'],
    ],
  },

  segment: {
    title: '部位分段（内镜 + CT 2026-04-24）',
    rows: [
      ['颈段', '未受累', '内镜报告原文摘录'],
      ['胸上段', '未受累', '同上'],
      ['胸中段', '未受累', '同上'],
      ['胸下段', '下段受累，病变累及 EGJ', '内镜 + 胸腹盆 CT'],
      ['EGJ', '受累（Siewert Ⅱ）', '内镜 + CT'],
      ['Siewert 分型', 'Ⅱ 型（医生给出：肿瘤中心位于贲门上方 1–2 cm）', '胃镜报告 2026-04-24 原文摘录'],
    ],
  },

  swallow: {
    title: '吞咽自查（六档，按时间倒序）',
    rows: [
      ['2026-10-18', '普食', '第 2 次扩张后一周，能吃正常饭菜了', 1],
      ['2026-10-14', '软食', '能吃软饭和面条，需要慢慢嚼', 1],
      ['2026-09-24', '半流', '扩张后第 3 天，粥和蒸蛋顺一些', 1],
      ['2026-09-10', '流食', '吻合口狭窄，喝粥也梗', 1],
      ['2026-08-15', '半流', '术后 6 周，米糊为主', 1],
      ['2026-07-22', '流食', '刚拔鼻胃管，只能喝米汤', 1],
      ['2026-07-08', '流食', '术后第 6 天，少量饮水', 1],
      ['2026-06-20', '软食', '新辅助结束、术前评估', 1],
      ['2026-04-24', '软食', '内镜：EGJ 见溃疡型病变累及齿状线（原文摘录）', 0],
      ['2026-04-20', '软食', '吃饭要配水，饭后有反酸', 1],
    ],
  },

  access: {
    title: '进食通路档案（可并列，按开始时间倒序）',
    rows: [
      ['空肠造瘘（管饲）', '2026-07-02', '2026-08-10', '医生原话：「术后早期经造瘘管打营养，逐步过渡到经口」', 0, '手术同期置管；拔管后伤口愈合'],
      ['鼻胃管', '2026-07-02', '2026-07-08', '术后常规减压', 0, '术后第 6 天拔除'],
      ['经口', '2026-07-08', null, '医生原话：「先少量饮水，逐步加量」', 1, '—'],
    ],
  },

  dilation: {
    title: '扩张记录（只记事实：日期 / 次数 / 机构）',
    rows: [
      ['2026-10-08', '第 2 次', '省肿瘤医院 · 内镜中心', '吻合口狭窄，球囊扩张至 15 mm'],
      ['2026-08-28', '第 1 次', '省肿瘤医院 · 内镜中心', '吻合口狭窄，球囊扩张至 12 mm'],
    ],
  },

  accessEvents: {
    title: '通路相关事件（误吸 / 呛咳 / 移位 / 堵管）',
    rows: [
      ['2026-09-28', '夜间反流', '垫高枕头后减轻（自查）'],
      ['2026-09-05', '吻合口狭窄', '进食变慢，内镜确认；9 月 10 日起改流食'],
      ['2026-07-18', '造瘘管周围渗液', '换药后好转'],
      ['2026-07-15', '餐后心慌出汗', '进食后 20 分钟出现，记录后在门诊提出（自查）'],
    ],
  },

  nutrition: {
    title: '进食量记录（每餐份量按自述，不做热量换算）',
    rows: [
      ['2026-10-15', '晚餐', '约八分饱', '软饭大半碗 + 清蒸鱼 + 青菜', '饭后轻微反酸', '—'],
      ['2026-10-09', '午餐', '约七分饱', '面条 + 鸡蛋 + 肉末', '无', '第 2 次扩张后 1 天'],
      ['2026-09-12', '午餐', '约五分饱', '米糊 + 鱼肉泥', '哽噎', '吻合口狭窄期间'],
      ['2026-08-25', '早餐', '约六分饱', '小米粥 + 蒸蛋', '无', '—'],
      ['2026-07-25', '午餐', '约五分饱', '匀浆膳 250 mL（经造瘘管）', '腹胀', '管饲期间'],
      ['2026-07-05', '流食', '约三分饱', '米汤 150 mL', '—', '术后第 3 天'],
    ],
  },

  supplements: [
    ['口服营养补充（ONS）', '医嘱原文：整蛋白型营养粉，每日 2 次，两餐之间', '2026-07-10', null, '营养门诊 2026-07-10'],
    ['维生素 B12', '医嘱原文：每日 1 片（胃部分切除后）', '2026-07-20', null, '营养门诊 2026-07-20'],
    ['铁剂', '医嘱原文：隔日 1 片，与维生素 C 同服', '2026-08-05', null, '营养门诊 2026-08-05'],
    ['钙 + 维生素 D', '医嘱原文：每日 1 片', '2026-07-20', null, '营养门诊 2026-07-20'],
  ],

  monitor: {
    title: '随访安排（只记医生安排）',
    rows: [
      ['胃镜随访', '每 6–12 个月（医生安排）', '2026-10-08（扩张时顺带复查）', '2027-09 前后', '术后随访'],
      ['胸腹盆 CT', '每 6 个月（医生安排）', '2026-10-06', '2027-04 前后', '—'],
      ['营养门诊', '每 4–6 周（医生安排）', '2026-10-14', '2026-11-11 前后', '—'],
      ['体重与白蛋白', '每次复诊', '2026-10-14', '2026-11-11 前后', '营养门诊医嘱'],
    ],
  },

  endoscopy: {
    title: '内镜与影像随访（逐次记录，已发生的检查）',
    rows: [
      ['2026-10-08', '胃镜', '吻合口狭窄，镜身可通过；活检未见肿瘤', '3 个月后复查', '内镜报告'],
      ['2026-10-06', '胸腹盆 CT', '吻合口未见明显增厚，腹腔未见新发病灶（报告结论摘录）', '6 个月后复查', '影像科报告'],
      ['2026-07-06', '病理（术后）', 'ypT3N1M0，R0 切除，脉管侵犯（+），神经侵犯（−）', '—', '病理报告摘录'],
      ['2026-04-24', '胃镜 + 活检', 'EGJ 见溃疡型病变累及齿状线，活检：腺癌', '—', '确诊检查'],
    ],
  },

  rhythm: [
    ['肿瘤科门诊', '每 3 周（辅助期）', '医生安排', '2026-11-05 前后'],
    ['胃镜', '每 6–12 个月', '医生安排', '2027-09 前后'],
    ['胸腹盆 CT', '每 6 个月', '医生安排', '2027-04 前后'],
    ['营养门诊', '每 4–6 周', '医生安排', '2026-11-11 前后'],
    ['血常规 + 生化', '每次治疗前', '医生安排', '2026-11-05 前后'],
  ],

  events: [
    ['2026-04-24', '确诊（胃镜活检）'],
    ['2026-04-28', '开始 FLOT 新辅助'],
    ['2026-06-16', '新辅助结束'],
    ['2026-07-02', 'Ivor Lewis 手术'],
    ['2026-08-20', '开始术后辅助'],
    ['2026-08-28', '第 1 次吻合口扩张'],
    ['2026-10-08', '第 2 次吻合口扩张'],
  ],

  viewpoints: [
    ['2026-07-20', '熬过来了', '术后第 3 周，能自己下床走两圈'],
    ['2026-09-12', '有点着急', '吃不下东西，体重又掉了'],
    ['2026-10-14', '松口气', '扩张后能吃饭了，反流还在，垫高枕头睡'],
  ],

  docs: [
    ['B-D1', '胃镜报告 2026-04-24.pdf', '2026-04-24', '内镜报告', '已解析'],
    ['B-D2', '术前 CT 2026-06-18.pdf', '2026-06-18', '影像报告', '已解析'],
    ['B-D3', '手术记录 2026-07-02.pdf', '2026-07-02', '手术记录', '已入库'],
    ['B-D4', '术后病理 2026-07-06.pdf', '2026-07-06', '病理报告', '已解析'],
    ['B-D5', '血常规 2026-10-14.jpg', '2026-10-14', '化验单', '已接受'],
    ['B-D6', 'CLDN18.2 外送申请单 2026-09-20.pdf', '2026-09-20', '检测申请', '待核对'],
  ],

  candidates: [
    ['B-C1', 'CEA', '3.2', '血生化报告 2026-10-14', '待确认'],
    ['B-C2', '白蛋白', '38.6', '血生化报告 2026-10-14', '已接受'],
    ['B-C3', '体重', '52.8', '营养门诊记录 2026-10-14', '已接受'],
  ],

  pathology: {
    title: '病理与免疫组化',
    status: '已出（术后 2026-07-06）',
    rows: [
      ['病理类型', '腺癌（肠型，中分化）'],
      ['取材方式', '手术标本（Ivor Lewis）'],
      ['浸润深度', 'ypT3（侵及食管外膜）'],
      ['淋巴结', 'ypN1（3/21）'],
      ['切缘', 'R0'],
      ['HER2', 'IHC 2+，FISH 无扩增'],
      ['PD-L1', 'CPS 5'],
      ['MMR', 'pMMR / MSS'],
    ],
    gaps: [
      ['CLDN18.2', '外送检测中，预计 2026-10 底出结果'],
      ['EBV', '未检测（医生未开）'],
    ],
  },

  /* B 是腺癌：不给 SCC-Ag / CYFRA21-1（E-A8） */
  extraMetrics: [
    { key: 'cea', name: 'CEA', unit: 'ng/mL', dec: 1, band: [0, 5], note: '腺癌常用；单次波动不等于病情变化', ...cat('肿瘤标志物'),
      points: pts([
        ['2026-04-24', 5.8, '确诊时'], ['2026-06-16', 4.2, '新辅助结束'], ['2026-07-08', 3.6, '术后第 6 天'],
        ['2026-08-20', 3.4, '辅助-1 前'], ['2026-10-14', 3.2, '复诊']]) },
    { key: 'ca199', name: 'CA19-9', unit: 'U/mL', dec: 0, band: [0, 37], note: '—', ...cat('肿瘤标志物'),
      points: pts([
        ['2026-04-24', 42, '确诊时'], ['2026-06-16', 30, '新辅助结束'],
        ['2026-08-20', 26, '辅助-1 前'], ['2026-10-14', 24, '复诊']]) },
    { key: 'ca724', name: 'CA72-4', unit: 'U/mL', dec: 1, band: [0, 6.9], note: '—', ...cat('肿瘤标志物'),
      points: pts([
        ['2026-04-24', 8.4, '确诊时'], ['2026-06-16', 6.2, '新辅助结束'], ['2026-10-14', 5.4, '复诊']]) },
    { key: 'swallow', name: '吞咽等级', dec: null, kind: 'qual', band: null, note: '自查，不是医生评估（六档：普食 / 软食 / 半流 / 流食 / 水呛 / 完全梗阻）', ...cat('吞咽与症状'),
      points: pts([
        ['2026-04-20', '软食', '自查'], ['2026-06-20', '软食', '自查'], ['2026-07-08', '流食', '自查'],
        ['2026-07-22', '流食', '自查'], ['2026-08-15', '半流', '自查'], ['2026-09-10', '流食', '自查'],
        ['2026-09-24', '半流', '自查'], ['2026-10-14', '软食', '自查'], ['2026-10-18', '普食', '自查']]) },
    { key: 'meal', name: '每餐份量', dec: null, kind: 'qual', band: null, note: '按自述记，不做热量换算', ...cat('吞咽与症状'),
      points: pts([
        ['2026-04-24', '约七分饱', '自查'], ['2026-07-08', '约三分饱', '自查'], ['2026-08-05', '约五分饱', '自查'],
        ['2026-09-10', '约四分饱', '自查'], ['2026-10-14', '约八分饱', '自查']]) },
    { key: 'reflux', name: '反流 / 烧心', dec: null, kind: 'grade', band: null, note: '按医生记录的分级抄录；睡眠姿势调整是患者自述', ...cat('吞咽与症状'),
      points: pts([
        ['2026-07-22', '2 级', '胸外科记录'], ['2026-08-20', '2 级', '胸外科记录'],
        ['2026-09-10', '1 级', '胸外科记录'], ['2026-10-14', '1 级', '胸外科记录']]) },
  ],
};

/* ---------- 试验演示行 ----------
   来自本地资料包 `research/esophageal-cancer/`（200 条真实登记摘录，2026 首次公示）。
   标题是登记标题的中文摘要，原文与资格以链接为准；状态是登记状态，不是入组资格。
   覆盖：dCRT + 免疫 ×2 / 新辅助 ADC ×2 / 术后免疫 ×1 / CLDN18.2-HER2 CAR-NK ×1 /
   GEJ 一线 ×1 / 器官保留 ×1 / 围手术期预康复营养 ×1 / 吻合口扩张与食管旁疝 ×2。 */
const TRIAL_ROWS = [
  ['NCT07836049', '局限期食管鳞癌：特瑞普利单抗诱导 → 根治性放化疗 → 辅助特瑞普利单抗', 'Ⅱ期', '尚未招募', 'Vanderbilt-Ingram Cancer Center'],
  ['NCT07711470', '可切除食管鳞癌：诱导化免疫后放疗，探索器官保留', 'Ⅱ期', '进行中未招募', '中国医学科学院肿瘤医院'],
  ['NCT07823270', '局部晚期食管鳞癌：新辅助 Sacituzumab Tirumotecan（ADC）+ 特瑞普利单抗', 'Ⅱ期', '尚未招募', '河北医科大学第四医院'],
  ['NCT07531979', '食管鳞癌：Becotatug Vedotin（EGFR ADC）+ 替雷利珠单抗 + 化疗（多队列）', 'Ⅱ期', '尚未招募', '天津医科大学肿瘤医院'],
  ['NCT07830355', '食管鳞癌术后残留 / 淋巴结阳性：免疫治疗 + 安罗替尼', 'Ⅱ期', '尚未招募', '上海市胸科医院'],
  ['NCT07622940', '晚期食管腺癌：CLDN18.2 / HER2 双靶 CAR-NK', 'Ⅰ/Ⅱ期', '招募中', 'Beijing Biotech'],
  ['NCT07874425', '转移性胃 / GEJ 腺癌一线：Retlirafusp Alfa + Zeprumetostat + 阿帕替尼 + 化疗', 'Ⅱ期', '尚未招募', '复旦大学'],
  ['NCT07671625', '可手术食管胃结合部癌：预康复 + 营养干预 + 心理支持的围手术期综合项目', 'NA（未分期）', '招募中', 'Masaryk Memorial Cancer Institute'],
  ['NCT07355374', '微创 Ivor Lewis 术后：球囊扩张对胃代食管排空延迟的影响', 'NA（未分期）', '招募中', 'University Hospital, Basel'],
  ['NCT07426835', '机器人食管切除：关闭食管裂孔对照标准做法（食管旁疝发生率）', 'NA（未分期）', '招募中', 'Royal College of Surgeons, Ireland'],
].map(([id, title, phase, status, sponsor]) => ({ id, title, phase, status, sponsor, url: 'https://clinicaltrials.gov/study/' + id }));

/* ---------- 组装 ---------- */

function assemble(P, commonLabs) {
  /* band 必须显式写 null（H3）：分类指标没有区间，读模型按 === null 判定；
     漏写这个键会让 sqlite 存 NULL、读回来变成 null，parity 断言在 band 上来回抖。 */
  const metrics = [...P.extraMetrics, ...commonLabs()].map((m) => ({ ...m, color: KEY_COLOR[m.key] || m.color, band: m.band ?? null }));
  /* extraMetrics 是组装用的中间量，**不能漏进产物**：它和 metrics 里的同一批指标重复，
     多一个键就会让 sqlite 读模型（只有 metrics）与快照 parity 断言对不上。
     原型与开发版都只读 metrics。 */
  const { extraMetrics, ...rest } = P;
  return { ...rest, metrics };
}

const DATA = {
  profiles: { A: assemble(PROFILE_A, commonLabsA), B: assemble(PROFILE_B, commonLabsB) },
  trials: TRIAL_ROWS,
};

/* ---------- 纯数据出口（不碰磁盘） ---------- */

/** 演示档案的纯数据：`{ profiles: {A, B}, trials, meta }`。开发版播种与两个产物都从这里取。 */
export function buildDemoProfiles() {
  return { profiles: DATA.profiles, trials: DATA.trials, meta: buildMeta() };
}

/** demo_meta 的内容：一段免责声明 + 几条统计，落进 sqlite 的 demo_meta 表。 */
function buildMeta() {
  return [
    ['disclaimer', '全部患者数据为虚构模拟，仅供原型演示；trials 表为真实登记摘录，登记状态未核实'],
    ['generated_at', new Date().toISOString()],
    ['source', 'demo/build-demo-data.mjs（唯一数据源）'],
    ['subjects', '2'],
    ['window', '2026-04-20..2026-10-18'],
    ['window_label', '演示数据覆盖 2026-04-20 → 2026-10-18（约 6 个月）'],
    ['views', '11'],
    ['metrics_rows', String(Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.length, 0))],
    ['points_rows', String(Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.reduce((b, m) => b + m.points.length, 0), 0))],
  ];
}

/** 只有 `node demo/build-demo-data.mjs` 才落盘；被 import 时不写任何东西。 */
function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(resolve(entry)) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

/* ---------- 产 1：SQLite ---------- */

function writeSqlite() {
  const db = new DatabaseSync(join(ROOT, 'demo/demo-data.sqlite'));
  db.exec(`
/* 这张表的结构必须与 schema/0001_initial.sql 逐列一致（scripts/check-demo-columns.mjs 会比对）。
   改动顺序：先改 schema/0001_*.sql（或新增 0002），再改这里。 */
DROP TABLE IF EXISTS metric_points;
DROP TABLE IF EXISTS metrics; DROP TABLE IF EXISTS molecular;
DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS rhythm; DROP TABLE IF EXISTS cycles;
DROP TABLE IF EXISTS treatment_lines; DROP TABLE IF EXISTS pathway_rows; DROP TABLE IF EXISTS segment_rows;
DROP TABLE IF EXISTS surgery_rows; DROP TABLE IF EXISTS pathology_rows; DROP TABLE IF EXISTS swallow_rows;
DROP TABLE IF EXISTS access_rows; DROP TABLE IF EXISTS dilation_rows; DROP TABLE IF EXISTS access_events;
DROP TABLE IF EXISTS nutrition_rows; DROP TABLE IF EXISTS supplement_rows; DROP TABLE IF EXISTS monitor_rows;
DROP TABLE IF EXISTS endoscopy_rows; DROP TABLE IF EXISTS viewpoints; DROP TABLE IF EXISTS trials;
DROP TABLE IF EXISTS subjects; DROP TABLE IF EXISTS demo_meta; DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS candidate_fields;

CREATE TABLE subjects (
  profile_key TEXT PRIMARY KEY, name TEXT, sex TEXT, age INTEGER, meta TEXT, headline TEXT,
  stage TEXT, mindset TEXT, dash_keys TEXT, path TEXT, activity TEXT, family_talk TEXT,
  pathology_title TEXT, pathology_status TEXT, subtype_title TEXT, segment_title TEXT,
  pathway_title TEXT, surgery_title TEXT, swallow_title TEXT, access_title TEXT,
  nutrition_title TEXT, monitor_title TEXT, endoscopy_title TEXT,
  /* 这两列由 schema/0002_section_titles.sql 追加（ALTER 只能加在末尾，镜像也必须写在最后） */
  dilation_title TEXT, access_events_title TEXT
);
CREATE TABLE metrics (
  profile_key TEXT, key TEXT, name TEXT, unit TEXT, cat TEXT, color TEXT, dec INTEGER,
  kind TEXT, band_low REAL, band_high REAL, note TEXT, PRIMARY KEY (profile_key, key)
);
CREATE TABLE metric_points (
  profile_key TEXT, metric_key TEXT, d TEXT, v_num REAL, v_text TEXT, src TEXT, ord INTEGER,
  PRIMARY KEY (profile_key, metric_key, d, ord)
);
CREATE TABLE molecular (profile_key TEXT, k TEXT, v TEXT, src TEXT, state TEXT, note TEXT, ord INTEGER);
CREATE TABLE events (profile_key TEXT, d TEXT, label TEXT);
CREATE TABLE rhythm (profile_key TEXT, item TEXT, freq TEXT, guideline TEXT, next TEXT, ord INTEGER);
CREATE TABLE cycles (profile_key TEXT, name TEXT, date TEXT, drugs TEXT, status TEXT, done INTEGER, ord INTEGER);
CREATE TABLE treatment_lines (profile_key TEXT, name TEXT, detail TEXT, done INTEGER, ord INTEGER);
CREATE TABLE pathway_rows (profile_key TEXT, phase TEXT, name TEXT, window TEXT, detail TEXT, note TEXT, ord INTEGER);
CREATE TABLE segment_rows (profile_key TEXT, item TEXT, value TEXT, note TEXT, ord INTEGER);
CREATE TABLE surgery_rows (profile_key TEXT, d TEXT, kind TEXT, recon TEXT, institution TEXT, note TEXT, ord INTEGER);
CREATE TABLE pathology_rows (profile_key TEXT, kind TEXT, a TEXT, b TEXT, ord INTEGER);
CREATE TABLE swallow_rows (profile_key TEXT, d TEXT, level TEXT, note TEXT, self INTEGER, ord INTEGER);
CREATE TABLE access_rows (profile_key TEXT, kind TEXT, start TEXT, end TEXT, doctor_text TEXT, in_use INTEGER, note TEXT, ord INTEGER);
CREATE TABLE dilation_rows (profile_key TEXT, d TEXT, times TEXT, institution TEXT, note TEXT, ord INTEGER);
CREATE TABLE access_events (profile_key TEXT, d TEXT, kind TEXT, detail TEXT, ord INTEGER);
CREATE TABLE nutrition_rows (profile_key TEXT, d TEXT, slot TEXT, amount TEXT, foods TEXT, symptoms TEXT, note TEXT, ord INTEGER);
CREATE TABLE supplement_rows (profile_key TEXT, item TEXT, order_text TEXT, start TEXT, end TEXT, source TEXT, ord INTEGER);
CREATE TABLE monitor_rows (profile_key TEXT, item TEXT, freq TEXT, last TEXT, next TEXT, note TEXT, ord INTEGER);
CREATE TABLE endoscopy_rows (profile_key TEXT, d TEXT, kind TEXT, finding TEXT, next TEXT, note TEXT, ord INTEGER);
CREATE TABLE viewpoints (profile_key TEXT, d TEXT, mood TEXT, text TEXT, ord INTEGER);
CREATE TABLE trials (nct_id TEXT PRIMARY KEY, title TEXT, phase TEXT, status TEXT, sponsor TEXT, url TEXT);
CREATE TABLE demo_meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE documents (profile_key TEXT, id TEXT, name TEXT, date TEXT, type TEXT, status TEXT, ord INTEGER, PRIMARY KEY (profile_key, id));
CREATE TABLE candidate_fields (profile_key TEXT, id TEXT, name TEXT, value TEXT, source TEXT, status TEXT, ord INTEGER, PRIMARY KEY (profile_key, id));

CREATE INDEX idx_points  ON metric_points (profile_key, metric_key);
CREATE INDEX idx_swallow ON swallow_rows  (profile_key, d);
CREATE INDEX idx_docs    ON documents     (profile_key);
`);

  const insSubject = db.prepare(`INSERT INTO subjects
    (profile_key, name, sex, age, meta, headline, stage, mindset, dash_keys, path,
     activity, family_talk, pathology_title, pathology_status, subtype_title, segment_title,
     pathway_title, surgery_title, swallow_title, access_title, nutrition_title, monitor_title, endoscopy_title,
     dilation_title, access_events_title)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insMetric = db.prepare(`INSERT INTO metrics
    (profile_key, key, name, unit, cat, color, dec, kind, band_low, band_high, note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insPoint = db.prepare(`INSERT INTO metric_points
    (profile_key, metric_key, d, v_num, v_text, src, ord) VALUES (?,?,?,?,?,?,?)`);
  const insMolecular = db.prepare(`INSERT INTO molecular
    (profile_key, k, v, src, state, note, ord) VALUES (?,?,?,?,?,?,?)`);
  const insEvent = db.prepare('INSERT INTO events (profile_key, d, label) VALUES (?,?,?)');
  const insRhythm = db.prepare(`INSERT INTO rhythm
    (profile_key, item, freq, guideline, next, ord) VALUES (?,?,?,?,?,?)`);
  const insCycle = db.prepare(`INSERT INTO cycles
    (profile_key, name, date, drugs, status, done, ord) VALUES (?,?,?,?,?,?,?)`);
  const insLine = db.prepare(`INSERT INTO treatment_lines
    (profile_key, name, detail, done, ord) VALUES (?,?,?,?,?)`);
  const insPathway = db.prepare(`INSERT INTO pathway_rows
    (profile_key, phase, name, window, detail, note, ord) VALUES (?,?,?,?,?,?,?)`);
  const insSegment = db.prepare(`INSERT INTO segment_rows
    (profile_key, item, value, note, ord) VALUES (?,?,?,?,?)`);
  const insSurgery = db.prepare(`INSERT INTO surgery_rows
    (profile_key, d, kind, recon, institution, note, ord) VALUES (?,?,?,?,?,?,?)`);
  const insPathology = db.prepare(`INSERT INTO pathology_rows
    (profile_key, kind, a, b, ord) VALUES (?,?,?,?,?)`);
  const insSwallow = db.prepare(`INSERT INTO swallow_rows
    (profile_key, d, level, note, self, ord) VALUES (?,?,?,?,?,?)`);
  const insAccess = db.prepare(`INSERT INTO access_rows
    (profile_key, kind, start, end, doctor_text, in_use, note, ord) VALUES (?,?,?,?,?,?,?,?)`);
  const insDilation = db.prepare(`INSERT INTO dilation_rows
    (profile_key, d, times, institution, note, ord) VALUES (?,?,?,?,?,?)`);
  const insAccessEvent = db.prepare(`INSERT INTO access_events
    (profile_key, d, kind, detail, ord) VALUES (?,?,?,?,?)`);
  const insNutrition = db.prepare(`INSERT INTO nutrition_rows
    (profile_key, d, slot, amount, foods, symptoms, note, ord) VALUES (?,?,?,?,?,?,?,?)`);
  const insSupplement = db.prepare(`INSERT INTO supplement_rows
    (profile_key, item, order_text, start, end, source, ord) VALUES (?,?,?,?,?,?,?)`);
  const insMonitor = db.prepare(`INSERT INTO monitor_rows
    (profile_key, item, freq, last, next, note, ord) VALUES (?,?,?,?,?,?,?)`);
  const insEndoscopy = db.prepare(`INSERT INTO endoscopy_rows
    (profile_key, d, kind, finding, next, note, ord) VALUES (?,?,?,?,?,?,?)`);
  const insViewpoint = db.prepare(`INSERT INTO viewpoints
    (profile_key, d, mood, text, ord) VALUES (?,?,?,?,?)`);
  const insDoc = db.prepare(`INSERT INTO documents
    (profile_key, id, name, date, type, status, ord) VALUES (?,?,?,?,?,?,?)`);
  const insCandidate = db.prepare(`INSERT INTO candidate_fields
    (profile_key, id, name, value, source, status, ord) VALUES (?,?,?,?,?,?,?)`);

  for (const [k, p] of Object.entries(DATA.profiles)) {
    insSubject.run(k, p.name, p.sex, p.age, p.meta, p.headline, p.stage, p.mindset,
      JSON.stringify(p.dash_keys), JSON.stringify(p.path),
      p.activity, p.familyTalk,
      p.pathology ? p.pathology.title : null,
      p.pathology ? p.pathology.status : null,
      null,                                   /* subtype_title：分型页标题由前端静态文案给，不落库 */
      p.segment ? p.segment.title : null,
      p.pathway ? p.pathway.title : null,
      p.surgery ? p.surgery.title : null,
      p.swallow ? p.swallow.title : null,
      p.access ? p.access.title : null,
      p.nutrition ? p.nutrition.title : null,
      p.monitor ? p.monitor.title : null,
      p.endoscopy ? p.endoscopy.title : null,
      p.dilation ? p.dilation.title : null,
      p.accessEvents ? p.accessEvents.title : null);

    for (const m of p.metrics) {
      insMetric.run(k, m.key, m.name, m.unit ?? null, m.cat ?? null, m.color ?? null,
        m.dec ?? null, m.dec === null ? (m.kind || 'qual') : 'numeric',
        m.band ? m.band[0] : null, m.band ? m.band[1] : null, m.note ?? null);
      m.points.forEach((pt, i) => insPoint.run(k, m.key, pt.d,
        typeof pt.v === 'number' ? pt.v : null,
        typeof pt.v === 'number' ? null : pt.v,
        pt.src ?? null, i));
    }
    p.molecular.forEach((x, i) => insMolecular.run(k, x.k, x.v, x.src ?? null, x.state ?? null, x.note ?? null, i));
    p.events.forEach((e) => insEvent.run(k, e[0], e[1]));
    p.rhythm.forEach((r, i) => insRhythm.run(k, r[0], r[1], r[2], r[3], i));
    p.cycles.forEach((c, i) => insCycle.run(k, c[0], c[1], c[2], c[3], c[4] ? 1 : 0, i));
    p.lines.forEach((l, i) => insLine.run(k, l.name, l.detail, l.done ? 1 : 0, i));
    if (p.pathway) p.pathway.rows.forEach((r, i) => insPathway.run(k, r[0], r[1], r[2], r[3], r[4], i));
    if (p.segment) p.segment.rows.forEach((r, i) => insSegment.run(k, r[0], r[1], r[2], i));
    if (p.surgery) p.surgery.rows.forEach((r, i) => insSurgery.run(k, r[0], r[1], r[2], r[3], r[4], i));
    p.pathology.rows.forEach((r, i) => insPathology.run(k, 'row', r[0], r[1], i));
    p.pathology.gaps.forEach((r, i) => insPathology.run(k, 'gap', r[0], r[1], i));
    if (p.swallow) p.swallow.rows.forEach((r, i) => insSwallow.run(k, r[0], r[1], r[2], r[3] ? 1 : 0, i));
    if (p.access) p.access.rows.forEach((r, i) => insAccess.run(k, r[0], r[1], r[2] ?? null, r[3], r[4] ? 1 : 0, r[5], i));
    if (p.dilation) p.dilation.rows.forEach((r, i) => insDilation.run(k, r[0], r[1], r[2], r[3], i));
    if (p.accessEvents) p.accessEvents.rows.forEach((r, i) => insAccessEvent.run(k, r[0], r[1], r[2], i));
    if (p.nutrition) p.nutrition.rows.forEach((r, i) => insNutrition.run(k, r[0], r[1], r[2], r[3], r[4], r[5], i));
    p.supplements.forEach((r, i) => insSupplement.run(k, r[0], r[1], r[2], r[3] ?? null, r[4], i));
    if (p.monitor) p.monitor.rows.forEach((r, i) => insMonitor.run(k, r[0], r[1], r[2] ?? null, r[3], r[4], i));
    if (p.endoscopy) p.endoscopy.rows.forEach((r, i) => insEndoscopy.run(k, r[0], r[1], r[2], r[3], r[4], i));
    p.viewpoints.forEach((v, i) => insViewpoint.run(k, v[0], v[1], v[2], i));
    p.docs.forEach((d, i) => insDoc.run(k, d[0], d[1], d[2], d[3], d[4], i));
    p.candidates.forEach((c, i) => insCandidate.run(k, c[0], c[1], c[2], c[3], c[4], i));
  }

  const insTrial = db.prepare('INSERT INTO trials (nct_id, title, phase, status, sponsor, url) VALUES (?,?,?,?,?,?)');
  DATA.trials.forEach((t) => insTrial.run(t.id, t.title, t.phase, t.status, t.sponsor, t.url));
  const insMeta = db.prepare('INSERT INTO demo_meta (k, v) VALUES (?,?)');
  buildMeta().forEach(([k, v]) => insMeta.run(k, v));
  db.close();
}

/* ---------- 产 2：原型数据层 ---------- */

function writePrototypeJs() {
  /* 只有 profiles 与 trials 进前端快照：meta 是给 sqlite 的统计信息，
     带 generated_at（每次都变），放进快照会让 demo-data.js 每次运行字节都不同。 */
  const js = '/* 由 demo/build-demo-data.mjs 生成；勿手改，改数据请改生成器后重新运行。 */\nwindow.DEMO_DATA = ' + JSON.stringify(DATA) + ';\n';
  writeFileSync(join(P2, 'demo-data.js'), js);
}

/* ---------- 只有被当作脚本直接运行时才落盘 ---------- */
if (isDirectRun()) {
  writeSqlite();
  writePrototypeJs();
  const nMetrics = Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.length, 0);
  const nPoints = Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.reduce((b, m) => b + m.points.length, 0), 0);
  console.log(`demo-data.sqlite + demo-data.js 生成完毕：2 档案 / ${nMetrics} 项指标 / ${nPoints} 个数据点 / ${DATA.trials.length} 条试验`);
}
