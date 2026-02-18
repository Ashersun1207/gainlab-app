import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ForexCommodityWidget } from '../index';

vi.mock('../../../services/api', () => ({
  fetchBatchQuotes: vi.fn().mockResolvedValue([
    { price: 2350, change: 15, changePercent: 0.64 },
    { price: 28.5, change: -0.3, changePercent: -1.04 },
    { price: 1.085, change: 0.002, changePercent: 0.18 },
    { price: 1.272, change: -0.003, changePercent: -0.24 },
    { price: 149.5, change: 0.8, changePercent: 0.54 },
    { price: 7.25, change: 0.01, changePercent: 0.14 },
    { price: 72.5, change: -1.2, changePercent: -1.63 },
    { price: 2.15, change: 0.05, changePercent: 2.38 },
  ]),
}));

describe('ForexCommodityWidget', () => {
  it('renders title', () => {
    render(<ForexCommodityWidget />);
    expect(screen.getByText('外汇 / 大宗商品')).toBeInTheDocument();
  });
});
