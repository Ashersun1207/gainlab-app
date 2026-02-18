# GainLab App — 架构文档

_P1 产品阶段 | 更新时机：目录结构或数据流变更后_

---

## 项目定位

`gainlab-app` 是 GainLab 的**产品前端**，独立仓库。  
对应关系：

| 仓库 | 职责 |
|---|---|
| `gainlab-mcp` | MCP Server，提供 7 个金融分析工具，发布为 npm 包 |
| `gainlab-app` | 产品前端（本仓库），三区布局 + 混合图表 + Chat 界面 |
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
│   ├── App.tsx                 # 三区布局 + 移动端适配 + 状态管理
│   ├── index.css               # Tailwind + Mosaic 深色主题 + 移动端样式
│   │
│   ├── layout/
│   │   ├── Sidebar/
│   │   │   ├── index.tsx       # Sidebar 主组件（Koyfin 单栏双状态：折叠 42px / 展开 250px）
│   │   │   ├── SceneList.tsx   # 场景列表（可展开 → 显示子 Widget 清单）
│   │   │   ├── sceneConfig.ts  # 场景定义（id/名称/图标/badge/children Widget 列表）
│   │   │   └── SidebarToggle.tsx # Hamburger 切换按钮（展开时右侧，带箭头指示）
│   │   ├── Toolbar.tsx         # 顶部工具栏（资产名 + 价格 + 周期选择器 + 图表类型 + 指标）
│   │   ├── Drawer.tsx          # 底部抽屉（工具面板容器）
│   │   ├── MobileTabBar.tsx    # 移动端底部 Tab Bar（📊市场/🔧工具/💬聊天）
│   │   ├── MosaicDashboard.tsx # react-mosaic 容器（P0 遗留，保留兼容）
│   │   └── WidgetBase.tsx      # Widget 壳（深色主题）
│   │
│   ├── widgets/
│   │   ├── KLineWidget/
│   │   │   ├── index.tsx       # K线渲染（外部 data prop 优先 → fallback Binance → 样本数据）
│   │   │   ├── klinechart.d.ts # 类型声明
│   │   │   ├── klines/         # K线数据文件
│   │   │   └── KLineChart/     # 45K 行 fork（G5 禁区，不改）
│   │   ├── EChartsWidget/
│   │   │   ├── index.tsx       # 通用 ECharts 容器
│   │   │   └── charts/
│   │   │       ├── HeatmapChart.ts       # treemap option builder
│   │   │       └── sampleHeatmapData.ts  # 20 加密货币静态数据
│   │   ├── HeatmapWidget/
│   │   │   └── index.tsx       # 板块热力图（自动 fetch screener 数据）
│   │   ├── VolumeProfileWidget/
│   │   │   ├── index.tsx       # 筹码分布（基于 klineData 计算）
│   │   │   └── calculateVP.ts  # VP 计算逻辑
│   │   ├── OverlayWidget/
│   │   │   ├── index.tsx       # 多资产叠加对比
│   │   │   └── useOverlayData.ts  # 多 symbol 并行 fetch
│   │   ├── FundamentalsWidget/
│   │   │   └── index.tsx       # 基本面数据柱状图
│   │   ├── WRBWidget/
│   │   │   ├── index.tsx       # WRB 信号检测列表
│   │   │   └── detectWRB.ts    # WRB 检测逻辑
│   │   ├── QuoteTableWidget/
│   │   │   └── index.tsx       # 通用报价表（W1，复用于 W5/W6）
│   │   ├── SentimentWidget/
│   │   │   └── index.tsx       # 市场情绪仪表盘（W4，VIX + Fear & Greed gauge）
│   │   ├── GlobalIndexWidget/
│   │   │   └── index.tsx       # 全球指数（W5，复用 QuoteTableWidget）
│   │   └── ForexCommodityWidget/
│   │       └── index.tsx       # 外汇 + 大宗商品（W6，复用 QuoteTableWidget）
│   │
│   ├── chat/
│   │   ├── ChatPanel.tsx       # 对话框 UI（输入框 + 消息列表）
│   │   ├── ChatToggle.tsx      # 💬 悬浮按钮（桌面端）
│   │   ├── MessageList.tsx     # 消息渲染（user/assistant 气泡 + 自动滚底）
│   │   └── ToolCallBadge.tsx   # tool call 标签（紫色，可折叠 args）
│   │
│   ├── hooks/
│   │   ├── useMarketData.ts    # 市场数据 hook（kline + quote，走 CF Worker）
│   │   ├── useResponsive.ts    # 响应式断点 hook（768px，matchMedia 监听）
│   │   └── useMcpStream.ts     # SSE 流式响应 hook + Widget 回调
│   │
│   ├── services/
│   │   ├── api.ts              # CF Worker API 封装（kline/quote/search/fundamentals/screener/batchQuotes）
│   │   ├── dataAdapter.ts      # 渲染目标路由 + MCP 数据格式转换
│   │   ├── marketData.ts       # useMarketData 的数据获取实现
│   │   └── mcpClient.ts        # CF Worker SSE 通信 + think 过滤
│   │
│   ├── types/
│   │   ├── market.ts           # MarketType / TimeInterval / ToolType / Asset / Quote
│   │   ├── data.ts             # KLineData / HeatmapItem / VPLevel / WRBSignal / FundamentalsData
│   │   └── mcp.ts              # McpMessage / McpToolCall / McpStreamEvent
│   │
│   ├── constants/
│   │   └── markets.ts          # 市场配置 / 热门资产 / 时间周期 / 指标 / 工具配置
│   │
│   ├── components/
│   │   └── ErrorBoundary.tsx   # React Error Boundary（深色主题，retry 按钮）
│   │
│   └── utils/                  # （空，格式转换在 dataAdapter.ts）
│
├── scripts/
│   ├── project-boot.sh         # 认知恢复脚本
│   ├── typecheck.sh            # tsc 检查（过滤 KLineChart fork 错误）
│   ├── verify.sh               # 验收自动化（V1-V6）
│   └── post-batch.sh           # 批次收尾（commit + sync + check-all）
├── ARCHITECTURE.md             # 本文件
├── RULES.md                    # 开发规则
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 布局结构

