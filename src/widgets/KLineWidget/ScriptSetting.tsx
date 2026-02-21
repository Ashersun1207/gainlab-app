import { useState, useCallback } from 'react';
import { t } from '../../i18n';

/* ── Types (mirrors ScriptParser output) ── */

export interface ScriptInput {
  key: string;
  title: string;
  type: string; // 'int' | 'float' | 'bool' | 'select'
  defaultValue: unknown;
  value: unknown;
  min?: number;
  max?: number;
}

export interface ScriptStyle {
  key: string;
  title: string;
  type: string; // 'color' | 'line' | 'width' | ...
  defaultValue: unknown;
  value: unknown;
}

export interface ScriptSettingProps {
  scriptName: string;
  inputs: ScriptInput[];
  styles: ScriptStyle[];
  onClose: () => void;
  onConfirm: (data: { inputs: ScriptInput[]; styles: ScriptStyle[] }) => void;
}

/* ── Component ── */

export function ScriptSetting({
  scriptName,
  inputs: initialInputs,
  styles: initialStyles,
  onClose,
  onConfirm,
}: ScriptSettingProps) {
  const hasTabs = initialInputs.length > 0 && initialStyles.length > 0;
  const defaultTab = initialInputs.length > 0 ? 'inputs' : 'styles';

  const [tab, setTab] = useState<'inputs' | 'styles'>(defaultTab);
  const [inputs, setInputs] = useState<ScriptInput[]>(() =>
    initialInputs.map((i) => ({ ...i })),
  );
  const [styles, setStyles] = useState<ScriptStyle[]>(() =>
    initialStyles.map((s) => ({ ...s })),
  );

  /* ── input handlers ── */
  const updateInput = useCallback((key: string, val: unknown) => {
    setInputs((prev) =>
      prev.map((i) => (i.key === key ? { ...i, value: val } : i)),
    );
  }, []);

  const updateStyle = useCallback((key: string, val: unknown) => {
    setStyles((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: val } : s)),
    );
  }, []);

  const handleReset = useCallback(() => {
    setInputs((prev) => prev.map((i) => ({ ...i, value: i.defaultValue })));
    setStyles((prev) => prev.map((s) => ({ ...s, value: s.defaultValue })));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm({ inputs, styles });
  }, [inputs, styles, onConfirm]);

  /* ── render helpers ── */
  const renderInput = (item: ScriptInput) => {
    if (item.type === 'int' || item.type === 'float') {
      return (
        <div key={item.key} className="ss-row">
          <label className="ss-label">{item.title}</label>
          <input
            type="number"
            className="ss-number"
            value={item.value as number}
            min={item.min}
            max={item.max}
            step={item.type === 'float' ? 0.1 : 1}
            onChange={(e) => {
              const raw = e.target.value;
              const num = item.type === 'float' ? parseFloat(raw) : parseInt(raw, 10);
              if (!isNaN(num)) {
                const clamped = Math.min(
                  Math.max(num, item.min ?? -Infinity),
                  item.max ?? Infinity,
                );
                updateInput(item.key, clamped);
              }
            }}
          />
        </div>
      );
    }
    return null;
  };

  const renderStyle = (item: ScriptStyle) => {
    if (item.type === 'color') {
      const colorVal =
        typeof item.value === 'string' ? item.value : String(item.defaultValue);
      return (
        <div key={item.key} className="ss-row">
          <label className="ss-label">{item.title}</label>
          <div className="ss-color-wrap">
            <input
              type="color"
              className="ss-color"
              value={colorVal}
              onChange={(e) => updateStyle(item.key, e.target.value)}
            />
            <span className="ss-color-hex">{colorVal}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* backdrop */}
      <div className="ss-backdrop" onClick={onClose} />

      {/* panel */}
      <div className="ss-panel">
        {/* header */}
        <div className="ss-header">
          <span className="ss-title">{scriptName} {t('ss_title')}</span>
          <button className="ss-close" onClick={onClose}>✕</button>
        </div>

        {/* tabs */}
        {hasTabs && (
          <div className="ss-tabs">
            <button
              className={`ss-tab${tab === 'inputs' ? ' on' : ''}`}
              onClick={() => setTab('inputs')}
            >
              {t('ss_tab_params')}
            </button>
            <button
              className={`ss-tab${tab === 'styles' ? ' on' : ''}`}
              onClick={() => setTab('styles')}
            >
              {t('ss_tab_styles')}
            </button>
          </div>
        )}

        {/* body */}
        <div className="ss-body">
          {tab === 'inputs' && inputs.map(renderInput)}
          {tab === 'styles' && styles.map(renderStyle)}
        </div>

        {/* actions */}
        <div className="ss-actions">
          <button className="ss-btn" onClick={handleReset}>
            {t('ss_reset')}
          </button>
          <button className="ss-btn ss-btn-primary" onClick={handleConfirm}>
            {t('ss_confirm')}
          </button>
        </div>
      </div>
    </>
  );
}
