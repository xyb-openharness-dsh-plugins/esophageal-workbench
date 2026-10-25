# 疾病概要 · 食管癌

> 本项目实例文件，由 `xyb-workbench-starter` 的 `templates/DISEASE-PRIMER.md` 复制而来。
> 规范：starter `docs/36-DISEASE-PRIMER.md`。四段固定、顺序不变，缺段不合格。

- 项目 / 品牌：小咽宝 EsopPal
- 病种：食管癌（Esophageal Cancer）
- 最后更新：2026-10-25
- 数据文件：`prototypes/v0.2/primer-data.js`（`window.DISEASE_PRIMER`）
- README 对应段：`## 疾病概要`
- 实现：`prototypes/v0.2/primer.js` + `primer.css`（来自 starter `assets/patterns/`，逻辑未改）
- 探针：`NODE_OPTIONS= node scripts/probe-disease-primer.mjs --port 8132 --url http://127.0.0.1:8132/prototypes/v0.2/index.html` → 9/9

## 0 原件状态（本项目的前提）

| 文件 | 状态 |
|---|---|
| CSCO 食管癌诊疗指南 | **未取得原件**：2026 版状态未核验（`docs/CLINICAL-DATA-2026.md`「2026 指南监测入口」） |
| NCCN Esophageal and Esophagogastric Junction Cancers | **未取得原件**：2026 版更新状态未核验 |
| ESMO 食管癌相关指南 | **未取得原件**：2026 更新状态未核验 |
| AJCC Cancer Staging Manual（食管与 EGJ 章节） | **未取得原件**，版本未核实 |
| WHO 消化系统肿瘤分类 | **未取得原件**，版本未核实，仅作命名口径 |

本项目一份指南全文都没有。`docs/USER-RESEARCH.md` 的原话是「CSCO 食管癌指南全文未核对；鳞/腺与 dCRT 路径框架为公认」，
`docs/CLINICAL-DATA-2026.md` 进一步规定：在取得并核对中国现行指南全文之前，工作台不得生成任何「按最新指南」的治疗解释内容。
所以**指南类**来源全部写「未取得原件 · 页码待核」，不引用具体条文、不写具体阈值。趋势段的自采登记数据按一手数据标「原件已取得」，与指南原件分开计。

## 1 定义（`definition`）

食管癌是发生在食管黏膜上皮的恶性肿瘤。第一道分岔不是「几期」，而是病理类型（鳞癌 / 腺癌）与部位分段。

- 病理类型：食管鳞状细胞癌与食管腺癌是两条不同的病程与治疗路径，指南按类型分别列条目；本台要求先选类型再建档（SPEC A1）。
- 部位分段：颈段、胸上段、胸中段、胸下段、食管胃结合部（EGJ）。分段由内镜与影像报告给出，本台只抄原文，不按距门齿距离自行推算。
- EGJ 病变用 Siewert 分型记录（医生给出），本台只留记录位，不自动计算、不据此推荐术式（SPEC A2）。
- 分期用 TNM；本项目未取得 AJCC 原件，版本未核实，报告上的 T/N/M 只抄不判。
- 本台不把「鳞癌 / 腺癌」或「哪一段」解释成严重或好治。

**来源**：CSCO · CSCO 食管癌诊疗指南 · 版本未核实 · 未取得原件，据二次来源 · 页码待核（2026 版状态未核验）｜ NCCN · NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers · 版本未核实 · 未取得原件，据二次来源 · 页码待核 ｜ WHO · WHO 消化系统肿瘤分类 · 版本未核实 · 未取得原件，据二次来源 · 页码待核 ｜ AJCC · AJCC Cancer Staging Manual（食管与 EGJ 章节）· 版本未核实 · 未取得原件，据二次来源 · 页码待核

## 2 医学资料规范和指南情况（`evidence`）

| 机构 | 文件 | 版本 / 年份 | 原件 | 本台的用途 |
|---|---|---|---|---|
| CSCO | CSCO 食管癌诊疗指南 | 版本未核实（2026 版状态未核验） | 未取得原件 | 国内口径：病理类型、分段、治疗路径与随访条目 |
| NCCN | NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers | 版本未核实（2026 版更新状态未核验） | 未取得原件 | 手术、围手术期治疗、dCRT 与系统治疗的条目结构 |
| ESMO | ESMO 食管癌相关指南 | 版本未核实（2026 更新状态未核验） | 未取得原件 | 欧洲口径对照 |
| AJCC | AJCC Cancer Staging Manual（食管与 EGJ 章节） | 版本未核实 | 未取得原件 | TNM 分期字段 |
| WHO | WHO 消化系统肿瘤分类 | 版本未核实 | 未取得原件 | 鳞癌 / 腺癌等病理类型命名 |

