/**
 * Scene Configuration — 14 scenes, 4 sections
 * Single source of truth for Sidebar, routing, and MobileTabBar.
 *
 * Based on preview-layout.html sidebarItems.
 * @see PREVIEW-ARCHITECTURE.md for design context.
 */

// ── Scene child (widget inside a scene) ──

export interface SceneChild {
  id: string;
  nameKey: string; // i18n key
}

// ── Scene config ──

export interface SceneConfig {
  id: string;
  nameKey: string; // i18n key
  badge: string; // short label shown in collapsed sidebar & tab bar
  svg: string; // inline SVG markup (no wrapper)
  section: 'top' | 'dashboards' | 'portfolio' | 'ai';
  children: SceneChild[];
  implemented: boolean;
}

// ── Section header i18n keys ──

export const SECTION_HEADERS: Record<string, string> = {
  dashboards: 'sec_dashboards',
  portfolio: 'sec_portfolio',
  ai: 'sec_ai',
};

// ── 14 scenes ──

export const SCENE_CONFIGS: SceneConfig[] = [
  // ─── TOP: high-frequency (no section header) ───
  {
    id: 'ai',
    nameKey: 'sc_ai_chat',
    badge: 'AI',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z"/></svg>',
    section: 'top',
    children: [
      { id: 'chat', nameKey: 'w_chat_panel' },
      { id: 'ai_cmd', nameKey: 'w_ai_cmd' },
    ],
    implemented: true,
  },
  {
    id: 'snapshot',
    nameKey: 'sc_snapshot',
    badge: 'NOW',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l2.5 4H1.5L4 2z" opacity=".8"/><path d="M12 14l-2.5-4h5L12 14z" opacity=".5"/><rect x="7" y="6" width="2" height="4" rx=".5" opacity=".4"/></svg>',
    section: 'top',
    children: [
      { id: 'quotes', nameKey: 'w_gainers_losers' },
      { id: 'heatmap', nameKey: 'w_heatmap' },
      { id: 'sentiment', nameKey: 'w_key_indices' },
      { id: 'global_idx', nameKey: 'w_global_idx' },
      { id: 'forex_comm', nameKey: 'w_forex_comm' },
      { id: 'kline_mini', nameKey: 'w_kline_mini' },
    ],
    implemented: true,
  },
  {
    id: 'watchlist',
    nameKey: 'sc_watchlist',
    badge: 'MYW',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2.2 4.5 5 .7-3.6 3.5.9 5L8 12.4 3.5 14.7l.9-5L.8 6.2l5-.7z"/></svg>',
    section: 'top',
    children: [
      { id: 'watchlist_table', nameKey: 'w_watchlist_table' },
      { id: 'mini_charts', nameKey: 'w_mini_charts' },
    ],
    implemented: false,
  },

  // ─── DASHBOARDS ───
  {
    id: 'stock_analysis',
    nameKey: 'sc_stock_analysis',
    badge: 'CK',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="9" width="3" height="6" rx=".5"/><rect x="5.5" y="5" width="3" height="10" rx=".5"/><rect x="10" y="1" width="3" height="14" rx=".5"/></svg>',
    section: 'dashboards',
    children: [
      { id: 'kline', nameKey: 'w_kline' },
      { id: 'volume_profile', nameKey: 'w_volume_profile' },
      { id: 'wrb', nameKey: 'w_wrb' },
      { id: 'indicators', nameKey: 'w_indicators' },
    ],
    implemented: true,
  },
  {
    id: 'market_heat',
    nameKey: 'sc_market_heat',
    badge: 'HM',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6.5" height="6.5" rx="1"/><rect x="8.5" y="1" width="6.5" height="6.5" rx="1" opacity=".5"/><rect x="1" y="8.5" width="6.5" height="6.5" rx="1" opacity=".5"/><rect x="8.5" y="8.5" width="6.5" height="6.5" rx="1" opacity=".3"/></svg>',
    section: 'dashboards',
    children: [
      { id: 'big_heatmap', nameKey: 'w_crypto_heatmap' },
      { id: 'top_movers', nameKey: 'w_sector_heatmap' },
      { id: 'quotes', nameKey: 'w_rank' },
    ],
    implemented: true,
  },
  {
    id: 'fundamentals',
    nameKey: 'sc_fundamentals',
    badge: 'FD',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm1 3h8v1.5H4V4zm0 3h5v1.5H4V7zm0 3h7v1.5H4V10z"/></svg>',
    section: 'dashboards',
    children: [
      { id: 'financials', nameKey: 'w_financials' },
      { id: 'earnings', nameKey: 'w_earnings_compare' },
      { id: 'cashflow', nameKey: 'w_cashflow' },
    ],
    implemented: false,
  },
  {
    id: 'multi_compare',
    nameKey: 'sc_multi_compare',
    badge: 'CMP',
    svg: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="1" width="9" height="9" rx="1.5"/><rect x="6" y="6" width="9" height="9" rx="1.5"/></svg>',
    section: 'dashboards',
    children: [
      { id: 'overlay', nameKey: 'w_overlay' },
      { id: 'correlation', nameKey: 'w_correlation' },
      { id: 'ratio', nameKey: 'w_ratio' },
    ],
    implemented: false,
  },
  {
    id: 'global_idx',
    nameKey: 'sc_global',
    badge: 'WEI',
    svg: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="3" ry="6.5"/><line x1="1.5" y1="8" x2="14.5" y2="8"/></svg>',
    section: 'dashboards',
    children: [
      { id: 'world_indices', nameKey: 'w_world_indices' },
      { id: 'fx_matrix', nameKey: 'w_fx_matrix' },
    ],
    implemented: false,
  },
  {
    id: 'macro',
    nameKey: 'sc_macro',
    badge: 'ECON',
    svg: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><polyline points="1,13 4,9 7,11 10,5 13,7 15,3"/><line x1="1" y1="14" x2="15" y2="14"/></svg>',
    section: 'dashboards',
    children: [
      { id: 'rates', nameKey: 'w_rates' },
      { id: 'gdp_cpi', nameKey: 'w_gdp_cpi' },
    ],
    implemented: false,
  },

  // ─── PORTFOLIO TOOLS ───
  {
    id: 'my_portfolio',
    nameKey: 'sc_portfolio',
    badge: 'MYP',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1zm4-2h4v2H6V2z"/></svg>',
    section: 'portfolio',
    children: [
      { id: 'holdings', nameKey: 'w_holdings' },
      { id: 'pnl', nameKey: 'w_pnl' },
    ],
    implemented: false,
  },
  {
    id: 'risk',
    nameKey: 'sc_risk',
    badge: 'RISK',
    svg: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8 1l7 13H1z"/><line x1="8" y1="6" x2="8" y2="9.5"/><circle cx="8" cy="11.5" r=".5" fill="currentColor"/></svg>',
    section: 'portfolio',
    children: [
      { id: 'var', nameKey: 'w_var' },
      { id: 'drawdown', nameKey: 'w_drawdown' },
    ],
    implemented: false,
  },

  // ─── AI TOOLS ───
  {
    id: 'ai_analysis',
    nameKey: 'sc_ai_analysis',
    badge: 'ANA',
    svg: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/></svg>',
    section: 'ai',
    children: [
      { id: 'signal_scan', nameKey: 'w_signal_scan' },
      { id: 'strategy', nameKey: 'w_strategy' },
    ],
    implemented: false,
  },
  {
    id: 'ai_report',
    nameKey: 'sc_ai_report',
    badge: 'RPT',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 1h5l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zm4.5.5V5H12"/><rect x="5" y="7" width="6" height="1" rx=".3"/><rect x="5" y="9.5" width="4" height="1" rx=".3"/></svg>',
    section: 'ai',
    children: [
      { id: 'report_gen', nameKey: 'w_report_gen' },
      { id: 'summary', nameKey: 'w_summary' },
    ],
    implemented: false,
  },
  {
    id: 'ai_screen',
    nameKey: 'sc_ai_screen',
    badge: 'MYS',
    svg: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v2h4V5H3zm0 3.5v2h4v-2H3zm5.5-3.5v2H14V5H8.5zm0 3.5v2H14v-2H8.5z"/></svg>',
    section: 'ai',
    children: [
      { id: 'screener', nameKey: 'w_screener' },
      { id: 'filter_builder', nameKey: 'w_filter_builder' },
    ],
    implemented: false,
  },
];

