import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WRBWidget } from '../index';
import { detectWRB } from '../detectWRB';
import type { KLineData } from '../../../types/data';

const mockKlineData: KLineData[] = [
  { timestamp: 1000, open: 100, high: 105, low: 98, close: 102, volume: 100 },
  { timestamp: 2000, open: 102, high: 104, low: 100, close: 103, volume: 120 },
  { timestamp: 3000, open: 103, high: 106, low: 101, close: 104, volume: 110 },
  { timestamp: 4000, open: 104, high: 105, low: 102, close: 103, volume: 90 },
  // This bar has a huge body — should trigger WRB
  { timestamp: 5000, open: 100, high: 125, low: 99, close: 120, volume: 500 },
  { timestamp: 6000, open: 120, high: 122, low: 118, close: 121, volume: 200 },
  { timestamp: 7000, open: 121, high: 123, low: 119, close: 120, volume: 180 },
  { timestamp: 8000, open: 120, high: 121, low: 118, close: 119, volume: 150 },
  // Another big WRB
  { timestamp: 9000, open: 119, high: 120, low: 100, close: 102, volume: 600 },
];

describe('detectWRB', () => {
  it('returns empty for insufficient data', () => {
    const short: KLineData[] = [
      { timestamp: 1000, open: 100, high: 110, low: 90, close: 105, volume: 100 },
    ];
    expect(detectWRB(short)).toHaveLength(0);
  });

  it('detects WRB signals correctly', () => {
    const signals = detectWRB(mockKlineData);
    expect(signals.length).toBeGreaterThan(0);

    // The bar at index 4 (timestamp 5000) has body 20, previous 3 bodies average ~2
    const wrbAt5000 = signals.find((s) => s.timestamp === 5000);
    expect(wrbAt5000).toBeDefined();
    expect(wrbAt5000?.direction).toBe('bullish');
    expect(wrbAt5000?.type).toBe('wrb');
    expect(wrbAt5000?.score).toBeGreaterThan(1.5);
  });

  it('detects bearish WRB signals', () => {
    const signals = detectWRB(mockKlineData);
    const bearish = signals.find((s) => s.timestamp === 9000);
    expect(bearish).toBeDefined();
    expect(bearish?.direction).toBe('bearish');
  });

  it('caps score at 5', () => {
    const signals = detectWRB(mockKlineData);
    for (const s of signals) {
      expect(s.score).toBeLessThanOrEqual(5);
    }
  });
});

describe('WRBWidget', () => {
  it('shows empty message when no data', () => {
    render(<WRBWidget klineData={[]} />);
    expect(screen.getByText('请先选择资产以检测 WRB 信号')).toBeInTheDocument();
  });

  it('renders signal list with data', () => {
    render(<WRBWidget klineData={mockKlineData} />);
    expect(screen.getByText('WRB 信号检测')).toBeInTheDocument();
    // Use getAllByText since both header and signal list contain these
    expect(screen.getAllByText(/▲ 多/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/▼ 空/).length).toBeGreaterThan(0);
  });

  it('shows signal count', () => {
    render(<WRBWidget klineData={mockKlineData} />);
    const signals = detectWRB(mockKlineData);
    expect(screen.getByText(`共 ${signals.length}`)).toBeInTheDocument();
  });
});
