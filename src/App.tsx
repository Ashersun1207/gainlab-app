import { useState, useCallback, Suspense, lazy } from 'react';
import { useResponsive } from './hooks/useResponsive';
import { useMarketData } from './hooks/useMarketData';
import { useScene } from './hooks/useScene';
import { useResizable } from './hooks/useResizable';
import { useAgentWidgets } from './hooks/useAgentWidgets';
import { useHiddenWidgets } from './hooks/useHiddenWidgets';
import { Sidebar } from './layout/Sidebar';
import { HeaderBar } from './layout/HeaderBar';
import { WidgetPanel } from './layout/WidgetPanel';
import { ChatToggle } from './chat/ChatToggle';
import { MobileTabBar } from './layout/MobileTabBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeatmapScene } from './scenes/HeatmapScene';
import { AgentView } from './scenes/AgentView';
import { PlaceholderScene } from './scenes/PlaceholderScene';
import { KLineHeader } from './widgets/KLineWidget/KLineHeader';
import { NOW_QUOTE_ITEMS } from './constants/markets';
import { t } from './i18n';
import { Settings } from './layout/Settings';
import type { MarketType, TimeInterval } from './types/market';

// --- Code-split heavy widgets (G7) ---
const LazyChatPanel = lazy(() =>
  import('./chat/ChatPanel').then((m) => ({ default: m.ChatPanel })),
);
const LazyKLineWidget = lazy(() =>
  import('./widgets/KLineWidget').then((m) => ({ default: m.KLineWidget })),
);
const LazyHeatmapWidget = lazy(() =>
  import('./widgets/HeatmapWidget').then((m) => ({ default: m.HeatmapWidget })),
);
const LazyFundamentalsWidget = lazy(() =>
  import('./widgets/FundamentalsWidget').then((m) => ({
    default: m.FundamentalsWidget,
  })),
);
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

function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-[#8888aa] text-sm">
      Loading…
    </div>
  );
}

