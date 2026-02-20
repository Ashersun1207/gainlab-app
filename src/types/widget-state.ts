/**
 * Widget State Protocol — 类型定义
 *
 * Agent 调用 tool → Worker 注入 widgetState JSON → 前端解析 → 主区域渲染。
 * 注册表模式：type 是开放字符串，新增 Widget 不改旧代码。
 */

/** 通用 Widget State（所有 Widget 的基类） */
export interface WidgetState {
  type: string;
  [key: string]: unknown;
}

// ── 已有 Widget 的 State 定义（类型收窄，用于组件内部）──

export interface KlineWidgetState extends WidgetState {
  type: 'kline';
  symbol: string;
  market: string;
  period?: string;
  indicators?: string[];
  chartType?: string;
  showWRB?: boolean;
}

export interface HeatmapWidgetState extends WidgetState {
  type: 'heatmap';
  market: string;
  sector?: string;
  metric?: string;
}

export interface QuoteTableWidgetState extends WidgetState {
  type: 'quote_table';
  symbols: string[];
  market: string;
}

export interface SentimentWidgetState extends WidgetState {
  type: 'sentiment';
}

export interface FundamentalsWidgetState extends WidgetState {
  type: 'fundamentals';
  symbol: string;
  market: string;
}

export interface VolumeProfileWidgetState extends WidgetState {
  type: 'volume_profile';
  symbol: string;
  market: string;
  period?: string;
}

export interface OverlayWidgetState extends WidgetState {
  type: 'overlay';
  symbols: string[];
  markets: string[];
  period: string;
}

/** 联合类型（用于 switch-case 类型收窄） */
export type KnownWidgetState =
  | KlineWidgetState
  | HeatmapWidgetState
  | QuoteTableWidgetState
  | SentimentWidgetState
  | FundamentalsWidgetState
  | VolumeProfileWidgetState
  | OverlayWidgetState;
