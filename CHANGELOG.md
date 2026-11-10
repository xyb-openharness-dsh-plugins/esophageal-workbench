## 0.1.3（2026-11-11，AI 对话面板激活修复）

- 会话判定改用宿主归属 `ownedSession()`（`ownsSession(currentSession())`），不再用 `Boolean(conversation)`（customFrame 下没会话也会传隐藏容器 → 判断恒为真 → 点了没反应）。
- 创建路径改 `service.newSession(workspaceId)`，工作区取 `service.defaultWorkspace?.()?.workspaceId`；无可用工作区时由宿主提示选目录；不再用 `ensureSession({})`。
- 取消目录选择不留空会话并提示可重试；创建失败在工作台内显示原因；订阅会话变化触发重渲染；草稿仍只填不发。
- 版本与生成物同步 0.1.3；新增 `scripts/check-agent-pane-contract.mjs` 入 check 链。
- **界面加载与真机点击待人工**（需退出重开 DSH Desktop 后新建会话走查）。

# 变更记录

## 2026-10-27 · v0.1.1：36 号疾病概要补齐（指南可点 + 看板状态卡）+ 首次装入 Desktop

**为什么做**：`xyb-workbench-starter/prompts/PRIMER-BACKFILL.md` 要求把 36 号规范补齐到各癌种工作台。
本项目 0.1.0 的疾病概要只有四段文字，指南表「原件」列是纯文字、点不开；看板也没有 §2.6 的病程状态卡。

- **疾病概要模块升到 36 号 v2**：`primer.js` / `primer.css` 原样取自 starter `assets/patterns/`，含 `safeHref()`
  （只放行 `https://`）与 `.dp-miss` 缺链红标（缺链接的行会渲染成红色提示，而不是静默通过）。
  原型 `prototypes/v0.2/` 与开发版 `public/` 两处同步，保持逐字符一致。
- **指南表每条来源都给可点链接**（36 号 §2.5）。本项目**一份原件都没有**，所以 5 行全部是
  `original:false` + `secondaryUrl`，指向该机构的官方出版信息页，不拿别人的 PDF 冒充自己的原件：
  CSCO 官方指南合订本页、NCCN 指南详情页（id=1433）、ESMO 胃与食管癌 CPG 页、AJCC 官方页（FACS）、
  IARC《消化系统肿瘤》2019 出版页；趋势段的 ClinicalTrials.gov 换成同口径检索页。
  六条链接逐条 `curl -L` 验过 HTTP 200 才写进数据。
- **看板加 36 号 §2.6 病程状态卡**（四件：卡头 / 大字天数 / 现状行 / 出口按钮排）。天数一律由档案日期派生：
  有手术记录 → 锚点=手术日；未手术 → 锚点=治疗路径「当前」行起始日；取不到就整卡「待初始化」，不编数字。
  两档实测：沈志远 D+147（2026-06-02 当前方案首日）、顾晓兰 D+117（2026-07-02 手术日）。
  原来那条琥珀色「下一次节点」提示条并入状态卡现状行，同一句话不再出现两次。
- **`docs/SPEC.md` §3 冲突修正**：原文写「吞咽卡为首卡」，与 36 号「病程状态卡是看板首卡」直接矛盾。
  定为「通用骨架首卡在上、业务首卡在下」，理由写进 SPEC（位置感先于业务重点），避免下一个人再改回去。
- **顶栏「?」改为手写**：`primer.js` 的 `mount()` 是「已有 `[data-primer-open]` 就接管、没有才插」，
  而 `app.js` 先渲染出状态卡里的同名按钮 —— 自动挂载接管的是那一颗，顶栏永远空着；且 P1 照样 PASS
  （`querySelector` 拿到的是状态卡按钮）。开发版顶栏是 `.tb-actions`，另在 `shell.css` 里按 32×32 圆形适配。
  教训写进 `docs/DISEASE-PRIMER.md` §7。
- **排版对齐 P9**：`primer.css` 的列表由 `padding-left:18px` 改为 `padding-left:0 + li::before` 自定义符号，
  使正文 / 列表 / 表格 / 来源行同左基线、右边界极差 ≤2px（1280 / 900 / 390 三档）。
- **验证**：`npm run check` **21/21 全绿**（含视图 HTML 逐字符一致、style.css 规则一致、版本 8 处一致）；
  `probe-disease-primer.mjs` 原型与开发版均 **10/10 PASS**（P1–P9 + E0）；`--self-test` **3 FAIL**（闸门会报红）。
- **版本**：`VERSION` 0.1.0 → **0.1.1**，`lib/version.js` / `package.json` / `public/index.html` / `public/app.js`
  共 8 处一致；原型快照 `prototypes/v0.2` 按 D37 仍冻结在 v0.1.0。
- **首次装入 DSH Desktop**：0.1.0 只发过 GitHub Release、从未实机安装。本次打进
  `~/Library/Application Support/dsh-desktop/harness/profiles/web`
  （`pnpm --dir . add -w <tgz>`），`dsh.profile.bundles` 加入 `@xyb-community/esophageal-workbench`
  （39 → **41**：同一次安装窗口里另一路会话同时装入了 `fshd-workbench`，我的脚本只加了食管这一条，
  安装前已备份 profile 清单并逐项比对，36 个依赖目录 0 缺失）；`check-install.mjs` 已认到登记。
  顺带修正 profile 里一条失效依赖路径：`@xyb-community/aml-workbench` 指向已不存在的 0.6.1，
  改为磁盘上已有的 0.6.2（同包新版本，否则 `pnpm add` 整体 ENOENT 失败）。
  **待办：需重启 DSH Desktop 才会加载新 bundle；重启后应在市场/工作台里看到小咽宝。**

