import { useState, useCallback, Suspense, lazy } from 'react';
import { useResponsive } from './hooks/useResponsive';
import { useMarketData } from './hooks/useMarketData';
import { Sidebar } from './layout/Sidebar';
import { Toolbar } from './layout/Toolbar';
import { Drawer } from './layout/Drawer';
import { ChatToggle } from './chat/ChatToggle';
import { MobileTabBar } from './layout/MobileTabBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HOT_ASSETS } from './constants/markets';
import { getRenderTarget, mcpToKLine, mcpToEChartsOption } from './services/dataAdapter';
import type { MarketType, TimeInterval, ToolType, Asset, Quote } from './types/market';
import type { KLineData } from './types/data';
import type { EChartsOption } from 'echarts';
import type { MobileTab } from './layout/MobileTabBar';

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
// VP/WRB 已改为 KLineChart overlay，不再需要独立 widget
const LazyOverlayWidget = lazy(() =>
  import('./widgets/OverlayWidget').then((m) => ({ default: m.OverlayWidget })),
);
const LazyFundamentalsWidget = lazy(() =>
  import('./widgets/FundamentalsWidget').then((m) => ({
    default: m.FundamentalsWidget,
  })),
);
// WRBWidget removed — now rendered as KLineChart overlay

// --- Loading placeholder (dark themed) ---
function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-[#8888aa] text-sm">
      Loading…
    </div>
  );
}

/** 获取资产显示名（如 "BTC / USDT"） */
function formatSymbolDisplay(symbol: string): string {
  // 加密货币：BTCUSDT → BTC / USDT
  if (symbol.endsWith('USDT')) {
    return `${symbol.slice(0, -4)} / USDT`;
  }
  // A股：601318.SHG → 601318
  if (symbol.includes('.')) {
    return symbol.split('.')[0];
  }
  return symbol;
}

