# 食管癌开发版需求与硬约束清单（2026-10-21）

本文件是食管癌工作台从「starter 骨架」进入「调研 → schema → 临床数据 → demo HTML → 开发版」的**唯一执行依据**。
前半部分是范围与验收（沿用胃癌 `gastric-workbench/docs/DEV-REQUIREMENTS-2026-10-21.md` 的体例），
后半部分是**从肠癌、胃癌两轮开发中逐条回收的错误**，标为硬约束，违反即视为未完成。

样板 = `~/Downloads/gastric-workbench`（v0.1.0，`9821a81` / tag `v0.1.0`，`npm run check` 全绿 + 21 项测试 + 无头浏览器实测通过）。
食管癌本轮目标：**达到胃癌现在的开发版效果**，并按食管癌 SPEC（`docs/SPEC.md`）换内容。

---

## 一、范围（本轮要交付什么）

| # | 交付物 | 落点 | 怎么验 |
| --- | --- | --- | --- |
| 1 | 食管癌 2026 临床试验资料包 | `research/esophageal-cancer/{manifest.json, trials-2026.jsonl, esophageal_cancer_trials_2026.sqlite, README.md}` | manifest 记录数 = jsonl 行数 = sqlite `trial_records` 行数；sha256 与实算一致；`docs/CLINICAL-DATA-2026.md` 写清口径与限制 |
| 2 | 采集脚本随项目版本化 | `scripts/fetch-esophageal-trials-2026.mjs` | `--dry-run` 只打印命中数 + 剔除样本 + 疑似非肿瘤样本；重跑可复现 |
| 3 | 食管癌数据模型 | `schema/0001_initial.sql` + `schema/freeze-contract.md` | `npm run check` 的 `check-schema` 验哈希；改结构只能加 `0002_*.sql` |
| 4 | 2 套 6 个月演示档案 | `demo/build-demo-data.mjs` → `prototypes/v0.2/demo-data.js` + `demo/demo-data.sqlite` | 单测：指标点升序、主序列跨度 ≥150 天、两档案都能渲染全部视图 |
| 5 | 原型 demo 四件套 | `prototypes/v0.2/{index.html, style.css, app.js, demo-data.js}` | 浏览器打开无控制台错误；一级页 **11 个**（SPEC §4 的 10 个 + 脚手架要求的「资料库」`records`，见 Q8），其中**「吞咽与进食通路」与「营养支持」同时存在**（见 E-A9） |
| 6 | 开发版 `public/` + DSH 链路 | `public/{index.html, style.css, shell.css, app.js}`、`dsh/*`、`lib/*` | `test/ui-parity.test.mjs` 逐视图比对原型与开发版；`npm run check` 全绿 |
| 7 | 顶栏 / AI 面板 / 一图秀 / 3D 卡 | 见第二节 | 见第二节 |

## 二、照抄样板的四条产品要求（不许"按比例缩减"）

| # | 要求 | 做什么 | 怎么验 |
| --- | --- | --- | --- |
| R1 | 顶栏三段式 + AI 主按钮五态 | 左＝品牌+版本 chip（中性灰）/ 中＝一句说明 `flex:1` / 右＝主操作组 `margin-left:auto`；五态文案固定：AI 对话 / 正在连接… / 收起 AI 对话 / 打开 AI 对话 / AI 对话暂不可用 | parity ⑨ |
| R2 | AI 面板可打开 / 隐藏 / 调宽 | 25%–45% 可拖、`role="separator"` + aria 区间、键盘 ←/→、Home/End、localStorage 记忆 | parity ⑨ + 浏览器实测 |
| R3 | 一图秀严格按设计原型 | 统一画布常量、单调三次插值（无过冲）、每指标独立配色、治疗泳道、末点防叠 13px；**默认体重 + 白蛋白双序列**（A7） | parity ① 逐视图 |
| R4 | 3D 指标卡按 `docs/24-METRIC-TREND-TAB-DESIGN.md` | 整卡点击 180°、`perspective:1100px`、`480ms cubic-bezier(.2,.7,.2,1)`、双面 `backface-visibility:hidden`、隐藏面 `aria-hidden`、键盘 Enter/Space、分类记录不翻不连线 | 卡片 HTML 有 `role="group" tabindex="0" data-flipped` |