## 2026-10-21 · 临床资料包入库 + 开发版无头实测留痕

- `research/esophageal-cancer/` 纳入版本管理：`manifest.json` + `trials-2026.jsonl` + `esophageal_cancer_trials_2026.sqlite`（200 条，sha256 `4dd62ee2…`）+ `README.md`；`.gitignore` 加 `!research/**/*.sqlite` 例外，业务库仍不入库。
- `docs/CLINICAL-DATA-2026.md` 路径改为仓库内相对路径，并写清重跑方式（`ESOPHAGEAL_RESEARCH_DIR=research/esophageal-cancer`）与 hash 同步要求。
- 新增 `docs/release/v0.1.0/`：5 张实测截图 + `LIVE-CHECK.md`（11 页 / 32 个二级页签穷举、面板 25–35–45%、三档字号无溢出、0 error / 0 4xx）。
- **发布**：打 tag `v0.1.0` 并建 GitHub Release，附 `xyb-community-esophageal-workbench-0.1.0.tgz`（230KB，sha256 `3468abbf58448ae39dd1f21358dbe1e18fd1b27c9235f78452ce9dcb3f64b5ef`）。仍**未**做 Desktop 实机装机，因此不声明市场可见。

## 2026-10-21 · 装机目标更正（V2 前的准备）

- **更正**：装机目录不是 `~/.dsh/profiles/desktop`（CLI 侧，Desktop 不读）。DSH Desktop 0.12.0 实际加载的是 app 自己的 Harness `~/Library/Application Support/dsh-desktop/harness/profiles/web`。
- `scripts/check-install.mjs` 换成自动探测版（Desktop Harness → `DSH_HOME` → `~/.dsh`，打印判定依据，区分市场安装/手工安装）；`docs/DEV-REQUIREMENTS-2026-10-21.md` H15 同步更正。
- `scripts/build-version.mjs --check` 不再比较 `build` / `commit`（易变量），修掉每次提交后必失败的假阴性。


## 2026-10-21 · 提示词升级 v1.1（补 init / 强约束 / 三阶段闸口 / 多通道临床库）

- `prompts/ZERO-TO-DEV.md`：新增阶段 0（starter init + 标准文档体系 + `DEV-REQUIREMENTS` 强约束文档，
  体例对齐 `gastric-workbench/docs/DEV-REQUIREMENTS-2026-10-21.md`）。
- 三阶段闸口写实：3.1 调研/患者流程/schema/临床库/HTML demo → 第一次确认；3.2 开发版与原型逐字符一致；
  3.3 按发布规范做 dsh-desktop 实测；之后才是 push、tag、经验回流（项目约束文档 + starter LESSONS/prompts）。
- 临床试验改为多通道口径：unified-trial-mcp（`opencare-skillhub/unified-trial-search-mcp-service`，
  ICTRP / CTV / ChiCTR / CDE 含 PI / 离线语料），强调「0 条结果必须带覆盖声明」「登记≠有效≠可入组」。
- 样板基准统一写成 `<癌种英文>-workbench v0.1.0`。

## 2026-10-21 · 开发版 0.1.0（原型 → 数据层 → 开发版骨架走通）

- 需求与约束固化为 `docs/DEV-REQUIREMENTS-2026-10-21.md`（H1–H25 开发红线 + E-A1–E-A12 食管癌专属 + Q1–Q8）。
- 数据层：`schema/0001_initial.sql` 25 表 / 174 列；新增 `0002_section_titles.sql` 补
  `dilation_title` / `access_events_title` 两列（ALTER 追加，不改历史迁移）。
- 演示数据：2 档案（沈志远 / 顾晓兰）× 6 个月，59 项指标 / 666 个数据点 / 10 条真实登记摘录；
  `docs` / `candidates` / `events` 保持定长数组形状，生成器不再把中间量 `extraMetrics` 漏进产物。
- 开发版：`public/{app.js,index.html,style.css,shell.css}` + `dsh/{index,server,store,workbench,demo,readmodels}.js`；
  数据改走 `GET /api/bootstrap`（失败且有 `window.DEMO_DATA` 时回退），顶栏三段式，AI 面板五态 + 25%–45% 可拖 + 宽度记忆。
- 校验：`npm run check` 全绿；`test/ui-parity.test.mjs` 11 视图 × 2 档案逐字符与原型一致；
  无头实测 1440px 无横向溢出、无控制台错误、无 4xx，一图秀仍为 2 条数值线 + 吞咽分类节点不连线。
- 未做：DSH Desktop 实机装机验证（P2 未验证，不写"装机通过"）；未打 tag。

## 2026-10-20 · 开发快照（包版本 0.1.0）

- 补录D9仓库纳管决定、实际仓库身份及Git同步与市场投稿的边界；当前仍是设计审定阶段。
- 本次仅修改设计会话与说明文档，未运行业务测试；不代表设计或实机验收。
- 详细范围见 [Git同步记录](docs/GIT-SYNC-2026-10-20.md)；本次未创建正式发布tag。