// ── Routable scenes (have actual rendered content) ──

export const ROUTABLE_SCENES = [
  'stock_analysis',
  'snapshot',
  'market_heat',
  'ai',
] as const;
export type RoutableScene = (typeof ROUTABLE_SCENES)[number];

// ── Symbol → display name mapping ──

export const SYMBOL_DISPLAY: Record<string, string> = {
  BTC: 'BTC/USDT',
  ETH: 'ETH/USDT',
  SOL: 'SOL/USDT',
  BNB: 'BNB/USDT',
  XRP: 'XRP/USDT',
  ADA: 'ADA/USDT',
  DOGE: 'DOGE/USDT',
  AVAX: 'AVAX/USDT',
  DOT: 'DOT/USDT',
  LINK: 'LINK/USDT',
  UNI: 'UNI/USDT',
  MATIC: 'MATIC/USDT',
  ATOM: 'ATOM/USDT',
  APT: 'APT/USDT',
  ARB: 'ARB/USDT',
  OP: 'OP/USDT',
  NEAR: 'NEAR/USDT',
  FIL: 'FIL/USDT',
  ICP: 'ICP/USDT',
  AAVE: 'AAVE/USDT',
  BTCUSDT: 'BTC/USDT',
  ETHUSDT: 'ETH/USDT',
  SOLUSDT: 'SOL/USDT',
  AAPL: 'AAPL',
  NVDA: 'NVDA',
  MSFT: 'MSFT',
  TSLA: 'TSLA',
  SPY: 'SPY',
  XAU: 'XAU/USD',
  'S&P 500': 'S&P 500',
  'Dow Jones': 'Dow Jones',
  NASDAQ: 'NASDAQ',
  'FTSE 100': 'FTSE 100',
  DAX: 'DAX',
  Nikkei: 'Nikkei',
  恒生: '恒生指数',
  上证: '上证指数',
  'XAU/USD': 'XAU/USD',
  'XAG/USD': 'XAG/USD',
  'EUR/USD': 'EUR/USD',
  'GBP/USD': 'GBP/USD',
  'USD/JPY': 'USD/JPY',
  WTI: 'WTI',
};

