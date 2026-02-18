# T3 Brief: 改造 WidgetBase + 新增 Widget 内部控件

## 任务

改造 `WidgetBase.tsx` 支持可组合 Header，新建 4 个 Widget 内部控件组件 + 测试。

**本任务只新建/改造组件，不改各个 Widget 的实际使用（T5 做）。**

## 项目信息

- 仓库：`~/Desktop/卷卷/gainlab-app/`
- 技术栈：React 18 + TypeScript + Vite + Tailwind
- 测试：vitest + @testing-library/react
- pnpm 路径：`export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"`

## 验收标准

1. 改造 `src/layout/WidgetBase.tsx`
2. 新建 `src/widgets/SymbolSelector.tsx`
3. 新建 `src/widgets/IntervalPicker.tsx`
4. 新建 `src/widgets/IndicatorSelector.tsx`
5. 新建 `src/widgets/WidgetControls.tsx`
6. 新建测试文件（至少 15 个测试）
7. `pnpm lint` — 0 errors
8. `pnpm test` — 全绿
9. `pnpm build` — 通过

---

## 1. WidgetBase 改造

文件：`src/layout/WidgetBase.tsx`

### 现有代码（35 行）

```tsx
interface WidgetBaseProps {
  title: string;
  children: React.ReactNode;
}

export function WidgetBase({ title, children }: WidgetBaseProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#12122a', border: '1px solid #2a2a4a', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: '#1a1a3e', borderBottom: '1px solid #2a2a4a', fontSize: '13px', fontWeight: 600, color: '#a0a0cc', userSelect: 'none' }}>
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
    </div>
  );
}
```

### 改造后

```tsx
interface WidgetBaseProps {
  /** 可组合 Header 内容（优先级高于 title） */
  header?: React.ReactNode;
  /** 简单标题（header 为空时使用） */
  title?: string;
  /** 关闭按钮回调（Mosaic 中移除此 Widget） */
  onRemove?: () => void;
  children: React.ReactNode;
}

export function WidgetBase({ header, title, onRemove, children }: WidgetBaseProps) {
  return (
    <div className="flex flex-col h-full bg-[#12122a] border border-[#2a2a4a] rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1 px-1.5 bg-[#0d0d20] border-b border-[#2a2a4a] flex-shrink-0 min-h-[32px]">
        {header ?? (
          <span className="text-[13px] font-semibold text-[#a0a0cc] select-none px-1.5 py-1">
            {title}
          </span>
        )}
        {/* 右侧始终有关闭按钮（如果有 onRemove） */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-auto w-[20px] h-[20px] rounded flex items-center justify-center text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] text-xs transition-colors flex-shrink-0"
            title="关闭"
          >
            ✕
          </button>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );
}
```

**关键改动：**
- 新增 `header` prop（React.ReactNode），允许外部传入任意控件组合
- 新增 `onRemove` prop，Header 右侧显示 ✕ 关闭按钮
- `title` 变为可选，作为 `header` 的 fallback
- 样式从 inline style 改为 Tailwind class（跟项目统一）
- Header 背景改为 `#0d0d20`（跟 prototype 一致）

---

## 2. SymbolSelector — 标的搜索下拉

文件：`src/widgets/SymbolSelector.tsx`

### Props

```tsx
interface SymbolSelectorProps {
  /** 当前选中的标的 */
  symbol: string;
  /** 当前市场 */
  market: MarketType;
  /** 选择标的后回调（同时返回 market） */
  onChange: (symbol: string, market: MarketType) => void;
  /** 紧凑模式（小 Widget 用，只显示 "AAPL ▾"） */
  compact?: boolean;
}
```

### 行为

1. 点击 → overlay 弹出下拉面板（覆盖在图表上方，不推布局）
2. 下拉面板内容：搜索框 + 分市场分组列表
3. 默认显示 HOT_ASSETS（从 `constants/markets.ts` import）
4. 输入搜索词 → 调用 `fetchWorkerSearch`（从 `services/api.ts` import）
5. 选中标的 → onChange(symbol, market) + 关闭面板
6. 点击 overlay 背景 → 关闭面板

### 样式参考（prototype）

```
触发器（未展开）：
  [🔍 BTCUSDT ▾]  或 compact 模式 [AAPL ▾]
  font-size: 12px, font-weight: 600
  hover: bg-[#1e1e3a]

下拉面板（展开）：
  position: absolute (相对于触发器的父容器)
  width: 280px (compact 模式 200px)
  max-height: 360px, overflow-y: auto
  background: #0d0d20
  border: 1px solid #3a3a6a
  border-radius: 8px
  box-shadow: 0 12px 40px rgba(0,0,0,.6)
  z-index: 200

搜索框：
  width: 100%, padding: 6px 8px
  bg: #1a1a3e, border: 1px solid #2a2a4a
  color: #e0e0f0, font-size: 11px

分组标题：
  font-size: 8px, color: #5a5a8a, text-transform: uppercase

列表项：
  padding: 6px 8px, hover bg: #1e1e3a
  左侧：symbol (font-weight 600) + name (color #5a5a8a)
  右侧：市场标签 (font-size 8px, bg #1a1a3e)
```

### Overlay 背景

```tsx
{/* 点击背景关闭 */}
{open && <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />}
```

### 依赖的导入

```tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { HOT_ASSETS } from '../constants/markets';
import { fetchWorkerSearch } from '../services/api';
import type { MarketType } from '../types/market';
```

---

## 3. IntervalPicker — 周期选择

