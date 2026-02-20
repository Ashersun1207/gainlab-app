import type { ReactNode } from 'react';
import { t } from '../i18n';

interface WidgetPanelProps {
  title: string;
  subtitle?: string;
  /** Hide the ⟲ ⛶ ✕ action buttons (default: shown) */
  hideActions?: boolean;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onClose?: () => void;
  children: ReactNode;
}

const noop = () => { /* placeholder */ };

export function WidgetPanel({
  title,
  subtitle,
  hideActions = false,
  onRefresh,
  onFullscreen,
  onClose,
  children,
}: WidgetPanelProps) {
  return (
    <div className="wp">
      <div className="wph">
        <div className="wph-title">{title}</div>
        {subtitle && <div className="wph-sym">{subtitle}</div>}
        <div className="wph-spc" />
        {!hideActions && (
          <>
            <button className="wph-btn" title={t('btn_refresh')} onClick={onRefresh ?? noop}>⟲</button>
            <button className="wph-btn" title={t('btn_fullscreen')} onClick={onFullscreen ?? noop}>⛶</button>
            <button className="wph-btn" title={t('btn_close')} onClick={onClose ?? noop}>✕</button>
          </>
        )}
      </div>
      <div className="wpb">{children}</div>
    </div>
  );
}
