# 2026 食管癌临床研究资料包说明

资料包位置：**仓库内 `research/esophageal-cancer/`**（README + `trials-2026.jsonl` + `esophageal_cancer_trials_2026.sqlite` + `manifest.json`），随仓库版本化；同一份也在 `~/Downloads/unified_search_trials/research/esophageal-cancer/`。
SQLite 文件为 `esophageal_cancer_trials_2026.sqlite`，sha256 `4dd62ee2f061c71e2161397fcaec92b5fab19382c845c7ef4ba9cc3015436486`（写入 `manifest.json`，重跑采集会变）。

采集脚本随本项目版本化：`scripts/fetch-esophageal-trials-2026.mjs`（`--dry-run` 只报命中数、打印被剔除样本与疑似非肿瘤样本，便于核对术语误杀与误收）。
脚本默认写到 `~/Downloads/unified_search_trials/research/esophageal-cancer`；要让产物直接落进本仓库，显式给目录：

```bash
ESOPHAGEAL_RESEARCH_DIR=research/esophageal-cancer node scripts/fetch-esophageal-trials-2026.mjs
```

重跑会改 sqlite 与 manifest 的 sha256，属预期；提交前把新 hash 同步到本文件、`research/esophageal-cancer/README.md` 与 `manifest.json`。

## 设计/开发阶段可用内容

- **200 条** 2026 年首次公示的食管癌（鳞/腺）/ 食管胃交界相关干预性研究，全部来自 ClinicalTrials.gov：疾病特异 190 条 + 广谱篮式 10 条。ChinaDrugTrials 与 ChiCTR 本轮未采集。
- 主题量级（关键词近似命中，同一研究可多命中）：**免疫治疗 85**、**鳞癌 84**、**腺癌/GEJ 80**、手术相关 68、新辅助/围手术期 55、放疗放化疗 45、HER2 24、影像 AI 19、CLDN18.2 13、ADC/靶向 12、**营养/吞咽/支架/管饲 9**、光动力/内镜 6、支架/扩张/狭窄 3、疫苗/细胞治疗 0。
- 申办方 top5：天津医科大学肿瘤医院 8、复旦大学 7、中山大学 7、唐都医院 5、河南省肿瘤医院 4。
- 每条记录保存：注册库、登记号（NCT）、首次公示日期、开始/主要完成/最近更新日期、登记状态、研究类型、分期、标题、官方标题、疾病、干预、申办方、国家、入组人数、摘要、入排标准、`category`、来源 URL、采集时间。未保留 PI 电话/邮箱等直接联系字段。

### 与胃癌资料包的边界差异（跨包相加会重复）

1. **GEJ 研究刻意重叠**：食管癌 SPEC 的目标用户含 EGJ 腺癌，胃癌资料包的检索起点也含 GEJ。两包在 GEJ 研究上有重复，**合并分析必须按 NCT 号去重**。
2. **裸词 `esophageal` 不进疾病术语表**（胃癌那版收了裸词 `gastric`）。裸词会把食管静脉曲张、贲门失弛缓、嗜酸粒细胞性食管炎、Barrett 食管等非肿瘤研究收进来。本包改为「肿瘤写法 + `...of the esophagus` 词序变体 + esophagectomy + cardia」，并加**良性排除**规则（命中 Barrett/esophagitis/varices/achalasia/eosinophilic/reflux/GERD 且全文无癌词则剔除，本批 6 条）。`dysphagia` 不进排除表——吞咽困难是食管癌核心症状。
3. 篮式判定沿用家族规则（conditions 含泛化实体瘤词 且 同时列入 ≥1 个上消化道以外瘤种）；**gastric 与 esophageal 都不算"其它瘤种"**（GEJ 研究常同时列入胃腺癌或食管腺癌，同属上消化道）。

## 重要限制

1. 年份口径是"首次公示在 2026 年"（2026-01-01 至采集日），不是试验启动或结果发表年份。
2. 仅干预性研究；观察性研究未采集。
3. **ChinaDrugTrials 与 ChiCTR 未采集**：中国登记 2026 记录数未知，不能推断全量；"未命中"不是"不存在"。已含中国中心的 108 条只反映 ClinicalTrials.gov 上标明中国站点的记录。
4. 试验登记不证明方案有效、安全、获批或开放入组；涉及具体患者由专业团队判断，并回源核实登记状态与纳排标准。
5. 主题命中数为关键词近似统计，不是人工分类，**不能作为"某方向有多少研究"的精确结论引用**。
6. 药物层面的机制、阶段与已发布疗效**不在本资料包范围内**——本包只做登记信息留档，不做药物级梳理。
7. 该库未接入 HTML 原型的临床研究页、食管癌工作台业务数据层或 `unified_search_trials` 在线 MCP 注册表；是设计阶段离线资料夹具。原型临床研究页中的行是**演示行**，真实接入需另做许可、同步、去重与临床审核。

## 2026 指南监测入口

- 中国 CSCO 食管癌指南 2026 版状态**未核验**。
- NCCN Esophageal and Esophagogastric Junction Cancers 2026 版更新状态**未核验**。
- ESMO 食管癌相关指南 2026 更新状态**未核验**。

以上来源地区适用边界不同；在取得并核对中国现行指南全文之前，工作台不得生成任何"按最新指南"的治疗解释内容。

## 对工作台页的直接约束

- 临床研究页的每条线索必须带**来源 URL 与首次公示日期**，并写免责（登记 ≠ 可入组、≠ 有效）。
- **不排序、不打分、不预测**：鳞癌/腺癌分层、HER2、PD-L1、CLDN18.2 等只作检索词与筛选条件，不作"适合你"的判断。
- 营养/吞咽/支架/扩张相关研究合计仅 9–12 条，量级远低于治疗类；「吞咽与进食通路」页的定位是**记录与随访**，不得据此给出通路选择、扩张时机或支架品牌建议（SPEC 明确不做：支架品牌推荐、扩张时机建议、瘘的分诊）。
- 鳞癌与腺癌在登记中几乎各占一半（84 vs 80），工作台必须保持**病理类型分开建档**（SPEC A1：不得合并为"食管癌"）。