文件：`src/widgets/IntervalPicker.tsx`

### Props

```tsx
interface IntervalPickerProps {
  value: TimeInterval;
  onChange: (interval: TimeInterval) => void;
}
```

### 行为

- 横排 pill 按钮：1m / 5m / 15m / 1H / 4H / 1D / 1W / 1M
- 选中的高亮（bg `#2563eb`, color white）
- 未选中：color `#5a5a8a`, hover color `#e0e0f0`

### 依赖

```tsx
import { TIME_INTERVALS } from '../constants/markets';
import type { TimeInterval } from '../types/market';
```

**TIME_INTERVALS 已在 constants/markets.ts 定义：**
```tsx
export const TIME_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1m', label: '1m' }, { value: '5m', label: '5m' },
  { value: '15m', label: '15m' }, { value: '1h', label: '1H' },
  { value: '4h', label: '4H' }, { value: '1D', label: '1D' },
  { value: '1W', label: '1W' }, { value: '1M', label: '1M' },
];
```

---

## 4. IndicatorSelector — 指标选择器

文件：`src/widgets/IndicatorSelector.tsx`

### Props

```tsx
interface IndicatorSelectorProps {
  active: string[];
  onChange: (indicator: string) => void; // toggle 单个指标
}
```

### 行为

1. 触发器按钮：`📊 指标 N ▾`（N = active.length）
   - N 用蓝色圆形 badge 显示
2. 点击 → overlay 面板弹出
3. 面板分两组：
   - **主图叠加**：MA / EMA / BOLL / VWAP / VP / WRB
   - **副图指标**：RSI / MACD / KDJ / ATR
4. 每项有 toggle 开关（左滑/右滑动画）
5. 点击某项 → onChange(indicator) toggle
6. 搜索框过滤

### 指标定义（内部常量）

```tsx
const INDICATOR_GROUPS = [
  {
    title: '主图叠加',
    items: [
      { id: 'MA', name: 'MA', desc: '移动平均线' },
      { id: 'EMA', name: 'EMA', desc: '指数移动平均' },
      { id: 'BOLL', name: 'BOLL', desc: '布林带' },
      { id: 'VWAP', name: 'VWAP', desc: '成交量加权均价' },
      { id: 'VP', name: 'VP', desc: '筹码分布' },
      { id: 'WRB', name: 'WRB', desc: '宽幅K线信号' },
    ],
  },
  {
    title: '副图指标',
    items: [
      { id: 'RSI', name: 'RSI', desc: '相对强弱' },
      { id: 'MACD', name: 'MACD', desc: '指数平滑异同' },
      { id: 'KDJ', name: 'KDJ', desc: '随机指标' },
      { id: 'ATR', name: 'ATR', desc: '真实波幅' },
    ],
  },
];
```

### 面板样式

跟 SymbolSelector 的 overlay 面板类似。宽度 240px，toggle 开关用 CSS 伪元素实现。

---

## 5. WidgetControls — 右侧控制按钮

文件：`src/widgets/WidgetControls.tsx`

### Props

```tsx
interface WidgetControlsProps {
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onRemove?: () => void;
}
```

### 按钮

```
[⟲] [⛶] [✕]
```

每个 20x20px，rounded，hover bg `#1e1e3a`，color `#5a5a8a` → hover `#e0e0f0`

**注意：** ✕ 按钮跟 WidgetBase 的 onRemove 功能重叠。如果 WidgetBase 已有 onRemove 的 ✕，WidgetControls 可以不包含 ✕，交给使用方决定。

---

## 测试要求

新建 `src/widgets/__tests__/WidgetControls.test.tsx`（或按组件拆分多个文件）

### WidgetBase 测试（4 个）

放在 `src/layout/__tests__/WidgetBase.test.tsx`：
1. 渲染 title fallback
2. 渲染 header 自定义内容
3. header 优先于 title
4. onRemove → 显示 ✕ 按钮 + 点击回调

### SymbolSelector 测试（5 个）

放在 `src/widgets/__tests__/SymbolSelector.test.tsx`：
1. 渲染当前 symbol
2. 点击打开下拉面板
3. 显示 HOT_ASSETS 分组列表
4. compact 模式只显示 symbol + ▾
5. 选择标的 → onChange 回调 + 面板关闭

### IntervalPicker 测试（3 个）

放在 `src/widgets/__tests__/IntervalPicker.test.tsx`：
1. 渲染所有 8 个周期按钮
2. 当前选中高亮
3. 点击 → onChange 回调

### IndicatorSelector 测试（3 个）

放在 `src/widgets/__tests__/IndicatorSelector.test.tsx`：
1. 渲染触发器按钮 + 指标数 badge
2. 点击打开面板，显示两组指标
3. 点击指标 → onChange 回调

---

## 注意

- **只新建/改造以上列出的文件**
- **不修改任何 Widget（KLineWidget/HeatmapWidget 等）** — T5 做
- **不修改 App.tsx** — T4 做
- **不修改 types/market.ts 或 constants/markets.ts** — 已有的够用
- 可以从 `constants/markets.ts` import HOT_ASSETS、TIME_INTERVALS
- 可以从 `services/api.ts` import fetchWorkerSearch
- 可以从 `types/market.ts` import MarketType、TimeInterval
- **SymbolSelector 的 fetchWorkerSearch 调用需要 debounce**（300ms），避免每次按键都发请求
- 所有 overlay 面板用 `position: absolute` + `z-index: 200`，背景遮罩用 `fixed inset-0 z-[199]`
