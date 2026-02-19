/**
 * Settings panel — slide-out overlay from left.
 * Sections: Language, Agent, Data Sources, Display, About.
 */

import { useState, useCallback } from 'react';
import { t, getLang, setLang } from '../../i18n';
import type { ReactElement } from 'react';

type Lang = 'zh' | 'en';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  onLangChange?: (lang: Lang) => void;
}

// ── localStorage helpers ──

function loadByok(): Record<string, string> {
  try {
    const raw = localStorage.getItem('gainlab-byok');
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }
  return {};
}

function saveByok(keys: Record<string, string>) {
  localStorage.setItem('gainlab-byok', JSON.stringify(keys));
}

interface AgentConfig {
  endpoint: string;
  enabled: boolean;
  model: string;
  style: string;
  autoAnalysis: boolean;
}

const AGENT_DEFAULTS: AgentConfig = {
  endpoint: 'https://gainlab-api.asher-sun.workers.dev/api/chat',
  enabled: true,
  model: 'auto',
  style: 'concise',
  autoAnalysis: false,
};

function loadAgentConfig(): AgentConfig {
  try {
    const raw = localStorage.getItem('gainlab-agent');
    if (raw) return { ...AGENT_DEFAULTS, ...JSON.parse(raw) as Partial<AgentConfig> };
  } catch { /* ignore */ }
  return { ...AGENT_DEFAULTS };
}

function saveAgentConfig(cfg: AgentConfig) {
  localStorage.setItem('gainlab-agent', JSON.stringify(cfg));
}

interface DisplayConfig {
  market: string;
  period: string;
}

function loadDisplayConfig(): DisplayConfig {
  try {
    const raw = localStorage.getItem('gainlab-display');
    if (raw) return JSON.parse(raw) as DisplayConfig;
  } catch { /* ignore */ }
  return { market: 'crypto', period: '1D' };
}

function saveDisplayConfig(cfg: DisplayConfig) {
  localStorage.setItem('gainlab-display', JSON.stringify(cfg));
}

export function Settings({ open, onClose, onLangChange }: SettingsProps): ReactElement | null {
  if (!open) return null;
  return <SettingsInner onClose={onClose} onLangChange={onLangChange} />;
}

