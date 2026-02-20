import { useState, useEffect, useCallback, useRef } from 'react';
import type { MarketType, TimeInterval } from '../types/market';
import type { KLineData } from '../types/data';
import { getKlineData, getQuote } from '../services/marketData';

interface UseMarketDataResult {
  klineData: KLineData[];
  loading: boolean;
  error: string | null;
  quote: { price: number; change: number; changePercent: number } | null;
  refresh: () => void;
}

export function useMarketData(
  symbol: string,
  market: MarketType,
  interval: TimeInterval = '1D',
): UseMarketDataResult {
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<UseMarketDataResult['quote']>(null);
  // (#11) AbortController 防止卸载后 setState + 防止旧请求覆盖新结果
  // NOTE: signal 未透传到 fetchWithTimeout（它有自己的 timeout controller），
  // 所以网络请求本身不会被 abort，只是结果被丢弃。完全透传需改 api.ts 签名（P2 优化）。
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 取消上一次请求
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [kline, q] = await Promise.allSettled([
        getKlineData(symbol, market, interval),
        getQuote(symbol, market),
      ]);

      if (controller.signal.aborted) return;

      if (kline.status === 'fulfilled') {
        setKlineData(kline.value);
      } else {
        setError(
          kline.reason instanceof Error
            ? kline.reason.message
            : '获取K线失败',
        );
      }

      if (q.status === 'fulfilled') {
        setQuote(q.value);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [symbol, market, interval]);

  useEffect(() => {
    if (symbol) fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData, symbol]);

  return { klineData, loading, error, quote, refresh: fetchData };
}
