# GainLab App

> **"Agent 的眼睛"** — Agent 会分析，但不会画图。GainLab 帮 Agent 画图。

GainLab App 是 GainLab 的产品前端，提供 Mosaic 多窗口布局 + 混合图表渲染（KLineChart + ECharts）+ AI Chat 界面。

## 状态

🚧 **骨架验证阶段**（v0.1）— 验证核心架构可行性

## 技术栈

- **框架**：React 18 + TypeScript + Vite
- **布局**：react-mosaic（拖拽式多窗口）
- **K线图**：KLineChart（专业金融 K 线渲染）
- **非K线图**：ECharts（热力图 / 基本面 / 相关性矩阵）
- **样式**：Tailwind CSS
- **部署**：GitHub Actions → gh-pages

## 项目关系

| 仓库 | 职责 |
|---|---|
| [gainlab-mcp](https://github.com/Ashersun1207/gainlab-mcp) | MCP Server，7 个金融分析工具 |
| **gainlab-app**（本仓库） | 产品前端，Mosaic 布局 + 混合图表 + Chat |
| gainlab-research | 研究知识库，PRD / TASK / 决策 / 教训 |
| CF Worker | API 代理，保护 key |

## 开发

```bash
pnpm install
pnpm dev        # 本地开发
pnpm build      # 构建
```

## 部署

Push `main` 分支自动触发 GitHub Actions → gh-pages。

线上地址：https://ashersun1207.github.io/gainlab-app/

## 文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) — 代码结构 + 数据流
- [RULES.md](./RULES.md) — 开发规则

## License

MIT
