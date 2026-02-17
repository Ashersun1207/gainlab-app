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
│   ├── App.tsx                 # Mosaic + Chat 布局，Widget 数据流管理
│   ├── index.css               # Tailwind + Mosaic 深色主题
│   ├── layout/
│   │   ├── MosaicDashboard.tsx # 极简 Mosaic 容器（props 驱动，无 store）
│   │   └── WidgetBase.tsx      # Widget 壳（深色主题）
│   ├── widgets/
│   │   ├── KLineWidget/
│   │   │   ├── index.tsx       # KLineChart 渲染 + Binance fetch + fallback
│   │   │   ├── klinechart.d.ts # 类型声明（KLineChart 排除 tsc 检查）
│   │   │   ├── klines/
│   │   │   │   └── scriptUtils.ts  # stub（脚本编辑器功能骨架不需要）
│   │   │   └── KLineChart/     # 45K 行插件（从 dashboard 复制，不改）
│   │   └── EChartsWidget/
│   │       ├── index.tsx       # 通用 ECharts 容器（echarts-for-react）
│   │       └── charts/
│   │           ├── HeatmapChart.ts       # treemap option builder
│   │           └── sampleHeatmapData.ts  # 20 加密货币静态数据
│   ├── chat/
│   │   ├── ChatPanel.tsx       # 对话框 UI（输入框 + 消息列表）
│   │   ├── MessageList.tsx     # 消息渲染（user/assistant 气泡 + 自动滚底）
│   │   └── ToolCallBadge.tsx   # tool call 标签（紫色，可折叠 args）
│   ├── services/
│   │   ├── mcpClient.ts        # CF Worker SSE 通信 + think 过滤
│   │   └── dataAdapter.ts      # 渲染目标路由 + 格式转换
│   ├── hooks/
│   │   └── useMcpStream.ts     # SSE 流式响应 hook + Widget 回调
│   ├── types/
│   │   ├── mcp.ts              # McpMessage / McpToolCall / McpStreamEvent
│   │   └── data.ts             # KLineData / HeatmapItem
│   └── utils/                  # （空，T6 的 format.ts 内联到 dataAdapter）
├── scripts/
│   ├── project-boot.sh         # 认知恢复脚本
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

> ⚠️ 骨架阶段**不包含**：
> - `src/i18n/`（P1 阶段实现）
> - `src/layout/Sidebar.tsx`（P1 阶段实现）
> - `src/hooks/useWidgetData.ts`（未实现，数据管理内联在 App.tsx）
> - `src/utils/format.ts`（格式转换内联到 dataAdapter.ts）

---

## 骨架阶段技术决策

| 决策 | 原因 |
|---|---|
| **build 改为 vite-only（不跑 tsc）** | KLineChart 45K 行不兼容 strict mode，esbuild transpile 够用；`vite build` 成功，不加 `tsc --noEmit` |
| **KLineChart 用 `cp -r` 整目录复制，不改源码** | 45K 行改了出 bug 排不完，骨架验证期间不碰内部代码 |
| **加 `crypto-js` + `pako` 依赖** | KLineChart 内部 `Chart.ts` 有 import，不装 build 不过 |
| **`klinechart.d.ts` 提供类型声明** | 让 TypeScript 知道 KLineChart 的核心 API 类型，避免全 `any` |
| **KLineChart 目录排除在 tsconfig 之外** | `tsconfig.json` 的 `exclude` 字段加上 `src/widgets/KLineWidget/KLineChart` |
| **Chat 布局：左侧 Mosaic + 右侧固定 ChatPanel 320px** | 简化实现，Chat 不需要拖拽调整；Mosaic 只管 kline（上 60%）+ echarts（下 40%） |

> ⚠️ **L17 陷阱**：`tsconfig exclude` 不阻止 import chain 编译。KLineChart 目录加了 exclude，但只要 `index.tsx` import 了 KLineChart，tsc 仍然跟进去编译所有文件。解决方案是整个 build 改 vite-only。

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
MiniMax-M2（AI 模型）
        │  tool_call: { name: "gainlab_kline", args: {...} }
        ▼
CF Worker SSE stream
        │  事件流：text_delta | tool_call | tool_result
        ▼
mcpClient.ts (useMcpStream hook)
        │  解析 SSE → 识别 tool call
        │  过滤 <think>...</think>（MiniMax M2 推理输出）
        │
        ├── tool call → dataAdapter.ts
        │       │  getRenderTarget(toolName) → "kline" | "echarts"
        │       │  binanceToKLine() / buildHeatmapOption()
        │       ▼
        │   KLineWidget（KLineChart）
        │       或
        │   EChartsWidget（echarts-for-react）
        │
        └── text_delta → MessageList.tsx（文字渲染）
