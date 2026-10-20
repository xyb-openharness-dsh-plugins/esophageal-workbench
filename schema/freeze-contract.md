# 迁移冻结合同（小咽宝 EsopPal）

`schema/` 下的迁移一旦对外发布就不许再改：改历史迁移 = 两台机器的库结构不一样 = 数据不可复现。
本文件记每个迁移文件的 sha256，由 `npm run check` 里的 `scripts/check-schema.mjs` 逐条比对。

要改结构：**新增** `NNNN_name.sql`，并把新文件与哈希追加到下表的末尾。改旧文件会被检查拦下。

| 文件 | sha256 |
| --- | --- |
| `0001_initial.sql` | 5b9ce07433f88109741c10557276fb80ccdfc7abcc403f6b86c7dffe1a525148 |
| `0002_section_titles.sql` | cc6ecf5617153b15db6f2343f5b652bc29508e69db45bbb43eeeaae3a8b86c32 |

## 0001 的内容边界（写在冻结之前，便于日后审）

25 张表，174 列。分四组：

- **档案级 1 张**：`subjects`（档案标量 + 11 个分节标题；标题为 NULL 表示该档案没有这一节，
  A 档案未手术因此 `surgery_title` 为 NULL）。
- **指标 3 张**：`metrics` / `metric_points` / `molecular`。分类指标 `dec IS NULL` 且 `kind ∈ {grade, qual}`；
  数值指标 `kind = 'numeric'`。`band` 用 `band_low/band_high` 两列，都没有则为 NULL（≠ 0）。
- **通用 8 张**：`events` / `rhythm` / `cycles` / `treatment_lines` / `viewpoints` / `trials` /
  `documents` / `candidate_fields`。
- **食管癌专属 10 张**：`pathway_rows`（治疗路径三选一，`phase` 当前/既往）/
  `segment_rows`（颈·胸上·胸中·胸下·EGJ + Siewert）/ `surgery_rows`（术式·重建·吻合口）/
  `pathology_rows`（`kind` 为 row/gap）/ `swallow_rows`（六档自查，`self=1` 为自查）/
  `access_rows`（经口·支架·鼻饲·胃造瘘·空肠造瘘，`in_use` 标当前在用）/
  `dilation_rows`（扩张事实：日期·次数·机构）/ `access_events`（误吸·呛咳·移位·堵管）/
  `nutrition_rows`（"吃了多少"，与通路页分工）/ `supplement_rows`（营养补充医嘱留痕）/
  `monitor_rows`（随访安排 + 第二原发监测）/ `endoscopy_rows`（内镜与影像逐次记录）。

> 列名避坑：`access_rows` 的"当前在用"列叫 **`in_use`**，不叫 `using` ——
> `USING` 是 SQLite 保留字，裸写 `using INTEGER` 会在建表时报 `near "using": syntax error`。

## 0002 的内容边界

只做两件 `ALTER TABLE subjects ADD COLUMN`：`dilation_title` / `access_events_title`。

0001 的 11 个分节标题列漏了「扩张记录」和「通路相关事件」两节。这两节有 `rows` 但没有标题列，
读模型就还原不出 `{ title, rows }`，与 `demo-data.js` 的 parity 断言会在 title 上红。
按"迁移只增不改"的规矩，不动 0001，追加 0002；`ALTER` 只能加到末尾，生成器的 `CREATE TABLE`
镜像与 `dsh/demo.js` 的 INSERT 列顺序也把这两列写在最后（`scripts/check-demo-columns.mjs`
现在会执行 `schema/00*.sql` 全部文件后再比对，所以能覆盖到 0002）。

## 四条契约在本 schema 里的落点

| 契约 | 落点 |
| --- | --- |
| 看法恒不为结论 | `viewpoints` 无 `is_conclusion` 列（恒视为 0），读模型不输出结论字段 |
| 四点位 1–4 点、缺健侧不生成差值 | `metric_points` 允许任意点数；差值在读取时算，NULL 不折算成 0 |
| 更正只新增版本 | `pathway_rows.phase` 只取「当前 / 既往」，切路径新增行不覆盖旧行 |
| 事实四层不合并 | 文档 `documents` / 候选 `candidate_fields` / 记录 `*.rows` / 指标 `metric_points` 各存各的 |

## 与生成器的一致性

`demo/build-demo-data.mjs` 里那份 `CREATE TABLE` 是 schema 的镜像。
改完任一边都要跑：

```bash
node demo/build-demo-data.mjs
node scripts/check-demo-columns.mjs     # 逐表比对 PRAGMA table_info：列名 / 顺序 / 类型 / 主键
```

（H6：胃癌那轮连续 6 次 INSERT 列数不匹配，靠位置式 INSERT 才没在写代码时暴露。）
