# 需求链 — 需求→实现追踪

---

## REQ1: "Agent 组件展示，不是看盘工具"
**来源**：定位讨论（2/19）
**转化**：Widget 自治 + Agent 编排 + 可嵌入
**实现**：T14-T18 Widget Catalog 架构

## REQ2: "控件内置在图表里"
**来源**：参考 TradingView 模式
**转化**：KLineHeader 内置标的/时间周期/指标面板
**实现**：Prototype 迭代

## REQ3: "preview-layout.html 是入口"
**来源**：老板看效果用 preview-layout.html
**转化**：新 Widget 必须集成到 preview-layout.html
**实现**：写入 MEMORY 规则

## REQ4: "副图指标不稳定，方向不对"
**来源**：T17 反馈
**转化**：回退 Script hack，恢复 Indicator 原生
**实现**：确定 P1-P4 搬迁路线，代码待执行

## REQ5: "指标按钮改单按钮+overlay"
**来源**：2/19 反馈
**转化**：单按钮触发分组面板（主图叠加 vs 副图指标）
**实现**：Prototype 完成

## REQ6: "标的选择改 overlay 覆盖式"
**来源**：2/19 反馈
**转化**：覆盖在图表上方，不撑开布局
**实现**：Prototype 完成
