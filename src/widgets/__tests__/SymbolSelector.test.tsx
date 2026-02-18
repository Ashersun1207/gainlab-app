import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SymbolSelector } from '../SymbolSelector';

// Mock the API module
vi.mock('../../services/api', () => ({
  fetchWorkerSearch: vi.fn().mockResolvedValue([
    { symbol: 'ETHUSDT', name: 'Ethereum' },
    { symbol: 'BNBUSDT', name: 'BNB' },
  ]),
}));

describe('SymbolSelector', () => {
  const defaultProps = {
    symbol: 'BTCUSDT',
    market: 'crypto' as const,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the current symbol in trigger button', () => {
    render(<SymbolSelector {...defaultProps} />);
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
  });

  it('opens dropdown panel when trigger is clicked', () => {
    render(<SymbolSelector {...defaultProps} />);
    expect(screen.queryByTestId('symbol-selector-panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('symbol-selector-panel')).toBeInTheDocument();
  });

  it('displays HOT_ASSETS grouped by market when panel is open', () => {
    render(<SymbolSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    // Should show crypto market group label (multiple matches expected — group header + badges)
    expect(screen.getAllByText(/加密/).length).toBeGreaterThan(0);
    // Should show BTC from HOT_ASSETS
    expect(screen.getByText('BTC')).toBeInTheDocument();
    // Should show US market
    expect(screen.getAllByText(/美股/).length).toBeGreaterThan(0);
    // Should show AAPL from HOT_ASSETS
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('compact mode shows only symbol and arrow without icon prefix', () => {
    render(<SymbolSelector {...defaultProps} compact={true} />);
    const button = screen.getByRole('button');
    // In compact mode, no "🔍" prefix
    expect(button.textContent).toContain('BTCUSDT');
    expect(button.textContent).not.toContain('🔍');
  });

  it('calls onChange and closes panel when an asset is selected', () => {
    const onChange = vi.fn();
    render(<SymbolSelector {...defaultProps} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Click on ETH in the HOT_ASSETS list
    fireEvent.click(screen.getByText('ETH'));
    expect(onChange).toHaveBeenCalledWith('ETHUSDT', 'crypto');
    // Panel should be closed after selection
    expect(screen.queryByTestId('symbol-selector-panel')).not.toBeInTheDocument();
  });

  it('closes panel when backdrop is clicked', () => {
    render(<SymbolSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('symbol-selector-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('symbol-selector-backdrop'));
    expect(screen.queryByTestId('symbol-selector-panel')).not.toBeInTheDocument();
  });

  it('shows search input in the panel', () => {
    render(<SymbolSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText('搜索标的...')).toBeInTheDocument();
  });

  it('shows no-result message when search returns empty', async () => {
    const { fetchWorkerSearch } = await import('../../services/api');
    vi.mocked(fetchWorkerSearch).mockResolvedValueOnce([]);

    render(<SymbolSelector {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    const input = screen.getByPlaceholderText('搜索标的...');
    fireEvent.change(input, { target: { value: 'ZZZNONE' } });

    await waitFor(
      () => {
        expect(screen.getByText('无结果')).toBeInTheDocument();
      },
      { timeout: 1000 },
    );
  });
});