- 一台一表，不合并；未取得原件的必须标出来。
- 本项目没有「国内分期 vs TNM」两套体系并存的实测差异，因此不做换算、不造对照列。

**来源**：见上表逐行。

## 3 目前治疗全景概要（`landscape`）

按病期 / 线序分组，只列指南列举过的手段类别，不排序、不比优劣、不含剂量与疗程。

### 3.1 局限期 / 可切除（以手术为主）

- 手术：食管切除 + 淋巴结清扫 + 消化道重建是这一路径的核心；具体术式、切口与重建方式由外科团队按病变位置决定。
- 围手术期治疗：新辅助放化疗、新辅助化疗、新辅助免疫治疗在指南与 2026 年登记研究中都有条目；本台只记录「做过哪一类、起止日期」。
- 早期、局限于黏膜的表浅病变：指南列有内镜下切除（EMR / ESD）这一类别；是否适用由内镜与病理判断，本台不替选。
- 术后辅助：按病理分期、切缘与淋巴结情况，指南列有观察、辅助化疗或辅助放化疗等条目。

### 3.2 根治性放化疗 + 免疫巩固（不手术路径）

- 根治性同步放化疗（dCRT）：放疗与化疗同期进行，作为不做手术时的根治性路径；本项目 2026 登记里「放疗 / 放化疗」主题近似命中 45 条。
- 免疫巩固：dCRT 结束后进入免疫治疗维持阶段，指南与登记研究中都单列这一阶段；本台只记录起止与复查节点，不评价疗效。
- 路径切换：从手术路径转到 dCRT、或从 dCRT 转到系统治疗，旧路径记录保留、不覆盖——这是本台的结构要求，不是治疗建议。

### 3.3 晚期 / 复发 / 转移

- 系统治疗：化疗、HER2 靶向（腺癌语境）、免疫检查点抑制剂、CLDN18.2 等靶点在指南与登记研究中出现；具体药是否国内获批、是否在医保内需单独核实。
- 姑息放疗：用于局部症状控制的放疗条目在指南里列出；本台只记录「做过没有、什么时候、几次」。
- 营养与进食通路支持：经口调整、支架、鼻饲、胃造瘘、空肠造瘘都是记录位；本台不推荐品牌、不建议时机、不做分诊。
- 临床研究：指南把「参加登记良好的临床试验」列为一项正式选项，不是最后手段。

### 3.4 贯穿全程的两件事

- 吞咽与营养记录：吞咽自查六档（普食 / 软食 / 半流 / 流食 / 水呛 / 完全梗阻）固定标注「自查，不是医生评估」；体重与白蛋白双序列只画趋势，不判读。
- 随访与第二原发监测：胃镜 + 影像的复查节点按医生安排记录；鳞癌烟酒人群的头颈 / 肺监测只记录「医生安排了什么」，不给风险提示。

**固定出口（原话照抄）**：

> 以上是文献与指南里列出的手段，按病期与线序排列，不代表任何一项适合你。选哪一个，这一句需要问你的医生。

**来源**：CSCO · CSCO 食管癌诊疗指南 · 版本未核实 · 未取得原件 · 页码待核 ｜ NCCN · NCCN Guidelines: Esophageal and Esophagogastric Junction Cancers · 版本未核实 · 未取得原件 · 页码待核 ｜ ClinicalTrials.gov · 2026 年食管癌 / EGJ 干预性研究登记采集 · 快照 2026-10-25 · 原件已取得（本项目自采，200 条）

## 4 发展趋势（`trend`）

只写已发生的事实，每条带日期或版本号。

