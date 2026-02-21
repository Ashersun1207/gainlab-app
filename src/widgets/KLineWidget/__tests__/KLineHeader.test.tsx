import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KLineHeader } from '../KLineHeader';

const defaultProps = {
  symbol: 'BTCUSDT',
  symbolDisplay: 'BTC/USDT',
  market: 'Crypto',
  price: 65432.1,
  changePercent: 2.35,
  period: '1D',
  onSymbolChange: vi.fn(),
  onPeriodChange: vi.fn(),
};

describe('KLineHeader', () => {
  it('renders symbol display', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
  });

  it('renders market badge', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByText('Crypto')).toBeInTheDocument();
  });

  it('renders price with up color', () => {
    render(<KLineHeader {...defaultProps} />);
    const prc = screen.getByText('65,432.1');
    expect(prc.className).toContain('up');
  });

  it('renders negative change with dn color', () => {
    render(<KLineHeader {...defaultProps} changePercent={-1.5} />);
    const chg = screen.getByText('-1.50%');
    expect(chg.className).toContain('dn');
  });

  it('renders change percent', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByText('+2.35%')).toBeInTheDocument();
  });

  it('renders common period buttons', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByText('1H')).toBeInTheDocument();
    expect(screen.getByText('4H')).toBeInTheDocument();
    expect(screen.getByText('1D')).toBeInTheDocument();
    expect(screen.getByText('1W')).toBeInTheDocument();
    expect(screen.getByText('1M')).toBeInTheDocument();
  });

  it('calls onPeriodChange when period clicked', () => {
    const fn = vi.fn();
    render(<KLineHeader {...defaultProps} onPeriodChange={fn} />);
    fireEvent.click(screen.getByText('4H'));
    expect(fn).toHaveBeenCalledWith('4H');
  });

  it('opens symbol dropdown on click', () => {
    render(<KLineHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('BTC/USDT'));
    expect(screen.getByPlaceholderText('搜索标的...')).toBeInTheDocument();
  });

  it('filters symbol dropdown by search', () => {
    render(<KLineHeader {...defaultProps} />);
    fireEvent.click(screen.getByText('BTC/USDT'));
    const input = screen.getByPlaceholderText('搜索标的...');
    fireEvent.change(input, { target: { value: 'apple' } });
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
  });

  it('renders chart type button', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByLabelText('chart type')).toBeInTheDocument();
  });

  it('renders indicator trigger', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByText(/ƒx 指标/)).toBeInTheDocument();
  });

  it('shows indicator count badge when active', () => {
    render(<KLineHeader {...defaultProps} activeIndicators={['MA', 'RSI']} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows indicator tags when active', () => {
    render(<KLineHeader {...defaultProps} activeIndicators={['BOLL']} />);
    // T18: tags now include ⚙ icon for Script indicators
    expect(screen.getByText(/BOLL/)).toBeInTheDocument();
  });

  it('renders widget control buttons', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByTitle('设置')).toBeInTheDocument();
    expect(screen.getByTitle('截图')).toBeInTheDocument();
    expect(screen.getByTitle('全屏')).toBeInTheDocument();
  });

  it('renders drawing tool trigger', () => {
    render(<KLineHeader {...defaultProps} />);
    expect(screen.getByTitle('画图工具')).toBeInTheDocument();
  });

  it('highlights active period button', () => {
    render(<KLineHeader {...defaultProps} period="1D" />);
    const btn = screen.getByText('1D');
    expect(btn.className).toContain('on');
  });
});
