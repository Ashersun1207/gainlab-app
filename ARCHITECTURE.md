# GainLab App — 架构文档

_P1 产品阶段 | 更新时机：目录结构或数据流变更后 | 最后更新 2026-02-22 (Widget State Protocol)_

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
│   │   ├── HeaderBar.tsx        # 顶部信息栏（GainLab logo + 数据源状态 + 主题/Agent 按钮）
│   │   ├── WidgetPanel.tsx     # Widget 面板壳（标题栏 + 刷新/全屏/关闭按钮）
│   │   ├── Toolbar.tsx         # (遗留) 顶部工具栏 — CK 场景已由 KLineHeader 替代
│   │   ├── Drawer.tsx          # (遗留) 底部抽屉 — CK 场景已由 Widget 网格替代
│   │   ├── Settings/
│   │   │   └── index.tsx       # 设置面板（语言/Agent配置/BYOK数据源/显示偏好/关于）
│   │   ├── MobileTabBar.tsx    # 移动端底部 Tab Bar（5 tab: 分析/快照/热力/AI/更多）
│   │   ├── MosaicDashboard.tsx # react-mosaic 容器（P0 遗留，保留兼容）
│   │   └── WidgetBase.tsx      # Widget 壳（深色主题）
│   │
│   ├── widgets/
│   │   ├── KLineWidget/
│   │   │   ├── index.tsx       # K线渲染（外部 data prop 优先 → fallback Binance → 样本数据）
│   │   │   ├── KLineHeader.tsx # TV 风格 widget-internal header（symbol 搜索 + 价格 + 周期 + 图表类型 + 指标 + 画图 + 控件）
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
│   ├── scenes/
│   │   ├── HeatmapScene.tsx    # 市场热力场景（7:3 layout: 大热力图 + 侧栏）
│   │   └── PlaceholderScene.tsx # 未实装场景 placeholder（Coming Soon）
│   │
│   ├── i18n/
│   │   └── index.ts            # 完整 i18n（zh/en，100+ keys：场景/tab/widget/指标/图表类型/设置/按钮）
│   │
│   ├── hooks/
│   │   ├── useScene.ts         # 场景管理 + URL 路由 + drill-down（替代 App.tsx useState）
│   │   ├── useMarketData.ts    # 市场数据 hook（kline + quote，走 CF Worker）
│   │   ├── useResizable.ts     # 拖拽分隔条 hook（DOM 操作避免 stale closure）
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

### 桌面端（≥768px）— CK 场景

```
┌──────────────────────────────────────────────────────────────────┐
│ App.tsx                                                           │
│ ┌────────┐ ┌───────────────────────────────────┐ ┌────────────┐ │
│ │Sidebar │ │ 主区                               │ │ ChatPanel  │ │
│ │42/250px│ │ ┌─────────────────────────────────┐│ │ 300px      │ │
│ │        │ │ │ HeaderBar (logo + 数据源状态)    ││ │ (可收起)   │ │
│ │ GainLab│ │ ├─────────────────────────────────┤│ │            │ │
│ │ ──────│ │ │ KLineHeader (TV 风格内置控件)    ││ │ 消息列表   │ │
│ │ 场景列表│ │ │ ⌕BTC/USDT|$96K|1H 4H 1D|CT|fx ││ │ + 输入框   │ │
│ │ ▸快照  │ │ ├─────────────────────────────────┤│ │            │ │
│ │ ▸个股  │ │ │ K线图区域 (flex:1)              ││ │ ToolCall   │ │
│ │ ▸热力  │ │ ├═════════════════════════════════┤│ │ Badge      │ │
│ │ ▸基本面│ │ │ ═══ 拖拽分隔条 (4px) ═══        ││ │            │ │
│ │ ──────│ │ ├─────────────────────────────────┤│ │            │ │
│ │        │ │ │ 3×2 Widget Grid (40vh)          ││ │            │ │
│ │        │ │ │ [热力图][基本面][报价表]         ││ │            │ │
│ │        │ │ │ [情绪  ][全球指数][外汇大宗]     ││ │            │ │
│ │        │ │ └─────────────────────────────────┘│ └────────────┘ │
│ └────────┘ └───────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

### 移动端（<768px）

```
┌──────────────────────────┐
│ KLineHeader (compact)     │
│ ⌕BTC/USDT|$96K|1H 1D    │
├──────────────────────────┤
│ Scene Content             │
│ (CK: KLine + grid 单列)  │
│ (NOW/HM/Placeholder)     │
│ (flex-1, 自适应高度)      │
├──────────────────────────┤
│ MobileTabBar (52px)       │
│ 分析 │ 快照 │ 热力 │ AI │ 更多 │
└──────────────────────────┘
+ AI tab → 全屏 Chat overlay
+ 更多 tab → 底部面板列出 10+ 场景
+ Chat 面板手机端隐藏
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

---

## App.tsx 状态管理

```typescript
// ── 场景管理（useScene hook，替代散落的 useState）──
const { activeScene, sceneParams, switchScene, drillDown, isImplemented } = useScene();
// sceneParams: { symbol, market, period } — 从 URL 初始化，pushState 同步

// ── 派生状态 ──
const activeSymbol = sceneParams.symbol ?? 'BTCUSDT';
const activeMarket = sceneParams.market ?? 'crypto';
const activeInterval = sceneParams.period ?? '1D';

// ── 指标 ──
const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);

// ── Chat ──
const [chatOpen, setChatOpen] = useState(false);

// ── P0 兼容：Chat 推送数据 ──
const [echartsOption, setEchartsOption] = useState<EChartsOption | null>(null);
const [chatKlineData, setChatKlineData] = useState<KLineData[] | null>(null);
```

