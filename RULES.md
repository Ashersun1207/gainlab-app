# GainLab App 开发规则

_任何改动前必读。违反规则 = 返工。_

---

## 🔴 核心原则

**框架思维，不是想到哪改到哪。** 任何改动先确认：解决什么问题 → 验收标准是什么 → 文档在哪。  
**复用优先，不造轮子。** gainlab-dashboard 里有的先看有没有可以复制，调研过的开源项目优先采用。  
**PRD 是约束，不是摆设。** 没有 PRD 就不知道做什么，没有 TASK 就不知道怎么拆。

## 文档体系

本仓库（`gainlab-app/`）放代码级文档：

| 文件 | 内容 | 更新时机 |
|---|---|---|
| `RULES.md` | 本文件 | 规范变更时 |
| `ARCHITECTURE.md` | 目录结构 + 数据流 + 混合渲染策略 | 架构改动后 |

PRD / TASK / 决策记录 统一放研究仓库：

| 路径 | 内容 |
|---|---|
| `gainlab-research/docs/plans/2026-02-17-gainlab-app-prd.md` | 产品需求文档 |
| `gainlab-research/docs/plans/2026-02-17-gainlab-app-task.md` | 任务分解 |
| `gainlab-research/docs/decisions.md` | 重大决策记录 |
| `gainlab-research/docs/lessons.md` | 踩坑教训 |

## 开发流程（强制顺序）

```
1. RULES.md          — 读规则（本文件）
2. PRD               — 确认需求（gainlab-research/docs/plans/）
3. TASK              — 写任务分解（改动 > 1 个文件必须）
4. 实现              — 写代码，复用优先
5. 验证              — 本地跑通，截图/录屏存档
6. 文档同步          — `bash scripts/doc-sync.sh --fix`（自动检查+提交三仓库）
7. 提交              — commit + push，CI 自动部署
```

**小改（单文件 bug fix）**：可跳过 2-3，但 5-7 不能跳。  
**新增 Widget**：必须走完全流程，并在 ARCHITECTURE.md 登记。  
**图表相关改动**：必须遵守下方「图表渲染规范」。

### 任务文件前置检查 🔴（L27 教训）
**任何新功能（commit message 含 `feat`）必须先有对应任务文件：**
- 文件位置：`gainlab-research/docs/plans/p1-tasks/T{N}-*.md`
- 写完任务文件 → commit 到 research → 再开始写代码
- 事后补写 ≠ 合规，下次不允许

## 代码规范

### 技术栈
- **框架**：React 18 + TypeScript 5 + Vite
- **布局**：react-mosaic（复用 gainlab-dashboard）
- **K线图**：KLineChart（从 dashboard 复制的 fork，KLineWidget 专用）
- **非K线图**：echarts + echarts-for-react（EChartsWidget 专用）
- **样式**：Tailwind CSS（与 dashboard 保持一致）
- **包管理**：pnpm

### TypeScript
- 开启 `strict: true`，不用 `any`，不用 `as` 除非有注释说明
- 类型定义放 `src/types/`，组件 props 必须有显式类型
- 数据格式转换函数放 `src/utils/format.ts`，不在组件内内联
- MCP 消息类型定义放 `src/types/mcp.ts`

### React 组件
- 函数组件 + hooks，不用 class component
- Widget 组件放 `src/widgets/`，每个 Widget 独立目录
- 副作用隔离：数据获取放 `src/hooks/` 或 `src/services/`
- 组件命名：PascalCase（`KLineWidget.tsx`），文件名与组件名一致

### 样式
- 优先用 Tailwind 类，不写内联 style
- 颜色/间距使用 Tailwind 配置中的 token，不硬编码
- 深色主题优先（金融数据展示场景）

### 图表渲染规范 ⚠️

**规则：用途决定库，不混用。**

| 场景 | 必须用 | 禁止用 |
|---|---|---|
| K线（OHLCV）、技术指标（RSI/MACD/Bollinger）、成交量分布（VP）、WRB | **KLineChart**（dashboard fork） | ECharts |
| 热力图、基本面雷达/柱状/树图、相关性矩阵、Overlay 折线叠加 | **ECharts** | KLineChart |
| 新增图表类型 | 先看属不属于K线类 → 是则 KLineChart，否则 ECharts | 随意选库 |

**理由**：KLineChart 提供专业的 K 线体验（画图工具 / 十字光标 / 时间轴缩放），ECharts 在热力图/树图/复杂 overlay 更灵活。混用库但不混用场景。

**MCP 数据格式**：MCP Server 输出标准数据（OHLCV array / 指标 array），前端根据 widget 类型选渲染库，不依赖 Server 端的渲染指令。`render:"echarts"` 模式为可选兼容层。

## 工程化规则（G1-G7） 🔴

_基于 Reddit/X 社区调研 + 自身踩坑经验。违反 = 返工。_

