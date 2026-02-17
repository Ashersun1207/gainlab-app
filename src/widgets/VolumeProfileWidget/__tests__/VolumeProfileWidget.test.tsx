import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VolumeProfileWidget } from '../index';
import { calculateVP } from '../calculateVP';
import type { KLineData } from '../../../types/data';

// Mock the EChartsWidget module (lazy-loaded)
vi.mock('../../EChartsWidget', () => ({
  EChartsWidget: (props: Record<string, unknown>) => (
    <div data-testid="echarts-widget" style={props.style as React.CSSProperties} />
  ),
}));

const mockKlineData: KLineData[] = [
  { timestamp: 1000, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
  { timestamp: 2000, open: 105, high: 115, low: 95, close: 98, volume: 1500 },
  { timestamp: 3000, open: 98, high: 108, low: 88, close: 102, volume: 1200 },
  { timestamp: 4000, open: 102, high: 112, low: 92, close: 107, volume: 800 },
  { timestamp: 5000, open: 107, high: 120, low: 100, close: 115, volume: 2000 },
];

describe('calculateVP', () => {
  it('returns empty result for empty data', () => {
    const result = calculateVP([], 10);
    expect(result.levels).toHaveLength(0);
    expect(result.poc).toBe(0);
  });

  it('computes POC, VAH, VAL correctly', () => {
    const result = calculateVP(mockKlineData, 10);
    expect(result.levels).toHaveLength(10);
    expect(result.poc).toBeGreaterThan(0);
    expect(result.vah).toBeGreaterThanOrEqual(result.poc);
    expect(result.val).toBeLessThanOrEqual(result.poc);
    // Total volume should match input
    const totalVol = result.levels.reduce((s, l) => s + l.volume, 0);
    const inputVol = mockKlineData.reduce((s, d) => s + (d.volume ?? 0), 0);
    expect(totalVol).toBe(inputVol);
  });

  it('has buyVolume + sellVolume summing to total volume per level', () => {
    const result = calculateVP(mockKlineData, 10);
    for (const level of result.levels) {
      expect(level.buyVolume + level.sellVolume).toBe(level.volume);
    }
  });
});

describe('VolumeProfileWidget', () => {
  it('shows empty message when no data', () => {
    render(<VolumeProfileWidget klineData={[]} />);
    expect(screen.getByText('请先选择资产以查看筹码分布')).toBeInTheDocument();
  });

  it('renders without crashing with kline data', () => {
    const { container } = render(
      <VolumeProfileWidget klineData={mockKlineData} bins={10} />,
    );
    // Suspense fallback or rendered widget
    expect(container.firstChild).toBeInTheDocument();
  });
});
