/**
 * Widget Catalog — 单一真相源
 *
 * 每个 Widget 的 Zod schema + 元数据。
 * 此文件不 import 项目内任何其他文件（避免循环依赖）。
 *
 * 消费者：
 *   - widget-state.ts  → 推导 TypeScript 类型
 *   - validate.ts      → 运行时验证 AI 返回的 widgetState
 *   - build-prompt.ts  → 自动生成 AI System Prompt
 *   - widget-registry.ts → 注册渲染组件时引用 wrapper 类型
 *
 * @see PRD: 2026-02-20-widget-catalog-prd.md
 */

import { z } from 'zod';

// ── Market 枚举（与 src/types/market.ts MarketType 保持一致） ──

const marketEnum = z.enum([
  'crypto',
  'us',
  'cn',
  'hk',
  'eu',
  'uk',
  'jp',
  'fx',
  'comm',
  'metal',
]);

// ── Catalog 条目类型 ──

export interface CatalogEntry<T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  /** Zod schema — 运行时验证 + 编译时类型推导 */
  schema: T;
  /** 渲染包裹方式：kline = KLineHeader + KLineWidget，panel = WidgetPanel 包裹 */
  wrapper: 'kline' | 'panel';
  /** AI 可读的自然语言描述 */
  description: string;
  /** 示例用户 prompt */
  examples: string[];
}

// ── 7 个 Widget 定义 ──

export const WIDGET_CATALOG = {
  kline: {
    schema: z.object({
      type: z.literal('kline'),
      symbol: z.string(),
      market: marketEnum,
      period: z.string().optional(),
      indicators: z.array(z.string()).optional(),
      chartType: z.string().optional(),
      showWRB: z.boolean().optional(),
    }),
    wrapper: 'kline' as const,
    description: 'Candlestick K-line chart with technical indicators and drawing tools',
    examples: ['show BTC 1h chart', 'AAPL daily with MACD'],
  },

  heatmap: {
    schema: z.object({
      type: z.literal('heatmap'),
      market: marketEnum,
      sector: z.string().optional(),
      metric: z.string().optional(),
    }),
    wrapper: 'panel' as const,
    description: 'Market sector treemap heatmap showing gains/losses by market cap',
    examples: ['crypto heatmap', 'US market heat'],
  },

  fundamentals: {
    schema: z.object({
      type: z.literal('fundamentals'),
      symbol: z.string(),
      market: marketEnum,
    }),
    wrapper: 'panel' as const,
    description: 'Company fundamentals bar chart (revenue, EPS, margins)',
    examples: ['NVDA fundamentals', 'TSLA financials'],
  },

  volume_profile: {
    schema: z.object({
      type: z.literal('volume_profile'),
      symbol: z.string(),
      market: marketEnum,
      period: z.string().optional(),
    }),
    wrapper: 'kline' as const,
    description: 'Volume profile overlay on candlestick chart showing price distribution',
    examples: ['BTC volume profile'],
  },

  overlay: {
    schema: z.object({
      type: z.literal('overlay'),
      symbols: z.array(z.string()),
      markets: z.array(marketEnum),
      period: z.string(),
    }),
    wrapper: 'kline' as const,
    description: 'Multi-symbol price overlay comparison chart (normalized)',
    examples: ['compare BTC vs ETH', 'AAPL vs MSFT 1Y'],
  },

  quote_table: {
    schema: z.object({
      type: z.literal('quote_table'),
      symbols: z.array(z.string()),
      market: marketEnum,
    }),
    wrapper: 'panel' as const,
    description: 'Real-time quote table with price, change, and volume',
    examples: ['top crypto prices', 'FAANG quotes'],
  },

  sentiment: {
    schema: z.object({
      type: z.literal('sentiment'),
    }),
    wrapper: 'panel' as const,
    description: 'Market sentiment gauge (Fear & Greed index, VIX)',
    examples: ['market sentiment', 'fear greed index'],
  },
} as const;

// ── 导出类型 ──

/** 已注册的 Widget type 名称 */
export type WidgetType = keyof typeof WIDGET_CATALOG;

/** 所有 Widget type 名称列表（运行时可用） */
export const WIDGET_TYPES = Object.keys(WIDGET_CATALOG) as WidgetType[];

/** 单个 Catalog 条目的类型 */
export type WidgetCatalogEntry = (typeof WIDGET_CATALOG)[WidgetType];
