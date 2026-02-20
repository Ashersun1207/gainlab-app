/**
 * AgentView — Agent 可视化区域
 *
 * 根据 widgetState 渲染对应的 Widget（K线/热力图/基本面等）。
 * 作为 AI 场景主区域的右半部分。
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

interface AgentViewProps {
  widgetState: WidgetState | null;
  klineData?: KLineData[];
}

export function AgentView({ widgetState, klineData }: AgentViewProps) {
  // 空状态：引导
  if (!widgetState) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d20] text-[#4a4a7a]">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#6a6aaa', marginBottom: 8 }}>
          Agent Visualization
        </div>
        <div style={{ fontSize: 13, maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
          {t('agent_view_hint') || 'Chat 中输入指令，结果将在此处可视化展示。\n例如："show BTC chart" "crypto heatmap"'}
        </div>
      </div>
    );
  }

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
                key={`${symbol}-${widgetState.period || '1D'}-${widgetState.type}`}
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
              <LazyFundamentalsWidget
                symbol={symbol}
              />
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
        <div className="w-full h-full flex items-center justify-center bg-[#0d0d20] text-[#4a4a7a] text-sm">
          Unsupported widget type: {widgetState.type}
        </div>
      );
  }
}