### G1: 测试作为行为锁
- Vitest + React Testing Library
- 数据转换函数（dataAdapter, mcpClient）必须有测试
- **测试数量只能增不能减**（防 AI 删测试绕过）
- 新增 Widget 必须至少 1 个渲染测试
- 跑 `pnpm test` 全绿才能 commit

### G2: 类型检查
- `pnpm typecheck` 必须通过（app 代码 0 errors）
- KLineChart fork 错误由 `scripts/typecheck.sh` 自动过滤
- 禁止 `any`，必须 `as` 时加注释说明原因
- 禁止 `@ts-ignore`，用 `@ts-expect-error` + 说明

### G3: Lint + Format
- ESLint flat config（`eslint.config.js`）+ Prettier（`.prettierrc`）
- `pnpm lint` 0 error 才能 commit
- `pnpm format` 格式化所有 app 代码
- KLineChart 目录已在 ignore 列表中

### G4: CI 门禁（四步强制）
```yaml
steps:
  - pnpm lint         # 风格检查
  - pnpm typecheck    # 类型检查
  - pnpm test         # 测试
  - pnpm build        # 构建
```
任一步红 → 不部署。人和 AI 都绕不过。

### G5: 核心文件禁区（AI 专属） 🔴
```
NEVER MODIFY（不许改）:
- src/widgets/KLineWidget/KLineChart/  （45K 行 fork，不改源码）
- src/widgets/KLineWidget/klines/       （K线数据文件）
- .github/workflows/deploy.yml          （CI 流程不随便动）
- vite.config.ts                         （构建配置不随便动）
- eslint.config.js                       （lint 配置稳定后不动）
```
修改这些文件**必须在 TASK 里明确授权 + 说明原因**。

### G6: ErrorBoundary + 网络容错
- React ErrorBoundary 包裹每个 Widget（崩了不白屏）
- 所有 fetch 加 AbortController + 超时 + fallback 数据
- 用户看到的错误信息要有意义（不是白屏/undefined）

### G7: 代码分割
- KLineChart 用 React.lazy + Suspense 动态加载
- ECharts 同理
- 目标：首屏 chunk < 500KB

## 提交规范

```
feat(widget): add KLineWidget with RSI overlay
feat(layout): implement 2-widget Mosaic dashboard
fix(mcp): handle SSE stream reconnection
docs: update ARCHITECTURE.md with data flow diagram
refactor(utils): extract OHLCV format converter
chore: add GH Actions deploy workflow
```

格式：`type(scope): description`  
type: `feat` / `fix` / `docs` / `refactor` / `chore` / `test`  
scope: `widget` / `layout` / `mcp` / `utils` / `deploy`

**commit 前必须**（按 G4 门禁顺序）：
1. `pnpm lint` — 0 errors
2. `pnpm typecheck` — app 代码 0 errors
3. `pnpm test` — 全绿，测试数不减少
4. `pnpm build` — 构建成功
5. 浏览器本地验证通过（图表类改动）

## 安全规范 ⚠️

- **API key 永远不写在代码/文档/配置文件里**
- `.env.local` 放本地开发密钥，已在 `.gitignore` 中排除
- 前端不能直接调用需要 key 的 API（EODHD / FMP）
- 所有需要 key 的请求必须通过 CF Worker 代理
- BYOK（用户自带 key）存在 `~/.gainlab/config.json`，不上传，不在对话中传递
- 代码审查时检查：`grep -r "api_key\|apiKey\|secret" src/` 必须为空

## 部署规范

- **自动部署**：push `main` 分支 → GitHub Actions → gh-pages
- **手动触发**：`gh workflow run deploy.yml`
- **Base URL**：`/gainlab-app/`（gh-pages 子路径，Vite `base` 配置）
- **环境变量**：只有 `VITE_WORKER_URL`（CF Worker 公开 URL，不是密钥）

## 复用清单（开发前必看）

从 `gainlab-dashboard` 复制的模块（不要重写）：

| 模块 | 来源 | 目标路径 |
|---|---|---|
| react-mosaic 布局 | dashboard/src/components/MosaicDashboard | src/layout/ |
| Sidebar 组件 | dashboard/src/components/layout/OpenBBSidebar | src/layout/ |
| Widget 容器 | dashboard/src/components/widgets/WidgetContainer.tsx | src/layout/ |
| ChartView | dashboard/src/components/chart/ChartView.tsx | src/widgets/KLineWidget/ |
| i18n 配置 | dashboard/src/i18n/ | src/i18n/ |
| KLineChart plugin | dashboard/src/plugins/klinechart/ + KLineChart/ | src/widgets/KLineWidget/ |
| OHLCV 类型定义 | dashboard/src/plugins/KLineChart/common/Data.ts | src/types/ |

---

_创建于 2026-02-17 | 更新时机：流程变更 / 新规范确认后_
