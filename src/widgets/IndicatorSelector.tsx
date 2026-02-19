import { useState, useCallback } from 'react';
import { t } from '../i18n';

interface IndicatorItem {
  id: string;
  name: string;
  descKey: string;
}

interface IndicatorGroup {
  titleKey: string;
  items: IndicatorItem[];
}

const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    titleKey: 'ind_group_main',
    items: [
      { id: 'MA', name: 'MA', descKey: 'ind_ma_desc' },
      { id: 'EMA', name: 'EMA', descKey: 'ind_ema_desc' },
      { id: 'BOLL', name: 'BOLL', descKey: 'ind_boll_desc' },
      { id: 'VWAP', name: 'VWAP', descKey: 'ind_vwap_desc' },
      { id: 'VP', name: 'VP', descKey: 'ind_vp_desc' },
      { id: 'WRB', name: 'WRB', descKey: 'ind_wrb_desc' },
    ],
  },
  {
    titleKey: 'ind_group_sub',
    items: [
      { id: 'RSI', name: 'RSI', descKey: 'ind_rsi_desc' },
      { id: 'MACD', name: 'MACD', descKey: 'ind_macd_desc' },
      { id: 'KDJ', name: 'KDJ', descKey: 'ind_kdj_desc' },
      { id: 'ATR', name: 'ATR', descKey: 'ind_atr_desc' },
    ],
  },
];

interface IndicatorSelectorProps {
  /** 当前激活的指标 id 列表 */
  active: string[];
  /** toggle 单个指标回调 */
  onChange: (indicator: string) => void;
}

export function IndicatorSelector({ active, onChange }: IndicatorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      onChange(id);
    },
    [onChange],
  );

  const activeCount = active.length;

  // Filter groups by search query
  const filteredGroups = query.trim()
    ? INDICATOR_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            t(item.descKey).toLowerCase().includes(query.toLowerCase()),
        ),
      })).filter((group) => group.items.length > 0)
    : INDICATOR_GROUPS;

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-semibold text-[#e0e0f0] hover:bg-[#1e1e3a] transition-colors select-none"
        aria-label="Select indicators"
        data-testid="indicator-selector-trigger"
      >
        <span>{t('ind_trigger_chart')}</span>
        {activeCount > 0 && (
          <span
            className="flex items-center justify-center w-4 h-4 rounded-full bg-[#2563eb] text-white text-[9px] font-bold"
            data-testid="indicator-count-badge"
          >
            {activeCount}
          </span>
        )}
        <span className="text-[#5a5a8a] text-[10px]">▾</span>
      </button>

      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[199]"
          onClick={handleClose}
          data-testid="indicator-selector-backdrop"
        />
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 bg-[#0d0d20] border border-[#3a3a6a] rounded-lg shadow-[0_12px_40px_rgba(0,0,0,.6)] z-[200] overflow-hidden"
          style={{ width: 240 }}
          data-testid="indicator-selector-panel"
        >
          {/* Search */}
          <div className="p-2 border-b border-[#2a2a4a]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('ph_search_indicator')}
              className="w-full px-2 py-1.5 bg-[#1a1a3e] border border-[#2a2a4a] rounded text-[#e0e0f0] text-[11px] placeholder-[#5a5a8a] outline-none"
            />
          </div>

          {/* Groups */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {filteredGroups.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-[#5a5a8a]">{t('search_no_results')}</div>
            )}
            {filteredGroups.map((group) => (
              <div key={group.titleKey}>
                <div className="px-3 pt-2 pb-1 text-[8px] text-[#5a5a8a] uppercase tracking-wider">
                  {t(group.titleKey)}
                </div>
                {group.items.map((item) => {
                  const isActive = active.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggle(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#1e1e3a] transition-colors text-left"
                      aria-pressed={isActive}
                      data-testid={`indicator-item-${item.id}`}
                    >
                      <div>
                        <span className="text-[12px] font-semibold text-[#e0e0f0]">
                          {item.name}
                        </span>
                        <span className="ml-2 text-[10px] text-[#5a5a8a]">{t(item.descKey)}</span>
                      </div>
                      {/* Toggle switch */}
                      <div
                        className={[
                          'relative w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0',
                          isActive ? 'bg-[#2563eb]' : 'bg-[#2a2a4a]',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        <div
                          className={[
                            'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200',
                            isActive ? 'translate-x-4' : 'translate-x-0.5',
                          ].join(' ')}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