```

### App.tsx 状态管理

```typescript
// App.tsx 持有 Widget 状态（无外部 store）
const [klineData, setKlineData] = useState<KLineData[]>([]);
const [echartsOption, setEchartsOption] = useState<EChartsOption | null>(null);

// Widget 回调：由 useMcpStream hook 触发
const handleWidgetUpdate = (target: "kline" | "echarts", data: any) => {
  if (target === "kline") setKlineData(data);
  else setEchartsOption(data);
};
```

> ⚠️ **L18 陷阱**：`useState` 在 async generator 循环里有 stale closure。`setActiveToolCall(tc)` 后立刻读 `activeToolCall` 还是旧值。解决方案：用 `useRef` 同步追踪当前 tool call，`useState` 只用于 UI 渲染触发。

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
        │       → KLineWidget（index.tsx）渲染
        │
        └── 非K线类（heatmap / fundamentals / correlation / overlay）
                → 构建 ECharts option
                → EChartsWidget 渲染
```

**判断逻辑**（`dataAdapter.ts`）：

```typescript
type RenderTarget = "kline" | "echarts";

export function getRenderTarget(toolName: string): RenderTarget {
  const klineTools = ["gainlab_kline", "gainlab_indicators",
                      "gainlab_volume_profile", "gainlab_wrb_scoring"];
  return klineTools.includes(toolName) ? "kline" : "echarts";
}
```

---

## 布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│ App.tsx                                                          │
│  ┌──────────────────────────────────────┐  ┌───────────────┐   │
│  │ MosaicDashboard (flex-grow)          │  │ ChatPanel     │   │
│  │  ┌────────────────────────────────┐  │  │ 320px fixed   │   │
│  │  │ KLineWidget (上 60%)           │  │  │               │   │
│  │  │ BTC K 线 + RSI 子图             │  │  │ 消息列表      │   │
│  │  └────────────────────────────────┘  │  │ + 输入框      │   │
│  │  ┌────────────────────────────────┐  │  │               │   │
│  │  │ EChartsWidget (下 40%)         │  │  │ ToolCallBadge │   │
│  │  │ 加密市值热力图 treemap          │  │  │ (紫色标签)    │   │
│  │  └────────────────────────────────┘  │  └───────────────┘   │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

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

**骨架阶段简化**：gainlab-mcp tools 的执行逻辑在 CF Worker 内内联实现，产品阶段再接真正的 MCP Server。

---

## 与 CF Worker 的关系

```
CF Worker: gainlab-api.asher-sun.workers.dev
  ├── 端点：POST /api/chat
  ├── 职责：
  │   ├── 持有 AI API key（MiniMax-M2）
  │   ├── IP 限流（10 req/min/IP）
  │   ├── 持有 EODHD / FMP key（BYOK 代理）
  │   └── 返回 SSE 流（text_delta + tool_call + tool_result）
  └── 已有实现：骨架阶段直接复用，不新建 Worker
```

---

## 骨架验证范围（v0.1）

| 组件 | 验证目标 | 状态 |
|---|---|---|
| Mosaic 布局（2 个 Widget） | react-mosaic 可以正常拖拽分割 | ✅ |
| KLineWidget | KLineChart 在浏览器中渲染 K 线 + RSI | ✅ |
| EChartsWidget | echarts-for-react 渲染热力图 | ✅ |
| 简化 Chat | 输入框 → CF Worker → tool call → 触发 Widget 更新 | ✅ |
| GH Actions 部署 | push main → gh-pages 自动更新 | ✅ |

**线上地址**：https://ashersun1207.github.io/gainlab-app/

**不在骨架范围内**：完整 Sidebar、i18n 切换、移动端适配、完整 7 工具覆盖、BYOK、CF KV 缓存。

---

## P1 产品阶段（待实现）

- 完整 Sidebar（资产选择 + 市场切换）
- i18n 切换（zh/en）
- 7 工具全覆盖（kline / indicators / overlay / fundamentals / volume_profile / heatmap / wrb）
- 移动端适配
- BYOK 支持（用户自带 EODHD / FMP / Binance key）
- CF KV 缓存层

---

_创建于 2026-02-17 | 骨架验证 v0.1 | 校准于 2026-02-17（P0 完成后）_
