import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndicatorSelector } from '../IndicatorSelector';

describe('IndicatorSelector', () => {
  it('renders the trigger button with indicator label', () => {
    render(<IndicatorSelector active={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId('indicator-selector-trigger')).toBeInTheDocument();
    expect(screen.getByText(/指标/)).toBeInTheDocument();
  });

  it('shows count badge with active indicator count', () => {
    render(<IndicatorSelector active={['MA', 'RSI']} onChange={vi.fn()} />);
    const badge = screen.getByTestId('indicator-count-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('2');
  });

  it('does not show count badge when no active indicators', () => {
    render(<IndicatorSelector active={[]} onChange={vi.fn()} />);
    expect(screen.queryByTestId('indicator-count-badge')).not.toBeInTheDocument();
  });

  it('opens panel and shows both indicator groups when trigger is clicked', () => {
    render(<IndicatorSelector active={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('indicator-selector-trigger'));
    expect(screen.getByTestId('indicator-selector-panel')).toBeInTheDocument();
    // Both group titles should appear
    expect(screen.getByText('主图叠加')).toBeInTheDocument();
    expect(screen.getByText('副图指标')).toBeInTheDocument();
    // Some indicators from each group
    expect(screen.getByText('MA')).toBeInTheDocument();
    expect(screen.getByText('RSI')).toBeInTheDocument();
    expect(screen.getByText('MACD')).toBeInTheDocument();
  });

  it('calls onChange with indicator id when an indicator is clicked', () => {
    const onChange = vi.fn();
    render(<IndicatorSelector active={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('indicator-selector-trigger'));
    fireEvent.click(screen.getByTestId('indicator-item-MA'));
    expect(onChange).toHaveBeenCalledWith('MA');
  });

  it('closes panel when backdrop is clicked', () => {
    render(<IndicatorSelector active={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('indicator-selector-trigger'));
    expect(screen.getByTestId('indicator-selector-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('indicator-selector-backdrop'));
    expect(screen.queryByTestId('indicator-selector-panel')).not.toBeInTheDocument();
  });

  it('toggle switch reflects active state for indicators', () => {
    render(<IndicatorSelector active={['BOLL']} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('indicator-selector-trigger'));
    const bollItem = screen.getByTestId('indicator-item-BOLL');
    expect(bollItem).toHaveAttribute('aria-pressed', 'true');
    const maItem = screen.getByTestId('indicator-item-MA');
    expect(maItem).toHaveAttribute('aria-pressed', 'false');
  });

  it('filters indicators by search query', () => {
    render(<IndicatorSelector active={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('indicator-selector-trigger'));
    const input = screen.getByPlaceholderText('搜索指标...');
    fireEvent.change(input, { target: { value: 'RSI' } });
    // RSI should be visible
    expect(screen.getByText('RSI')).toBeInTheDocument();
    // MA should be filtered out
    expect(screen.queryByText('MA')).not.toBeInTheDocument();
  });

  it('shows all 10 indicators when panel is open without search', () => {
    render(<IndicatorSelector active={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByTestId('indicator-selector-trigger'));
    const allIds = ['MA', 'EMA', 'BOLL', 'VWAP', 'VP', 'WRB', 'RSI', 'MACD', 'KDJ', 'ATR'];
    for (const id of allIds) {
      expect(screen.getByTestId(`indicator-item-${id}`)).toBeInTheDocument();
    }
  });
});
