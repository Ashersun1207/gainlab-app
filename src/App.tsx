import { useState, useCallback, Suspense, lazy } from 'react';
import { useResponsive } from './hooks/useResponsive';
import { useMarketData } from './hooks/useMarketData';
import { useScene } from './hooks/useScene';
import { Sidebar } from './layout/Sidebar';
import { Toolbar } from './layout/Toolbar';
import { Drawer } from './layout/Drawer';
import { ChatToggle } from './chat/ChatToggle';
import { MobileTabBar } from './layout/MobileTabBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeatmapScene } from './scenes/HeatmapScene';
import { PlaceholderScene } from './scenes/PlaceholderScene';
import { getRenderTarget, mcpToKLine, mcpToEChartsOption } from './services/dataAdapter';
import type { ToolType } from './types/market';
import type { KLineData } from './types/data';
import type { EChartsOption } from 'echarts';
import type { MarketType } from './types/market';

// --- Code-split heavy widgets (G7) ---
const LazyChatPanel = lazy(() =>
  import('./chat/ChatPanel').then((m) => ({ default: m.ChatPanel })),
);
const LazyKLineWidget = lazy(() =>
  import('./widgets/KLineWidget').then((m) => ({ default: m.KLineWidget })),
);
const LazyEChartsWidget = lazy(() =>
  import('./widgets/EChartsWidget').then((m) => ({ default: m.EChartsWidget })),
);
const LazyHeatmapWidget = lazy(() =>
  import('./widgets/HeatmapWidget').then((m) => ({ default: m.HeatmapWidget })),
);
const LazyOverlayWidget = lazy(() =>
  import('./widgets/OverlayWidget').then((m) => ({ default: m.OverlayWidget })),
);
const LazyFundamentalsWidget = lazy(() =>
  import('./widgets/FundamentalsWidget').then((m) => ({
    default: m.FundamentalsWidget,
  })),
);

// --- NOW page widgets (T11) ---
const LazyQuoteTableWidget = lazy(() =>
  import('./widgets/QuoteTableWidget').then((m) => ({ default: m.QuoteTableWidget })),
);
const LazySentimentWidget = lazy(() =>
  import('./widgets/SentimentWidget').then((m) => ({ default: m.SentimentWidget })),
);
const LazyGlobalIndexWidget = lazy(() =>
  import('./widgets/GlobalIndexWidget').then((m) => ({ default: m.GlobalIndexWidget })),
);
const LazyForexCommodityWidget = lazy(() =>
  import('./widgets/ForexCommodityWidget').then((m) => ({ default: m.ForexCommodityWidget })),
);

// --- Loading placeholder (dark themed) ---
function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-[#8888aa] text-sm">
      Loading…
    </div>
  );
}

// --- NOW scene: 四市场报价表 items ---
const NOW_QUOTE_ITEMS = [
  { symbol: 'BTCUSDT', displayName: 'Bitcoin', market: 'crypto' as MarketType },
  { symbol: 'ETHUSDT', displayName: 'Ethereum', market: 'crypto' as MarketType },
  { symbol: 'SOLUSDT', displayName: 'Solana', market: 'crypto' as MarketType },
  { symbol: 'BNBUSDT', displayName: 'BNB', market: 'crypto' as MarketType },
  { symbol: 'XRPUSDT', displayName: 'XRP', market: 'crypto' as MarketType },
  { symbol: 'AAPL', displayName: 'Apple', market: 'us' as MarketType },
  { symbol: 'MSFT', displayName: 'Microsoft', market: 'us' as MarketType },
  { symbol: 'NVDA', displayName: 'NVIDIA', market: 'us' as MarketType },
  { symbol: 'TSLA', displayName: 'Tesla', market: 'us' as MarketType },
  { symbol: 'XAUUSD.FOREX', displayName: 'Gold', market: 'metal' as MarketType },
];

/** 获取资产显示名（如 "BTC / USDT"） */
function formatSymbolDisplay(symbol: string): string {
  if (symbol.endsWith('USDT')) {
    return `${symbol.slice(0, -4)} / USDT`;
  }
  if (symbol.includes('.')) {
    return symbol.split('.')[0];
  }
  return symbol;
}

