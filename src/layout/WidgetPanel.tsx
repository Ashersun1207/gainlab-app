import type { ReactNode } from 'react';

interface WidgetPanelProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onClose?: () => void;
  children: ReactNode;
}

export function WidgetPanel({
  title,
  subtitle,
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
        {onRefresh && (
          <button className="wph-btn" title="刷新" onClick={onRefresh}>⟲</button>
        )}
        {onFullscreen && (
          <button className="wph-btn" title="全屏" onClick={onFullscreen}>⛶</button>
        )}
        {onClose && (
          <button className="wph-btn" title="关闭" onClick={onClose}>✕</button>
        )}
      </div>
      <div className="wpb">{children}</div>
    </div>
  );
}