**核心变更（M8 迁移）**：`useScene` 替代了散落的 useState，成为场景 + URL 路由的唯一来源。
**无外部状态管理库**，纯 `useState` + `useScene` + props drilling。

---

## 数据流

### 1. 场景模式（Sidebar / TabBar 驱动）

```
用户点击 Sidebar 场景 / TabBar tab
        │
        ▼
switchScene(sceneId, params?)      ← useScene hook
  → setActiveScene / setSceneParams
  → pushState URL(?s=&sym=&m=&p=)
        │
        ▼
App.tsx renderScene()
  → CK: KLineHeader + KLineWidget + resize + 3×2 Widget Grid + ChatPanel
  → NOW: QuoteTable + Sentiment + GlobalIndex + Heatmap + Forex + KLine
  → HM: HeatmapScene (7:3 layout)
  → 未实装: PlaceholderScene

useMarketData(symbol, market, interval)  ← 从 sceneParams 派生
  → fetchWorkerKline() + fetchWorkerQuote()
  → 走 CF Worker 代理
```

### 1b. drill-down（Widget → CK 场景）

```
Widget 数据行 onClick
        │
        ▼
drillDown(symbol, market?)          ← useScene hook
  → switchScene('stock_analysis', { symbol, market })
  → URL pushState
  → useMarketData 拉真实数据
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
- **移动端**: KLineHeader(compact) + Scene + MobileTabBar(5 tab) + Chat overlay
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

## Widget State Protocol

### 概念

Agent 调用 tool → Worker 拦截 SSE 注入 `widgetState` JSON → 前端解析 → 主区域渲染对应 Widget。

三条路径共用同一套 Widget 组件渲染：
- **人主动浏览**：Sidebar 切场景 / drill-down
- **Agent 推送**：Chat tool_result 带 widgetState → 自动切场景 + 更新参数
- **分享/嵌入**：URL 参数初始化（P2+）

### SSE 数据流

```
前端 ChatPanel
  │  POST /api/chat { messages, config: {model, style, lang} }
  ▼
CF Worker (SSE 中间件)
  │  → MiniMax M2 (OpenAI 兼容格式)
  │  ← choices[0].delta.content / tool_calls
  │
  │  Worker 转换:
  │    delta.content     → {"type":"text_delta","text":"..."}
  │    delta.tool_calls  → {"type":"tool_call","tool":{name,id,arguments}}
  │    finish_reason=tool_calls → 内部执行 tool → {"type":"tool_result","result":{...},"widgetState":{...}}
  │    <think> 标签     → 过滤掉
  ▼
前端 mcpClient.ts 解析
  │  text_delta → 消息气泡追加文字
  │  tool_call → 显示 ToolCallBadge
  │  tool_result → handleToolResult(name, result, widgetState)
  ▼
App.tsx
  │  widgetState → setAgentWidgetState
  │  useEffect → switchScene('ai')  // 自动切到 Agent 场景
  ▼
AgentView (src/scenes/AgentView.tsx)
  │  根据 widgetState.type 渲染对应 Widget
  │  kline/overlay/volume_profile → KLineWidget
  │  heatmap → HeatmapWidget
  │  fundamentals → FundamentalsWidget
  ▼
主区域渲染（Chat 保持在右侧 panel）
```

### WidgetState Schema

```typescript
interface WidgetState {
  type: string;               // 'kline' | 'heatmap' | 'overlay' | ...
  [key: string]: unknown;     // Widget 特定参数
}
```

Worker 端 `toWidgetState(toolName, args)` 映射：

| tool name | widgetState.type | 额外字段 |
|---|---|---|
| `gainlab_kline` | `kline` | symbol, market, period |
| `gainlab_indicators` | `kline` | symbol, market, period, indicators[] |
| `gainlab_wrb_scoring` | `kline` | symbol, market, period, showWRB |
| `gainlab_heatmap` | `heatmap` | market |
| `gainlab_overlay` | `overlay` | symbols[], markets[], period |
| `gainlab_fundamentals` | `fundamentals` | symbol, market |
| `gainlab_volume_profile` | `volume_profile` | symbol, market, period |

widgetState.type → **统一落到 AI 场景 (AgentView)**：

| type | AgentView 渲染 |
|---|---|
| `kline` | KLineWidget |
| `heatmap` | HeatmapWidget |
| `overlay` | KLineWidget (MA) |
| `fundamentals` | FundamentalsWidget |
| `volume_profile` | KLineWidget (VP) |
| `sentiment` | Placeholder (P2) |

### 降级策略

- Worker 未注入 widgetState → 前端走现有 handleToolResult 逻辑（数据转换 + 硬编码渲染）
- 未知 widgetState.type → 忽略，不报错

---

## 与外部系统的关系

```
CF Worker: gainlab-api.asher-sun.workers.dev
  ├── POST /api/chat     — AI 对话（SSE 中间件：MiniMax 格式转换 + tool 执行 + widgetState 注入）
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
| Vitest + RTL | 测试（185 tests, G1 只增不减） |
| ESLint flat config | Lint（0 error 才能 commit） |
| tsc + typecheck.sh | 类型检查（过滤 KLineChart 45K fork 错误） |
| Vite | 构建 + Dev server |
| GH Actions | CI/CD → gh-pages |

```bash
# G4 四步门禁
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

_创建于 2026-02-17 | 最后更新于 2026-02-19（CK 对齐 + 全站 i18n + Settings + 185 tests）_