/** 获取资产显示名（如 "BTC / USDT"） */
function formatSymbolDisplay(symbol: string): string {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)} / USDT`;
  if (symbol.includes('.')) return symbol.split('.')[0];
  return symbol;
}

/** Map KLineHeader market labels to MarketType */
const MARKET_LABEL_MAP: Record<string, MarketType> = {
  crypto: 'crypto',
  us: 'us',
  'a股': 'cn',
  metal: 'metal',
};
function toMarketType(label: string): MarketType {
  return MARKET_LABEL_MAP[label.toLowerCase()] ?? 'crypto';
}

function App() {
  const { isMobile } = useResponsive();

  // ── Language ──
  const [, setLangVersion] = useState(0);
  const handleLangChange = useCallback((_newLang: 'zh' | 'en') => {
    setLangVersion((v) => v + 1);
  }, []);

  // ── Settings ──
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Scene ──
  const { activeScene, sceneParams, switchScene, isImplemented } = useScene();
  const activeSymbol = sceneParams.symbol ?? 'BTCUSDT';
  const activeMarket = (sceneParams.market ?? 'crypto') as MarketType;
  const activeInterval = sceneParams.period ?? '1D';

  // ── Chart controls ──
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);
  const [chartType, setChartType] = useState('candle_solid');
  const [drawingToolOpen, setDrawingToolOpen] = useState(false);
  const handleIndicatorToggle = useCallback((ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    );
  }, []);

  // ── Resize ──
  const { handleResizeStart } = useResizable('.ck-grid', 150, 500);

  // ── Chat ──
  const [chatOpen, setChatOpen] = useState(!isMobile);
  const toggleChat = useCallback(() => setChatOpen((prev) => !prev), []);

  // ── Data ──
  const { klineData, quote } = useMarketData(activeSymbol, activeMarket, activeInterval);
  const effectiveKlineData = klineData.length > 0 ? klineData : undefined;

  // ── (#4) Agent Widgets — extracted hook ──
  const {
    agentWidgets,
    handleToolResult,
    handleNewRound,
    clearAgentWidgets,
    removeAgentWidget,
  } = useAgentWidgets(switchScene);

  // ── (#4) Hidden Widgets — extracted hook ──
  const { isHidden, closeHandler } = useHiddenWidgets(activeScene);

  // ── Scene content renderer ──
  const renderScene = () => {
    if (!isImplemented) {
      return <PlaceholderScene sceneId={activeScene} />;
    }

    switch (activeScene) {
      case 'snapshot':
        return (
          <div className="scene-grid">
            {!isHidden('QUOTES') && (
            <WidgetPanel title="QUOTES" subtitle={t('w_four_markets')} onClose={closeHandler('QUOTES')}>
              <ErrorBoundary label="QuoteTable">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyQuoteTableWidget title="" items={NOW_QUOTE_ITEMS} />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>
            )}
            {!isHidden('SENTIMENT') && (
            <WidgetPanel title="SENTIMENT" subtitle={t('w_market_mood')} onClose={closeHandler('SENTIMENT')}>
              <ErrorBoundary label="Sentiment">
                <Suspense fallback={<LoadingPlaceholder />}><LazySentimentWidget headless /></Suspense>
              </ErrorBoundary>
            </WidgetPanel>
            )}
            {!isHidden('GLOBAL INDEX') && (
            <WidgetPanel title="GLOBAL INDEX" subtitle={t('w_world_indices')} onClose={closeHandler('GLOBAL INDEX')}>
              <ErrorBoundary label="GlobalIndex">
                <Suspense fallback={<LoadingPlaceholder />}><LazyGlobalIndexWidget headless /></Suspense>
              </ErrorBoundary>
            </WidgetPanel>
            )}
            {!isHidden('HEATMAP') && (
            <WidgetPanel title="HEATMAP" subtitle={`${activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1)} ▾`} onClose={closeHandler('HEATMAP')}>
              <ErrorBoundary label="Heatmap">
                <Suspense fallback={<LoadingPlaceholder />}><LazyHeatmapWidget market={activeMarket} /></Suspense>
              </ErrorBoundary>
            </WidgetPanel>
            )}
            {!isHidden('FX & COMM') && (
            <WidgetPanel title="FX & COMM" subtitle={t('w_forex_comm')} onClose={closeHandler('FX & COMM')}>
              <ErrorBoundary label="ForexCommodity">
                <Suspense fallback={<LoadingPlaceholder />}><LazyForexCommodityWidget headless /></Suspense>
              </ErrorBoundary>
            </WidgetPanel>
            )}
            {!isHidden('CHART') && (
            <WidgetPanel title="CHART" subtitle={formatSymbolDisplay(activeSymbol)} onClose={closeHandler('CHART')}>
              <ErrorBoundary label="KLine">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyKLineWidget key={activeSymbol} symbol={activeSymbol} market={activeMarket} data={effectiveKlineData} indicators={activeIndicators} showWRB={false} showVP={false} />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>
            )}
          </div>
        );

      case 'market_heat':
        return (
          <div className="flex-1 min-h-0">
            <ErrorBoundary label="HeatmapScene">
              <HeatmapScene
                market={activeMarket}
                onCloseWidget={(k) => closeHandler(k)()}
                isHidden={isHidden}
              />
            </ErrorBoundary>
          </div>
        );

      case 'ai':
        return (
          <div className="flex-1 min-h-0">
            <AgentView widgets={agentWidgets} onClear={clearAgentWidgets} onRemoveWidget={removeAgentWidget} />
          </div>
        );

      case 'stock_analysis':
      default:
        return (
          <>
            {!isHidden('KLINE') && (
            <div className="ck-kline">
              <KLineHeader
                symbol={activeSymbol}
                symbolDisplay={formatSymbolDisplay(activeSymbol)}
                market={activeMarket}
                price={quote?.price}
                changePercent={quote?.changePercent}
                period={activeInterval}
                onSymbolChange={(sym, mkt) => switchScene('stock_analysis', { symbol: sym, market: toMarketType(mkt) })}
                onPeriodChange={(p) => switchScene(activeScene, { period: p as TimeInterval })}
                chartType={chartType}
                onChartTypeChange={setChartType}
                activeIndicators={activeIndicators}
                onIndicatorToggle={handleIndicatorToggle}
                drawingToolOpen={drawingToolOpen}
                onDrawingToolToggle={() => setDrawingToolOpen((v) => !v)}
                onClose={closeHandler('KLINE')}
              />
              <ErrorBoundary label="KLine">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyKLineWidget key={activeSymbol} symbol={activeSymbol} market={activeMarket} data={effectiveKlineData} indicators={activeIndicators} showWRB={false} showVP={false} drawingToolOpen={drawingToolOpen} />
                </Suspense>
              </ErrorBoundary>
            </div>
            )}
            <div className="ck-resize" onMouseDown={handleResizeStart} />
            <div className="ck-grid">
              {!isHidden('HEATMAP') && (
              <WidgetPanel title="HEATMAP" subtitle={`${activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1)} ▾`} onClose={closeHandler('HEATMAP')}>
                <ErrorBoundary label="Heatmap">
                  <Suspense fallback={<LoadingPlaceholder />}><LazyHeatmapWidget market={activeMarket} /></Suspense>
                </ErrorBoundary>
              </WidgetPanel>
              )}
              {!isHidden('FUNDAMENTALS') && (
              <WidgetPanel title="FUNDAMENTALS" subtitle={`${activeSymbol} ▾`} onClose={closeHandler('FUNDAMENTALS')}>
                <ErrorBoundary label="Fundamentals">
                  <Suspense fallback={<LoadingPlaceholder />}><LazyFundamentalsWidget symbol={activeSymbol} headless /></Suspense>
                </ErrorBoundary>
              </WidgetPanel>
              )}
              {!isHidden('QUOTES') && (
              <WidgetPanel title="QUOTES" subtitle={t('w_four_markets')} onClose={closeHandler('QUOTES')}>
                <ErrorBoundary label="QuoteTable">
                  <Suspense fallback={<LoadingPlaceholder />}><LazyQuoteTableWidget title="" items={NOW_QUOTE_ITEMS} /></Suspense>
                </ErrorBoundary>
              </WidgetPanel>
              )}
              {!isHidden('SENTIMENT') && (
              <WidgetPanel title="SENTIMENT" subtitle={t('w_market_mood')} onClose={closeHandler('SENTIMENT')}>
                <ErrorBoundary label="Sentiment">
                  <Suspense fallback={<LoadingPlaceholder />}><LazySentimentWidget headless /></Suspense>
                </ErrorBoundary>
              </WidgetPanel>
              )}
              {!isHidden('GLOBAL INDEX') && (
              <WidgetPanel title="GLOBAL INDEX" subtitle={t('w_world_indices')} onClose={closeHandler('GLOBAL INDEX')}>
                <ErrorBoundary label="GlobalIndex">
                  <Suspense fallback={<LoadingPlaceholder />}><LazyGlobalIndexWidget headless /></Suspense>
                </ErrorBoundary>
              </WidgetPanel>
              )}
              {!isHidden('FX & COMM') && (
              <WidgetPanel title="FX & COMM" subtitle={t('w_forex_comm')} onClose={closeHandler('FX & COMM')}>
                <ErrorBoundary label="ForexCommodity">
                  <Suspense fallback={<LoadingPlaceholder />}><LazyForexCommodityWidget headless /></Suspense>
                </ErrorBoundary>
              </WidgetPanel>
              )}
            </div>
          </>
        );
    }
  };

  // ══════════════ Mobile ══════════════
  if (isMobile) {
    return (
      <div className="w-screen h-[100dvh] bg-[#0f0f1a] overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pb-14">
          {renderScene()}
        </div>
        {chatOpen && (
          <div className="mobile-overlay">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyChatPanel onToolResult={handleToolResult} onNewRound={handleNewRound} onClose={() => setChatOpen(false)} />
            </Suspense>
          </div>
        )}
        <MobileTabBar activeScene={activeScene} chatOpen={chatOpen} onSceneSelect={switchScene} onToggleChat={toggleChat} onCloseChat={() => setChatOpen(false)} />
        <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onLangChange={handleLangChange} />
      </div>
    );
  }

  // ══════════════ Desktop ══════════════
  return (
    <div className="w-screen h-screen bg-[#0f0f1a] overflow-hidden flex">
      <ErrorBoundary label="Sidebar">
        <Sidebar activeScene={activeScene} onSceneSelect={switchScene} onToggleChat={toggleChat} onOpenSettings={() => setSettingsOpen(true)} />
      </ErrorBoundary>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderBar onToggleChat={toggleChat} />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderScene()}
        </div>
      </div>
      {chatOpen ? (
        <div className="cp-panel">
          <ErrorBoundary label="Chat">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyChatPanel onToolResult={handleToolResult} onNewRound={handleNewRound} onClose={() => setChatOpen(false)} />
            </Suspense>
          </ErrorBoundary>
        </div>
      ) : (
        <ChatToggle onClick={() => setChatOpen(true)} />
      )}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onLangChange={handleLangChange} />
    </div>
  );
}

export default App;
