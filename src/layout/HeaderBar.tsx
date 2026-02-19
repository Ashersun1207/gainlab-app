import type { ReactElement } from 'react';
import { t } from '../i18n';

interface HeaderBarProps {
  onToggleChat?: () => void;
}

export function HeaderBar({ onToggleChat }: HeaderBarProps): ReactElement {
  // Read BYOK config from localStorage to determine data source status
  let byokKeys: Record<string, string> = {};
  try {
    const raw = localStorage.getItem('gainlab-byok');
    if (raw) {
      byokKeys = JSON.parse(raw) as Record<string, string>;
    }
  } catch {
    // ignore parse errors
  }

  const hasKey = (key: string): boolean => Boolean(byokKeys[key]);

  // Crypto is always green (uses Bybit public API, no key needed)
  const sources: { label: string; online: boolean }[] = [
    { label: 'Crypto', online: true },
    { label: 'US', online: hasKey('us') },
    { label: 'A股', online: hasKey('cn') },
    { label: 'Metal', online: hasKey('metal') },
  ];

  const dotOnline = '#26a69a';
  const dotOffline = '#5a5a8a';

  return (
    <div
      style={{
        height: 40,
        background: '#0d0d20',
        borderBottom: '1px solid #1e1e3a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <span
        style={{
          background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        GainLab
      </span>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 18,
          background: '#2a2a4a',
          flexShrink: 0,
        }}
      />

      {/* Data source status pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        {sources.map(({ label, online }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 7px',
              borderRadius: 4,
              background: '#1a1a3e',
              color: '#8888aa',
            }}
          >
            <div
              data-testid={`dot-${label}`}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: online ? dotOnline : dotOffline,
                flexShrink: 0,
              }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Right buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Theme toggle button */}
        <button
          onClick={() => {
            /* placeholder */
          }}
          aria-label="Toggle theme"
          style={{
            padding: '3px 8px',
            borderRadius: 5,
            fontSize: 11,
            border: '1px solid #2a2a4a',
            color: '#8888aa',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          🌙
        </button>

        {/* Agent button (highlighted by default) */}
        <button
          onClick={onToggleChat}
          aria-label="Agent"
          style={{
            padding: '3px 10px',
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            border: '1px solid #2563eb',
            color: '#fff',
            background: '#2563eb',
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
        >
          {t('btn_agent')}
        </button>
      </div>
    </div>
  );
}
