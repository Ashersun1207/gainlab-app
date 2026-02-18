# T2 Brief: Sidebar 改造为 44px 组件目录

## 任务

把 `src/layout/Sidebar/` 从 200px 资产浏览器改造为 44px 窄栏组件目录。同步更新测试。

## 项目信息

- 仓库：`~/Desktop/卷卷/gainlab-app/`
- 技术栈：React 18 + TypeScript + Vite + Tailwind
- 测试：vitest + @testing-library/react
- pnpm 路径：`export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"`

## 验收标准

1. 改造 `src/layout/Sidebar/index.tsx`
2. 重写 `src/layout/Sidebar/__tests__/Sidebar.test.tsx`（测试数 ≥ 原有 11 个）
3. 删除 `src/layout/Sidebar/MarketTabs.tsx`
4. 删除 `src/layout/Sidebar/SearchBox.tsx`
5. 删除 `src/layout/Sidebar/AssetList.tsx`
6. 改造 `src/layout/Sidebar/ToolBar.tsx` → 合并进 index.tsx 或删除
7. `pnpm lint` — 0 errors
8. `pnpm test` — 全绿
9. `pnpm build` — 通过

## ⚠️ 重要：暂时保持 App.tsx 兼容

App.tsx 目前 import 的 Sidebar props 是旧接口。**本任务只改 Sidebar 目录内的文件**，不动 App.tsx。

为了 build 不挂，新 Sidebar 必须**同时兼容旧 props**（标记 deprecated）：

```tsx
interface SidebarProps {
  // === 新 props ===
  onAddWidget?: (type: WidgetType) => void;
  onToggleChat?: () => void;
  onLayoutPreset?: (preset: string) => void;
  // === 旧 props（deprecated，T4 会删）===
  activeMarket?: MarketType;
  activeSymbol?: string;
  activeTool?: ToolType | null;
  quotes?: Map<string, Quote>;
  onMarketChange?: (market: MarketType) => void;
  onAssetSelect?: (asset: Asset) => void;
  onToolClick?: (tool: ToolType) => void;
}
```

Sidebar 内部**只用新 props 渲染新 UI**，旧 props 接收但忽略。这样 App.tsx 传旧 props 不会报错，T4 再统一改。

## 新 Sidebar 设计

```
┌──────┐
│  GL  │  ← Logo (渐变色)
│──────│
│  📈  │  ← K线 (tooltip: "K线图")
│  🔥  │  ← 热力图
│  💰  │  ← 基本面
│  📐  │  ← 叠加对比
│  📊  │  ← WRB
│──────│
│  ⊞   │  ← 布局预设 (tooltip: "布局")
│──────│
│      │  ← 撑开
│  💬  │  ← Chat (tooltip: "AI 对话")
│  ⚙️  │  ← 设置 (tooltip: "设置")
└──────┘
宽度: 44px
```

### 每个按钮样式

```tsx
// WidgetButton 内部组件
<button
  className="w-[32px] h-[32px] rounded-md flex items-center justify-center text-sm cursor-pointer text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] relative group transition-colors"
  onClick={() => onAddWidget?.(type)}
  title={label}
>
  {icon}
  {/* Tooltip */}
  <span className="absolute left-[110%] top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#1a1a3e] border border-[#2a2a4a] text-[#e0e0f0] text-[9px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
    {label}
  </span>
</button>
```

### Widget 类型定义

在 Sidebar 文件内部定义（T4 会移到 types/market.ts）：

```tsx
type WidgetType = 'kline' | 'heatmap' | 'fundamentals' | 'overlay' | 'wrb';
```

### 分隔线

```tsx
<div className="w-5 h-px bg-[#2a2a4a] mx-auto my-1" />
```

### 整体容器

```tsx
<div className="w-[44px] h-full flex flex-col items-center bg-[#0d0d20] border-r border-[#1e1e3a] flex-shrink-0 py-1.5 gap-0.5">
```

## 测试要求

重写 `src/layout/Sidebar/__tests__/Sidebar.test.tsx`，至少 11 个测试：

1. 渲染 Logo
2. 渲染 5 个 Widget 按钮（K线/热力图/基本面/叠加/WRB）
3. 渲染布局预设按钮
4. 渲染 Chat 按钮
5. 渲染设置按钮
6. 点击 K线按钮 → onAddWidget('kline')
7. 点击热力图按钮 → onAddWidget('heatmap')
8. 点击基本面按钮 → onAddWidget('fundamentals')
9. 点击 Chat 按钮 → onToggleChat()
10. Sidebar 宽度 44px（检查 className 包含 `w-[44px]`）
11. 兼容旧 props 不报错

## 现有文件参考

### 旧 Sidebar/index.tsx（将被替换）

```tsx
// 旧接口（App.tsx 目前传这些）
interface SidebarProps {
  activeMarket: MarketType;
  activeSymbol: string;
  activeTool: ToolType | null;
  quotes: Map<string, Quote>;
  onMarketChange: (market: MarketType) => void;
  onAssetSelect: (asset: Asset) => void;
  onToolClick: (tool: ToolType) => void;
}
```

### 类型定义（不要修改 types/market.ts）

```tsx
// src/types/market.ts
export type MarketType = 'crypto' | 'us' | 'cn' | 'metal';
export type ToolType = 'overlay' | 'fundamentals' | 'heatmap';
export interface Asset { symbol: string; name: string; market: MarketType; displaySymbol?: string; }
export interface Quote { symbol: string; price: number; change: number; changePercent: number; }
```

## 注意

- **只改 `src/layout/Sidebar/` 目录内的文件**
- **不动 App.tsx、types/、constants/ 等任何其他文件**
- 删除 MarketTabs.tsx、SearchBox.tsx、AssetList.tsx
- ToolBar.tsx 的功能合并到 index.tsx 后删除
- 保持 `export function Sidebar` 的导出名不变（App.tsx import 不用改）
