# 推理链 — 完整决策推理过程

_格式：输入 → 约束 → 候选方案 → 分析 → 排除 → 结论 → 验证_

---

## R1: 新建 vs 改造 Dashboard

**输入**：需要一个 Agent 组件展示前端
**约束**：Dashboard 101K+40 依赖+Dify 绑定，太重
**候选**：A) 新建项目 cherry-pick B) 在 Dashboard 上加 Agent
**分析**：A 只拿 ~6400 行需要的；B 背 90K 包袱还要删东西
**排除**：B — 删东西比加东西风险大
**结论**：A — 新建 gainlab-app
**验证**：P0 骨架 1 天完成，11K + 8 依赖

## R2: 产品定位 — 看盘工具 vs Agent 组件展示

**输入**：gainlab-app 做什么？
**约束**：看盘红海（TradingView/Koyfin），Agent 组件是空白市场
**候选**：A) 散户看盘工具 B) Agent 组件展示平台
**分析**：A 红海 6 个月打不过 TV；B 空白市场 6-12 月窗口，与 MCP 叙事一致
**结论**：B — Agent 组件展示
**验证**：Widget Catalog + TOOL_REGISTRY 架构匹配

## R3: build 方案 — tsc vs vite-only

**输入**：KLineChart 45K 行不兼容 strict mode
**约束**：不改 KLineChart 源码（45K 行改了出 bug 排不完）
**候选**：A) tsc 类型检查 + vite B) vite-only（esbuild transpile）
**分析**：A 需要 45K 行类型兼容，不现实；B esbuild 只 transpile 不检查类型
**结论**：B — vite-only，不跑 tsc
**验证**：build 成功，CI 绿

## R4: T17 Script 引擎方向

**输入**：副图指标（RSI/MACD）用 Script 引擎 hack builtin
**约束**：Dashboard 已有成熟 Indicator 系统
**候选**：A) 继续 Script hack B) 回退到 Indicator 原生
**分析**：Script 引擎给用户自定义用，不该给 builtin；副图 yAxis 鸡生蛋问题是架构不匹配症状
**结论**：B — 回退，确定搬迁路线 P1-P4
**教训**：方向错误越早发现越好

## R5: Widget 定义管理

**输入**：Widget 定义散落 4 处，改一处漏三处
**约束**：频繁新增 Widget
**候选**：A) 继续分散 B) Catalog 单一源 C) 引入 json-render
**分析**：C 太重（KLineChart 有状态不适配）；B 轻量够用
**排除**：A（已证明不行）C（过度工程）
**结论**：B — widget-catalog.ts 单一源 + TOOL_REGISTRY
**验证**：新增 Widget 零改 App.tsx
