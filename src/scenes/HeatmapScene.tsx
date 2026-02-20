/**
 * HeatmapScene — Market heat scene: big heatmap + sidebar (top movers + quote table).
 * Layout: 7:3 ratio on desktop, vertical stack on mobile.
 */

import { Suspense, lazy } from 'react';
import { WidgetPanel } from '../layout/WidgetPanel';
import type { MarketType } from '../types/market';

// Lazy load widgets for code splitting (G7)
const LazyHeatmapWidget = lazy(() =>
  import('../widgets/HeatmapWidget').then((m) => ({
    default: m.HeatmapWidget,
  })),
);
const LazyQuoteTableWidget = lazy(() =>
  import('../widgets/QuoteTableWidget').then((m) => ({
    default: m.QuoteTableWidget,
  })),
);

// Top movers items — crypto for now, can be parameterized later
const TOP_MOVERS_ITEMS = [
  { symbol: 'BTCUSDT', displayName: 'BTC', market: 'crypto' as MarketType },
  { symbol: 'ETHUSDT', displayName: 'ETH', market: 'crypto' as MarketType },
  { symbol: 'SOLUSDT', displayName: 'SOL', market: 'crypto' as MarketType },
  { symbol: 'BNBUSDT', displayName: 'BNB', market: 'crypto' as MarketType },
  { symbol: 'XRPUSDT', displayName: 'XRP', market: 'crypto' as MarketType },
  { symbol: 'ADAUSDT', displayName: 'ADA', market: 'crypto' as MarketType },
  { symbol: 'DOGEUSDT', displayName: 'DOGE', market: 'crypto' as MarketType },
  { symbol: 'AVAXUSDT', displayName: 'AVAX', market: 'crypto' as MarketType },
];

interface HeatmapSceneProps {
  market: MarketType;
  onCloseWidget?: (key: string) => void;
  isHidden?: (key: string) => boolean;
}

export function HeatmapScene({ market, onCloseWidget, isHidden }: HeatmapSceneProps) {
  const fallback = (
    <div className="w-full h-full bg-[#0d0d20] flex items-center justify-center">
      <span className="text-[#5a5a8a] text-sm">Loading...</span>
    </div>
  );

  return (
    <div className="hm-scene">
      {/* Main: big heatmap */}
      {(!isHidden || !isHidden('HEATMAP')) && (
      <div className="hm-main">
        <WidgetPanel title="HEATMAP" subtitle={`${market.charAt(0).toUpperCase() + market.slice(1)} ▾`} onClose={onCloseWidget ? () => onCloseWidget('HEATMAP') : undefined}>
          <Suspense fallback={fallback}>
            <LazyHeatmapWidget market={market} />
          </Suspense>
        </WidgetPanel>
      </div>
      )}

      {/* Side: top movers + quote table */}
      {(!isHidden || !isHidden('TOP MOVERS')) && (
      <div className="hm-side">
        <WidgetPanel title="TOP MOVERS" subtitle="Crypto" onClose={onCloseWidget ? () => onCloseWidget('TOP MOVERS') : undefined}>
          <Suspense fallback={fallback}>
            <LazyQuoteTableWidget
              title=""
              items={TOP_MOVERS_ITEMS}
            />
          </Suspense>
        </WidgetPanel>
      </div>
      )}
    </div>
  );
}
