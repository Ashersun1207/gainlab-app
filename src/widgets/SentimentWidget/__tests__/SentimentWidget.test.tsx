import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SentimentWidget } from '../index';

vi.mock('echarts-for-react', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="echarts-mock" style={props.style as React.CSSProperties} />
  ),
}));

vi.mock('../../EChartsWidget', () => ({
  EChartsWidget: (props: Record<string, unknown>) => (
    <div data-testid="echarts-widget" style={props.style as React.CSSProperties} />
  ),
}));

describe('SentimentWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(<SentimentWidget />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows header', () => {
    render(<SentimentWidget />);
    expect(screen.getByText('市场情绪')).toBeInTheDocument();
  });
});
