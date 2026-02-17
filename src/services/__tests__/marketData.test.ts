import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('VITE_WORKER_URL', 'https://test.workers.dev/api/chat');

// Must mock api before importing marketData
vi.mock('../api');

const { getKlineData } = await import('../marketData');
const api = await import('../api');

describe('marketData', () => {
  it('routes crypto to Worker (not direct Binance)', async () => {
    const mockData = [
      {
        timestamp: 1,
        open: 1,
        high: 2,
        low: 0.5,
        close: 1.5,
        volume: 100,
      },
    ];
    vi.mocked(api.fetchWorkerKline).mockResolvedValueOnce(mockData);

    const result = await getKlineData('BTCUSDT', 'crypto', '1D');
    expect(api.fetchWorkerKline).toHaveBeenCalledWith(
      'BTCUSDT',
      'crypto',
      '1D',
    );
    expect(result).toEqual(mockData);
  });

  it('routes us stock to Worker', async () => {
    const mockData = [
      {
        timestamp: 1,
        open: 150,
        high: 155,
        low: 149,
        close: 153,
        volume: 5000,
      },
    ];
    vi.mocked(api.fetchWorkerKline).mockResolvedValueOnce(mockData);

    const result = await getKlineData('AAPL', 'us', '1D');
    expect(api.fetchWorkerKline).toHaveBeenCalledWith('AAPL', 'us', '1D');
    expect(result).toEqual(mockData);
  });

  it('routes cn stock to Worker', async () => {
    const mockData = [
      {
        timestamp: 1,
        open: 30,
        high: 32,
        low: 29,
        close: 31,
        volume: 8000,
      },
    ];
    vi.mocked(api.fetchWorkerKline).mockResolvedValueOnce(mockData);

    const result = await getKlineData('601318.SHG', 'cn', '1D');
    expect(api.fetchWorkerKline).toHaveBeenCalledWith(
      '601318.SHG',
      'cn',
      '1D',
    );
    expect(result).toEqual(mockData);
  });

  it('routes metal to Worker', async () => {
    const mockData = [
      {
        timestamp: 1,
        open: 2000,
        high: 2050,
        low: 1980,
        close: 2030,
        volume: 300,
      },
    ];
    vi.mocked(api.fetchWorkerKline).mockResolvedValueOnce(mockData);

    const result = await getKlineData('XAUUSD.FOREX', 'metal', '1D');
    expect(api.fetchWorkerKline).toHaveBeenCalledWith(
      'XAUUSD.FOREX',
      'metal',
      '1D',
    );
    expect(result).toEqual(mockData);
  });
});
