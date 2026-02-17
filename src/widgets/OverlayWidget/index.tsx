import { useState, useCallback, Suspense, lazy, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import type { KLineData } from '../../types/data';
import type { MarketType } from '../../types/market';
import { useOverlayData } from './useOverlayData';

const LazyECharts = lazy(() =>
  import('../EChartsWidget').then((m) => ({ default: m.EChartsWidget })),
);

interface OverlayWidgetProps {
  symbol: string;
  market: MarketType;
}

const MAX_COMPARE = 5;

/** 颜色池 — 主资产 + 4 个对比 */
const COLORS = ['#60a5fa', '#fbbf24', '#a78bfa', '#34d399', '#f87171'];

/**
 * 将价格归一化为基于首日的百分比变化
 * 便于不同价格量级的资产叠加对比
 */
function normalize(data: KLineData[]): number[] {
  if (data.length === 0) return [];
  const base = data[0].close;
  if (base === 0) return data.map(() => 0);
  return data.map((d) => ((d.close - base) / base) * 100);
}

function buildOverlayOption(
  datasets: Array<{ symbol: string; data: KLineData[] }>,
): EChartsOption {
  if (datasets.length === 0) {
    return {
      backgroundColor: '#0d0d20',
      title: {
        text: 'Overlay — 加载数据中...',
        textStyle: { color: '#666', fontSize: 12 },
        left: 'center',
        top: 'center',
      },
    };
  }

  // Use the longest dataset's timestamps as x-axis
  const longest = datasets.reduce((a, b) =>
    a.data.length >= b.data.length ? a : b,
  );
  const xData = longest.data.map((d) =>
    new Date(d.timestamp).toLocaleDateString(),
  );

  const series = datasets.map((ds, i) => ({
    name: ds.symbol,
    type: 'line' as const,
    data: normalize(ds.data),
    smooth: true,
    symbol: 'none',
    lineStyle: { width: i === 0 ? 2 : 1.5 },
    itemStyle: { color: COLORS[i % COLORS.length] },
  }));

  return {
    backgroundColor: '#0d0d20',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0', fontSize: 11 },
    },
    legend: {
      data: datasets.map((ds) => ds.symbol),
      textStyle: { color: '#888', fontSize: 10 },
      top: 5,
      right: 10,
    },
    grid: { left: 50, right: 20, top: 35, bottom: 30 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: '#666', fontSize: 9 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '变化 %',
      nameTextStyle: { color: '#666', fontSize: 10 },
      axisLabel: {
        color: '#888',
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
      splitLine: { lineStyle: { color: '#1e1e3a' } },
    },
    series,
  };
}

export function OverlayWidget({ symbol, market }: OverlayWidgetProps) {
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const symbolsKey = useMemo(
    () => [symbol, ...compareSymbols].join(','),
    [symbol, compareSymbols],
  );

  const { datasets, loading } = useOverlayData(symbolsKey, market);

  const handleAdd = useCallback(() => {
    const s = inputValue.trim().toUpperCase();
    if (
      s &&
      compareSymbols.length < MAX_COMPARE - 1 &&
      !compareSymbols.includes(s) &&
      s !== symbol.toUpperCase()
    ) {
      setCompareSymbols((prev) => [...prev, s]);
      setInputValue('');
    }
  }, [inputValue, compareSymbols, symbol]);

  const handleRemove = useCallback((s: string) => {
    setCompareSymbols((prev) => prev.filter((x) => x !== s));
  }, []);

  const option = useMemo(() => buildOverlayOption(datasets), [datasets]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e1e3a] flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={`添加对比资产（最多 ${MAX_COMPARE - 1} 个）`}
          className="flex-1 bg-[#13132a] border border-[#2a2a4a] rounded px-2 py-1 text-xs text-[#d0d0f0]
                     placeholder-[#4a4a7a] focus:outline-none focus:border-[#4a4a8a]"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={compareSymbols.length >= MAX_COMPARE - 1}
          className="text-xs px-2 py-1 rounded bg-[#1e1e3a] text-[#8888aa] hover:text-white
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          添加
        </button>
        {compareSymbols.map((s) => (
          <span
            key={s}
            className="text-[10px] bg-[#1e1e3a] px-1.5 py-0.5 rounded text-[#aaaacc] flex items-center gap-1"
          >
            {s}
            <button
              type="button"
              onClick={() => handleRemove(s)}
              className="text-[#ef4444] hover:text-white"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d20]/80 z-10">
            <span className="text-[#8888aa] text-sm">加载中...</span>
          </div>
        )}
        <Suspense fallback={<div className="w-full h-full bg-[#0d0d20]" />}>
          <LazyECharts option={option} style={{ height: '100%' }} />
        </Suspense>
      </div>
    </div>
  );
}
