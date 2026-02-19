import { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { buildHeatmapOption } from '../EChartsWidget/charts/HeatmapChart';
import { sampleHeatmapData } from '../EChartsWidget/charts/sampleHeatmapData';
import { fetchWorkerScreener } from '../../services/api';
import type { MarketType } from '../../types/market';
import type { HeatmapItem } from '../../types/data';

const LazyECharts = lazy(() =>
  import('../EChartsWidget').then((m) => ({ default: m.EChartsWidget })),
);

interface HeatmapWidgetProps {
  market: MarketType;
  onCellClick?: (symbol: string) => void;
}

export function HeatmapWidget({ market, onCellClick }: HeatmapWidgetProps) {
  const [data, setData] = useState<HeatmapItem[]>(sampleHeatmapData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const loadData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchWorkerScreener(market);
      if (!cancelledRef.current && result.length > 0) {
        setData(result);
      }
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        const msg =
          err instanceof Error ? err.message : 'Failed to fetch screener';
        setError(msg);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [market]);

  useEffect(() => {
    void loadData();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadData]);

  const option = buildHeatmapOption(data);

  // ECharts click handler for treemap cells
  const echartsEvents = useMemo(() => {
    if (!onCellClick) return undefined;
    return {
      click: (params: Record<string, unknown>) => {
        const name = params.name as string | undefined;
        if (name) {
          // treemap cell name is the symbol (e.g. "BTC", "ETH")
          onCellClick(name);
        }
      },
    };
  }, [onCellClick]);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d20]/80 z-10">
          <span className="text-[#8888aa] text-sm">加载中...</span>
        </div>
      )}
      {error && (
        <div className="absolute top-1 right-2 z-10 text-[10px] text-[#ef4444] bg-[#1a1a2e] px-2 py-0.5 rounded">
          {error}（使用默认数据）
        </div>
      )}
      <Suspense
        fallback={<div className="w-full h-full bg-[#0d0d20]" />}
      >
        <LazyECharts option={option} style={{ height: '100%' }} onEvents={echartsEvents} />
      </Suspense>
    </div>
  );
}
