# 变更记录

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
