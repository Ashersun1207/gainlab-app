# 复盘链 — 阶段性复盘

---

## P0→T18 复盘（2026-02-22）

### 做对了
- 新建项目比改 Dashboard 快得多
- Widget 自治模式灵活，Agent 编排无缝
- Catalog 单一源消灭散落定义问题
- SAMPLE_DATA fallback 保证离线也能看到东西
- vite-only 绕过 KLineChart 类型问题

### 做错了
- T17 Script hack 方向错误，浪费时间
- 混淆 preview-layout.html 和 App 根路径（L24）
- Sidebar active 状态数据/DOM 不同步（L25）
- P0 做完没更新文档（L19），后续接手困难
- applyNewData vs setDataList API 名没验证就用（L20）

### 下次改进
- 架构决策先讨论再动手，不要 hack
- 产品入口明确后写入规则
- 状态管理只用数据驱动，不碰 DOM
- 改完代码浏览器验证再 push（L23）
- API 方法名查源码确认，不信 .d.ts
