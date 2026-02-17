import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWorkerKline } from '../../services/api';
import type { MarketType } from '../../types/market';
import type { KLineData } from '../../types/data';

interface OverlayDataset {
  symbol: string;
  data: KLineData[];
}

interface UseOverlayDataResult {
  datasets: OverlayDataset[];
  loading: boolean;
}

export function useOverlayData(
  symbolsKey: string,
  market: MarketType,
): UseOverlayDataResult {
  const [datasets, setDatasets] = useState<OverlayDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);

    const symbols = symbolsKey.split(',').filter(Boolean);

    try {
      const results = await Promise.all(
        symbols.map((s) =>
          fetchWorkerKline(s, market)
            .then((data) => ({ symbol: s, data }))
            .catch(() => ({ symbol: s, data: [] as KLineData[] })),
        ),
      );

      if (!cancelledRef.current) {
        setDatasets(results.filter((r) => r.data.length > 0));
      }
    } finally {
      if (!cancelledRef.current) {
        setLoading(false);
      }
    }
  }, [symbolsKey, market]);

  useEffect(() => {
    if (symbolsKey) fetchAll();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchAll, symbolsKey]);

  return { datasets, loading };
}
