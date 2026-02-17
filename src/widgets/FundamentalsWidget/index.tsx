import { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import type { EChartsOption } from 'echarts';
import { fetchWorkerFundamentals } from '../../services/api';

const LazyECharts = lazy(() =>
  import('../EChartsWidget').then((m) => ({ default: m.EChartsWidget })),
);

interface FundamentalsWidgetProps {
  symbol: string;
}

/** 构建基本面柱状图 option */
function buildFundamentalsOption(
  symbol: string,
  metrics: Record<string, number>,
): EChartsOption {
  const keys = Object.keys(metrics).slice(0, 10);
  const values = keys.map((k) => metrics[k]);

  return {
    backgroundColor: '#0d0d20',
    title: {
      text: `${symbol} 基本面`,
      textStyle: { color: '#ccc', fontSize: 12 },
      left: 10,
      top: 8,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a1a2e',
      borderColor: '#2a2a4a',
      textStyle: { color: '#e0e0e0', fontSize: 11 },
    },
    grid: { left: 60, right: 20, top: 45, bottom: 40 },
    xAxis: {
      type: 'category',
      data: keys,
      axisLabel: { color: '#888', fontSize: 9, rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: '#1e1e3a' } },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v) => ({
          value: v,
          itemStyle: { color: v >= 0 ? '#22c55e' : '#ef4444' },
        })),
        barWidth: '60%',
      },
    ],
  };
}

/** 从 Worker 返回的原始数据中提取数值型 metrics */
function extractMetrics(
  raw: Record<string, unknown>,
): Record<string, number> {
  const result: Record<string, number> = {};
  const interestingKeys = [
    'pe',
    'pb',
    'ps',
    'roe',
    'roa',
    'grossMargin',
    'netMargin',
    'debtToEquity',
    'currentRatio',
    'dividendYield',
    'eps',
    'revenue',
    'netIncome',
    'marketCap',
  ];

  for (const key of interestingKeys) {
    if (key in raw && typeof raw[key] === 'number') {
      result[key] = raw[key] as number;
    }
  }

  // If no known keys found, take any numeric values
  if (Object.keys(result).length === 0) {
    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === 'number' && !key.startsWith('_')) {
        result[key] = val;
      }
    }
  }

  return result;
}

export function FundamentalsWidget({ symbol }: FundamentalsWidgetProps) {
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const loadData = useCallback(async () => {
    if (!symbol) return;
    cancelledRef.current = false;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWorkerFundamentals(symbol);
      if (!cancelledRef.current) setRawData(data);
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch fundamentals',
        );
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void loadData();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadData]);

  const metrics = useMemo(
    () => (rawData ? extractMetrics(rawData) : null),
    [rawData],
  );

  const option = useMemo(
    () =>
      metrics && Object.keys(metrics).length > 0
        ? buildFundamentalsOption(symbol, metrics)
        : null,
    [symbol, metrics],
  );

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#ef4444] text-sm">
        {error}
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#6666aa] text-sm">
        选择资产查看基本面数据
      </div>
    );
  }

  if (!option && !loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#6666aa] text-sm">
        暂无基本面数据
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d20]/80 z-10">
          <span className="text-[#8888aa] text-sm">加载中...</span>
        </div>
      )}
      {option && (
        <Suspense fallback={<div className="w-full h-full bg-[#0d0d20]" />}>
          <LazyECharts option={option} style={{ height: '100%' }} />
        </Suspense>
      )}
    </div>
  );
}
