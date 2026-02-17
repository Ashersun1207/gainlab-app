# GainLab App — 架构文档

_骨架验证阶段（v0.1）| 更新时机：目录结构或数据流变更后_

---

## 项目定位

`gainlab-app` 是 GainLab 的**产品前端**，独立仓库。  
对应关系：

| 仓库 | 职责 |
|---|---|
| `gainlab-mcp` | MCP Server，提供 7 个金融分析工具，发布为 npm 包 |
| `gainlab-app` | 产品前端（本仓库），Mosaic 布局 + 混合图表 + Chat 界面 |
| `gainlab-research` | 研究仓库，PRD / TASK / 决策 / 教训 |
| Cloudflare Worker | API 代理，保护 key，gainlab-api.asher-sun.workers.dev |

---

## 目录结构

```
gainlab-app/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GH Actions → gh-pages
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 根组件，布局组装
│   ├── types/
│   │   ├── data.ts             # OHLCV / Indicator 类型（复制自 dashboard）
│   │   └── mcp.ts              # MCP message / tool call / SSE 类型
│   ├── layout/
│   │   ├── MosaicDashboard.tsx # react-mosaic 布局容器（复制自 dashboard）
│   │   ├── Sidebar.tsx         # 侧边栏 + 资产选择（复制自 dashboard）
│   │   └── WidgetBase.tsx      # Widget 基类容器（复制自 dashboard）
│   ├── widgets/
│   │   ├── KLineWidget/
│   │   │   ├── index.tsx       # K线 Widget 入口
│   │   │   ├── ChartView.tsx   # KLineChart 渲染（复制自 dashboard）
│   │   │   └── plugins/        # KLineChart plugin（复制自 dashboard，45K行）
│   │   └── EChartsWidget/
│   │       ├── index.tsx       # ECharts Widget 入口
│   │       └── charts/
│   │           ├── HeatmapChart.tsx     # 热力图
│   │           ├── FundamentalsChart.tsx # 基本面图
│   │           └── CorrelationChart.tsx  # 相关性矩阵
│   ├── chat/
│   │   ├── ChatPanel.tsx       # 对话框 UI
│   │   ├── MessageList.tsx     # 消息渲染
│   │   └── ToolCallBadge.tsx   # tool call 可视化
│   ├── services/
│   │   ├── mcpClient.ts        # 连 CF Worker，SSE 解析，tool call 处理
│   │   └── dataAdapter.ts      # MCP 数据 → KLineChart / ECharts 格式转换
│   ├── hooks/
│   │   ├── useMcpStream.ts     # SSE 流式响应 hook
│   │   └── useWidgetData.ts    # Widget 数据管理 hook
│   ├── i18n/
│   │   ├── zh.ts               # 中文（复制自 dashboard）
│   │   └── en.ts               # 英文（复制自 dashboard）
│   └── utils/
│       └── format.ts           # OHLCV 格式转换，数据规范化
├── ARCHITECTURE.md             # 本文件
├── RULES.md                    # 开发规则
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 数据流

### 正常对话流程

```
用户输入自然语言
        │
        ▼
ChatPanel.tsx
        │  fetch POST (messages[])
        ▼
CF Worker (gainlab-api.asher-sun.workers.dev/api/chat)
        │  持有 AI API key（MiniMax-M2）
        │  IP 限流（10 req/min）
        ▼
MiniMax-M2 / Claude（AI 模型）
        │  tool_call: { name: "gainlab_kline", args: {...} }
        ▼
CF Worker SSE stream
        │  事件流：text_delta | tool_call | tool_result
        ▼
mcpClient.ts (useMcpStream hook)
        │  解析 SSE → 识别 tool call
        │
        ├── tool call → dataAdapter.ts
        │       │  MCP 数据格式 → KLineChart/ECharts 格式
        │       ▼
        │   KLineWidget（KLineChart）
        │       或
        │   EChartsWidget（echarts-for-react）
        │
        └── text_delta → MessageList.tsx（流式渲染文字）
```

### 数据层（阶段性）

```
骨架阶段（v0.1）：
  加密数据   ← Binance REST API（公开，无需 key）
  其他数据   ← sample-data.json（内嵌静态数据）

产品阶段（v1.0）：
  免费层     ← Binance + Tushare + Yahoo Finance
  BYOK 层    ← 用户自带 EODHD / FMP / Binance Key
  配置        ← ~/.gainlab/config.json（MCP tool 管理）
  缓存        ← CF KV（服务端）+ localStorage（客户端）