---

## 三、硬约束（肠癌 + 胃癌两轮逐条回收的错误，食管癌必须不再犯）

### 3.1 数据层

| # | 约束 | 错误来源 |
| --- | --- | --- |
| H1 | **复合主键表裸 `SELECT *` 必须写 `ORDER BY rowid`**（`metrics(profile_key,key)` 曾让 `alb` 排到 `cea` 前，parity 直接红） | 肠癌 parity ③ |
| H2 | **手写倒序数组用 `ORDER BY ord`，绝不叠加 DESC**（作者已按"最新在前"写数组） | 肠癌 parity ③ |
| H3 | **可选字段显式写 `null`**，读模型按 `=== null` 判定；`band: m.band ?? null` | 肠癌 parity ③ |
| H4 | 演示数据口径：化验/体征每 2–4 周一点并延续到当天；**影像/内镜按真实频率，不加密** | 家族约定 |
| H5 | 看法恒不为结论（`is_conclusion=0`）；更正只新增版本；四点位缺健侧不生成差值 | 家族四条契约 |
| H6 | **生成器与 `schema/0001_initial.sql` 列数要逐一核对**：胃癌那轮连续 6 次 INSERT 列数不匹配（`resection_rows` 8 列/7 值 等）。写完必须跑列一致性校验脚本 | 胃癌轮次 F |

### 3.2 前端

| # | 约束 | 错误来源 |
| --- | --- | --- |
| H7 | **图标 key 必须有别名兜底**（`ICON_ALIAS` + 最终兜底 `icons.badge`），曾出现 `<path d="undefined">` | 肠癌截图实测 |
| H8 | **内联 `<svg>` 必须给尺寸**（`.actions .hero-ai svg{width:15px;height:15px}`） | 用户截图 6 |
| H9 | **页脚贴底**：`.work-area{min-height:100%}` + `.work-grid{flex:1 1 auto;align-content:start}` | 用户截图 7 |
| H10 | **顶栏中区只放一句说明** | 用户截图 7 |
| H11 | **`[hidden]` 要防 CSS `display` 覆盖**（`[hidden]{display:none!important}`） | 家族踩坑 |
| H12 | **二级页签必须按 `state.sub` 分流**，测试穷举 sub × 档案 | 用户轮次 A |
| H13 | 字号基线 **12.5px**；面板参数唯一来源 `lib/layout.js`，不许客户端与页面各写一份 | 用户轮次 C |
| H14 | **对象字面量不许出现重复键**：胃癌那轮 `PAGE_CONTEXT` 里 `nutrition` 定义了两次，后者静默覆盖前者，本页提示词只剩体重一项。写这类映射表要扫一遍重复键 | 胃癌轮次 F（实测后才暴露） |

### 3.3 工程与交付

