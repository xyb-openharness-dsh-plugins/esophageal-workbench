# 食管癌临床研究登记资料（2026）

这是用于食管癌（EsopPal 小咽宝）工作台设计与资料结构验证的本地研究数据库，**不是产品已接入的数据服务**。

## 文件

- `esophageal_cancer_trials_2026.sqlite`：SQLite 数据库。`trial_records` 保存登记资料，`source_coverage` 标记每个来源的覆盖范围，`metadata` 记录筛选口径。
- `trials-2026.jsonl`：同一批数据的逐行 JSON 导出。
- `manifest.json`：记录数、来源覆盖、边界说明及 SQLite SHA-256（`4dd62ee2f061c71e2161397fcaec92b5fab19382c845c7ef4ba9cc3015436486`）。

当前共 **200 条**（四组词去重后 221 条，本地疾病术语过滤后保留 200）：全部来自 ClinicalTrials.gov。其中疾病特异研究 190 条、广谱篮式研究 10 条。所有保留记录的首次公示日期均在 2026-01-01 至采集日（含）之间，2025 及以前登记的记录已排除。

## 数据来源与覆盖

| 来源 | 纳入 | 覆盖说明 |
|---|---:|---|
| ClinicalTrials.gov | 200 | 官方 API v2。检索词四组并集：`query.cond="esophageal cancer"`（原始 140）、`"esophageal squamous cell carcinoma"`（84）、`"esophageal adenocarcinoma"`（38）、`"gastroesophageal junction cancer"`（80）；`filter.advanced=AREA[StudyFirstPostDate]RANGE[2026-01-01,MAX] AND AREA[StudyType]INTERVENTIONAL`；再经本地疾病术语过滤（esophageal / oesophageal / esophagus 全写法 + `...of the esophagus` 词序变体 + esophagectomy + cardia / GEJ 等，命中标题或 condition 任一）。该数仅代表这组查询与过滤口径，不代表所有全球注册库。 |
| ChinaDrugTrials | 0 | **本轮未采集**（需会话采集器与既有会话配置）。2026 记录数未知，"未命中"不能解释为"不存在"。 |
| ChiCTR | 0 | **本轮未采集**。同上。 |

状态分布（登记状态，非入组资格）：RECRUITING 103、NOT_YET_RECRUITING 82、COMPLETED 6、ACTIVE_NOT_RECRUITING 6、ENROLLING_BY_INVITATION 3。**108 条记录含中国中心**。

分期分布：PHASE2 92、NA（未标注/不适用）31、PHASE1 27、PHASE3 22、PHASE1|PHASE2 16、PHASE4 4、EARLY_PHASE1 4、PHASE2|PHASE3 4。

## 检索路径

与结直肠癌、胃癌资料包同一方法学：ClinicalTrials.gov API v2 直连（未走 MCP 在线适配器）；本地展平、去重、术语过滤、写入 SQLite。
采集脚本随食管癌项目版本化：`esophageal-workbench/scripts/fetch-esophageal-trials-2026.mjs`（支持 `--dry-run` 只报命中数）。采集为一次性全量，**未做增量更新机制**。

### 与胃癌资料包的两处边界差异（重要，跨包相加会重复）

1. **GEJ / 食管胃交界研究是刻意重叠的**。食管癌 SPEC 的目标用户含 EGJ 腺癌，胃癌资料包的检索起点也含 GEJ，因此两包在 GEJ 研究上会有重复。**跨包相加会重复计数**，需要合并分析时必须按 NCT 号去重。
2. **裸词 `esophageal` 不进疾病术语表**（胃癌那版收了裸词 `gastric`）。原因是裸 `esophageal` 会把食管静脉曲张、贲门失弛缓、嗜酸粒细胞性食管炎、Barrett 食管等非肿瘤研究一并收进来。改为「收全肿瘤写法 + 词序变体（`cancer/carcinoma/neoplasm/adenocarcinoma/squamous ... of the esophagus`）+ esophagectomy + cardia」，并额外加一道**良性排除**：命中 Barrett / esophagitis / varices / achalasia / eosinophilic / reflux / GERD **且全文无任何癌词**的记录剔除（本批剔除 6 条，含 4 条 Barrett 筛查、1 条放射性食管炎）。`dysphagia` **不进**排除表——吞咽困难是食管癌核心症状，很多食管癌研究 cond 里都有。
3. 另加**反向检查**：保留记录里命中上述良性词的会打印出来人工复核（本批 2 条，经查 cond 均含 `Barrett Esophagus Adenocarcinoma` / `Adenocarcinoma - GEJ`，属食管腺癌范畴，故保留）。

