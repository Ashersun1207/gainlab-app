import { useEffect, useRef, useState } from 'react';
import { init, dispose } from './KLineChart/index';
import type { KLineData, Chart } from './klinechart';

// BTC 30 条日线 fallback 数据（Binance 被墙时使用）
const SAMPLE_DATA: KLineData[] = [
  { timestamp: 1707955200000, open: 48000, high: 48800, low: 47200, close: 48500, volume: 25000 },
  { timestamp: 1708041600000, open: 48500, high: 49200, low: 48100, close: 49000, volume: 28000 },
  { timestamp: 1708128000000, open: 49000, high: 51500, low: 48800, close: 51200, volume: 42000 },
  { timestamp: 1708214400000, open: 51200, high: 52000, low: 50500, close: 51800, volume: 35000 },
  { timestamp: 1708300800000, open: 51800, high: 52300, low: 51000, close: 52100, volume: 30000 },
  { timestamp: 1708387200000, open: 52100, high: 52800, low: 51500, close: 51700, volume: 27000 },
  { timestamp: 1708473600000, open: 51700, high: 52500, low: 51200, close: 52300, volume: 31000 },
  { timestamp: 1708560000000, open: 52300, high: 53000, low: 52000, close: 52800, volume: 33000 },
  { timestamp: 1708646400000, open: 52800, high: 54200, low: 52500, close: 54000, volume: 45000 },
  { timestamp: 1708732800000, open: 54000, high: 55500, low: 53800, close: 55200, volume: 50000 },
  { timestamp: 1708819200000, open: 55200, high: 57000, low: 55000, close: 56800, volume: 55000 },
  { timestamp: 1708905600000, open: 56800, high: 58000, low: 56200, close: 57500, volume: 48000 },
  { timestamp: 1708992000000, open: 57500, high: 58500, low: 56800, close: 58200, volume: 42000 },
  { timestamp: 1709078400000, open: 58200, high: 60000, low: 57800, close: 59500, volume: 52000 },
  { timestamp: 1709164800000, open: 59500, high: 61000, low: 59000, close: 60800, volume: 58000 },
  { timestamp: 1709251200000, open: 60800, high: 62000, low: 60000, close: 61500, volume: 62000 },
  { timestamp: 1709337600000, open: 61500, high: 63500, low: 61000, close: 63000, volume: 70000 },
  { timestamp: 1709424000000, open: 63000, high: 64000, low: 62000, close: 62500, volume: 55000 },
  { timestamp: 1709510400000, open: 62500, high: 63500, low: 61500, close: 63200, volume: 48000 },
  { timestamp: 1709596800000, open: 63200, high: 65000, low: 63000, close: 64800, volume: 60000 },
  { timestamp: 1709683200000, open: 64800, high: 66000, low: 64200, close: 65500, volume: 65000 },
  { timestamp: 1709769600000, open: 65500, high: 67000, low: 65000, close: 66800, volume: 72000 },
  { timestamp: 1709856000000, open: 66800, high: 68000, low: 66000, close: 67200, volume: 58000 },
  { timestamp: 1709942400000, open: 67200, high: 68500, low: 66500, close: 68000, volume: 63000 },
  { timestamp: 1710028800000, open: 68000, high: 69500, low: 67500, close: 69000, volume: 68000 },
  { timestamp: 1710115200000, open: 69000, high: 70000, low: 68000, close: 69500, volume: 55000 },
  { timestamp: 1710201600000, open: 69500, high: 71000, low: 69000, close: 70500, volume: 75000 },
  { timestamp: 1710288000000, open: 70500, high: 72000, low: 70000, close: 71800, volume: 80000 },
  { timestamp: 1710374400000, open: 71800, high: 73000, low: 71000, close: 72500, volume: 70000 },
  { timestamp: 1710460800000, open: 72500, high: 73500, low: 71500, close: 73000, volume: 65000 },
];

interface KLineWidgetProps {
  symbol?: string;
  data?: KLineData[];
  indicators?: string[];
}

async function fetchBinanceKline(symbol: string): Promise<KLineData[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s 超时
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=100`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const raw = (await res.json()) as unknown[][];
    return raw.map((item) => ({
      timestamp: item[0] as number,
      open: parseFloat(item[1] as string),
      high: parseFloat(item[2] as string),
      low: parseFloat(item[3] as string),
      close: parseFloat(item[4] as string),
      volume: parseFloat(item[5] as string),
    }));
  } catch {
    return null;
  }
}

export function KLineWidget({
  symbol = 'BTCUSDT',
  data: externalData,
  indicators = ['RSI'],
}: KLineWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // init chart
    const chart = init(containerRef.current, {
      styles: {
        grid: {
          show: true,
          horizontal: { show: true, color: '#1e1e3a' },
          vertical: { show: true, color: '#1e1e3a' },
        },
        candle: {
          bar: {
            upColor: '#26a69a',
            downColor: '#ef5350',
            upBorderColor: '#26a69a',
            downBorderColor: '#ef5350',
            upWickColor: '#26a69a',
            downWickColor: '#ef5350',
          },
          tooltip: {
            showRule: 'follow_cross' as const,
          },
        },
        indicator: {
          lastValueMark: { show: true },
        },
        crosshair: {
          show: true,
          horizontal: { show: true, line: { color: '#4a4a8a', dashedValue: [4, 2] } },
          vertical: { show: true, line: { color: '#4a4a8a', dashedValue: [4, 2] } },
        },
        separator: {
          color: '#2a2a4a',
        },
      },
    });

    if (!chart) return;
    chartRef.current = chart;

    // add indicator panes
    for (const ind of indicators) {
      chart.createIndicator(ind, false, { id: `pane_${ind}` });
    }

    // 立刻用外部数据或 fallback 显示，再异步尝试 Binance
    if (externalData && externalData.length > 0) {
      chart.setDataList(externalData);
    } else {
      // 先用 SAMPLE_DATA 立即显示
      chart.setDataList(SAMPLE_DATA);

      // 后台尝试真实数据
      fetchBinanceKline(symbol).then((fetched) => {
        if (fetched && chartRef.current) {
          chartRef.current.setDataList(fetched);
          setError(null);
        } else {
          setError('Binance API 不可用，使用样本数据');
        }
      });
    }

    // Capture ref value for cleanup (react-hooks/exhaustive-deps)
    const container = containerRef.current;
    return () => {
      if (container) dispose(container);
      chartRef.current = null;
    };
  }, [symbol, externalData, indicators]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#12122a' }}>
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '4px 8px',
            borderRadius: 4,
            background: '#3a2a00',
            color: '#ffc107',
            fontSize: 12,
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
