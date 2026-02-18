import { useState, useCallback, useRef, useEffect } from 'react';
import { HOT_ASSETS, MARKET_CONFIG } from '../constants/markets';
import { fetchWorkerSearch } from '../services/api';
import type { MarketType } from '../types/market';

interface SymbolSelectorProps {
  /** 当前选中的标的 */
  symbol: string;
  /** 当前市场 */
  market: MarketType;
  /** 选择标的后回调 */
  onChange: (symbol: string, market: MarketType) => void;
  /** 紧凑模式（小 Widget 用，只显示 "AAPL ▾"） */
  compact?: boolean;
}

interface SearchResult {
  symbol: string;
  name: string;
  market: MarketType;
}

const DEBOUNCE_MS = 300;

export function SymbolSelector({ symbol, market, onChange, compact = false }: SymbolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await fetchWorkerSearch(value.trim(), market);
          setSearchResults(
            results.map((r) => ({ symbol: r.symbol, name: r.name, market })),
          );
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, DEBOUNCE_MS);
    },
    [market],
  );

  const handleSelect = useCallback(
    (selectedSymbol: string, selectedMarket: MarketType) => {
      onChange(selectedSymbol, selectedMarket);
      setOpen(false);
      setQuery('');
      setSearchResults([]);
    },
    [onChange],
  );

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSearchResults([]);
  }, []);

  // Determine display text
  const displayText = compact ? symbol : `🔍 ${symbol}`;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-semibold text-[#e0e0f0] hover:bg-[#1e1e3a] transition-colors select-none"
        title={compact ? undefined : 'Search symbol'}
      >
        <span>{displayText}</span>
        <span className="text-[#5a5a8a] text-[10px]">▾</span>
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[199]"
          onClick={handleClose}
          data-testid="symbol-selector-backdrop"
        />
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-[#0d0d20] border border-[#3a3a6a] rounded-lg shadow-[0_12px_40px_rgba(0,0,0,.6)] z-[200] overflow-hidden"
          style={{ width: compact ? 200 : 280 }}
          data-testid="symbol-selector-panel"
        >
          {/* Search input */}
          <div className="p-2 border-b border-[#2a2a4a]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="搜索标的..."
              className="w-full px-2 py-1.5 bg-[#1a1a3e] border border-[#2a2a4a] rounded text-[#e0e0f0] text-[11px] placeholder-[#5a5a8a] outline-none"
            />
          </div>

          {/* Content */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {searching && (
              <div className="px-3 py-2 text-[11px] text-[#5a5a8a]">搜索中...</div>
            )}

            {!searching && query.trim() && searchResults.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-[#5a5a8a]">无结果</div>
            )}

            {!searching && searchResults.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[8px] text-[#5a5a8a] uppercase tracking-wider">
                  搜索结果
                </div>
                {searchResults.map((item) => (
                  <button
                    key={`${item.market}:${item.symbol}`}
                    onClick={() => handleSelect(item.symbol, item.market)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#1e1e3a] transition-colors text-left"
                  >
                    <div>
                      <span className="text-[12px] font-semibold text-[#e0e0f0]">
                        {item.symbol}
                      </span>
                      <span className="ml-2 text-[11px] text-[#5a5a8a]">{item.name}</span>
                    </div>
                    <span className="text-[8px] bg-[#1a1a3e] text-[#a0a0cc] px-1.5 py-0.5 rounded">
                      {MARKET_CONFIG[item.market]?.label ?? item.market}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Hot assets grouped by market */}
            {!query.trim() &&
              (Object.keys(HOT_ASSETS) as MarketType[]).map((mkt) => (
                <div key={mkt}>
                  <div className="px-3 pt-2 pb-1 text-[8px] text-[#5a5a8a] uppercase tracking-wider">
                    {MARKET_CONFIG[mkt]?.icon} {MARKET_CONFIG[mkt]?.label}
                  </div>
                  {HOT_ASSETS[mkt].map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => handleSelect(asset.symbol, asset.market)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-[#1e1e3a] transition-colors text-left"
                    >
                      <div>
                        <span className="text-[12px] font-semibold text-[#e0e0f0]">
                          {asset.displaySymbol ?? asset.symbol}
                        </span>
                        <span className="ml-2 text-[11px] text-[#5a5a8a]">{asset.name}</span>
                      </div>
                      <span className="text-[8px] bg-[#1a1a3e] text-[#a0a0cc] px-1.5 py-0.5 rounded">
                        {MARKET_CONFIG[mkt]?.label}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