/** Inner component — mounts fresh each time the panel opens, so state auto-resets. */
function SettingsInner({ onClose, onLangChange }: Omit<SettingsProps, 'open'>): ReactElement {
  const [lang, setLangLocal] = useState<Lang>(getLang());
  const [byok, setByok] = useState(loadByok);
  const [agent, setAgent] = useState(loadAgentConfig);
  const [display, setDisplay] = useState(loadDisplayConfig);
  const [saved, setSaved] = useState(false);

  const handleLangChange = useCallback((newLang: Lang) => {
    setLangLocal(newLang);
    setLang(newLang);
    onLangChange?.(newLang);
  }, [onLangChange]);

  const handleSave = useCallback(() => {
    saveByok(byok);
    saveAgentConfig(agent);
    saveDisplayConfig(display);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [byok, agent, display]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const markets = ['crypto', 'us', 'cn', 'metal'];
  const marketLabels: Record<string, string> = { crypto: 'Crypto', us: 'US', cn: 'A股', metal: 'Metal' };
  const periods = ['1H', '4H', '1D', '1W'];

  return (
    <div className="settings-overlay" onClick={handleBackdropClick}>
      <div className="settings-panel">
        {/* Header */}
        <div className="settings-header">
          <span className="settings-title">{t('settings_title')}</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          {/* ── 1. Language ── */}
          <div className="settings-section">
            <div className="settings-section-title">🌐 {t('settings_language')}</div>
            <div className="settings-lang-group">
              <button
                className={`settings-lang-btn ${lang === 'zh' ? 'active' : ''}`}
                onClick={() => handleLangChange('zh')}
              >
                {t('settings_lang_zh')}
              </button>
              <button
                className={`settings-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleLangChange('en')}
              >
                {t('settings_lang_en')}
              </button>
            </div>
          </div>

          {/* ── 2. Agent Config ── */}
          <div className="settings-section">
            <div className="settings-section-title">🤖 {t('settings_agent')}</div>

            {/* Agent on/off */}
            <div className="settings-row">
              <span className="settings-label">{t('settings_agent_toggle')}</span>
              <button
                className={`settings-toggle ${agent.enabled ? 'on' : ''}`}
                onClick={() => setAgent({ ...agent, enabled: !agent.enabled })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-label">
                {agent.enabled ? t('settings_agent_on') : t('settings_agent_off')}
              </span>
            </div>

            {/* API Endpoint */}
            <label className="settings-label">{t('settings_agent_endpoint')}</label>
            <input
              className="settings-input"
              value={agent.endpoint}
              onChange={(e) => setAgent({ ...agent, endpoint: e.target.value })}
              placeholder="https://..."
            />

            {/* Model preference */}
            <label className="settings-label">{t('settings_agent_model')}</label>
            <div className="settings-pill-group">
              {['auto', 'gpt-4o', 'claude', 'deepseek'].map((m) => (
                <button
                  key={m}
                  className={`settings-pill ${agent.model === m ? 'active' : ''}`}
                  onClick={() => setAgent({ ...agent, model: m })}
                >
                  {m === 'auto' ? 'Auto' : m === 'gpt-4o' ? 'GPT-4o' : m === 'claude' ? 'Claude' : 'DeepSeek'}
                </button>
              ))}
            </div>

            {/* Analysis style */}
            <label className="settings-label">{t('settings_agent_style')}</label>
            <div className="settings-pill-group">
              {(['concise', 'detailed', 'technical', 'fundamental'] as const).map((s) => (
                <button
                  key={s}
                  className={`settings-pill ${agent.style === s ? 'active' : ''}`}
                  onClick={() => setAgent({ ...agent, style: s })}
                >
                  {t(`settings_style_${s}`)}
                </button>
              ))}
            </div>

            {/* Auto-analysis on symbol switch */}
            <div className="settings-row">
              <span className="settings-label">{t('settings_agent_auto')}</span>
              <button
                className={`settings-toggle ${agent.autoAnalysis ? 'on' : ''}`}
                onClick={() => setAgent({ ...agent, autoAnalysis: !agent.autoAnalysis })}
              >
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-label">
                {agent.autoAnalysis ? t('settings_agent_on') : t('settings_agent_off')}
              </span>
            </div>
          </div>

          {/* ── 3. Data Sources (BYOK) ── */}
          <div className="settings-section">
            <div className="settings-section-title">📊 {t('settings_data')}</div>
            <label className="settings-label">{t('settings_data_us')}</label>
            <input
              className="settings-input"
              value={byok.us ?? ''}
              onChange={(e) => setByok({ ...byok, us: e.target.value })}
              placeholder="FMP API Key"
            />
            <label className="settings-label">{t('settings_data_cn')}</label>
            <input
              className="settings-input"
              value={byok.cn ?? ''}
              onChange={(e) => setByok({ ...byok, cn: e.target.value })}
              placeholder="EODHD API Key"
            />
            <label className="settings-label">{t('settings_data_metal')}</label>
            <input
              className="settings-input"
              value={byok.metal ?? ''}
              onChange={(e) => setByok({ ...byok, metal: e.target.value })}
              placeholder="Metal/FX API Key"
            />
            <div className="settings-note">💚 {t('settings_data_crypto_free')}</div>
          </div>

          {/* ── 4. Display ── */}
          <div className="settings-section">
            <div className="settings-section-title">🎨 {t('settings_display')}</div>
            <label className="settings-label">{t('settings_default_market')}</label>
            <div className="settings-pill-group">
              {markets.map((m) => (
                <button
                  key={m}
                  className={`settings-pill ${display.market === m ? 'active' : ''}`}
                  onClick={() => setDisplay({ ...display, market: m })}
                >
                  {marketLabels[m]}
                </button>
              ))}
            </div>
            <label className="settings-label">{t('settings_default_period')}</label>
            <div className="settings-pill-group">
              {periods.map((p) => (
                <button
                  key={p}
                  className={`settings-pill ${display.period === p ? 'active' : ''}`}
                  onClick={() => setDisplay({ ...display, period: p })}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="settings-row">
              <span className="settings-label">{t('settings_theme')}</span>
              <button className="settings-toggle disabled" disabled>
                <span className="settings-toggle-knob" />
              </button>
              <span className="settings-toggle-label">{t('settings_theme_dark')}</span>
            </div>
          </div>

          {/* ── 5. About ── */}
          <div className="settings-section">
            <div className="settings-section-title">ℹ️ {t('settings_about')}</div>
            <div className="settings-about-row">
              <span>{t('settings_version')}</span>
              <span className="settings-about-val">v0.1.0</span>
            </div>
            <div className="settings-about-row">
              <span>{t('settings_github')}</span>
              <a
                className="settings-link"
                href="https://github.com/Ashersun1207/gainlab-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ashersun1207/gainlab-app
              </a>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="settings-footer">
          <button className="settings-save-btn" onClick={handleSave}>
            {saved ? `✓ ${t('settings_saved')}` : t('settings_save')}
          </button>
        </div>
      </div>
    </div>
  );
}
