import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env before importing the module
vi.stubEnv('VITE_WORKER_URL', 'https://test.workers.dev/api/chat');

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Dynamic import after env stub
const { fetchWorkerKline, fetchWorkerQuote, getWorkerBase } = await import(
  '../api'
);

describe('getWorkerBase', () => {
  it('extracts base URL from WORKER_URL', () => {
    expect(getWorkerBase()).toBe('https://test.workers.dev');
  });
});

describe('fetchWorkerKline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls CF Worker and parses kline response', async () => {
    const mockData = [
      {
        timestamp: 1707955200000,
        open: 48000,
        high: 48800,
        low: 47200,
        close: 48500,
        volume: 25000,
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockData }),
    });

    const result = await fetchWorkerKline('BTCUSDT', 'crypto', '1D');
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/kline?'),
      expect.any(Object),
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: () => Promise.resolve({ error: 'upstream error' }),
    });
    await expect(fetchWorkerKline('BTCUSDT', 'crypto')).rejects.toThrow(
      'upstream error',
    );
  });

  it('includes symbol, market, and interval in URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    await fetchWorkerKline('AAPL', 'us', '1h');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('symbol=AAPL');
    expect(url).toContain('market=us');
    expect(url).toContain('interval=1h');
  });
});

describe('fetchWorkerQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls CF Worker and parses quote response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          price: 69000.5,
          change: 1200,
          changePercent: 1.77,
        }),
    });

    const result = await fetchWorkerQuote('BTCUSDT', 'crypto');
    expect(result.price).toBe(69000.5);
    expect(result.changePercent).toBe(1.77);
  });

  it('returns zeros for missing fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await fetchWorkerQuote('BTCUSDT', 'crypto');
    expect(result.price).toBe(0);
    expect(result.change).toBe(0);
    expect(result.changePercent).toBe(0);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    await expect(fetchWorkerQuote('BTCUSDT', 'crypto')).rejects.toThrow(
      'Worker quote 500',
    );
  });
});
