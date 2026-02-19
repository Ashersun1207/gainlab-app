# preview-layout.html — 结构文档

_改 preview-layout 前必读。1390 行单文件，本文档是导航地图。_

---

## 定位

**preview-layout.html = 产品 Demo**（L24 教训）

| | preview-layout.html | React App (src/) |
|---|---|---|
| 角色 | Demo：体验完整交互流程 | 产品：真实数据 + 工程化 |
| 数据 | 硬编码 sample data | CF Worker API |
| 技术 | vanilla JS 单文件 | React + TS + Vite |
| 入口 | `ashersun1207.github.io/gainlab-app/preview-layout.html` | `ashersun1207.github.io/gainlab-app/` |
| 部署 | `public/` 静态文件 | Vite build → gh-pages |

两者共用 Widget State Schema（JSON 结构一致），但渲染层各自实现。

---

## 文件分区（~1390 行）

| 区域 | 行号 | 内容 |
|---|---|---|
| **CSS** | 1-336 | 所有样式（CSS 变量 + 响应式） |
| **HTML** | 337-660 | 页面结构（Header + Sidebar + Scenes + Chat） |
| **JS: Widget 渲染** | 661-960 | gen* 函数（蜡烛/VP/热力图/报价表/情绪/指数/外汇） |
| **JS: Scene 切换** | 961-990 | switchScene + populate* |
| **JS: Sidebar 数据** | 1032-1090 | sidebarItems 数组（14 场景定义） |
| **JS: Sidebar 渲染** | 1090-1130 | renderSidebar + 点击事件 |
| **JS: i18n** | 1135-1260 | zh/en 翻译表 + t() 函数 + applyLang |
| **JS: 工具交互** | 1260-1303 | 画图工具 overlay + 语言切换 |

---

## CSS 变量（深色主题）

```css
--bg0:#08081a  --bg1:#0d0d20  --bg2:#12122a  --bg3:#1a1a3e
--bgH:#1e1e3a  --brd:#2a2a4a  --brd2:#3a3a6a
--t1:#e0e0f0   --t2:#8888aa   --t3:#5a5a8a
--acc:#2563eb  --acc2:#1d4ed8
--grn:#26a69a  --red:#ef5350  --gld:#f0b90b
```

## CSS 类名约定

| 前缀 | 含义 | 示例 |
|---|---|---|
| `.wp` | Widget Panel（整个 Widget 容器） | `<div class="wp">` |
| `.wph` | Widget Panel Header | `.wph-title` `.wph-sym` `.wph-btn` |
| `.wpb` | Widget Panel Body | 内容区 |
| `.kw` | Kline Widget | 主 K线区域 |
| `.sb-` | Sidebar | `.sb-item` `.sb-ico` `.sb-text` `.sb-badge` |
| `.qt-` | Quote Table | `.qt-row` `.qt-name` `.qt-price` `.qt-hdr` |
| `.hmg` | Heatmap Grid | 热力图网格 |
| `.snt-` | Sentiment | `.snt-gauge` `.snt-arc` `.snt-val` |
| `.ct` | Content area（主区域） | Sidebar 右边 |
| `.cp` | Chat Panel | 右侧聊天 |
| `.hdr` | Header bar | 顶部 |

---

## HTML 结构

```
<body>
  ├── .hdr (Header: logo + pills + 按钮)
  └── .mn (Main)
      ├── .sidebar#sidebar (折叠42px/展开250px)
      │   ├── .sb-top (hamburger + logo)
      │   └── .sb-nav#sbNav (场景列表，JS 动态渲染)
      ├── .ct (Content 主区域)
      │   ├── #sceneCK (个股分析场景，默认显示)
      │   │   ├── .kw (K线 Widget: 标的选择+周期+指标+图表+画图工具)
      │   │   ├── .rh (Resize handle)
      │   │   └── .wg (底部 Widget Grid: 热力图+基本面)
      │   ├── #sceneNOW (行情快照场景，display:none)
      │   │   └── .scene-now-grid (3×2 Grid)
      │   │       ├── QUOTES (报价表)
      │   │       ├── HEATMAP (热力图)
      │   │       ├── SENTIMENT (情绪)
      │   │       ├── GLOBAL INDEX (全球指数)
      │   │       ├── FX & COMM (外汇大宗)
      │   │       └── BTC/USDT (K线缩略)
      │   └── #sceneHM (市场热力场景，display:none)
      │       └── .scene-hm-layout (7:3 分栏)
      │           ├── .scene-hm-main (大热力图)
      │           └── .scene-hm-side (Top Movers + Quotes)
      └── .cp (Chat Panel: AI 对话)
```

