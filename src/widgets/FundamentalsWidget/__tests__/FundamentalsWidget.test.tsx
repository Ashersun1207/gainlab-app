import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FundamentalsWidget } from '../index';

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" style={props.style as React.CSSProperties} />
  ),
}));

// Mock API — return fundamentals data
vi.mock('../../../services/api', () => ({
  fetchWorkerFundamentals: vi.fn().mockResolvedValue({
    pe: 25.3,
    pb: 4.2,
    roe: 18.5,
    grossMargin: 42.1,
  }),
}));

describe('FundamentalsWidget', () => {
  it('renders loading state initially', () => {
    render(<FundamentalsWidget symbol="AAPL" />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows empty message when no symbol', () => {
    render(<FundamentalsWidget symbol="" />);
    expect(screen.getByText('选择资产查看基本面数据')).toBeInTheDocument();
  });
});
