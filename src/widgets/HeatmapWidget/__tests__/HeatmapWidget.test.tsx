import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeatmapWidget } from '../index';

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" style={props.style as React.CSSProperties} />
  ),
}));

// Mock the EChartsWidget module (which is lazy-loaded)
vi.mock('../../EChartsWidget', () => ({
  EChartsWidget: (props: Record<string, unknown>) => (
    <div data-testid="echarts-widget" style={props.style as React.CSSProperties} />
  ),
}));

// Mock api
vi.mock('../../../services/api', () => ({
  fetchWorkerScreener: vi.fn().mockResolvedValue([]),
}));

// Mock buildHeatmapOption
vi.mock('../../EChartsWidget/charts/HeatmapChart', () => ({
  buildHeatmapOption: vi.fn().mockReturnValue({
    backgroundColor: '#1a1a2e',
    series: [],
  }),
}));

describe('HeatmapWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<HeatmapWidget market="crypto" />);
    // Should render the widget container
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows loading indicator', () => {
    render(<HeatmapWidget market="crypto" />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
