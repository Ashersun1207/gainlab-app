import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteTableWidget } from '../index';

vi.mock('../../../services/api', () => ({
  fetchBatchQuotes: vi.fn().mockResolvedValue([
    { price: 96000, change: 1200, changePercent: 1.25 },
    { price: 3200, change: -50, changePercent: -1.54 },
  ]),
}));

const ITEMS = [
  { symbol: 'BTCUSDT', displayName: 'Bitcoin', market: 'crypto' as const },
  { symbol: 'ETHUSDT', displayName: 'Ethereum', market: 'crypto' as const },
];

describe('QuoteTableWidget', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders title and items', () => {
    render(<QuoteTableWidget title="报价" items={ITEMS} />);
    expect(screen.getByText('报价')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });
});