---

## 三个 Scene

| Scene ID | DOM ID | 触发条件 | populate 函数 |
|---|---|---|---|
| `stock_analysis` | `sceneCK` | 默认 / sidebar 点个股分析 | 无（HTML 已有内容） |
| `snapshot` | `sceneNOW` | sidebar 点行情快照 | `populateNowScene()` |
| `market_heat` | `sceneHM` | sidebar 点市场热力 | `populateHmScene()` |

### switchScene 逻辑（~L962）

```javascript
const sceneMap = {
  'stock_analysis': 'sceneCK',
  'snapshot': 'sceneNOW',
  'market_heat': 'sceneHM'
};
// 隐藏所有 scene → 显示目标 → 调 populate
```

---

## Widget 渲染函数

所有 gen* 函数都是 **纯 DOM 操作 + 硬编码 sample data**。

| 函数 | 行号 | 用于 | 数据 |
|---|---|---|---|
| `genCandles(id,volId)` | ~686 | CK 场景主 K线 | 随机生成 60 根蜡烛 |
| `genVP()` | ~700 | CK 场景筹码分布 | 固定 10 档 |
| `genHM(targetId)` | ~709 | CK 底部热力图 / NOW 热力图 | 固定 8 币种 |
| `genQuoteTable(targetId)` | ~716 | NOW 报价 / HM 报价 | 固定 6 品种（BTC/ETH/SOL/AAPL/NVDA/XAU） |
| `genSentiment(...)` | ~733 | NOW 情绪 | VIX=18.5, F&G=62 |
| `genGlobalIdx(targetId)` | ~747 | NOW 全球指数 | 固定 8 指数 |
| `genForexComm(targetId)` | ~766 | NOW 外汇大宗 | 固定 6 品种 |
| `genCandlesTo(id,volId)` | ~986 | NOW 缩略K线 | 随机 40 根 |
| `genBigHeatmap(targetId)` | ~1001 | HM 大热力图 | 固定 20 币种 |
| `genTopMovers(targetId)` | ~1014 | HM Top Movers | 固定 8 品种 |

---

## Sidebar 数据结构（~L1032）

```javascript
const sidebarItems = [
  // 顶部高频（无 section header）
  { id:'ai',         nameKey:'sc_ai_chat',       badge:'AI',   children:[...] },
  { id:'snapshot',   nameKey:'sc_snapshot',       badge:'NOW',  children:[...] },
  { id:'watchlist',  nameKey:'sc_watchlist',      badge:'MYW',  children:[...] },
  // DASHBOARDS
  { sectionKey:'sec_dashboards' },
  { id:'stock_analysis', nameKey:'sc_stock_analysis', badge:'CK', on:true, children:[...] },
  { id:'market_heat',   nameKey:'sc_market_heat',    badge:'HM',  children:[...] },
  { id:'fundamentals',  ... },
  { id:'multi_compare', ... },
  { id:'global_idx',    ... },
  { id:'macro',         ... },
  // PORTFOLIO TOOLS
  { sectionKey:'sec_portfolio' },
  { id:'my_portfolio', ... },
  { id:'risk',         ... },
  // AI TOOLS
  { sectionKey:'sec_ai' },
  { id:'ai_analysis', ... },
  { id:'ai_report',   ... },
  { id:'ai_screen',   ... },
];
```

**active 状态**：数据驱动。点击时更新 `item.on`，`renderSidebar()` 读 `item.on` 渲染 class（L25 教训）。

**Scene 映射**：只有 3 个 scene 有实际 DOM（CK/NOW/HM），其他 sidebar 项点击后走 `switchScene()` 但 fallback 到 CK。

