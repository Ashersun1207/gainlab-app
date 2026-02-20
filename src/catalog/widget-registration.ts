/**
 * Widget 渲染器注册 — App 初始化时 import 此文件
 *
 * (#12) 从 AgentView.tsx 模块顶层移到 catalog/ 统一管理。
 * 不管 AgentView 是否被 import，注册都会生效。
 */

import { lazy } from 'react';
import type { ComponentType } from 'react';
import { registerWidget } from './widget-registry';

// ── Lazy imports ──

const LazyKLineWidget = lazy(() =>
  import('../widgets/KLineWidget').then((m) => ({ default: m.KLineWidget as ComponentType<Record<string, unknown>> })),
);
const LazyHeatmapWidget = lazy(() =>
  import('../widgets/HeatmapWidget').then((m) => ({ default: m.HeatmapWidget as ComponentType<Record<string, unknown>> })),
);
const LazyFundamentalsWidget = lazy(() =>
  import('../widgets/FundamentalsWidget').then((m) => ({ default: m.FundamentalsWidget as ComponentType<Record<string, unknown>> })),
);
const LazySentimentWidget = lazy(() =>
  import('../widgets/SentimentWidget').then((m) => ({ default: m.SentimentWidget as ComponentType<Record<string, unknown>> })),
);
const LazyQuoteTableWidget = lazy(() =>
  import('../widgets/QuoteTableWidget').then((m) => ({ default: m.QuoteTableWidget as ComponentType<Record<string, unknown>> })),
);

// ── Register all widget renderers ──

registerWidget('kline', {
  component: LazyKLineWidget,
  wrapper: 'kline',
  propsMapper: () => ({}),
});
registerWidget('volume_profile', {
  component: LazyKLineWidget,
  wrapper: 'kline',
  propsMapper: () => ({}),
});
registerWidget('overlay', {
  component: LazyKLineWidget,
  wrapper: 'kline',
  propsMapper: () => ({}),
});
registerWidget('heatmap', {
  component: LazyHeatmapWidget,
  wrapper: 'panel',
  title: 'HEATMAP',
  propsMapper: (ws) => ({ market: (ws.market as string) || 'crypto' }),
});
registerWidget('fundamentals', {
  component: LazyFundamentalsWidget,
  wrapper: 'panel',
  title: 'FUNDAMENTALS',
  propsMapper: (ws) => ({ symbol: (ws.symbol as string) || 'BTCUSDT' }),
});
registerWidget('sentiment', {
  component: LazySentimentWidget,
  wrapper: 'panel',
  title: 'SENTIMENT',
  propsMapper: () => ({}),
});
registerWidget('quote_table', {
  component: LazyQuoteTableWidget,
  wrapper: 'panel',
  title: 'QUOTES',
  propsMapper: (ws) => ({
    symbols: ws.symbols as string[] | undefined,
    market: (ws.market as string) || 'crypto',
  }),
});