### 桌面端（≥768px）

```
┌─────────────────────────────────────────────────────────────────┐
│ App.tsx                                                          │
│  ┌────────┐  ┌──────────────────────────────┐  ┌─────────────┐ │
│  │Sidebar │  │ 主区                          │  │ ChatPanel   │ │
│  │42/250px│  │ ┌────────────────────────────┐│  │ 320px       │ │
│  │        │  │ │ Toolbar                     ││  │ (可收起)    │ │
│  │ GainLab│  │ │ BTC/USDT|$96K|1H 4H 1D|CK ││  │             │ │
│  │ ──────│  │ ├────────────────────────────┤│  │ 消息列表    │ │
│  │ 场景列表│  │ │ Widget 区域                 ││  │ + 输入框    │ │
│  │ ▸快照  │  │ │ (场景对应的 Widget 组合)     ││  │             │ │
│  │ ▾个股  │  │ │ K线/指标/筹码/WRB/...       ││  │ ToolCall    │ │
│  │  K线图 │  │ ├────────────────────────────┤│  │ Badge       │ │
│  │  筹码  │  │ │ Drawer (可关闭)             ││  │             │ │
│  │  WRB   │  │ │ 工具面板                    ││  │             │ │
│  │ ──────│  │ └────────────────────────────┘│  └─────────────┘ │
│  └────────┘  └──────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 移动端（<768px）

```
┌──────────────────────────┐
│ Toolbar (48px)            │
│ BTC/USDT ▾ │ 1D ▾        │
├──────────────────────────┤
│ KLineWidget              │
│ (flex-1, 自适应高度)      │
├──────────────────────────┤
│ Drawer (40dvh, 可选)      │
│ 工具内容                  │
├──────────────────────────┤
│ MobileTabBar (56px)       │
│ 📊市场 │ 🔧工具 │ 💬聊天  │
└──────────────────────────┘
+ 全屏 Overlay (市场/工具/聊天)
```

---

## 场景模型（Scene → Widget）

Sidebar 的每个条目是一个**场景（Scene）**，而非单个 Widget。
场景 = Agent 预组装的多 Widget 组合，用户点击场景切换整个视图布局。

### 概念层级

```
Scene（场景）    ← sidebar 列的东西，如"个股分析""市场热力"
  └── Widget[]  ← 场景包含的组件列表，可自由增删
       └── K线图 / 热力图 / 筹码分布 / ...
