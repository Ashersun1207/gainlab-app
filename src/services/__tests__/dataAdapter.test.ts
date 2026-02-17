import { describe, it, expect } from 'vitest';
import {
  binanceToKLine,
  mcpToKLine,
  getRenderTarget,
  mcpToEChartsOption,
} from '../dataAdapter';

describe('getRenderTarget', () => {
  it('returns "kline" for kline tools', () => {
    expect(getRenderTarget('gainlab_kline')).toBe('kline');
    expect(getRenderTarget('gainlab_indicators')).toBe('kline');
    expect(getRenderTarget('gainlab_volume_profile')).toBe('kline');
    expect(getRenderTarget('gainlab_wrb_scoring')).toBe('kline');
  });

  it('returns "echarts" for non-kline tools', () => {
    expect(getRenderTarget('gainlab_heatmap')).toBe('echarts');
    expect(getRenderTarget('gainlab_market_cap')).toBe('echarts');
    expect(getRenderTarget('unknown_tool')).toBe('echarts');
  });
});

describe('binanceToKLine', () => {
  it('converts Binance raw arrays to KLineData[]', () => {
    const raw = [
      [1700000000000, '42000.50', '42500.00', '41800.00', '42300.25', '150.5'],
      [1700003600000, '42300.25', '42800.00', '42100.00', '42700.00', '200.3'],
    ];

    const result = binanceToKLine(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      timestamp: 1700000000000,
      open: 42000.5,
      high: 42500,
      low: 41800,
      close: 42300.25,
      volume: 150.5,
    });
    expect(result[1]).toMatchObject({
      timestamp: 1700003600000,
      open: 42300.25,
      close: 42700,
    });
  });
});

describe('mcpToKLine', () => {
  it('returns empty array for null/undefined input', () => {
    expect(mcpToKLine(null)).toEqual([]);
    expect(mcpToKLine(undefined)).toEqual([]);
    expect(mcpToKLine('string')).toEqual([]);
  });

  it('extracts from { data: KLineData[] } format', () => {
    const input = {
      data: [
        { timestamp: 1700000000000, open: 100, high: 110, low: 90, close: 105, volume: 50 },
      ],
    };
    const result = mcpToKLine(input);
    expect(result).toHaveLength(1);
    expect(result[0].open).toBe(100);
  });

  it('extracts from { klines: unknown[][] } Binance raw format', () => {
    const input = {
      klines: [[1700000000000, '100', '110', '90', '105', '50']],
    };
    const result = mcpToKLine(input);
    expect(result).toHaveLength(1);
    expect(result[0].open).toBe(100);
    expect(result[0].high).toBe(110);
  });

  it('handles top-level array of KLineData', () => {
    const input = [
      { timestamp: 1700000000000, open: 100, high: 110, low: 90, close: 105 },
    ];
    const result = mcpToKLine(input);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(1700000000000);
  });

  it('handles top-level array of Binance raw arrays', () => {
    const input = [[1700000000000, '100', '110', '90', '105', '50']];
    const result = mcpToKLine(input);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(105);
  });
});

describe('mcpToEChartsOption', () => {
  it('returns fallback option for null result', () => {
    const opt = mcpToEChartsOption('test_tool', null);
    expect(opt.backgroundColor).toBe('#0d0d20');
  });

  it('passes through result with series field', () => {
    const input = {
      series: [{ type: 'line', data: [1, 2, 3] }],
      xAxis: { type: 'category' },
    };
    const opt = mcpToEChartsOption('gainlab_custom', input);
    expect(opt.backgroundColor).toBe('#0d0d20');
    expect(opt.series).toEqual(input.series);
  });

  it('builds heatmap option for heatmap tools', () => {
    const input = {
      items: [
        { name: 'BTC', value: 1e12, change: 5.2 },
        { name: 'ETH', value: 3e11, change: -2.1 },
      ],
    };
    const opt = mcpToEChartsOption('gainlab_heatmap', input);
    expect(opt.series).toBeDefined();
    const series = opt.series as unknown[];
    expect(series).toHaveLength(1);
    const s = series[0] as Record<string, unknown>;
    expect(s.type).toBe('treemap');
  });
});
