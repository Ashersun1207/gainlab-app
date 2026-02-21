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
import { getWidget } from '../catalog';
import type { WidgetState } from '../types/widget-state';
import type { KLineData } from '../types/data';
import type { MarketType, TimeInterval } from '../types/market';

// (#12) Widget 注册已移到 catalog/widget-registration.ts，在 main.tsx 统一 import

// LazyKLineWidget 仅 FullKLineCard 内部使用
const LazyKLineWidget = lazy(() =>
  import('../widgets/KLineWidget').then((m) => ({ default: m.KLineWidget })),
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
  // Indicator 系统已废弃，技术指标通过 Script 引擎实现
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
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
      <div style={{ flex: 1, minHeight: '400px' }}>
        <ErrorBoundary label="AgentKLine">
          <Suspense fallback={<LoadingPlaceholder />}>
            <LazyKLineWidget
              key={item.id}
              symbol={symbol}
              market={market}
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

/** 渲染单个 Widget — 从 registry 查找，不再 switch-case */
function AgentWidgetCard({ item, onClose }: { item: AgentWidgetItem; onClose?: () => void }) {
  const { widgetState } = item;
  const reg = getWidget(widgetState.type);

  // 未注册的 type → fallback
  if (!reg) {
    return (
      <WidgetPanel title={widgetState.type.toUpperCase()} subtitle="" onClose={onClose}>
        <div className="w-full h-full flex items-center justify-center bg-[#0d0d20] text-[#4a4a7a] text-sm">
          Unsupported: {widgetState.type}
        </div>
      </WidgetPanel>
    );
  }

  // kline 类型 → FullKLineCard（复杂有状态组件，保持原逻辑）
  if (reg.wrapper === 'kline') {
    return <FullKLineCard item={item} onClose={onClose} />;
  }

  // panel 类型 → WidgetPanel 包裹 + propsMapper 提取 props
  const subtitle =
    (widgetState.symbol as string) ||
    (widgetState.market as string)?.toUpperCase() ||
    '';
  const props = reg.propsMapper(widgetState);

  return (
    <WidgetPanel
      title={reg.title ?? widgetState.type.toUpperCase()}
      subtitle={subtitle}
      onClose={onClose}
    >
      <ErrorBoundary label={`Agent${widgetState.type}`}>
        <Suspense fallback={<LoadingPlaceholder />}>
          <reg.component {...props} />
        </Suspense>
      </ErrorBoundary>
    </WidgetPanel>
  );
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
        {onClear && <FloatingClearButton onClick={onClear} />}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <AgentWidgetCard item={widgets[0]} onClose={onRemoveWidget ? () => onRemoveWidget(widgets[0].id) : undefined} />
        </div>
      </div>
    );
  }

  // 多个 Widget → 网格
  const cols = widgets.length <= 2 ? 1 : widgets.length <= 4 ? 2 : 3;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {onClear && <FloatingClearButton onClick={onClear} />}
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
          <div key={item.id} style={{ minHeight: 350, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AgentWidgetCard item={item} onClose={onRemoveWidget ? () => onRemoveWidget(item.id) : undefined} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 悬浮可拖拽"清空面板"按钮 */
function FloatingClearButton({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState({ x: -70, y: 8 }); // 默认右上角（用 right 定位）
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number; moved: boolean } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y, moved: false };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setPos({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
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
        right: -pos.x,
        top: pos.y,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(25,25,50,0.9)',
        border: '1px solid #2a2a4a',
        borderRadius: 16,
        color: '#8888aa',
        fontSize: 11,
        padding: '4px 12px',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        whiteSpace: 'nowrap',
      }}
      title="拖拽移动 · 点击清空面板"
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a4a'; e.currentTarget.style.color = '#8888aa'; }}
    >
      🗑 清空面板
    </div>
  );
}
