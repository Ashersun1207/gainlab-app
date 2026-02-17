import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OverlayWidget } from '../index';

// Mock the EChartsWidget module (lazy-loaded)
vi.mock('../../EChartsWidget', () => ({
  EChartsWidget: (props: Record<string, unknown>) => (
    <div data-testid="echarts-widget" style={props.style as React.CSSProperties} />
  ),
}));

// Mock API
vi.mock('../../../services/api', () => ({
  fetchWorkerKline: vi.fn().mockResolvedValue([
    { timestamp: 1000, open: 100, high: 110, low: 90, close: 105, volume: 1000 },
    { timestamp: 2000, open: 105, high: 115, low: 95, close: 110, volume: 1500 },
  ]),
}));

describe('OverlayWidget', () => {
  it('renders with input bar and add button', () => {
    const { container } = render(
      <OverlayWidget symbol="BTCUSDT" market="crypto" />,
    );
    // Input for adding compare symbols
    expect(screen.getByPlaceholderText(/添加对比资产/)).toBeInTheDocument();
    // Add button
    expect(screen.getByText('添加')).toBeInTheDocument();
    // Container rendered
    expect(container.firstChild).toBeInTheDocument();
  });
});