## 数据模型简述

`trial_records` 主要字段：`registry`、`registry_id`（NCT 号）、标题、官方标题、`first_posted`（首次公示日期）、开始/主要完成/最近更新日期、登记状态、研究类型、分期、疾病、干预、申办方、国家、入组人数、摘要、入排标准、`category`（disease-specific / basket）、来源 URL。未保留 PI 电话/邮箱等直接联系字段。

## 2026 年登记主题观察（仅描述登记研究，不构成疗效或推荐）

以下为主题词的近似命中统计（对 title + summary + conditions + interventions 做关键词匹配，同一研究可命中多个主题，**计数为量级参考不是精确分类**）：

| 主题 | 命中 | 占比 |
|---|---:|---:|
| 免疫治疗（PD-1/PD-L1 各类单抗） | 85 | 43% |
| 鳞癌（squamous） | 84 | 42% |
| 腺癌 / GEJ（adenocarcinoma） | 80 | 40% |
| 手术相关（surgery / esophagectomy / resection） | 68 | 34% |
| 新辅助 / 围手术期 | 55 | 28% |
| 放疗 / 放化疗（CRT / dCRT） | 45 | 23% |
| HER2 | 24 | 12% |
| 影像 AI / 影像组学 | 19 | 10% |
| CLDN18.2 | 13 | 7% |
| ADC / 靶向 | 12 | 6% |
| 营养 / 吞咽 / 支架 / 管饲 | 9 | 5% |
| 光动力 / 内镜 | 6 | 3% |
| 支架 / 扩张 / 狭窄 | 3 | 2% |
| 疫苗 / 细胞治疗 | 0 | 0% |

**申办方 top5**（均为中国中心为主）：天津医科大学肿瘤医院 8、复旦大学 7、中山大学 7、唐都医院 5、河南省肿瘤医院 4。

结构性观察：本批登记里**鳞癌与腺癌/GEJ 几乎各占一半**（84 vs 80），这与工作台「病理类型鳞/腺分开建档」（SPEC A1）的设计直接对应；**免疫治疗是最高频主题**（85 条，含新辅助与 dCRT 后巩固两类用法）；**手术 + 新辅助/围手术期 + 放化疗合计构成治疗路径的三条主干**，对应 SPEC 的「治疗路径三选一」结构；**营养/吞咽/支架/扩张合计仅 9–12 条**，量级远低于治疗类研究——工作台「吞咽与进食通路」模块的定位是记录与随访，不指望从登记研究里找方案。

> 药物层面的机制、阶段与已发布疗效数据**不在本资料包范围内**。若要做药物级梳理，须逐条回源取登记页原文与已发表文献，并另走临床审核。

## 2026 指南监测线索（地区适用边界不同，均需取得原文核验后才能用于产品解释）

- 中国 CSCO 食管癌指南 2026 版状态**未核验**；产品临床解释须核对中国适用指南全文与发布日期。
- NCCN Esophageal and Esophagogastric Junction Cancers 2026 版更新状态**未核验**。
- ESMO 食管癌相关指南 2026 更新状态**未核验**。

## 限制

1. 年份口径是"首次公示在 2026 年"，不是试验启动或结果发表年份。
2. 仅干预性研究；观察性研究未采集。
3. ChinaDrugTrials 与 ChiCTR 未采集，覆盖未知，**不能推断中国登记全量**——中国中心数（108 条）只反映 ClinicalTrials.gov 上标明中国站点的记录。
4. 试验登记不证明方案有效、安全、获批或正在开放入组；涉及具体患者应由专业团队结合病理、分期、既往治疗、分子结果判断，并回源核实状态与纳排标准。
5. 主题命中数为关键词近似统计，不等同于人工分类，不可作为"某方向有多少研究"的精确结论引用。
6. **与 gastric-cancer 资料包在 GEJ 研究上存在刻意重叠**，两包相加会重复计数。
7. 该库未接入 `unified_search_trials` 在线 MCP 源注册表与食管癌工作台业务数据层；产品化需另做数据许可、同步/去重、版本管理与临床审核。
