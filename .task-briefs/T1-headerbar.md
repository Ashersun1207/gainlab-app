# T1 Brief: 新建 HeaderBar 组件

## 任务

在 `src/layout/HeaderBar.tsx` 新建一个极简顶栏组件 + 对应测试。

## 项目信息

- 仓库：`~/Desktop/卷卷/gainlab-app/`
- 技术栈：React 18 + TypeScript + Vite + Tailwind（class 写法）
- 测试：vitest + @testing-library/react，测试文件放 `__tests__/` 子目录
- 测试 setup：`src/test/setup.ts`（已引入 `@testing-library/jest-dom/vitest`）
- 暗色主题，配色变量参考下方

## 验收标准

1. 新建 `src/layout/HeaderBar.tsx`
2. 新建 `src/layout/__tests__/HeaderBar.test.tsx`
3. `pnpm lint` — 0 errors
4. `pnpm test` — 全绿
5. `pnpm build` — 通过

## HeaderBar 设计

```
┌─────────────────────────────────────────────────────────────┐
│ [GainLab]  ·  🟢Crypto  🟢US  ⚫A股  🟢Metal     [🌙] [🤖] │
└─────────────────────────────────────────────────────────────┘
高度 40px
```

### 内容

1. **Logo** "GainLab"（渐变色文字）
   - `background: linear-gradient(135deg, #60a5fa, #a78bfa)`
   - `-webkit-background-clip: text; -webkit-text-fill-color: transparent`
   - font-size: 14px, font-weight: 700

2. **分隔线**（竖线 1px × 18px，颜色 `#2a2a4a`）

3. **数据源状态指示灯**（纯展示，**不可点击**）
   - 4 个 pill：Crypto / US / A股 / Metal
   - 每个 pill 左边一个小圆点（4px × 4px）
   - 绿色 = `#26a69a`（在线），灰色 = `#5a5a8a`（未配置）
   - 状态判断逻辑：从 `localStorage` 读 `gainlab-byok` JSON
     - 有 key → 绿色 🟢
     - 无 key → 灰色 ⚫
     - Crypto 默认绿色（不需要 key，走 Bybit 公开 API）
   - pill 样式：font-size 10px, font-weight 500, padding 2px 7px, border-radius 4px, bg `#1a1a3e`, color `#8888aa`

4. **右侧按钮**
   - 🌙 主题切换（暂时只是样子，onClick 不做实际操作）
   - 🤖 Agent（暂时只是样子，点击不做实际操作，默认高亮样式）
   - 按钮样式：padding 3px 8px, border-radius 5px, font-size 11px, border 1px solid `#2a2a4a`, color `#8888aa`
   - Agent 按钮高亮：bg `#2563eb`, border-color `#2563eb`, color `#fff`

### Props

```tsx
// 无 props，HeaderBar 自己读 localStorage 判断状态
export function HeaderBar(): JSX.Element
```

### 整体样式

```
height: 40px
background: #0d0d20
border-bottom: 1px solid #1e1e3a
display: flex
align-items: center
padding: 0 10px
gap: 10px
flex-shrink: 0
```

## 测试要求

文件：`src/layout/__tests__/HeaderBar.test.tsx`

至少 4 个测试：
1. 渲染 logo 文字 "GainLab"
2. 渲染 4 个数据源状态（Crypto / US / A股 / Metal）
3. 渲染主题按钮和 Agent 按钮
4. Crypto 状态灯默认绿色（不依赖 localStorage）

## 注意

- **不要** 修改任何现有文件
- **不要** 添加新依赖
- 文件编码 UTF-8，用 Tailwind class 写样式（项目已有 Tailwind）
- 遵循现有代码风格（看 `src/layout/Toolbar.tsx` 参考）
- pnpm 路径：`export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"`
