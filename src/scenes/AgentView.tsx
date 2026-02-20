/**
 * AgentView — Agent 可视化区域（多 Widget 网格）
 *
 * 每次 Chat tool_result 追加一个 Widget 卡片到网格中。
 * K线 Widget 使用完整的 KLineHeader + KLineWidget（跟 CK 场景一样）。
 */

import { useState, useCallback, useRef, Suspense, lazy } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { WidgetPanel } from '../layout/WidgetPanel';
import { KLineHeader } from '../widgets/KLineWidget/KLineHeader';
import { t } from '../i18n';
import type { WidgetState } from '../types/widget-state';
import type { KLineData } from '../types/data';
import type { MarketType, TimeInterval } from '../types/market';

const LazyKLineWidget = lazy(() =>
  import('../widgets/KLineWidget').then((m) => ({ default: m.KLineWidget })),
);
const LazyHeatmapWidget = lazy(() =>
  import('../widgets/HeatmapWidget').then((m) => ({ default: m.HeatmapWidget })),
);
const LazyFundamentalsWidget = lazy(() =>
  import('../widgets/FundamentalsWidget').then((m) => ({ default: m.FundamentalsWidget })),
);

function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e] text-[#8888aa] text-sm">
      Loading…
    </div>
  );
}

/** 单个 Agent Widget 的数据包 */
export interface AgentWidgetItem {
  id: string;
  widgetState: WidgetState;
  klineData?: KLineData[];
}

interface AgentViewProps {
  widgets: AgentWidgetItem[];
  onClear?: () => void;
  onRemoveWidget?: (id: string) => void;
}

/** 获取资产显示名 */
function formatSymbolDisplay(symbol: string): string {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)} / USDT`;
  if (symbol.includes('.')) return symbol.split('.')[0];
  return symbol;
}

/** 完整 K线 Widget（KLineHeader + KLineWidget）— 自带独立状态 */
function FullKLineCard({ item, onClose }: { item: AgentWidgetItem; onClose?: () => void }) {
  const { widgetState, klineData } = item;
  const symbol = (widgetState.symbol as string) || 'BTCUSDT';
  const market = ((widgetState.market as string) || 'crypto') as MarketType;
  const period = ((widgetState.period as string) || '1D') as TimeInterval;

  // 每个卡片独立的状态
  const [chartType, setChartType] = useState('candle_solid');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA']);
  const [drawingToolOpen, setDrawingToolOpen] = useState(false);

  const handleIndicatorToggle = useCallback((ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind],
    );
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <KLineHeader
        symbol={symbol}
        symbolDisplay={formatSymbolDisplay(symbol)}
        market={market}
        period={period}
        onSymbolChange={() => {}}
        onPeriodChange={() => {}}
        chartType={chartType}
        onChartTypeChange={setChartType}
        activeIndicators={activeIndicators}
        onIndicatorToggle={handleIndicatorToggle}
        drawingToolOpen={drawingToolOpen}
        onDrawingToolToggle={() => setDrawingToolOpen((v) => !v)}
        onClose={onClose}
      />
      <div style={{ flex: 1, minHeight: 0 }}>
        <ErrorBoundary label="AgentKLine">
          <Suspense fallback={<LoadingPlaceholder />}>
            <LazyKLineWidget
              key={item.id}
              symbol={symbol}
              data={klineData}
              indicators={activeIndicators}
              showWRB={widgetState.showWRB as boolean | undefined}
              showVP={widgetState.type === 'volume_profile'}
              drawingToolOpen={drawingToolOpen}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

/** 渲染单个 Widget */
function AgentWidgetCard({ item, onClose }: { item: AgentWidgetItem; onClose?: () => void }) {
  const { widgetState } = item;
  const symbol = (widgetState.symbol as string) || 'BTCUSDT';
  const market = ((widgetState.market as string) || 'crypto') as MarketType;

  switch (widgetState.type) {
    case 'kline':
    case 'overlay':
    case 'volume_profile':
      return <FullKLineCard item={item} onClose={onClose} />;

    case 'heatmap':
      return (
        <WidgetPanel title="HEATMAP" subtitle={`${market.toUpperCase()}`} onClose={onClose}>
          <ErrorBoundary label="AgentHeatmap">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyHeatmapWidget market={market} />
            </Suspense>
          </ErrorBoundary>
        </WidgetPanel>
      );

    case 'fundamentals':
      return (
        <WidgetPanel title="FUNDAMENTALS" subtitle={symbol} onClose={onClose}>
          <ErrorBoundary label="AgentFundamentals">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyFundamentalsWidget symbol={symbol} />
            </Suspense>
          </ErrorBoundary>
        </WidgetPanel>
      );

    case 'sentiment':
      return (
        <WidgetPanel title="SENTIMENT" subtitle={symbol} onClose={onClose}>
          <div className="w-full h-full flex items-center justify-center bg-[#0d0d20] text-[#6a6aaa] text-sm">
            Sentiment view — coming in P2
          </div>
        </WidgetPanel>
      );

    default:
      return (
        <WidgetPanel title={widgetState.type.toUpperCase()} subtitle="" onClose={onClose}>
          <div className="w-full h-full flex items-center justify-center bg-[#0d0d20] text-[#4a4a7a] text-sm">
            Unsupported: {widgetState.type}
          </div>
        </WidgetPanel>
      );
  }
}

export function AgentView({ widgets, onClear, onRemoveWidget }: AgentViewProps) {
  // 空状态
  if (widgets.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d20] text-[#4a4a7a]">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#6a6aaa', marginBottom: 8 }}>
          Agent Visualization
        </div>
        <div style={{ fontSize: 13, maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
          {t('agent_view_hint') || 'Chat 中输入指令，可视化结果将在此处展示。\n例如："show BTC chart" "crypto heatmap"'}
        </div>
      </div>
    );
  }

  // 单个 Widget → 全屏
  if (widgets.length === 1) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <AgentWidgetCard item={widgets[0]} onClose={onRemoveWidget ? () => onRemoveWidget(widgets[0].id) : undefined} />
        </div>
        {onClear && <ClearButton onClick={onClear} />}
      </div>
    );
  }

  // 多个 Widget → 网格
  const cols = widgets.length <= 2 ? 1 : widgets.length <= 4 ? 2 : 3;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {onClear && <ClearButton onClick={onClear} />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridAutoRows: '1fr',
          gap: 4,
          width: '100%',
          height: '100%',
          padding: 4,
          overflow: 'auto',
        }}
      >
        {widgets.map((item) => (
          <div key={item.id} style={{ minHeight: 250, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AgentWidgetCard item={item} onClose={onRemoveWidget ? () => onRemoveWidget(item.id) : undefined} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState({ x: 8, y: 8 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y, moved: false };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setPos({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    const wasDrag = dragRef.current?.moved;
    dragRef.current = null;
    if (!wasDrag) onClick();
  }, [onClick]);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        zIndex: 100,
        background: 'rgba(30,30,58,0.85)',
        border: '1px solid #2a2a4a',
        borderRadius: 8,
        color: '#6a6aaa',
        fontSize: 11,
        padding: '5px 12px',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
      title="拖拽移动 · 点击清空"
    >
      🗑 清空
    </div>
  );
}
