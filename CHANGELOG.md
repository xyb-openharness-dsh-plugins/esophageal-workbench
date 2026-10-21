# 变更记录

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