---

## i18n 系统（~L1135）

```javascript
const i18n = { zh: { ... }, en: { ... } };
let curLang = 'zh';
function t(key) { return i18n[curLang][key] || key; }
```

- 所有 UI 文字通过 `t('key')` 获取
- Header 右上角 EN/中 按钮切换
- 新增文案必须 zh + en 都加

---

## 交互逻辑一览

| 交互 | 实现 | 行号 |
|---|---|---|
| Sidebar 折叠/展开 | `toggleSidebar()` → `.sidebar.open` class | ~1128 |
| Sidebar 场景切换 | click → 更新 `item.on` → `switchScene()` → `renderSidebar()` | ~1114 |
| 标的搜索下拉 | `toggleDD()` / `filterDD()` | ~785 |
| 指标面板 | `toggleInd()` / `filterInd()` | ~821 |
| 周期选择 | `setPeriod()` / `toggleCommon()` | ~870 |
| 图表类型 | `setChartType()` / `toggleCtDd()` | ~931 |
| 画图工具 | `toggleDrawTools()` | ~1262 |
| 语言切换 | `toggleLang()` → `applyLang()` | ~1297 |

---

## Widget State + Drill-down（T12 P0）

### widgetState 对象
```javascript
let widgetState = { scene, symbol, market, period };
```
全局状态，记录当前视图。三条路径共用：
- 用户点击 → `drillDown(symbol)` → `switchScene('stock_analysis', params)`
- URL 参数 → `initFromUrl()` → `switchScene(scene, params)`
- 浏览器后退 → `popstate` → `switchScene(state.scene, state)`

### drill-down 交互
所有 `gen*` 函数的数据行都有 `onclick="drillDown('SYMBOL')""`：
- `genQuoteTable` — 报价表行
- `genGlobalIdx` — 全球指数行
- `genForexComm` — 外汇大宗行
- `genHM` / `genBigHeatmap` — 热力图色块
- `genTopMovers` — 涨跌幅排行行

点击后：切到 CK 场景 + K线标题更新 + sidebar active 跟随 + URL 带参数。

### URL 路由
| 参数 | 含义 | 示例 |
|---|---|---|
| `s` | 场景 ID | `?s=snapshot` |
| `sym` | 标的名 | `&sym=AAPL` |
| `m` | 市场 | `&m=us` |
| `p` | 周期 | `&p=1D` |

- `pushState` 更新 URL（不刷新页面）
- `popstate` 监听浏览器后退
- `initFromUrl()` 页面加载时读 URL 参数

### 辅助映射表
- `SYMBOL_DISPLAY` — symbol → 显示名（如 `'BTC'→'BTC/USDT'`）
- `SYMBOL_MARKET` — symbol → 市场（如 `'AAPL'→'us'`）

---

## 已知约束

1. **所有数据是硬编码 sample**，无 API 调用
2. **单文件 1400+ 行**，无模块拆分
3. **只有 3 个 scene 有 DOM**，其他 11 个 sidebar 项 fallback 到 CK
4. **GitHub Pages 不支持 path 路由**，只能用 query params
5. **无状态持久化**（刷新回默认，但 URL 参数可恢复）
6. **Sidebar active 状态必须走数据驱动**（L25 教训）
7. **drill-down 后 K线数据不变**（sample data，只改标题显示）

---

## 与 React App 的对应关系

| preview-layout (Demo) | React App (产品) |
|---|---|
| `sidebarItems` 数组 | `sceneConfig.ts` |
| `switchScene()` | React Router / state |
| `genQuoteTable()` | `<QuoteTableWidget />` |
| `genSentiment()` | `<SentimentWidget />` |
| `genGlobalIdx()` | `<GlobalIndexWidget />` |
| `genForexComm()` | `<ForexCommodityWidget />` |
| `genHM()` / `genBigHeatmap()` | `<HeatmapWidget />` |
| `genCandles()` | `<KLineWidget />` |
| 硬编码 sample data | `services/api.ts` → CF Worker |
| query params 路由 | React Router + pushState |

---

_创建于 2026-02-19 | 更新时机：每次改 preview-layout.html 后_
