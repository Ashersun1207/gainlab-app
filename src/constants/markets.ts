import type {
  Asset,
  MarketType,
  TimeInterval,
  ToolType,
} from '../types/market';

/** 市场配置 */
export const MARKET_CONFIG: Record<
  MarketType,
  { label: string; icon: string }
> = {
  crypto: { label: '加密', icon: '₿' },
  us: { label: '美股', icon: '🇺🇸' },
  cn: { label: 'A股', icon: '🇨🇳' },
  hk: { label: '港股', icon: '🇭🇰' },
  eu: { label: '欧股', icon: '🇪🇺' },
  uk: { label: '英股', icon: '🇬🇧' },
  jp: { label: '日股', icon: '🇯🇵' },
  fx: { label: '外汇', icon: '💱' },
  comm: { label: '大宗商品', icon: '🛢️' },
  metal: { label: '贵金属', icon: '🥇' },
};

/** 热门资产（按市场） */
export const HOT_ASSETS: Record<MarketType, Asset[]> = {
  crypto: [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin',
      market: 'crypto',
      displaySymbol: 'BTC',
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum',
      market: 'crypto',
      displaySymbol: 'ETH',
    },
    {
      symbol: 'SOLUSDT',
      name: 'Solana',
      market: 'crypto',
      displaySymbol: 'SOL',
    },
    {
      symbol: 'BNBUSDT',
      name: 'BNB',
      market: 'crypto',
      displaySymbol: 'BNB',
    },
    {
      symbol: 'XRPUSDT',
      name: 'XRP',
      market: 'crypto',
      displaySymbol: 'XRP',
    },
    {
      symbol: 'ADAUSDT',
      name: 'Cardano',
      market: 'crypto',
      displaySymbol: 'ADA',
    },
    {
      symbol: 'DOGEUSDT',
      name: 'Dogecoin',
      market: 'crypto',
      displaySymbol: 'DOGE',
    },
    {
      symbol: 'AVAXUSDT',
      name: 'Avalanche',
      market: 'crypto',
      displaySymbol: 'AVAX',
    },
  ],
  us: [
    { symbol: 'AAPL', name: 'Apple', market: 'us', displaySymbol: 'AAPL' },
    {
      symbol: 'MSFT',
      name: 'Microsoft',
      market: 'us',
      displaySymbol: 'MSFT',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet',
      market: 'us',
      displaySymbol: 'GOOGL',
    },
    { symbol: 'AMZN', name: 'Amazon', market: 'us', displaySymbol: 'AMZN' },
    { symbol: 'NVDA', name: 'NVIDIA', market: 'us', displaySymbol: 'NVDA' },
    { symbol: 'TSLA', name: 'Tesla', market: 'us', displaySymbol: 'TSLA' },
    { symbol: 'META', name: 'Meta', market: 'us', displaySymbol: 'META' },
  ],
  cn: [
    {
      symbol: '601318.SHG',
      name: '中国平安',
      market: 'cn',
      displaySymbol: '平安',
    },
    {
      symbol: '600519.SHG',
      name: '贵州茅台',
      market: 'cn',
      displaySymbol: '茅台',
    },
    {
      symbol: '000001.SHE',
      name: '平安银行',
      market: 'cn',
      displaySymbol: '平安银行',
    },
    {
      symbol: '000858.SHE',
      name: '五粮液',
      market: 'cn',
      displaySymbol: '五粮液',
    },
    {
      symbol: '600036.SHG',
      name: '招商银行',
      market: 'cn',
      displaySymbol: '招行',
    },
  ],
  hk: [
    { symbol: 'HSI', name: '恒生指数', market: 'hk', displaySymbol: '恒生' },
  ],
  eu: [
    { symbol: 'DAX', name: 'DAX', market: 'eu', displaySymbol: 'DAX' },
  ],
  uk: [
    { symbol: 'FTSE 100', name: 'FTSE 100', market: 'uk', displaySymbol: 'FTSE' },
  ],
  jp: [
    { symbol: 'Nikkei', name: 'Nikkei 225', market: 'jp', displaySymbol: 'Nikkei' },
  ],
  fx: [
    { symbol: 'EUR/USD', name: 'EUR/USD', market: 'fx', displaySymbol: 'EUR/USD' },
    { symbol: 'GBP/USD', name: 'GBP/USD', market: 'fx', displaySymbol: 'GBP/USD' },
    { symbol: 'USD/JPY', name: 'USD/JPY', market: 'fx', displaySymbol: 'USD/JPY' },
  ],
  comm: [
    { symbol: 'WTI', name: 'WTI Crude Oil', market: 'comm', displaySymbol: 'WTI' },
  ],
  metal: [
    {
      symbol: 'XAUUSD.FOREX',
      name: 'Gold',
      market: 'metal',
      displaySymbol: 'XAU',
    },
    {
      symbol: 'XAGUSD.FOREX',
      name: 'Silver',
      market: 'metal',
      displaySymbol: 'XAG',
    },
  ],
};

/** 时间周期选项 */
export const TIME_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

/** 可用指标 */
export const AVAILABLE_INDICATORS = [
  'MA',
  'EMA',
  'RSI',
  'MACD',
  'BOLL',
  'KDJ',
  'VWAP',
  'ATR',
] as const;

/** 工具配置 */
export const TOOL_CONFIG: Record<
  ToolType,
  { label: string; icon: string; description: string }
> = {
  // volume_profile: 已改为 KLineChart overlay 指标，不再作为独立 widget
  overlay: { label: 'Overlay', icon: '📈', description: '多资产叠加' },
  fundamentals: { label: '基本面', icon: '💰', description: '财务数据' },
  heatmap: { label: '热力图', icon: '🔥', description: '板块热力图' },
  // wrb: 已改为 KLineChart overlay 指标，不再作为独立 widget
};

/** 工具按市场支持映射：哪些工具在哪些市场可用 */
export const TOOL_MARKET_SUPPORT: Record<ToolType, MarketType[]> = {
  // volume_profile: KLineChart overlay
  overlay: ['crypto', 'us', 'cn', 'metal'],
  fundamentals: ['us', 'cn'], // 加密和贵金属无基本面数据
  heatmap: ['crypto', 'us', 'cn', 'metal'],
  // wrb: KLineChart overlay
};

/** CF Worker base URL（从 .env VITE_WORKER_URL 读取） */
export const WORKER_URL = import.meta.env.VITE_WORKER_URL as string;

/** (#6) NOW 场景默认报价资产列表 — 从 App.tsx 移出 */
export const NOW_QUOTE_ITEMS: Array<{ symbol: string; displayName: string; market: MarketType }> = [
  { symbol: 'BTCUSDT', displayName: 'Bitcoin', market: 'crypto' },
  { symbol: 'ETHUSDT', displayName: 'Ethereum', market: 'crypto' },
  { symbol: 'SOLUSDT', displayName: 'Solana', market: 'crypto' },
  { symbol: 'BNBUSDT', displayName: 'BNB', market: 'crypto' },
  { symbol: 'XRPUSDT', displayName: 'XRP', market: 'crypto' },
  { symbol: 'AAPL', displayName: 'Apple', market: 'us' },
  { symbol: 'MSFT', displayName: 'Microsoft', market: 'us' },
  { symbol: 'NVDA', displayName: 'NVIDIA', market: 'us' },
  { symbol: 'TSLA', displayName: 'Tesla', market: 'us' },
  { symbol: 'XAUUSD.FOREX', displayName: 'Gold', market: 'metal' },
];
