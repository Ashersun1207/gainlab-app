import { QuoteTableWidget } from '../QuoteTableWidget';
import type { MarketType } from '../../types/market';

// Global indices — all via EODHD (cn market type for EODHD routing)
const GLOBAL_INDICES = [
  // US
  { symbol: 'GSPC.INDX', displayName: 'S&P 500', market: 'us' as MarketType },
  { symbol: 'DJI.INDX', displayName: 'Dow Jones', market: 'us' as MarketType },
  { symbol: 'IXIC.INDX', displayName: 'NASDAQ', market: 'us' as MarketType },
  // Europe
  { symbol: 'FTSE.INDX', displayName: 'FTSE 100', market: 'cn' as MarketType },
  { symbol: 'GDAXI.INDX', displayName: 'DAX', market: 'cn' as MarketType },
  // Asia
  { symbol: 'N225.INDX', displayName: 'Nikkei 225', market: 'cn' as MarketType },
  { symbol: 'HSI.INDX', displayName: '恒生指数', market: 'cn' as MarketType },
  { symbol: '000001.SHG', displayName: '上证综指', market: 'cn' as MarketType },
  // Note: EODHD indices use market='cn' for the EODHD router in the Worker
  // INDX symbols are EODHD index tickers
];

interface GlobalIndexWidgetProps {
  headless?: boolean;
  onRowClick?: (symbol: string, market: MarketType) => void;
}

export function GlobalIndexWidget({ headless, onRowClick }: GlobalIndexWidgetProps) {
  return (
    <QuoteTableWidget
      title={headless ? '' : '全球指数'}
      items={GLOBAL_INDICES}
      onRowClick={onRowClick}
      refreshInterval={60000}
    />
  );
}