1. 截至 2026-10-25：ClinicalTrials.gov 上首次公示于 2026-01-01 之后的食管癌 / 食管胃结合部干预性研究共 200 条（疾病特异 190 条 + 篮式 10 条）。
2. 截至 2026-10-25，同一批 200 条的登记状态：RECRUITING 103、NOT_YET_RECRUITING 82、COMPLETED 6、ACTIVE_NOT_RECRUITING 6、ENROLLING_BY_INVITATION 3。
3. 截至 2026-10-25，同一批 200 条的分期分布：PHASE2 92、NA（未标注 / 不适用）31、PHASE1 27、PHASE3 22、PHASE1|PHASE2 16、PHASE4 4、EARLY_PHASE1 4、PHASE2|PHASE3 4。
4. 截至 2026-10-25，同一批 200 条中 108 条含中国中心；主题关键词近似命中：免疫治疗 85、鳞癌 84、腺癌 / GEJ 80、手术相关 68、新辅助 / 围手术期 55、放疗 / 放化疗 45（同一研究可命中多个主题，计数为量级参考，不是精确分类）。
5. 采集边界：ChinaDrugTrials 与 ChiCTR 本轮未采集（2026 记录数未知），因此上述 200 条只代表 ClinicalTrials.gov 这一组查询与过滤口径，不代表所有注册库。

**未写**：指南版本更替（CSCO 2026 / NCCN 2026 / ESMO 2026 状态未核验）、监管批件（本项目没有核实任何 NMPA 批件）、分类体系更新（WHO 版本未核实）、指南结构变化（没有原文）——四类整类不写，只保留自采登记这一类。

**来源**：ClinicalTrials.gov · 2026 年食管癌 / EGJ 干预性研究登记采集 · 快照 2026-10-25 · 原件已取得（API v2 直连，检索式与过滤口径见 `research/esophageal-cancer/README.md`）｜ 本项目 · research/esophageal-cancer/README.md · 2026-10-25 · 原件已取得（登记状态、分期分布与主题命中数的原始统计）

## 5 落地清单

- [x] `prototypes/v0.2/primer.css`（starter 原样复制）
- [x] `prototypes/v0.2/primer.js`（starter 原样复制，逻辑未改）
- [x] `prototypes/v0.2/primer-data.js`（四段数据）
- [x] `index.html` 三处引用：`primer.css`、`primer-data.js`、`primer.js`
- [x] 顶栏「?」由模块自动插入 `.top-actions`（未手写按钮）
- [x] README 的 `## 疾病概要` 四段正文（位置：首个 `##` 之前，即项目简介之后）
- [x] `NODE_OPTIONS= node scripts/probe-disease-primer.mjs --port 8132 --url …/prototypes/v0.2/index.html` → 9/9 PASS
- [x] `node /Users/qinxiaoqiang/Downloads/xyb-workbench-starter/scripts/check-conformance.mjs .` → primer/* 四条 ok

## 6 验收（P1–P8）

| 编号 | 判据 | 结果 |
|---|---|---|
| P1 | 顶栏有可点「?」，aria-label 说明四段 | ✅ text="?" label="疾病概要：定义、医学资料与指南情况、治疗全景、发展趋势" |
| P2 | 整页面板，四段顺序 定义 → 指南 → 治疗全景 → 趋势 | ✅ definition › evidence › landscape › trend |
| P3 | 面板宽高 ≥ 视口 90% | ✅ 1249×829 / 视口 1280×860 |
| P4 | 打开压一条 history，`history.back()` 收起 | ✅ history.length=3；返回后 open=false |
| P5 | 「返回」「关闭」两个独立入口 | ✅ back=true close=true same=false |
| P6 | 关闭后焦点回触发按钮、滚动位置不变 | ✅ focusOnTrigger=true scrollY=260→260 |
| P7 | Esc 只退一层 | ✅ open=false，URL 仍在 /prototypes/v0.2/index.html |
| P8 | 四段齐全、每段有来源、趋势段无禁止词 | ✅ |

## 7 本项目教训

- **一份指南全文都没有，就不要写版本号**：初稿想写「CSCO 2026 / NCCN 2026」，但 `docs/CLINICAL-DATA-2026.md` 白纸黑字写着这两个版本「未核验」。全部改成「版本未核实 · 页码待核」，并在 README 的引言里先交代这件事——填一个像样的年份比留空更容易误导。
- **趋势段没有硬凑到五类**：手上只有 ClinicalTrials.gov 的 200 条自采登记，指南版本更替、监管批件、分类体系更新、指南结构变化四类都没有原件支撑，最终只写「在研登记规模与阶段分布」这一类，其余整类留空。
- **分段与 Siewert 只留记录位**：初稿起过「按距门齿距离判断分段」的念头，这与 SPEC 的「分段由内镜与影像报告给出、本台不自行推算」冲突，也容易滑成判断；最后只写「医生给出、本台留记录位」。
