/** 市场类型 */
export type MarketType = 'crypto' | 'us' | 'cn' | 'hk' | 'eu' | 'uk' | 'jp' | 'fx' | 'comm' | 'metal';

/** K线时间周期 */
export type TimeInterval =
  | '1m'
  | '5m'
  | '15m'
  | '1h'
  | '4h'
  | '1D'
  | '1W'
  | '1M';

/** 工具类型 */
export type ToolType =
  | 'overlay'
  | 'fundamentals'
  | 'heatmap';

/** 资产信息 */
export interface Asset {
  symbol: string; // e.g. 'BTCUSDT', 'AAPL', '601318.SHG'
  name: string; // e.g. 'Bitcoin', 'Apple Inc.'
  market: MarketType;
  displaySymbol?: string; // 简短显示名 e.g. 'BTC', 'AAPL'
}

/** 场景参数（drill-down / URL 路由用） */
export interface SceneParams {
  symbol?: string;
  market?: MarketType;
  period?: TimeInterval;
}

/** 报价信息 */
export interface Quote {
  symbol: string;
  price: number;
  change: number; // 涨跌额
  changePercent: number; // 涨跌幅 %
}