function App() {
  const { isMobile } = useResponsive();

  // ── 资产上下文 ──
  const [activeMarket, setActiveMarket] = useState<MarketType>('crypto');
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
  const [activeInterval, setActiveInterval] = useState<TimeInterval>('1D');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);

  // ── 抽屉 ──
  const [drawerTool, setDrawerTool] = useState<ToolType | null>(null);

  // ── Chat ──
  const [chatOpen, setChatOpen] = useState(false);

  // ── 移动端 tab + overlay ──
  const [mobileTab, setMobileTab] = useState<MobileTab>('market');
  const [mobileOverlay, setMobileOverlay] = useState<MobileTab | null>(null);

  // ── 报价缓存（给 Sidebar 显示用）──
  const [quotes] = useState<Map<string, Quote>>(new Map());

  // ── 数据 ──
  const { klineData, quote } = useMarketData(activeSymbol, activeMarket, activeInterval);

  // ── P0 兼容：Chat onToolResult → 更新 ECharts / KLine ──
  const [echartsOption, setEchartsOption] = useState<EChartsOption | null>(null);
  const [chatKlineData, setChatKlineData] = useState<KLineData[] | null>(null);

  // ── 资产选择 ──
  const handleAssetSelect = useCallback((asset: Asset) => {
    setActiveSymbol(asset.symbol);
    setActiveMarket(asset.market);
    // 关闭移动端 overlay
    setMobileOverlay(null);
  }, []);

  // ── 市场切换 ──
  const handleMarketChange = useCallback((market: MarketType) => {
    setActiveMarket(market);
    const firstAsset = HOT_ASSETS[market][0];
    if (firstAsset) setActiveSymbol(firstAsset.symbol);
  }, []);

  // ── 工具 toggle ──
  const handleToolClick = useCallback((tool: ToolType) => {
    setDrawerTool((prev) => (prev === tool ? null : tool));
    // 移动端点击工具时关闭 overlay
    setMobileOverlay(null);
  }, []);

  // ── 指标 toggle ──
  const handleIndicatorToggle = useCallback((ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    );
  }, []);

  // ── Chat onToolResult 回调（P0 兼容 — MCP 工具结果更新主图）──
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

  // ── 移动端 tab 切换 ──
  const handleMobileTabChange = useCallback(
    (tab: MobileTab) => {
      setMobileTab(tab);
      if (tab === 'market' || tab === 'tools' || tab === 'chat') {
        setMobileOverlay(tab);
      }
    },
    [],
  );

  // ── 关闭移动端 overlay ──
  const closeMobileOverlay = useCallback(() => {
    setMobileOverlay(null);
  }, []);

  // ── 抽屉内容渲染 ──
  const renderDrawerContent = useCallback(() => {
    // VP/WRB 已改为 KLineChart overlay，不再需要独立 drawer

    switch (drawerTool) {
      // volume_profile & wrb: 已改为 KLineChart overlay，不再作为独立 widget
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
  }, [drawerTool, klineData, chatKlineData, activeMarket, activeSymbol]);

  // 决定 KLineWidget 用什么数据：Chat 推送的优先，否则用 useMarketData 的
  const effectiveKlineData = chatKlineData ?? (klineData.length > 0 ? klineData : undefined);

  // ══════════════════════════════════════════════════════════
  // 移动端布局
  // ══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="w-screen h-[100dvh] bg-[#0f0f1a] overflow-hidden flex flex-col">
        {/* 顶栏 Toolbar */}
        <Toolbar
          symbolDisplay={formatSymbolDisplay(activeSymbol)}
          price={quote?.price}
          changePercent={quote?.changePercent}
          interval={activeInterval}
          activeIndicators={activeIndicators}
          onIntervalChange={setActiveInterval}
          onIndicatorToggle={handleIndicatorToggle}
        />

        {/* K线主图 — 高度自适应（减 toolbar 48px + tabbar 56px） */}
        <div
          className="flex-1 min-h-0"
          style={{ height: drawerTool ? '60%' : undefined }}
        >
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

        {/* 抽屉（工具面板） */}
        {drawerTool && (
          <div className="h-[40dvh] flex-shrink-0 overflow-hidden">
            <Drawer open={true} activeTool={drawerTool} onClose={() => setDrawerTool(null)}>
              <ErrorBoundary label="Drawer Widget">
                {renderDrawerContent()}
              </ErrorBoundary>
            </Drawer>
          </div>
        )}

        {/* ECharts 小窗（Chat 推送了 ECharts 数据时显示） */}
        {echartsOption && !drawerTool && (
          <div className="h-[30dvh] flex-shrink-0 border-t border-[#1e1e3a]">
            <ErrorBoundary label="ECharts">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyEChartsWidget option={echartsOption} style={{ height: '100%' }} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {/* 底部 Tab Bar */}
        <div className="h-14 flex-shrink-0">
          <MobileTabBar activeTab={mobileTab} onTabChange={handleMobileTabChange} />
        </div>

        {/* ── 移动端全屏 Overlay ── */}

        {/* 市场 overlay */}
        {mobileOverlay === 'market' && (
          <div className="mobile-overlay">
            <div className="mobile-overlay-header">
              <span className="text-white font-semibold">选择资产</span>
              <button
                onClick={closeMobileOverlay}
                className="text-[#6666aa] hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar
                activeMarket={activeMarket}
                activeSymbol={activeSymbol}
                activeTool={drawerTool}
                quotes={quotes}
                onMarketChange={handleMarketChange}
                onAssetSelect={handleAssetSelect}
                onToolClick={handleToolClick}
              />
            </div>
          </div>
        )}

        {/* 工具 overlay */}
        {mobileOverlay === 'tools' && (
          <div className="mobile-overlay">
            <div className="mobile-overlay-header">
              <span className="text-white font-semibold">分析工具</span>
              <button
                onClick={closeMobileOverlay}
                className="text-[#6666aa] hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar
                activeMarket={activeMarket}
                activeSymbol={activeSymbol}
                activeTool={drawerTool}
                quotes={quotes}
                onMarketChange={handleMarketChange}
                onAssetSelect={handleAssetSelect}
                onToolClick={handleToolClick}
              />
            </div>
          </div>
        )}

        {/* 聊天 overlay */}
        {mobileOverlay === 'chat' && (
          <div className="mobile-overlay">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyChatPanel
                onToolResult={handleToolResult}
                onClose={closeMobileOverlay}
              />
            </Suspense>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // 桌面端布局：Sidebar + 主区(Toolbar + KLine + Drawer) + Chat
  // ══════════════════════════════════════════════════════════
  return (
    <div className="w-screen h-screen bg-[#0f0f1a] overflow-hidden flex">
      {/* 左侧 Sidebar */}
      <ErrorBoundary label="Sidebar">
        <Sidebar
          activeMarket={activeMarket}
          activeSymbol={activeSymbol}
          activeTool={drawerTool}
          quotes={quotes}
          onMarketChange={handleMarketChange}
          onAssetSelect={handleAssetSelect}
          onToolClick={handleToolClick}
        />
      </ErrorBoundary>

      {/* 中间主区 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          symbolDisplay={formatSymbolDisplay(activeSymbol)}
          price={quote?.price}
          changePercent={quote?.changePercent}
          interval={activeInterval}
          activeIndicators={activeIndicators}
          onIntervalChange={setActiveInterval}
          onIndicatorToggle={handleIndicatorToggle}
        />

        {/* K线主图 */}
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

        {/* 抽屉 */}
        <Drawer open={!!drawerTool} activeTool={drawerTool} onClose={() => setDrawerTool(null)}>
          <ErrorBoundary label="Drawer Widget">
            {renderDrawerContent()}
          </ErrorBoundary>
        </Drawer>

        {/* ECharts 区域（Chat 推送时或无抽屉时显示） */}
        {echartsOption && !drawerTool && (
          <div className="h-[40%] border-t border-[#1e1e3a]">
            <ErrorBoundary label="ECharts">
              <Suspense fallback={<LoadingPlaceholder />}>
                <LazyEChartsWidget option={echartsOption} style={{ height: '100%' }} />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* 右侧 Chat（可收起） */}
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