```

### 场景定义（sceneConfig.ts）

```typescript
interface Scene {
  id: string;              // 'stock_analysis'
  nameKey: string;         // i18n key
  badge: string;           // 快捷键 badge
  icon: ReactNode;         // SVG 图标
  children: WidgetDef[];   // 包含的 Widget 列表
}

interface WidgetDef {
  nameKey: string;         // i18n key
  widgetType: string;      // 对应的 Widget 组件类型
}
```

### Sidebar 分组

| 分组 | 场景 | badge | 子 Widget |
|---|---|---|---|
| （顶部高频） | AI 对话 | AI | 对话面板 / 指令快捷 |
| | 行情快照 | NOW | 涨跌排行 / 热力图 / 关键指数 |
| | 自选股 | MYW | 自选列表 / 迷你图 |
| DASHBOARDS | 个股分析 | CK | K线 / 筹码 / WRB / 指标 |
| | 市场热力 | HM | Crypto热力 / 板块热力 / 涨跌排行 |
| | 基本面 | FD | 财务概览 / 财报对比 / 现金流 |
| | 多资产对比 | CMP | 叠加走势 / 相关性 / 比率图 |
| | 全球指数 | WEI | 全球指数 / 汇率矩阵 |
| | 宏观经济 | ECON | 利率 / GDP/CPI |
| PORTFOLIO TOOLS | 我的持仓 | MYP | 持仓明细 / 盈亏（待开发） |
| | 风险分析 | RISK | VaR / 最大回撤（待开发） |
| AI TOOLS | 智能分析 | ANA | 信号扫描 / 策略回测 |
| | 研报生成 | RPT | 生成报告 / AI摘要 |
| | 条件筛选 | MYS | 筛选器 / 条件构建 |

### Sidebar 交互

- **折叠态（42px）**：只显示图标 + hover tooltip
- **展开态（250px）**：图标 + 场景名 + badge，点击展开子 Widget 列表
- **Toggle**：hamburger 按钮，展开时在右侧带 ← 箭头，折叠时 → 箭头

### Toolbar 新增组件

- **周期选择器**：常用快捷按钮 + ▾ 下拉全部 + ★ 星标设为常用（max 5）
- **图表类型**：5 种（实心蜡烛/空心蜡烛/OHLC/价格线/价格区域），图标+下拉

---

## App.tsx 状态管理

```typescript
// ── 资产上下文 ──
const [activeMarket, setActiveMarket] = useState<MarketType>('crypto');
const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
const [activeInterval, setActiveInterval] = useState<TimeInterval>('1D');
const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);

// ── 抽屉 ──
const [drawerTool, setDrawerTool] = useState<ToolType | null>(null);

// ── Chat ──
const [chatOpen, setChatOpen] = useState(false);

// ── 移动端 ──
const [mobileTab, setMobileTab] = useState<MobileTab>('market');
const [mobileOverlay, setMobileOverlay] = useState<MobileTab | null>(null);

// ── P0 兼容：Chat 推送数据 ──
const [echartsOption, setEchartsOption] = useState<EChartsOption | null>(null);
const [chatKlineData, setChatKlineData] = useState<KLineData[] | null>(null);
```

**无外部状态管理库**（G3 约束），纯 `useState` + props drilling。

---

## 数据流

### 1. 仪表盘模式（Sidebar 驱动）

```
用户点击 Sidebar 资产
        │
        ▼
handleAssetSelect(asset)
  → setActiveSymbol / setActiveMarket
        │
        ▼
useMarketData(symbol, market, interval)
  → fetchWorkerKline() + fetchWorkerQuote()
  → 走 CF Worker 代理
        │
        ▼
klineData / quote 更新
        │
        ├── Toolbar 显示价格 / 涨跌
        ├── KLineWidget.setDataList(klineData)
        └── Drawer 工具使用 klineData（VP / WRB）
```

### 2. Chat 模式（AI 驱动）

```
用户输入自然语言
        │
        ▼
ChatPanel → useMcpStream
        │  fetch POST → CF Worker → MiniMax-M2
        ▼
SSE stream: text_delta | tool_call | tool_result
        │
        ▼
handleToolResult(toolName, result)
  → getRenderTarget(toolName)
        │
        ├── "kline" → setChatKlineData(mcpToKLine(result))
        │              → KLineWidget 显示 Chat 推送的数据
        │
        └── "echarts" → setEchartsOption(mcpToEChartsOption(...))
                         → EChartsWidget 显示图表
```

### 3. 抽屉工具模式

```
用户点击 Sidebar 工具按钮
        │
        ▼