| # | 约束 | 错误来源 |
| --- | --- | --- |
| H15 | **装机目录必须是 `~/.dsh/profiles/desktop`**，不是 web；`platform="web"` 是运行环境 | 用户轮次 E-1 |
| H16 | 文案红线词表本身会命中红线 → 词表行加 `// wording-allow` 并写理由 | 肠癌 `check-wording` |
| H17 | `schema/freeze-contract.md` 的 sha256 **必须实算写入**，不能留 `${sha}` 未展开 | 肠癌 `check-schema` |
| H18 | `lib/version.js` 是生成物；**build 日期取最后一次提交**，所以流程必须是「提交 → build:version → check → 再提交 version.js → 打 tag」 | 胃癌发版时踩到 |
| H19 | `check-workbench-package` 会比对 `project.config.json.repository` 与 `lib/client.js` 的 repository，**两边必须同字符串** | 肠癌包检查 |
| H20 | 跑测试 / `pnpm add` 前先 `NODE_OPTIONS=`（置空） | 家族记忆 |
| H21 | macOS **BSD grep 用 `\|` 会静默失败**，一律 `grep -E "a\|b"` 或用 Grep 工具 | 家族记忆 |
| H22 | **脚本复制改名后要全局搜残留**：胃癌那轮漏改 `manifest.files.gastric_cancer_trials_2026`（无冒号的引用处），跑完才发现 | 食管癌本轮刚踩到 |
| H23 | 原型/开发版实例化顺序：`buildData()` 必须在 `init()` 之前，`bootFail` 兜底不白屏 | 胃癌移植法 |
| H24 | **无头浏览器实测脚本三个坑**：① 不能一次性抓 `#nav .nav-button` 再逐个 click（render() 重建 DOM 后节点已 detach，点击不冒泡）；② 比对 (view, sub) 内容差异要**剥离公共区**（`.page-head`/`.subnav`/页面顶部 notice）再取指纹，否则 110 字符内全是公共文案；③ 穷举完必须复位 `state.sub`，否则停在最后一个页签（如「数据口径」没有指标卡） | 胃癌轮次 F |
| H25 | 原型是 file:// 或单目录静态托管时，**不带 favicon 会留一条 404**；用内联 SVG data URI | 胃癌轮次 F |

### 3.4 食管癌专属新增约束（依据 `docs/SPEC.md`）

| # | 约束 | 依据 |
| --- | --- | --- |
| E-A1 | **病理类型鳞/腺分开建档，不合并为"食管癌"**（两档案各一种，UI 上类型与分段是双主键） | SPEC A1 |
| E-A2 | EGJ 病例显示 **Siewert 记录位**（医生给出，不自动推算） | SPEC A2 |
| E-A3 | **治疗路径三选一**（手术路径 / 根治性放化疗 dCRT / 系统治疗），切换留旧路径**不覆盖** | SPEC A3 |
| E-A4 | **吞咽自查六档**（普食/软食/半流/流食/水呛/完全梗阻）按时间排列，固定标注"自查，不是医生评估" | SPEC A4 + 立场 10 |
| E-A5 | **进食通路档案可并列多个**（经口/支架/鼻饲/胃造瘘/空肠造瘘），各有起止日期；记录"医生建议原话 + 患者实际在用"，**不给利弊排序** | SPEC A5 + 立场 11 |
| E-A6 | **扩张记录只存事实**（日期/次数/机构），不给扩张时机建议 | SPEC A6 |
| E-A7 | **一图秀双序列**：体重（数值线）+ 白蛋白（数值线）+ 吞咽（分类节点，**分类不连折线**） | SPEC A7 / §4 |
| E-A8 | **SCC-Ag 仅鳞癌档案显示**；腺癌档案不出现该指标 | SPEC A8 |
| E-A9 | **「吞咽与进食通路」与「营养支持」两个一级页同时存在**（四癌种唯一双营养入口），两页各写一句职责边界常驻：一个是"怎么吃进去"，一个是"吃了多少" | SPEC A15 / §4 |
| E-A10 | 不做：支架品牌与型号推荐、扩张时机建议、瘘的分诊、"能不能手术"判断、营养液品牌推荐、病友匹配 | SPEC「明确不做」 |
| E-A11 | 第二原发（头颈/肺）监测**只记录医生安排**，不给患癌风险提示 | SPEC E6 |
| E-A12 | 免疫巩固期记录与 dCRT 后随访，**不评价疗效** | SPEC E4 |

---

## 四、本轮明确未做（不许在验收里算通过）

- DSH 真机装机（打 tar → desktop profile → 重启 Desktop 人工确认）。
- Desktop 内可拖会话栏（需 `customFrame=true`，M5 决策项）。
- MinerU 真实解析、导出 PDF/DOCX、云端同步。
- ChinaDrugTrials 与 ChiCTR 采集（资料包里显式记 `included:false`）。

