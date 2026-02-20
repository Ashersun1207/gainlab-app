import { useState, useCallback, useEffect, Fragment } from 'react';
import { t } from '../../i18n';

/* ── Data ─────────────────────────────────────────────── */

const SYMBOL_LIST = [
  { symbol: 'BTCUSDT', display: 'BTC/USDT', desc: 'Bitcoin', market: 'Crypto' },
  { symbol: 'ETHUSDT', display: 'ETH/USDT', desc: 'Ethereum', market: 'Crypto' },
  { symbol: 'SOLUSDT', display: 'SOL/USDT', desc: 'Solana', market: 'Crypto' },
  { symbol: 'AAPL', display: 'AAPL', desc: 'Apple Inc.', market: 'US' },
  { symbol: 'NVDA', display: 'NVDA', desc: 'NVIDIA', market: 'US' },
  { symbol: 'MSFT', display: 'MSFT', desc: 'Microsoft', market: 'US' },
  { symbol: '601318', display: '601318', desc: '中国平安', market: 'A股' },
  { symbol: '600519', display: '600519', desc: '贵州茅台', market: 'A股' },
  { symbol: 'XAUUSD', display: 'XAU/USD', desc: 'Gold', market: 'Metal' },
  { symbol: 'XAGUSD', display: 'XAG/USD', desc: 'Silver', market: 'Metal' },
];

const DEFAULT_PERIODS = [
  { name: '1m', common: false },
  { name: '5m', common: false },
  { name: '15m', common: false },
  { name: '1H', common: true },
  { name: '4H', common: true },
  { name: '1D', common: true },
  { name: '1W', common: true },
  { name: '1M', common: true },
];

const CHART_TYPES = [
  { id: 'candle_solid', labelKey: 'ct_candle_solid' },
  { id: 'candle_stroke', labelKey: 'ct_candle_stroke' },
  { id: 'ohlc', labelKey: 'ct_ohlc' },
  { id: 'price_line', labelKey: 'ct_price_line' },
  { id: 'area', labelKey: 'ct_area' },
];

const INDICATORS = [
  { id: 'MA', name: 'MA', descKey: 'ind_ma_desc', group: 'main' },
  { id: 'EMA', name: 'EMA', descKey: 'ind_ema_desc', group: 'main' },
  { id: 'BOLL', name: 'BOLL', descKey: 'ind_boll_desc', group: 'main' },
  { id: 'VWAP', name: 'VWAP', descKey: 'ind_vwap_desc', group: 'main' },
  { id: 'VP', name: 'VP', descKey: 'ind_vp_desc', group: 'main' },
  { id: 'WRB', name: 'WRB', descKey: 'ind_wrb_desc', group: 'main' },
  { id: 'RSI', name: 'RSI', descKey: 'ind_rsi_desc', group: 'sub' },
  { id: 'MACD', name: 'MACD', descKey: 'ind_macd_desc', group: 'sub' },
  { id: 'KDJ', name: 'KDJ', descKey: 'ind_kdj_desc', group: 'sub' },
  { id: 'ATR', name: 'ATR', descKey: 'ind_atr_desc', group: 'sub' },
];

/* ── Chart-type SVG icons ─────────────────────────────── */

function ChartIcon({ id }: { id: string }) {
  const s = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const;
  switch (id) {
    case 'candle_solid':
      return (<svg {...s}><line x1="5" y1="1" x2="5" y2="15" /><rect x="2" y="4" width="6" height="8" fill="currentColor" rx="0.5" /><line x1="12" y1="3" x2="12" y2="13" /><rect x="9" y="5" width="6" height="6" fill="currentColor" rx="0.5" /></svg>);
    case 'candle_stroke':
      return (<svg {...s}><line x1="5" y1="1" x2="5" y2="15" /><rect x="2" y="4" width="6" height="8" rx="0.5" /><line x1="12" y1="3" x2="12" y2="13" /><rect x="9" y="5" width="6" height="6" rx="0.5" /></svg>);
    case 'ohlc':
      return (<svg {...s}><line x1="4" y1="2" x2="4" y2="14" /><line x1="1" y1="5" x2="4" y2="5" /><line x1="4" y1="11" x2="7" y2="11" /><line x1="12" y1="4" x2="12" y2="12" /><line x1="9" y1="6" x2="12" y2="6" /><line x1="12" y1="10" x2="15" y2="10" /></svg>);
    case 'price_line':
      return (<svg {...s}><polyline points="1,12 4,8 7,10 10,4 14,6" /></svg>);
    case 'area':
      return (<svg {...s}><polygon points="1,12 4,8 7,10 10,4 14,6 14,14 1,14" fill="currentColor" opacity="0.3" /><polyline points="1,12 4,8 7,10 10,4 14,6" /></svg>);
    default:
      return null;
  }
}

