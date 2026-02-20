import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useResponsive } from './hooks/useResponsive';
import { useMarketData } from './hooks/useMarketData';
import { useScene } from './hooks/useScene';
import { useResizable } from './hooks/useResizable';
import { Sidebar } from './layout/Sidebar';
import { HeaderBar } from './layout/HeaderBar';
import { WidgetPanel } from './layout/WidgetPanel';
import { ChatToggle } from './chat/ChatToggle';
import { MobileTabBar } from './layout/MobileTabBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HeatmapScene } from './scenes/HeatmapScene';
import { PlaceholderScene } from './scenes/PlaceholderScene';
import { KLineHeader } from './widgets/KLineWidget/KLineHeader';
import { getRenderTarget, mcpToKLine, mcpToEChartsOption } from './services/dataAdapter';
import { t } from './i18n';
import { Settings } from './layout/Settings';
import type { KLineData } from './types/data';
import type { EChartsOption } from 'echarts';
import type { MarketType, TimeInterval } from './types/market';
import type { WidgetState } from './types/widget-state';

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

  // ── Language state (counter forces full re-render without remounting) ──
  const [, setLangVersion] = useState(0);
  const handleLangChange = useCallback((_newLang: 'zh' | 'en') => {
    setLangVersion((v) => v + 1);
  }, []);

  // ── Settings panel ──
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ── Scene management (replaces old activeScene useState) ──
  const { activeScene, sceneParams, switchScene, isImplemented } =
    useScene();

  // ── Derive market/symbol/interval from sceneParams ──
  const activeSymbol = sceneParams.symbol ?? 'BTCUSDT';
  const activeMarket = (sceneParams.market ?? 'crypto') as MarketType;
  const activeInterval = sceneParams.period ?? '1D';

  // ── Indicators ──
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);

  // ── Chart type ──
  const [chartType, setChartType] = useState('candle_solid');

  // ── Drawing tools ──
  const [drawingToolOpen, setDrawingToolOpen] = useState(false);

  // ── Resize ──
  const { handleResizeStart } = useResizable('.ck-grid', 150, 500);

  // ── Chat (desktop default open, mobile default closed) ──
  const [chatOpen, setChatOpen] = useState(!isMobile);

  // ── Data ──
  const { klineData, quote } = useMarketData(activeSymbol, activeMarket, activeInterval);

  // ── P0 compat: Chat onToolResult → update ECharts / KLine ──
  const [_echartsOption, setEchartsOption] = useState<EChartsOption | null>(null);
  const [chatKlineData, setChatKlineData] = useState<KLineData[] | null>(null);

  // ── T14.4: Agent widgetState → 主区域场景切换 ──
  const [agentWidgetState, setAgentWidgetState] = useState<WidgetState | null>(null);

  // ── Indicator toggle ──
  const handleIndicatorToggle = useCallback((ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    );
  }, []);

  // ── Chat tool result callback (T14.4: + widgetState) ──
  const handleToolResult = useCallback((toolName: string, result: unknown, widgetState?: WidgetState) => {
    // T14.4: 有 widgetState → 存储，驱动场景切换
    if (widgetState) {
      setAgentWidgetState(widgetState);
    }

    // 保留现有逻辑（数据转换 → 主区域渲染）
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

  // ── T14.4: widgetState → 场景切换 + 参数更新 ──
  useEffect(() => {
    if (!agentWidgetState) return;

    // widgetState.type → scene 映射
    const sceneMap: Record<string, string> = {
      kline: 'stock_analysis',
      heatmap: 'market_heat',
      overlay: 'stock_analysis',
      fundamentals: 'stock_analysis',
      volume_profile: 'stock_analysis',
      sentiment: 'snapshot',
    };

    const targetScene = sceneMap[agentWidgetState.type];
    if (targetScene) {
      switchScene(targetScene, {
        symbol: agentWidgetState.symbol as string | undefined,
        market: agentWidgetState.market as string | undefined,
        period: agentWidgetState.period as string | undefined,
      });
    }
  }, [agentWidgetState, switchScene]);

  // ── Toggle chat ──
  const toggleChat = useCallback(() => {
    setChatOpen((prev) => !prev);
  }, []);

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
          <div className="scene-grid">
            <WidgetPanel title="QUOTES" subtitle={t('w_four_markets')}>
              <ErrorBoundary label="QuoteTable">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyQuoteTableWidget
                    title=""
                    items={NOW_QUOTE_ITEMS}
                  />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>

            <WidgetPanel title="SENTIMENT" subtitle={t('w_market_mood')}>
              <ErrorBoundary label="Sentiment">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazySentimentWidget headless />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>

            <WidgetPanel title="GLOBAL INDEX" subtitle={t('w_world_indices')}>
              <ErrorBoundary label="GlobalIndex">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyGlobalIndexWidget headless />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>

            <WidgetPanel title="HEATMAP" subtitle={`${activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1)} ▾`}>
              <ErrorBoundary label="Heatmap">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyHeatmapWidget market={activeMarket} />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>

            <WidgetPanel title="FX & COMM" subtitle={t('w_forex_comm')}>
              <ErrorBoundary label="ForexCommodity">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyForexCommodityWidget headless />
                </Suspense>
              </ErrorBoundary>
            </WidgetPanel>

            <WidgetPanel title="CHART" subtitle={formatSymbolDisplay(activeSymbol)}>
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
            </WidgetPanel>
          </div>
        );

      case 'market_heat':
        return (
          <div className="flex-1 min-h-0">
            <ErrorBoundary label="HeatmapScene">
              <HeatmapScene market={activeMarket} />
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
            {/* KLine area */}
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
                onDrawingToolToggle={() => setDrawingToolOpen(v => !v)}
              />
              <ErrorBoundary label="KLine">
                <Suspense fallback={<LoadingPlaceholder />}>
                  <LazyKLineWidget
                    key={activeSymbol}
                    symbol={activeSymbol}
                    data={effectiveKlineData}
                    indicators={activeIndicators}
                    showWRB={false}
                    showVP={false}
                    drawingToolOpen={drawingToolOpen}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Resize handle */}
            <div className="ck-resize" onMouseDown={handleResizeStart} />

            {/* 3×2 Widget grid */}
            <div className="ck-grid">
              <WidgetPanel title="HEATMAP" subtitle={`${activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1)} ▾`}>
                <ErrorBoundary label="Heatmap">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazyHeatmapWidget
                      market={activeMarket}
                    />
                  </Suspense>
                </ErrorBoundary>
              </WidgetPanel>

              <WidgetPanel title="FUNDAMENTALS" subtitle={`${activeSymbol} ▾`}>
                <ErrorBoundary label="Fundamentals">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazyFundamentalsWidget symbol={activeSymbol} headless />
                  </Suspense>
                </ErrorBoundary>
              </WidgetPanel>

              <WidgetPanel title="QUOTES" subtitle={t('w_four_markets')}>
                <ErrorBoundary label="QuoteTable">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazyQuoteTableWidget
                      title=""
                      items={NOW_QUOTE_ITEMS}
                    />
                  </Suspense>
                </ErrorBoundary>
              </WidgetPanel>

              <WidgetPanel title="SENTIMENT" subtitle={t('w_market_mood')}>
                <ErrorBoundary label="Sentiment">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazySentimentWidget headless />
                  </Suspense>
                </ErrorBoundary>
              </WidgetPanel>

              <WidgetPanel title="GLOBAL INDEX" subtitle={t('w_world_indices')}>
                <ErrorBoundary label="GlobalIndex">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazyGlobalIndexWidget
                      headless
                    />
                  </Suspense>
                </ErrorBoundary>
              </WidgetPanel>

              <WidgetPanel title="FX & COMM" subtitle={t('w_forex_comm')}>
                <ErrorBoundary label="ForexCommodity">
                  <Suspense fallback={<LoadingPlaceholder />}>
                    <LazyForexCommodityWidget
                      headless
                    />
                  </Suspense>
                </ErrorBoundary>
              </WidgetPanel>
            </div>
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
        {/* Scene content — pb-14 compensates for fixed MobileTabBar */}
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pb-14">
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
          chatOpen={chatOpen}
          onSceneSelect={switchScene}
          onToggleChat={toggleChat}
          onCloseChat={() => setChatOpen(false)}
        />

        {/* Settings overlay */}
        <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onLangChange={handleLangChange} />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // Desktop layout: Sidebar + Main(HeaderBar + Scene) + Chat
  // ══════════════════════════════════════════════════════════
  return (
    <div className="w-screen h-screen bg-[#0f0f1a] overflow-hidden flex">
      {/* Sidebar */}
      <ErrorBoundary label="Sidebar">
        <Sidebar
          activeScene={activeScene}
          onSceneSelect={switchScene}
          onToggleChat={toggleChat}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </ErrorBoundary>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HeaderBar */}
        <HeaderBar onToggleChat={toggleChat} />

        {/* Scene content — independent flex container */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {renderScene()}
        </div>
      </div>

      {/* Chat panel — default open */}
      {chatOpen ? (
        <div className="cp-panel">
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

      {/* Settings overlay */}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} onLangChange={handleLangChange} />
    </div>
  );
}

export default App;
