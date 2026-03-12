# 升级链 — 系统能力跃升记录

---

## E1: P0 骨架（T1-T3, 2026-02-17）
- Mosaic + KLineChart + ECharts 基础布局
- HeaderBar + Sidebar + Widget 控件
- 从零到能看的界面

## E2: Chat + Agent 集成（T4-T8）
- CF Worker 代理
- MiniMax-M2 对话 + tool calling
- Agent Widget 渲染
- 从"静态布局"到"AI 能操控界面"

## E3: Widget 体系化（T14-T16）
- Widget Catalog 单一源定义
- TOOL_REGISTRY 注册机制
- Zod Schema + buildWidgetPrompt
- 从"硬编码 Widget"到"可扩展体系"

## E4: Script 引擎探索（T17）
- 引入 ScriptView + 副图渲染
- 发现方向错误：Script hack builtin ≠ Indicator 原生
- 架构转向决策

## E5: Widget State Protocol（T18）
- ✕ 关闭 + 清空面板
- Multi-Widget 累积显示
- hiddenWidgets Set 隔离
- 297 tests 全绿