// ── Symbol → market inference ──

export const SYMBOL_MARKET: Record<string, string> = {
  BTC: 'crypto',
  ETH: 'crypto',
  SOL: 'crypto',
  BNB: 'crypto',
  XRP: 'crypto',
  ADA: 'crypto',
  DOGE: 'crypto',
  AVAX: 'crypto',
  DOT: 'crypto',
  LINK: 'crypto',
  UNI: 'crypto',
  MATIC: 'crypto',
  ATOM: 'crypto',
  APT: 'crypto',
  ARB: 'crypto',
  OP: 'crypto',
  NEAR: 'crypto',
  FIL: 'crypto',
  ICP: 'crypto',
  AAVE: 'crypto',
  BTCUSDT: 'crypto',
  ETHUSDT: 'crypto',
  SOLUSDT: 'crypto',
  AAPL: 'us',
  NVDA: 'us',
  MSFT: 'us',
  TSLA: 'us',
  SPY: 'us',
  XAU: 'metal',
  'S&P 500': 'us',
  'Dow Jones': 'us',
  NASDAQ: 'us',
  'FTSE 100': 'uk',
  DAX: 'eu',
  Nikkei: 'jp',
  恒生: 'hk',
  上证: 'cn',
  'XAU/USD': 'metal',
  'XAG/USD': 'metal',
  'EUR/USD': 'fx',
  'GBP/USD': 'fx',
  'USD/JPY': 'fx',
  WTI: 'comm',
  HSI: 'hk',
  SSE: 'cn',
};
