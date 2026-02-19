import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBatchQuotes } from '../../services/api';
import type { MarketType } from '../../types/market';

interface QuoteTableItem {
  symbol: string;
  displayName: string;
  market: MarketType;
}

interface QuoteTableWidgetProps {
  title: string;
  items: QuoteTableItem[];
  onRowClick?: (symbol: string, market: MarketType) => void;
  refreshInterval?: number; // ms, default 30000
}

interface QuoteState {
  symbol: string;
  displayName: string;
  market: MarketType;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') { const n = Number(v); if (!Number.isNaN(n)) return n; }
  return 0;
}

function formatPrice(price: unknown): string {
  const p = toNum(price);
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
}

function formatPercent(pct: unknown): string {
  const v = toNum(pct);
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function formatChange(change: unknown, price: unknown): string {
  const c = toNum(change);
  const p = toNum(price);
  const sign = c >= 0 ? '+' : '';
  if (p >= 100) return `${sign}${c.toFixed(2)}`;
  if (p >= 1) return `${sign}${c.toFixed(2)}`;
  return `${sign}${c.toFixed(4)}`;
}

export function QuoteTableWidget({ title, items, onRowClick, refreshInterval = 30000 }: QuoteTableWidgetProps) {
  const [quotes, setQuotes] = useState<QuoteState[]>(() =>
    items.map((item) => ({ ...item, price: null, change: null, changePercent: null })),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchBatchQuotes(items);
      if (cancelledRef.current) return;
      setQuotes(
        items.map((item, i) => {
          const r = results[i];
          return {
            ...item,
            price: r?.price ?? null,
            change: r?.change ?? null,
            changePercent: r?.changePercent ?? null,
          };
        }),
      );
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    void loadData();
    timerRef.current = setInterval(() => { void loadData(); }, refreshInterval);
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadData, refreshInterval]);

  if (error && quotes.every((q) => q.price === null)) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#0d0d20]">
        <span className="text-[#ef4444] text-sm">{error}</span>
        <button
          onClick={() => void loadData()}
          className="px-3 py-1 text-xs bg-[#1e1e3a] text-[#a0a0cc] rounded hover:bg-[#2a2a4a] transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d20] overflow-hidden">
      {title && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e3a] flex-shrink-0">
            <span className="text-[13px] font-semibold text-[#a0a0cc]">{title}</span>
            {loading && (
              <span className="text-[10px] text-[#5a5a8a]">更新中...</span>
            )}
          </div>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 text-[10px] text-[#5a5a8a] uppercase tracking-wider border-b border-[#1e1e3a]/50 flex-shrink-0">
            <span>名称</span>
            <span className="text-right w-[72px]">价格</span>
            <span className="text-right w-[56px]">涨跌</span>
            <span className="text-right w-[56px]">涨跌%</span>
          </div>
        </>
      )}
      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {quotes.map((q) => {
          const isPositive = (q.changePercent ?? 0) >= 0;
          const colorClass = q.price !== null ? (isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]') : 'text-[#5a5a8a]';
          return (
            <div
              key={q.symbol}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 hover:bg-[#1a1a2e] cursor-pointer transition-colors items-center"
              onClick={() => onRowClick?.(q.symbol, q.market)}
            >
              <span className="text-[12px] text-[#e0e0f0] truncate">{q.displayName}</span>
              {q.price !== null ? (
                <>
                  <span className={`text-[12px] font-mono text-right w-[72px] ${colorClass}`}>
                    {formatPrice(q.price)}
                  </span>
                  <span className={`text-[11px] font-mono text-right w-[56px] ${colorClass}`}>
                    {formatChange(q.change ?? 0, q.price)}
                  </span>
                  <span className={`text-[11px] font-mono text-right w-[56px] ${colorClass}`}>
                    {formatPercent(q.changePercent ?? 0)}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-[72px] h-3 bg-[#1e1e3a] rounded animate-pulse" />
                  <span className="w-[56px] h-3 bg-[#1e1e3a] rounded animate-pulse" />
                  <span className="w-[56px] h-3 bg-[#1e1e3a] rounded animate-pulse" />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
