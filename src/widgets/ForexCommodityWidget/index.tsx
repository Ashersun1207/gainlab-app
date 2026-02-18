import { QuoteTableWidget } from '../QuoteTableWidget';
import type { MarketType } from '../../types/market';

const FOREX_COMMODITY_ITEMS = [
  // Precious metals (EODHD FOREX exchange)
  { symbol: 'XAUUSD.FOREX', displayName: 'Gold (XAU/USD)', market: 'metal' as MarketType },
  { symbol: 'XAGUSD.FOREX', displayName: 'Silver (XAG/USD)', market: 'metal' as MarketType },
  // Major forex pairs (EODHD FOREX exchange)
  { symbol: 'EURUSD.FOREX', displayName: 'EUR/USD', market: 'metal' as MarketType },
  { symbol: 'GBPUSD.FOREX', displayName: 'GBP/USD', market: 'metal' as MarketType },
  { symbol: 'USDJPY.FOREX', displayName: 'USD/JPY', market: 'metal' as MarketType },
  { symbol: 'USDCNH.FOREX', displayName: 'USD/CNH', market: 'metal' as MarketType },
  // Commodities
  { symbol: 'CL.COMM', displayName: 'Crude Oil (WTI)', market: 'metal' as MarketType },
  { symbol: 'NG.COMM', displayName: 'Natural Gas', market: 'metal' as MarketType },
];

interface ForexCommodityWidgetProps {
  onRowClick?: (symbol: string, market: MarketType) => void;
}

export function ForexCommodityWidget({ onRowClick }: ForexCommodityWidgetProps) {
  return (
    <QuoteTableWidget
      title="外汇 / 大宗商品"
      items={FOREX_COMMODITY_ITEMS}
      onRowClick={onRowClick}
      refreshInterval={60000}
    />
  );
}