```

---

## 混合渲染策略

```
MCP Server 输出标准化数据（不含渲染指令）
        │
        ▼
dataAdapter.ts 判断渲染类型
        │
        ├── K线类（kline / indicators / volume_profile / wrb）
        │       → 转换为 KLineChart 格式
        │       → KLineWidget（ChartView）渲染
        │
        └── 非K线类（heatmap / fundamentals / correlation / overlay）
                → 构建 ECharts option
                → EChartsWidget 渲染
```

**判断逻辑**（`dataAdapter.ts`）：

```typescript
type RenderTarget = "kline" | "echarts";

function getRenderTarget(toolName: string): RenderTarget {
  const klineTools = ["gainlab_kline", "gainlab_indicators", 
                      "gainlab_volume_profile", "gainlab_wrb_scoring"];
  return klineTools.includes(toolName) ? "kline" : "echarts";
}
```

**MCP 可选 `render:"echarts"` 模式**：  
当 MCP Server 响应中包含 `render:"echarts"` 字段时，即使是 K 线数据也用 ECharts 渲染（兼容纯数据消费场景）。

---

## 从 gainlab-dashboard 复制的模块清单

> 原则：复制不重写。cherry-pick 需要的部分，不背整个 dashboard 包袱。

| 模块 | 估算行数 | 复制方式 | 需要修改的内容 |
|---|---|---|---|
| react-mosaic 布局（MosaicDashboard） | ~800 行 | 直接复制 | 去掉 dashboard 特有的 redux store 依赖 |
| Sidebar 组件（OpenBBSidebar） | ~600 行 | 直接复制 | 去掉 OpenBB 特有逻辑，资产列表改为 props |
| Widget 基类容器 | ~200 行 | 直接复制 | 无需修改 |
| i18n（zh/en） | ~600 行 | 直接复制 | 追加 app 特有文案 |
| KLineChart plugin + ChartView | ~45,000 行 | 直接复制整个 plugins/ 目录 | 去掉 dashboard 的 store 订阅，改为 props 传入 |
| OHLCV / 类型定义 | ~400 行 | 直接复制 | 无需修改 |
| **合计** | **~47,400 行** | | |

> gainlab-dashboard 总规模：~54,000 行  
> 删除的部分：后端数据层（Node 版）/ 非必要 tabs / 测试文件

---

## 与 gainlab-mcp 的关系

```
gainlab-mcp（MCP Server）
  ├── 发布为 npm 包（@gainlab/mcp）
  ├── 独立运行，可被任意 Agent / LLM 调用
  └── 与 gainlab-app 无直接代码依赖

gainlab-app（本仓库）
  ├── 不 import gainlab-mcp 的代码
  ├── 通过 CF Worker 与 AI 模型交互
  └── AI 模型决定调用哪个 MCP tool → Worker 执行 → 返回数据
```

**骨架阶段简化**：gainlab-mcp tools 的执行逻辑在 CF Worker 内内联实现（不实际运行 MCP Server），产品阶段再接真正的 MCP Server。

---

## 与 CF Worker 的关系

```
CF Worker: gainlab-api.asher-sun.workers.dev
  ├── 端点：POST /api/chat
  ├── 职责：
  │   ├── 持有 AI API key（MiniMax / Claude）
  │   ├── IP 限流（10 req/min/IP）
  │   ├── 持有 EODHD / FMP key（BYOK 代理）
  │   └── 返回 SSE 流（text_delta + tool_call + tool_result）
  └── 已有实现：骨架阶段直接复用，不新建 Worker
```

**骨架验证阶段复用现有 Worker**，减少变量。产品阶段按需扩展 Worker 能力（BYOK key 代理、CF KV 缓存等）。

---

## 骨架验证范围（v0.1）

骨架阶段只实现最小可验证集合：

| 组件 | 验证目标 |
|---|---|
| Mosaic 布局（2 个 Widget） | react-mosaic 可以正常拖拽分割 |
| KLineWidget | KLineChart 在浏览器中渲染 K 线 + RSI |
| EChartsWidget | echarts-for-react 渲染热力图 |
| 简化 Chat | 输入框 → CF Worker → tool call → 触发 Widget 更新 |
| GH Actions 部署 | push main → gh-pages 自动更新 |

**不在骨架范围内**：完整 Sidebar、i18n 切换、移动端适配、完整 7 工具覆盖、BYOK、CF KV 缓存。

---

_创建于 2026-02-17 | 骨架验证 v0.1_
