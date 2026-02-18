export interface KLineData {
  timestamp: number; // 毫秒！
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  turnover?: number;
  [key: string]: unknown;
}

export interface HeatmapItem {
  name: string;
  value: number;
  change: number;
}

/** Volume Profile 单层数据 */
export interface VPLevel {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
}

/** Volume Profile 完整数据 */
export interface VolumeProfileData {
  levels: VPLevel[];
  poc: number; // Point of Control
  vah: number; // Value Area High
  val: number; // Value Area Low
}

/** WRB 信号 */
export interface WRBSignal {
  timestamp: number;
  type: 'wrb' | 'hg' | 'hg_pro';
  direction: 'bullish' | 'bearish';
  score: number;
}

/** 基本面数据（简化，具体字段由 MCP Server 定义） */
export interface FundamentalsData {
  symbol: string;
  metrics: Record<string, number | string>;
  chartOption?: Record<string, unknown>; // 预构建的 ECharts option
}

/** Quote table row */
export interface QuoteRow {
  symbol: string;
  displayName: string;
  price: number;
  change: number;
  changePercent: number;
  market: 'crypto' | 'us' | 'cn' | 'metal' | 'index' | 'forex';
}

/** Sentiment data */
export interface SentimentData {
  vix: { value: number; change: number; level: 'low' | 'normal' | 'high' | 'extreme' };
  fearGreed: { value: number; label: string; change: number };
}
