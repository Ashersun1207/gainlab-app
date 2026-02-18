import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalIndexWidget } from '../index';

vi.mock('../../../services/api', () => ({
  fetchBatchQuotes: vi.fn().mockResolvedValue([
    { price: 5200, change: 30, changePercent: 0.58 },
    { price: 42000, change: -100, changePercent: -0.24 },
    { price: 16800, change: 50, changePercent: 0.3 },
    { price: 8200, change: -20, changePercent: -0.24 },
    { price: 18500, change: 100, changePercent: 0.54 },
    { price: 38000, change: 200, changePercent: 0.53 },
    { price: 22000, change: -50, changePercent: -0.23 },
    { price: 3300, change: 10, changePercent: 0.3 },
  ]),
}));

describe('GlobalIndexWidget', () => {
  it('renders title', () => {
    render(<GlobalIndexWidget />);
    expect(screen.getByText('全球指数')).toBeInTheDocument();
  });
});
