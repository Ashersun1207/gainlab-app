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
  },
};

// Default language — could be made reactive later
let currentLang: Lang = 'zh';

/** Get current language */
export function getLang(): Lang {
  return currentLang;
}

/** Set current language */
export function setLang(lang: Lang) {
  currentLang = lang;
}

/** Translate key to current language string. Falls back to key itself. */
export function t(key: string): string {
  return translations[currentLang][key] || key;
}