function App() {
  const { isMobile } = useResponsive();

  // ── Scene management (replaces old activeScene useState) ──
  const { activeScene, sceneParams, switchScene, drillDown, isImplemented } =
    useScene();

  // ── Derive market/symbol/interval from sceneParams ──
  const activeSymbol = sceneParams.symbol ?? 'BTCUSDT';
  const activeMarket = (sceneParams.market ?? 'crypto') as MarketType;
  const activeInterval = sceneParams.period ?? '1D';

  // ── Indicators ──
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);

  // ── Drawer (tool panels) ──
  const [drawerTool, setDrawerTool] = useState<ToolType | null>(null);

  // ── Chat ──
  const [chatOpen, setChatOpen] = useState(false);

  // ── Data ──
  const { klineData, quote } = useMarketData(activeSymbol, activeMarket, activeInterval);

  // ── P0 compat: Chat onToolResult → update ECharts / KLine ──
  const [echartsOption, setEchartsOption] = useState<EChartsOption | null>(null);
  const [chatKlineData, setChatKlineData] = useState<KLineData[] | null>(null);

  // ── Indicator toggle ──
  const handleIndicatorToggle = useCallback((ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    );
  }, []);

  // ── Chat tool result callback ──
  const handleToolResult = useCallback((toolName: string, result: unknown) => {
    const target = getRenderTarget(toolName);
    if (target === 'kline') {
      const data = mcpToKLine(result);
      if (data.length > 0) {
        setChatKlineData(data);
      }
    } else {
      const option = mcpToEChartsOption(toolName, result);
      setEchartsOption(option);
    }
  }, []);

  // ── Toggle chat ──
  const toggleChat = useCallback(() => {
    setChatOpen((prev) => !prev);
  }, []);

  // ── Drawer content ──
  const renderDrawerContent = useCallback(() => {
    switch (drawerTool) {
      case 'heatmap':
        return (
          <Suspense fallback={<LoadingPlaceholder />}>
            <LazyHeatmapWidget market={activeMarket} />
          </Suspense>
        );
      case 'overlay':
        return (
          <Suspense fallback={<LoadingPlaceholder />}>
            <LazyOverlayWidget symbol={activeSymbol} market={activeMarket} />
          </Suspense>
        );
      case 'fundamentals':
        return (
          <Suspense fallback={<LoadingPlaceholder />}>
            <LazyFundamentalsWidget symbol={activeSymbol} />
          </Suspense>
        );
      default:
        return null;
    }
  }, [drawerTool, activeMarket, activeSymbol]);

  // Effective kline data: Chat-pushed data takes priority
  const effectiveKlineData =
    chatKlineData ?? (klineData.length > 0 ? klineData : undefined);

  // ── Scene content renderer ──
  const renderScene = () => {
    // Unimplemented scenes → placeholder
    if (!isImplemented) {
      return <PlaceholderScene sceneId={activeScene} />;
    }

    switch (activeScene) {
      case 'snapshot':
        return (
          <div className="flex-1 min-h-0 overflow-y-auto p-2 gap-2 grid grid-cols-2 grid-rows-[1fr_1fr_1fr] auto-rows-fr">
            <ErrorBoundary label="QuoteTable">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyQuoteTableWidget
                  title="四市场报价"
                  items={NOW_QUOTE_ITEMS}
                  onRowClick={(sym, mkt) => drillDown(sym, mkt)}
                />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary label="Sentiment">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazySentimentWidget />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary label="GlobalIndex">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyGlobalIndexWidget
                  onRowClick={(sym, mkt) => drillDown(sym, mkt)}
                />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary label="Heatmap">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyHeatmapWidget
                  market={activeMarket}
                  onCellClick={(sym) => drillDown(sym)}
                />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary label="ForexCommodity">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyForexCommodityWidget
                  onRowClick={(sym, mkt) => drillDown(sym, mkt)}
                />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary label="KLine">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyKLineWidget
                  key={activeSymbol}
                  symbol={activeSymbol}
                  data={effectiveKlineData}
                  indicators={activeIndicators}
                  showWRB={false}
                  showVP={false}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'market_heat':
        return (
          <div className="flex-1 min-h-0">
            <ErrorBoundary label="HeatmapScene">
              <HeatmapScene market={activeMarket} onDrillDown={drillDown} />
            </ErrorBoundary>
          </div>
        );

      case 'ai':
        return (
          <div className="flex-1 min-h-0">
            <ErrorBoundary label="Chat">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyChatPanel
                  onToolResult={handleToolResult}
                  onClose={() => switchScene('stock_analysis')}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        );

      case 'stock_analysis':
      default:
        return (
          <>
            <div className={`min-h-0 ${drawerTool ? 'h-[60%]' : 'flex-1'}`}>
              <ErrorBoundary label="KLine">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyKLineWidget
                    key={activeSymbol}
                    symbol={activeSymbol}
                    data={effectiveKlineData}
                    indicators={activeIndicators}
                    showWRB={false}
                    showVP={false}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
            <Drawer
              open={!!drawerTool}
              activeTool={drawerTool}
              onClose={() => setDrawerTool(null)}
            >
              <ErrorBoundary label="Drawer Widget">
                {renderDrawerContent()}
              </ErrorBoundary>
            </Drawer>
            {echartsOption && !drawerTool && (
              <div className="h-[40%] border-t border-[#1e1e3a]">
                <ErrorBoundary label="ECharts">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazyEChartsWidget
                      option={echartsOption}
                      style={{ height: '100%' }}
                    />
                  </Suspense>
                </ErrorBoundary>
              </div>
            )}
          </>
        );
    }
  };

  // ══════════════════════════════════════════════════════════
  // Mobile layout
  // ══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="w-screen h-[100dvh] bg-[#0f0f1a] overflow-hidden flex flex-col">
        {/* Toolbar */}
        <Toolbar
          symbolDisplay={formatSymbolDisplay(activeSymbol)}
          price={quote?.price}
          changePercent={quote?.changePercent}
          interval={activeInterval}
          activeIndicators={activeIndicators}
          onIntervalChange={(interval) =>
            switchScene(activeScene, { period: interval })
          }
          onIndicatorToggle={handleIndicatorToggle}
        />

        {/* Scene content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {renderScene()}
        </div>

        {/* Mobile chat overlay */}
        {chatOpen && (
          <div className="mobile-overlay">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyChatPanel
                onToolResult={handleToolResult}
                onClose={() => setChatOpen(false)}
              />
            </Suspense>
          </div>
        )}

        {/* Bottom Tab Bar */}
        <MobileTabBar
          activeScene={activeScene}
          onSceneSelect={switchScene}
          onToggleChat={toggleChat}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // Desktop layout: Sidebar + Main(Toolbar + Scene) + Chat
  // ══════════════════════════════════════════════════════════
  return (
    <div className="w-screen h-screen bg-[#0f0f1a] overflow-hidden flex">
      {/* Sidebar */}
      <ErrorBoundary label="Sidebar">
        <Sidebar
          activeScene={activeScene}
          onSceneSelect={switchScene}
          onToggleChat={toggleChat}
        />
      </ErrorBoundary>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          symbolDisplay={formatSymbolDisplay(activeSymbol)}
          price={quote?.price}
          changePercent={quote?.changePercent}
          interval={activeInterval}
          activeIndicators={activeIndicators}
          onIntervalChange={(interval) =>
            switchScene(activeScene, { period: interval })
          }
          onIndicatorToggle={handleIndicatorToggle}
        />

        {/* Scene content */}
        {renderScene()}
      </div>

      {/* Chat panel (desktop) */}
      {chatOpen ? (
        <div className="w-[320px] flex-shrink-0 overflow-hidden">
          <ErrorBoundary label="Chat">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyChatPanel
                onToolResult={handleToolResult}
                onClose={() => setChatOpen(false)}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : (
        <ChatToggle onClick={() => setChatOpen(true)} />
      )}
    </div>
  );
}

export default App;
