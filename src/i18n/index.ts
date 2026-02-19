/**
 * Minimal i18n — scene names, tab names, widget names, section headers.
 * Ported from preview-layout.html i18n object.
 */

type Lang = 'zh' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    // Section headers
    sec_dashboards: '看板',
    sec_portfolio: '投资组合',
    sec_ai: 'AI 工具',
    // Scene names
    sc_ai_chat: 'AI 对话',
    sc_snapshot: '行情快照',
    sc_watchlist: '自选股',
    sc_stock_analysis: '个股分析',
    sc_market_heat: '市场热力',
    sc_fundamentals: '基本面',
    sc_multi_compare: '多资产对比',
    sc_global: '全球指数',
    sc_macro: '宏观经济',
    sc_portfolio: '我的持仓',
    sc_risk: '风险分析',
    sc_ai_analysis: '智能分析',
    sc_ai_report: '研报生成',
    sc_ai_screen: '条件筛选',
    // Widget children
    w_chat_panel: '对话面板',
    w_ai_cmd: '指令快捷',
    w_gainers_losers: '涨跌排行',
    w_heatmap: '热力图',
    w_key_indices: '关键指数',
    w_global_idx: '全球指数',
    w_forex_comm: '外汇大宗',
    w_kline_mini: '走势图',
    w_watchlist_table: '自选列表',
    w_mini_charts: '迷你图',
    w_kline: 'K线图',
    w_volume_profile: '筹码分布',
    w_wrb: 'WRB 信号',
    w_indicators: '指标面板',
    w_crypto_heatmap: 'Crypto 热力',
    w_sector_heatmap: '板块热力',
    w_rank: '涨跌幅排行',
    w_financials: '财务概览',
    w_earnings_compare: '财报对比',
    w_cashflow: '现金流',
    w_overlay: '叠加走势',
    w_correlation: '相关性矩阵',
    w_ratio: '比率图',
    w_world_indices: '全球指数',
    w_fx_matrix: '汇率矩阵',
    w_rates: '利率',
    w_gdp_cpi: 'GDP / CPI',
    w_holdings: '持仓明细',
    w_pnl: '盈亏总览',
    w_var: 'VaR 敞口',
    w_drawdown: '最大回撤',
    w_signal_scan: '信号扫描',
    w_strategy: '策略回测',
    w_report_gen: '生成报告',
    w_summary: 'AI 摘要',
    w_screener: '筛选器',
    w_filter_builder: '条件构建',
    // Tab bar
    tab_ck: '分析',
    tab_now: '快照',
    tab_hm: '热力',
    tab_ai: 'AI',
    tab_more: '更多',
    // Placeholder
    placeholder_coming_soon: '即将上线',
    w_four_markets: '四市场',
    w_market_mood: '市场情绪',
    btn_agent: 'Agent',
    // Chart types
    ct_candle_solid: '实心蜡烛',
    ct_candle_stroke: '空心蜡烛',
    ct_ohlc: 'OHLC',
    ct_price_line: '价格线',
    ct_area: '面积图',
    // Indicator descriptions
    ind_ma_desc: '移动平均线',
    ind_ema_desc: '指数移动平均',
    ind_boll_desc: '布林带',
    ind_vwap_desc: '成交量加权均价',
    ind_vp_desc: '筹码分布',
    ind_wrb_desc: '宽幅K线信号',
    ind_rsi_desc: '相对强弱',
    ind_macd_desc: '指数平滑异同',
    ind_kdj_desc: '随机指标',
    ind_atr_desc: '真实波幅',
    // Indicator groups
    ind_group_main: '主图叠加',
    ind_group_sub: '副图指标',
    // Search placeholders
    ph_search_symbol: '搜索标的...',
    ph_search_indicator: '搜索指标...',
    // Buttons
    btn_drawing: '画图工具',
    btn_settings: '设置',
    btn_screenshot: '截图',
    btn_fullscreen: '全屏',
    btn_refresh: '刷新',
    btn_close: '关闭',
    // Triggers
    ind_trigger: 'ƒx 指标',
    ind_trigger_chart: '📊 指标',
    // Search states
    search_searching: '搜索中...',
    search_no_results: '无结果',
    search_results: '搜索结果',
    // Chat
    btn_open_ai: '打开 AI 助手',
    // Settings
    settings_title: '设置',
    settings_language: '语言',
    settings_lang_zh: '中文',
    settings_lang_en: 'English',
    settings_agent: 'Agent 配置',
    settings_agent_endpoint: 'API 端点',
    settings_agent_toggle: 'Agent 开关',
    settings_agent_on: '已启用',
    settings_agent_off: '已禁用',
    settings_data: '数据源 (BYOK)',
    settings_data_us: '美股 API Key (FMP)',
    settings_data_cn: 'A股 API Key (EODHD)',
    settings_data_metal: '贵金属/外汇 API Key',
    settings_data_crypto_free: 'Crypto 免费 (Bybit)',
    settings_display: '显示偏好',
    settings_default_market: '默认市场',
    settings_default_period: '默认周期',
    settings_theme: '主题',
    settings_theme_dark: '暗色',
    settings_about: '关于',
    settings_version: '版本',
    settings_github: 'GitHub',
    settings_save: '保存',
    settings_saved: '已保存',
  },
  en: {
    sec_dashboards: 'Dashboards',
    sec_portfolio: 'Portfolio Tools',
    sec_ai: 'AI Tools',
    sc_ai_chat: 'AI Chat',
    sc_snapshot: 'Market Snapshot',
    sc_watchlist: 'My Watchlists',
    sc_stock_analysis: 'Stock Analysis',
    sc_market_heat: 'Market Heatmap',
    sc_fundamentals: 'Fundamentals',
    sc_multi_compare: 'Multi-Asset Compare',
    sc_global: 'World Indices',
    sc_macro: 'World Economics',
    sc_portfolio: 'My Portfolio',
    sc_risk: 'Risk Analysis',
    sc_ai_analysis: 'AI Analysis',
    sc_ai_report: 'Research Report',
    sc_ai_screen: 'Screener',
    w_chat_panel: 'Chat Panel',
    w_ai_cmd: 'Quick Commands',
    w_gainers_losers: 'Gainers/Losers',
    w_heatmap: 'Heatmap',
    w_key_indices: 'Key Indices',
    w_global_idx: 'Global Indices',
    w_forex_comm: 'FX & Commodities',
    w_kline_mini: 'Mini Chart',
    w_watchlist_table: 'Watchlist Table',
    w_mini_charts: 'Mini Charts',
    w_kline: 'Candlestick',
    w_volume_profile: 'Volume Profile',
    w_wrb: 'WRB Signals',
    w_indicators: 'Indicators',
    w_crypto_heatmap: 'Crypto Heatmap',
    w_sector_heatmap: 'Sector Heatmap',
    w_rank: 'Gainers/Losers',
    w_financials: 'Financials',
    w_earnings_compare: 'Earnings Compare',
    w_cashflow: 'Cash Flow',
    w_overlay: 'Overlay Chart',
    w_correlation: 'Correlation Matrix',
    w_ratio: 'Ratio Chart',
    w_world_indices: 'World Indices',
    w_fx_matrix: 'FX Matrix',
    w_rates: 'Interest Rates',
    w_gdp_cpi: 'GDP / CPI',
    w_holdings: 'Holdings',
    w_pnl: 'P&L Overview',
    w_var: 'VaR Exposure',
    w_drawdown: 'Max Drawdown',
    w_signal_scan: 'Signal Scanner',
    w_strategy: 'Strategy Backtest',
    w_report_gen: 'Generate Report',
    w_summary: 'AI Summary',
    w_screener: 'Screener',
    w_filter_builder: 'Filter Builder',
    tab_ck: 'Analysis',
    tab_now: 'Snapshot',
    tab_hm: 'Heatmap',
    tab_ai: 'AI',
    tab_more: 'More',
    placeholder_coming_soon: 'Coming Soon',
    w_four_markets: 'Multi-Market',
    w_market_mood: 'Market Mood',
    btn_agent: 'Agent',
    // Chart types
    ct_candle_solid: 'Solid Candle',
    ct_candle_stroke: 'Hollow Candle',
    ct_ohlc: 'OHLC',
    ct_price_line: 'Price Line',
    ct_area: 'Area',
    // Indicator descriptions
    ind_ma_desc: 'Moving Average',
    ind_ema_desc: 'Exponential MA',
    ind_boll_desc: 'Bollinger Bands',
    ind_vwap_desc: 'Vol Weighted Avg Price',
    ind_vp_desc: 'Volume Profile',
    ind_wrb_desc: 'Wide Range Bar',
    ind_rsi_desc: 'Relative Strength',
    ind_macd_desc: 'MACD',
    ind_kdj_desc: 'Stochastic',
    ind_atr_desc: 'Average True Range',
    // Indicator groups
    ind_group_main: 'Main Overlays',
    ind_group_sub: 'Sub Indicators',
    // Search placeholders
    ph_search_symbol: 'Search symbol...',
    ph_search_indicator: 'Search indicator...',
    // Buttons
    btn_drawing: 'Drawing Tools',
    btn_settings: 'Settings',
    btn_screenshot: 'Screenshot',
    btn_fullscreen: 'Fullscreen',
    btn_refresh: 'Refresh',
    btn_close: 'Close',
    // Triggers
    ind_trigger: 'ƒx Indicators',
    ind_trigger_chart: '📊 Indicators',
    // Search states
    search_searching: 'Searching...',
    search_no_results: 'No results',
    search_results: 'Search Results',
    // Chat
    btn_open_ai: 'Open AI Assistant',
    // Settings
    settings_title: 'Settings',
    settings_language: 'Language',
    settings_lang_zh: '中文',
    settings_lang_en: 'English',
    settings_agent: 'Agent Config',
    settings_agent_endpoint: 'API Endpoint',
    settings_agent_toggle: 'Agent Toggle',
    settings_agent_on: 'Enabled',
    settings_agent_off: 'Disabled',
    settings_data: 'Data Sources (BYOK)',
    settings_data_us: 'US Stocks API Key (FMP)',
    settings_data_cn: 'A-Share API Key (EODHD)',
    settings_data_metal: 'Metal/FX API Key',
    settings_data_crypto_free: 'Crypto Free (Bybit)',
    settings_display: 'Display',
    settings_default_market: 'Default Market',
    settings_default_period: 'Default Period',
    settings_theme: 'Theme',
    settings_theme_dark: 'Dark',
    settings_about: 'About',
    settings_version: 'Version',
    settings_github: 'GitHub',
    settings_save: 'Save',
    settings_saved: 'Saved',
  },
};

// Load saved lang from localStorage, default to 'zh'
function loadLang(): Lang {
  try {
    const saved = localStorage.getItem('gainlab-lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch { /* SSR or blocked */ }
  return 'zh';
}

let currentLang: Lang = loadLang();

/** Get current language */
export function getLang(): Lang {
  return currentLang;
}

/** Set current language (also persists to localStorage) */
export function setLang(lang: Lang) {
  currentLang = lang;
  try { localStorage.setItem('gainlab-lang', lang); } catch { /* ignore */ }
}

/** Translate key to current language string. Falls back to key itself. */
export function t(key: string): string {
  return translations[currentLang][key] || key;
}
