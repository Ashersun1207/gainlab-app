import { t } from '../i18n';

interface WidgetControlsProps {
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onRemove?: () => void;
}

export function WidgetControls({ onRefresh, onFullscreen, onRemove }: WidgetControlsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="w-[20px] h-[20px] rounded flex items-center justify-center text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] text-xs transition-colors"
          title={t('btn_refresh')}
          aria-label="Refresh"
        >
          ⟲
        </button>
      )}
      {onFullscreen && (
        <button
          onClick={onFullscreen}
          className="w-[20px] h-[20px] rounded flex items-center justify-center text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] text-xs transition-colors"
          title={t('btn_fullscreen')}
          aria-label="Fullscreen"
        >
          ⛶
        </button>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-[20px] h-[20px] rounded flex items-center justify-center text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] text-xs transition-colors"
          title={t('btn_close')}
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}
