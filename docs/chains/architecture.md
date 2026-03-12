# 架构链 — 架构演进决策

---

## A1: Widget 自治模式

**核心原则**：每个 Widget 自治，控件内置，不依赖全局状态
**原因**：
- Agent 场景每个 Widget 可能看不同标的
- Widget 需要能独立嵌入第三方页面
- TradingView 专业工具验证了这个模式

## A2: Mosaic 自由布局

**为什么 react-mosaic？**
- Dashboard 已验证可行
- 专业交易工具需要自由分割（Grid 太死板）
- 手机端降级为全屏 tab 切换
- 预设模板 + 自由拖拽兼得

## A3: Widget Catalog 单一源

**问题**：Widget 定义散落 types/AgentView/klineTools/Worker prompt 四处
**方案**：`src/catalog/widget-catalog.ts` 集中定义
- schema（Zod）：参数验证
- prompt：AI 知道怎么调
- propsMapper：统一不同组件的 prop 形状
- isKline：路由到 KLineChart 还是 ECharts
**效果**：新增 Widget 只改 catalog + 写组件

## A4: 渲染混合 — KLineChart + ECharts

- KLineChart：K 线专业（画图/光标/缩放/指标叠加）
- ECharts：万能图表（热力图/基本面/相关性）
- 两者职责不同，不能互相替代

## A5: 架构转向 — Dashboard 能力搬到 App

**起因**：T17 Script hack 暴露了方向问题
**决策**：App 轻量(11K) vs Dashboard 重(101K)，Agent 层只 1310 行搬哪都行
**路线**：P1 恢复 Indicator → P2 搬 Monaco → P3 搬标注 → P4 Widget 放大
**愿景**：图表+脚本+标注都是 Widget，Agent 编排一切
