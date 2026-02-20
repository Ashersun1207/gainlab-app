/**
 * AgentView — Agent 可视化区域（多 Widget 网格）
 *
 * 每次 Chat tool_result 追加一个 Widget 卡片到网格中。
 * 支持 KLine / Heatmap / Fundamentals 等。
 */

import { Suspense, lazy } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { WidgetPanel } from '../layout/WidgetPanel';
import { t } from '../i18n';
import type { WidgetState } from '../types/widget-state';
import type { KLineData } from '../types/data';
import type { MarketType } from '../types/market';

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
}

/** 渲染单个 Widget */
function AgentWidgetCard({ item }: { item: AgentWidgetItem }) {
  const { widgetState, klineData } = item;
  const symbol = (widgetState.symbol as string) || 'BTCUSDT';
  const market = (widgetState.market as MarketType) || 'crypto';

  switch (widgetState.type) {
    case 'kline':
    case 'overlay':
    case 'volume_profile':
      return (
        <WidgetPanel
          title={symbol}
          subtitle={`${market.toUpperCase()} · ${widgetState.period || '1D'}`}
        >
          <ErrorBoundary label="AgentKLine">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyKLineWidget
                key={item.id}
                symbol={symbol}
                data={klineData}
                indicators={widgetState.type === 'overlay' ? ['MA'] : []}
                showWRB={false}
                showVP={widgetState.type === 'volume_profile'}
              />
            </Suspense>
          </ErrorBoundary>
        </WidgetPanel>
      );

    case 'heatmap':
      return (
        <WidgetPanel title="HEATMAP" subtitle={`${market.toUpperCase()}`}>
          <ErrorBoundary label="AgentHeatmap">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyHeatmapWidget market={market} />
            </Suspense>
          </ErrorBoundary>
        </WidgetPanel>
      );

    case 'fundamentals':
      return (
        <WidgetPanel title="FUNDAMENTALS" subtitle={symbol}>
          <ErrorBoundary label="AgentFundamentals">
            <Suspense fallback={<LoadingPlaceholder />}>
              <LazyFundamentalsWidget symbol={symbol} />
            </Suspense>
          </ErrorBoundary>
        </WidgetPanel>
      );

    case 'sentiment':
      return (
        <WidgetPanel title="SENTIMENT" subtitle={symbol}>
          <div className="w-full h-full flex items-center justify-center bg-[#0d0d20] text-[#6a6aaa] text-sm">
            Sentiment view — coming in P2
          </div>
        </WidgetPanel>
      );

    default:
      return (
        <WidgetPanel title={widgetState.type.toUpperCase()} subtitle="">
          <div className="w-full h-full flex items-center justify-center bg-[#0d0d20] text-[#4a4a7a] text-sm">
            Unsupported: {widgetState.type}
          </div>
        </WidgetPanel>
      );
  }
}

export function AgentView({ widgets, onClear }: AgentViewProps) {
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
        {onClear && <ClearButton onClick={onClear} />}
        <style>{`.agent-single > .wp { flex: 1; min-height: 0; }`}</style>
        <div className="agent-single" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <AgentWidgetCard item={widgets[0]} />
        </div>
      </div>
    );
  }

  // 多个 Widget → 网格（自适应：2 个上下分，3-4 个 2×2，5-6 个 3×2）
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
          <div key={item.id} style={{ minHeight: 200, display: 'flex', flexDirection: 'column' }}>
            <style>{`.agent-grid-item > .wp { flex: 1; min-height: 0; }`}</style>
            <div className="agent-grid-item" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <AgentWidgetCard item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        background: 'rgba(30,30,58,0.8)',
        border: '1px solid #2a2a4a',
        borderRadius: 6,
        color: '#6a6aaa',
        fontSize: 11,
        padding: '4px 10px',
        cursor: 'pointer',
      }}
      title="清空可视化"
    >
      清空
    </button>
  );
}