## 五、需要用户澄清 / 我按脚手架替你定的（默认执行，可回退）

| # | 项 | 默认决定 | 理由 |
| --- | --- | --- | --- |
| Q1 | 品牌主色 | **小咽宝长春花蓝**：`--violet:#7C83BC` / `--violet-soft:#EEF0FA` / `--violet-deep:#5B62A0`；外壳中性色（`--paper:#f7f9fc`、`--ink:#1c2b3a`、`--line:#e2e9f1`）与肠癌、胃癌完全一致 | `docs/BRIEF.md` §2026-10-18：「无专属 Logo，先走长春花蓝（periwinkle）色系 + 文字标识（EsopPal 小咽宝）」。换色成本 = 改 3 行 CSS |
| Q2 | 3D 卡高 | 沿用样板的 **188px**（三列网格密度），不套 doc24 的 276px 两列基线 | 肠癌/胃癌同一偏差，未收到回退指示 |
| Q3 | 一图秀默认指标 | **体重 + 白蛋白两条数值线**；吞咽六档作为可勾选的**分类序列**（只画节点不连折线） | SPEC §4 写「（体重+白蛋白双序列）」，A7 写「体重（数值线）+ 吞咽（分类节点）」。两者合并：默认双数值线，吞咽作为可切换的第三序列，同时满足两条 |
| Q4 | 资料包年份口径 | **首次公示在 2026 年**（与肠癌、胃癌一致），不是启动年份 | 与样板对齐，便于横向比较 |
| Q5 | 检索词 | 四组并集：`esophageal cancer` / `esophageal squamous cell carcinoma` / `esophageal adenocarcinoma` / `gastroesophageal junction cancer`；**裸词 `esophageal` 不进术语表**（会收进食管静脉曲张、Barrett、贲门失弛缓等非肿瘤研究），改为肿瘤写法 + 词序变体 + `esophagectomy` + `cardia` + 良性排除规则 | 鳞癌与腺癌分列对应 SPEC A1；GEJ 与胃癌资料包**刻意重叠**（见 Q6） |
| Q6 | 与胃癌资料包重叠 | **允许重叠，但必须在 README / CLINICAL-DATA / manifest 三处写明**：GEJ 是两癌种共同关注域，跨包相加会重复计数，合并需按 NCT 去重 | 食管癌 SPEC 目标用户含 EGJ 腺癌，胃癌检索起点也含 GEJ；如实标注而非悄悄去重 |
| Q7 | **双营养入口（与胃癌刻意相反）** | 食管癌**保留**独立「营养支持」一级页，与「吞咽与进食通路」并列；两页顶部各写一句职责边界常驻 | 胃癌 G-A8 明确"不设营养支持页"，**食管癌 SPEC §4 与 A15 明确反向要求**（四癌种中唯一双营养入口，理由：营养不良负担最重）。这是刻意不同，**不许当成不一致"统一"掉**——已在文档中双向标注 |
| Q8 | **一级页数量：11 而不是 10** | SPEC §4 只列了 10 个（看板 / 我的分型 / 治疗历程 / 吞咽与进食通路 / 检查与指标 / 一图秀 / 营养支持 / 心理支持 / 复诊准备 / 临床研究），**漏了「资料库」`records`**。按家族脚手架补入，成为第 11 个一级页（位置在「看板」之后），内容与肠癌/胃癌同构：文件上传 → 解析 → 核对候选指标 → 入库，另含病理文档目录与输出文档管理 | 用户在肠癌轮次明确要求「病情管理少了文件上传、文件解析、确认指标、导入数据库的步骤，同时缺少病理管理的文件目录列表」；肠癌与胃癌的 `SUBPAGES` 里 `records` 都是二级页最多的那个（5 个）。SPEC 草案漏写属遗漏，不是刻意排除 |
