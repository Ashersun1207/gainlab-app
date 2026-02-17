import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import type { TimeInterval } from '../../types/market';

describe('Toolbar', () => {
  const defaultProps = {
    symbolDisplay: 'BTC / USDT',
    price: 69000,
    changePercent: 2.5,
    interval: '1D' as TimeInterval,
    activeIndicators: ['RSI'],
    onIntervalChange: vi.fn(),
    onIndicatorToggle: vi.fn(),
  };

  it('renders symbol and price info', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('BTC / USDT')).toBeInTheDocument();
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
  });

  it('renders negative change with red color', () => {
    render(<Toolbar {...defaultProps} changePercent={-3.14} />);
    const pctEl = screen.getByText('-3.14%');
    expect(pctEl.className).toContain('text-[#ef5350]');
  });

  it('renders all 8 time intervals', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('1m')).toBeInTheDocument();
    expect(screen.getByText('1W')).toBeInTheDocument();
  });

  it('highlights the active interval', () => {
    render(<Toolbar {...defaultProps} />);
    const btn1D = screen.getByText('1D');
    expect(btn1D.className).toContain('bg-[#2563eb]');
  });

  it('calls onIntervalChange when period clicked', () => {
    const onIntervalChange = vi.fn();
    render(<Toolbar {...defaultProps} onIntervalChange={onIntervalChange} />);
    fireEvent.click(screen.getByText('1H'));
    expect(onIntervalChange).toHaveBeenCalledWith('1h');
  });

  it('renders indicator buttons', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByText('MACD')).toBeInTheDocument();
    expect(screen.getByText('RSI')).toBeInTheDocument();
  });

  it('highlights active indicators', () => {
    render(<Toolbar {...defaultProps} />);
    const rsiBtn = screen.getByText('RSI');
    expect(rsiBtn.className).toContain('bg-[#1e3a5f]');
    const macdBtn = screen.getByText('MACD');
    expect(macdBtn.className).not.toContain('bg-[#1e3a5f]');
  });

  it('calls onIndicatorToggle when indicator clicked', () => {
    const onIndicatorToggle = vi.fn();
    render(<Toolbar {...defaultProps} onIndicatorToggle={onIndicatorToggle} />);
    fireEvent.click(screen.getByText('MACD'));
    expect(onIndicatorToggle).toHaveBeenCalledWith('MACD');
  });
});
