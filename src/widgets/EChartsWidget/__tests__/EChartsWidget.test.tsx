import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { EChartsWidget } from '../index';

// Mock echarts-for-react to avoid full ECharts initialization in jsdom
vi.mock('echarts-for-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" style={props.style as React.CSSProperties} />
  ),
}));

describe('EChartsWidget', () => {
  it('renders without crashing', () => {
    const option = {
      backgroundColor: '#0d0d20',
      series: [],
    };

    const { getByTestId } = render(<EChartsWidget option={option} />);
    expect(getByTestId('echarts-mock')).toBeInTheDocument();
  });
});
