import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import type { EChartsOption } from 'echarts';

const LazyECharts = lazy(() =>
  import('../EChartsWidget').then((m) => ({ default: m.EChartsWidget })),
);

// Sample data (will be replaced by Worker API later)
const SAMPLE_SENTIMENT = {
  vix: { value: 18.5, change: -1.2 },
  fearGreed: { value: 62, label: 'Greed', change: 5 },
};

function getVixColor(value: number): string {
  if (value < 20) return '#22c55e';
  if (value < 30) return '#eab308';
  return '#ef4444';
}

function getVixLevel(value: number): string {
  if (value < 20) return '低波动';
  if (value < 30) return '正常';
  if (value < 40) return '高波动';
  return '极端恐慌';
}

function getFearGreedColor(value: number): string {
  if (value < 25) return '#ef4444';
  if (value < 45) return '#f97316';
  if (value < 55) return '#eab308';
  if (value < 75) return '#22c55e';
  return '#16a34a';
}

function getFearGreedLabel(value: number): string {
  if (value < 25) return '极度恐惧';
  if (value < 45) return '恐惧';
  if (value < 55) return '中性';
  if (value < 75) return '贪婪';
  return '极度贪婪';
}

function buildGaugeOption(title: string, value: number, getColor: (v: number) => string, max: number): EChartsOption {
  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '90%',
        min: 0,
        max,
        startAngle: 200,
        endAngle: -20,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 8,
            color: [
              [0.25, '#ef4444'],
              [0.5, '#f97316'],
              [0.75, '#22c55e'],
              [1, '#16a34a'],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: {
          length: '60%',
          width: 4,
          itemStyle: { color: '#e0e0f0' },
        },
        anchor: {
          show: true,
          size: 8,
          itemStyle: { color: '#e0e0f0', borderWidth: 0 },
        },
        title: {
          offsetCenter: [0, '75%'],
          fontSize: 11,
          color: '#a0a0cc',
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '40%'],
          fontSize: 22,
          fontWeight: 'bold',
          color: getColor(value),
          formatter: '{value}',
        },
        data: [{ value, name: title }],
      },
    ],
  };
}

export function SentimentWidget() {
  const [data, setData] = useState(SAMPLE_SENTIMENT);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const loadData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    try {
      // TODO: Replace with Worker API call when endpoint is ready
      // For now use sample data
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!cancelledRef.current) {
        setData(SAMPLE_SENTIMENT);
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    return () => { cancelledRef.current = true; };
  }, [loadData]);

  const vixOption = buildGaugeOption(
    `VIX — ${getVixLevel(data.vix.value)}`,
    data.vix.value,
    getVixColor,
    80,
  );

  const fgOption = buildGaugeOption(
    `F&G — ${getFearGreedLabel(data.fearGreed.value)}`,
    data.fearGreed.value,
    getFearGreedColor,
    100,
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d20] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e3a] flex-shrink-0">
        <span className="text-[13px] font-semibold text-[#a0a0cc]">市场情绪</span>
        {loading && <span className="text-[10px] text-[#5a5a8a]">更新中...</span>}
      </div>
      {/* Gauges */}
      <div className="flex-1 flex gap-1 p-1 min-h-0">
        <div className="flex-1 min-w-0">
          <Suspense fallback={<div className="w-full h-full bg-[#0d0d20]" />}>
            <LazyECharts option={vixOption} style={{ height: '100%' }} />
          </Suspense>
        </div>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<div className="w-full h-full bg-[#0d0d20]" />}>
            <LazyECharts option={fgOption} style={{ height: '100%' }} />
          </Suspense>
        </div>
      </div>
      {/* Footer stats */}
      <div className="flex justify-around px-3 py-1.5 border-t border-[#1e1e3a] flex-shrink-0">
        <div className="text-center">
          <div className="text-[10px] text-[#5a5a8a]">VIX</div>
          <div className={`text-[12px] font-mono ${data.vix.change >= 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
            {data.vix.value.toFixed(1)} ({data.vix.change >= 0 ? '+' : ''}{data.vix.change.toFixed(1)})
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#5a5a8a]">Fear & Greed</div>
          <div className={`text-[12px] font-mono`} style={{ color: getFearGreedColor(data.fearGreed.value) }}>
            {data.fearGreed.value} — {getFearGreedLabel(data.fearGreed.value)}
          </div>
        </div>
      </div>
    </div>
  );
}
