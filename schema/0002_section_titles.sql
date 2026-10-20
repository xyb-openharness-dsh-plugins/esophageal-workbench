/* 0002：补两个分节标题列。
 *
 * 为什么不在 0001 里加：0001 已经对外冻结（schema/freeze-contract.md 记了哈希），
 * 改历史迁移会让两台机器的库结构不一样。这里只做 ALTER，追加在 subjects 末尾。
 *
 * 为什么需要它们：读模型把每节还原成 `{ title, rows }`，与 prototypes/v0.2/demo-data.js
 * 逐字段对齐。0001 的 11 个分节标题列漏了「扩张记录」和「通路相关事件」两节 ——
 * 这两节有 rows 但没有 title 列，parity 断言会因为 title 变成 null 而红。
 *
 * 注意：ALTER TABLE 只能追加到末尾；`scripts/check-demo-columns.mjs` 按迁移执行后的
 * 实际列顺序比对，生成器里的 CREATE TABLE 镜像也要把这两列写在最后。
 */
ALTER TABLE subjects ADD COLUMN dilation_title TEXT;
ALTER TABLE subjects ADD COLUMN access_events_title TEXT;
