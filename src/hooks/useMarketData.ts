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
  // (#11) AbortController 真正取消进行中的请求，而非只忽略结果
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