handleToolClick(tool)
  → setDrawerTool(tool)
        │
        ▼
Drawer 展开 → renderDrawerContent()
  switch(tool):
    volume_profile → VolumeProfileWidget(klineData)
    heatmap        → HeatmapWidget(market)
    overlay        → OverlayWidget(symbol, market)
    fundamentals   → FundamentalsWidget(symbol)
    wrb            → WRBWidget(klineData)
```

---

## 混合渲染策略

| 场景 | 渲染库 | 组件 |
|---|---|---|
| K线（OHLCV）+ 技术指标 | KLineChart | KLineWidget |
| 筹码分布 | ECharts (bar) | VolumeProfileWidget |
| 板块热力图 | ECharts (treemap) | HeatmapWidget |
| 多资产叠加 | ECharts (line) | OverlayWidget |
| 基本面柱状图 | ECharts (bar) | FundamentalsWidget |
| WRB 信号 | 纯 HTML 列表 | WRBWidget |
| 报价表（四市场/全球指数/外汇大宗） | 纯 HTML 表格 | QuoteTableWidget |
| 市场情绪（VIX + Fear & Greed） | ECharts (gauge) | SentimentWidget |
| Chat 推送图表 | ECharts (dynamic) | EChartsWidget |

---

## 响应式设计

- **断点**: 768px（`useResponsive` hook, matchMedia 监听）
- **桌面端**: Sidebar(200px) + 主区(flex-1) + Chat(320px 可收起)
- **移动端**: Toolbar + KLine + Drawer + MobileTabBar + 全屏 Overlay
- **高度计算**: `calc(100dvh - toolbar - tabbar)`，不硬编码
- **iOS 安全区**: `env(safe-area-inset-bottom)` padding

---

## 代码分割（G7）

所有 Widget 和 ChatPanel 使用 `React.lazy` + `Suspense` 动态加载：

| chunk | 内容 | 大小 |
|---|---|---|
| index | App + layout + hooks | ~3KB |
| KLineWidget | KLineChart fork | ~560KB |
| ECharts | echarts 库 | ~1.1MB |
| ChatPanel | Chat UI + MCP stream | ~8KB |
| 工具 Widgets | VP/Heatmap/Overlay/Fundamentals/WRB | ~3KB each |

首屏只加载 App shell + KLineWidget，其他按需加载。

---

## 与外部系统的关系

```
CF Worker: gainlab-api.asher-sun.workers.dev
  ├── POST /api/chat     — AI 对话（SSE stream）
  ├── GET /api/kline      — K线数据（所有市场）
  ├── GET /api/quote      — 实时报价
  ├── GET /api/search     — 资产搜索
  ├── GET /api/fundamentals — 基本面数据
  └── GET /api/screener   — 板块筛选（热力图）

所有请求走 CF Worker 代理，前端不直连任何 API。
```

---

## 工程化

| 工具 | 用途 |
|---|---|
| Vitest + RTL | 测试（89 tests, G1 只增不减） |
| ESLint flat config | Lint（0 error 才能 commit） |
| tsc + typecheck.sh | 类型检查（过滤 KLineChart 45K fork 错误） |
| Vite | 构建 + Dev server |
| GH Actions | CI/CD → gh-pages |

```bash
# G4 四步门禁
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## P1 完成组件清单

| 任务 | 组件 | 状态 |
|---|---|---|
| T01 | types/market.ts, types/data.ts | ✅ |
| T02 | constants/markets.ts | ✅ |
| T03 | Sidebar/ (index + MarketTabs + SearchBox + AssetList + ToolBar) | ✅ |
| T04 | Toolbar.tsx | ✅ |
| T05 | Drawer.tsx | ✅ |
| T06 | services/api.ts, services/marketData.ts, hooks/useMarketData.ts | ✅ |
| T07 | ChatPanel.tsx (重构), ChatToggle.tsx | ✅ |
| T08 | HeatmapWidget, VolumeProfileWidget, OverlayWidget, FundamentalsWidget, WRBWidget | ✅ |
| T09 | hooks/useResponsive.ts, layout/MobileTabBar.tsx, mobile CSS | ✅ |
| T10 | App.tsx 集成, ARCHITECTURE.md 更新 | ✅ |

---

_创建于 2026-02-17 | P1 产品阶段 | 最后更新于 2026-02-17（T10 集成完成）_
