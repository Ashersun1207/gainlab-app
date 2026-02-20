/**
 * Widget State Protocol — 类型定义
 *
 * 精确子类型从 Widget Catalog (src/catalog/widget-catalog.ts) Zod schema 自动推导。
 * 依赖方向：widget-state.ts → catalog（单向，catalog 不 import 此文件）。
 *
 * @see src/catalog/widget-catalog.ts — 单一真相源
 */

import { z } from 'zod';
import { WIDGET_CATALOG } from '../catalog/widget-catalog';

/** 通用 Widget State（所有消费者使用的基础类型） */
export interface WidgetState {
  type: string;
  [key: string]: unknown;
}

// ── 从 Catalog schema 自动推导（类型名保持不变，兼容现有引用）──

export type KlineWidgetState = z.infer<typeof WIDGET_CATALOG.kline.schema>;
export type HeatmapWidgetState = z.infer<typeof WIDGET_CATALOG.heatmap.schema>;
export type QuoteTableWidgetState = z.infer<typeof WIDGET_CATALOG.quote_table.schema>;
export type SentimentWidgetState = z.infer<typeof WIDGET_CATALOG.sentiment.schema>;
export type FundamentalsWidgetState = z.infer<typeof WIDGET_CATALOG.fundamentals.schema>;
export type VolumeProfileWidgetState = z.infer<typeof WIDGET_CATALOG.volume_profile.schema>;
export type OverlayWidgetState = z.infer<typeof WIDGET_CATALOG.overlay.schema>;

/** 联合类型 */
export type KnownWidgetState =
  | KlineWidgetState
  | HeatmapWidgetState
  | QuoteTableWidgetState
  | SentimentWidgetState
  | FundamentalsWidgetState
  | VolumeProfileWidgetState
  | OverlayWidgetState;