/* ── Props ─────────────────────────────────────────────── */

export interface KLineHeaderProps {
  symbol: string;
  symbolDisplay: string;
  market: string;
  price?: number;
  changePercent?: number;
  period: string;
  onSymbolChange: (sym: string, mkt: string) => void;
  onPeriodChange: (period: string) => void;
  chartType?: string;
  onChartTypeChange?: (type: string) => void;
  activeIndicators?: string[];
  onIndicatorToggle?: (ind: string) => void;
  drawingToolOpen?: boolean;
  onDrawingToolToggle?: () => void;
  onClose?: () => void;
  onClearPanel?: () => void;
}

/* ── Component ────────────────────────────────────────── */

export function KLineHeader({
  symbolDisplay,
  market,
  price,
  changePercent,
  period,
  onSymbolChange,
  onPeriodChange,
  chartType = 'candle_solid',
  onChartTypeChange,
  activeIndicators = [],
  onIndicatorToggle,
  drawingToolOpen = false,
  onDrawingToolToggle,
  onClose,
  onClearPanel,
}: KLineHeaderProps) {
  /* ── state ── */
  const [ddOpen, setDdOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pdDdOpen, setPdDdOpen] = useState(false);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [ctDdOpen, setCtDdOpen] = useState(false);
  const [indOpen, setIndOpen] = useState(false);

  /* ── helpers ── */
  const toggleDD = useCallback(() => { setDdOpen(v => !v); setSearch(''); }, []);
  const closeDD = useCallback(() => { setDdOpen(false); setSearch(''); }, []);
  const togglePdDd = useCallback(() => setPdDdOpen(v => !v), []);
  const closePdDd = useCallback(() => setPdDdOpen(false), []);
  const toggleCtDd = useCallback(() => setCtDdOpen(v => !v), []);
  const closeCtDd = useCallback(() => setCtDdOpen(false), []);
  const toggleInd = useCallback(() => setIndOpen(v => !v), []);
  const closeInd = useCallback(() => setIndOpen(false), []);

  const toggleStar = useCallback((name: string) => {
    setPeriods(prev => prev.map(p => p.name === name ? { ...p, common: !p.common } : p));
  }, []);

  /* close all dropdowns on Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDdOpen(false);
        setPdDdOpen(false);
        setCtDdOpen(false);
        setIndOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ── symbol dropdown: filter & group ── */
  const lc = search.toLowerCase();
  const filtered = SYMBOL_LIST.filter(
    s => s.symbol.toLowerCase().includes(lc) || s.display.toLowerCase().includes(lc) || s.desc.toLowerCase().includes(lc),
  );
  const groups = [...new Set(filtered.map(s => s.market))];

  const commonNames = periods.filter(p => p.common).map(p => p.name);

  /* ── render ── */
  return (
    <div className="kwh">
      <div className="kwh-row">
        {/* ── Symbol selector ── */}
        <div className="sym" onClick={() => { if (!ddOpen) toggleDD(); }}>
          <span className="sym-icon">⌕</span>
          <span className="sym-t">{symbolDisplay}</span>
          <span className="sym-m">{market}</span>
          <span className="sym-v">▾</span>
          {ddOpen && <div className="dd-overlay show" onClick={e => { e.stopPropagation(); closeDD(); }} />}
          {ddOpen && (
            <div className="dd show" onClick={e => e.stopPropagation()}>
              <input
                placeholder={t('ph_search_symbol')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {groups.map(group => (
                <Fragment key={group}>
                  <div className="dd-section">{group}</div>
                  {filtered
                    .filter(s => s.market === group)
                    .map(s => (
                      <div
                        key={s.symbol}
                        className="ddi"
                        onClick={() => { onSymbolChange(s.symbol, s.market); closeDD(); }}
                      >
                        <span>
                          <span className="dn_">{s.display}</span>
                          <span className="dm">{s.desc}</span>
                        </span>
                        <span className="dk">{s.market}</span>
                      </div>
                    ))}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {/* ── Price ── */}
        <span className={`prc ${(changePercent ?? 0) >= 0 ? 'up' : 'dn'}`}>
          {price?.toLocaleString() ?? '—'}
        </span>
        <span className={`chg ${(changePercent ?? 0) >= 0 ? 'up' : 'dn'}`}>
          {changePercent != null
            ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`
            : ''}
        </span>

        <div className="vs" />

        {/* ── Period shortcuts + dropdown ── */}
        <div className="pd-wrap">
          {periods.filter(p => p.common).map(p => (
            <button
              key={p.name}
              className={`pb${p.name === period ? ' on' : ''}`}
              onClick={() => onPeriodChange(p.name)}
            >
              {p.name}
            </button>
          ))}
          <div className="pd-dd-wrap">
            <button className="pd-dd-btn" onClick={togglePdDd}>
              {!commonNames.includes(period) && <span>{period} </span>}
              ▾
            </button>
            {pdDdOpen && <div className="pd-dd-bg show" onClick={closePdDd} />}
            {pdDdOpen && (
              <div className="pd-dd show">
                {periods.map(p => (
                  <div key={p.name} className={`pd-item${p.name === period ? ' active' : ''}`}>
                    <span
                      className="pd-name"
                      onClick={() => { onPeriodChange(p.name); closePdDd(); }}
                    >
                      {p.name}
                    </span>
                    <button
                      className={`pd-star${p.common ? ' on' : ''}`}
                      onClick={() => toggleStar(p.name)}
                    >
                      ★
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="vs" />

        {/* ── T9: Chart type selector ── */}
        <div className="ct-sel">
          <button className="ct-btn" onClick={toggleCtDd} aria-label="chart type">
            <ChartIcon id={chartType} />
            <span style={{ fontSize: 7, color: '#5a5a8a' }}>▾</span>
          </button>
          {ctDdOpen && <div className="dd-overlay show" onClick={closeCtDd} />}
          {ctDdOpen && (
            <div className="ct-dd">
              {CHART_TYPES.map(ct => (
                <div
                  key={ct.id}
                  className={`ct-item${ct.id === chartType ? ' active' : ''}`}
                  onClick={() => { onChartTypeChange?.(ct.id); closeCtDd(); }}
                >
                  <ChartIcon id={ct.id} />
                  <span>{t(ct.labelKey)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── T9: Indicator selector ── */}
        <div className="ind-sel">
          <button className="ind-trigger" onClick={toggleInd}>
            {t('ind_trigger')}
            {activeIndicators.length > 0 && (
              <span className="ind-count">{activeIndicators.length}</span>
            )}
            <span style={{ fontSize: 7 }}>▾</span>
          </button>
          {activeIndicators.length > 0 && (
            <div className="ind-tags" style={{ marginLeft: 4 }}>
              {activeIndicators.map(id => (
                <span key={id} className="ind-tag">{id}</span>
              ))}
            </div>
          )}
          {indOpen && <div className="dd-overlay show" onClick={closeInd} />}
          {indOpen && (
            <div className="ind-panel">
              <div className="dd-section">{t('ind_group_main')}</div>
              {INDICATORS.filter(i => i.group === 'main').map(ind => (
                <div
                  key={ind.id}
                  className={`ind-item${activeIndicators.includes(ind.id) ? ' on' : ''}`}
                  onClick={() => onIndicatorToggle?.(ind.id)}
                >
                  <div className="ind-toggle" />
                  <span className="ind-name">{ind.name}</span>
                  <span className="dm">{t(ind.descKey)}</span>
                </div>
              ))}
              <div className="dd-section">{t('ind_group_sub')}</div>
              {INDICATORS.filter(i => i.group === 'sub').map(ind => (
                <div
                  key={ind.id}
                  className={`ind-item${activeIndicators.includes(ind.id) ? ' on' : ''}`}
                  onClick={() => onIndicatorToggle?.(ind.id)}
                >
                  <div className="ind-toggle" />
                  <span className="ind-name">{ind.name}</span>
                  <span className="dm">{t(ind.descKey)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Drawing tool trigger ── */}
        <button
          className={`dt-trigger${drawingToolOpen ? ' on' : ''}`}
          title={t('btn_drawing')}
          onClick={onDrawingToolToggle}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="14" x2="14" y2="2" />
            <circle cx="14" cy="2" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {/* ── T9: Widget controls (right-aligned) ── */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {onClearPanel && (
            <button
              className="dtb"
              title="清空面板"
              onClick={onClearPanel}
              style={{ fontSize: 11, color: '#6a6aaa', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6a6aaa'; }}
            >
              🗑 清空面板
            </button>
          )}
          <button className="dtb" title={t('btn_settings')}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
            </svg>
          </button>
          <button className="dtb" title={t('btn_screenshot')}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="10" rx="1" />
              <circle cx="8" cy="8" r="2.5" />
            </svg>
          </button>
          <button className="dtb" title={t('btn_fullscreen')}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="1,5 1,1 5,1" />
              <polyline points="11,1 15,1 15,5" />
              <polyline points="15,11 15,15 11,15" />
              <polyline points="5,15 1,15 1,11" />
            </svg>
          </button>
          {onClose && (
            <button className="dtb" title={t('btn_close')} onClick={onClose} style={{ color: '#6a6aaa' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6a6aaa'; }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
