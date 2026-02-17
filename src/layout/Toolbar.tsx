import { TIME_INTERVALS, AVAILABLE_INDICATORS } from '../constants/markets';
import type { TimeInterval } from '../types/market';

interface ToolbarProps {
  symbolDisplay: string; // e.g. "BTC / USDT"
  price?: number;
  changePercent?: number;
  interval: TimeInterval;
  activeIndicators: string[];
  onIntervalChange: (interval: TimeInterval) => void;
  onIndicatorToggle: (indicator: string) => void;
}

export function Toolbar({
  symbolDisplay,
  price,
  changePercent,
  interval,
  activeIndicators,
  onIntervalChange,
  onIndicatorToggle,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-[#0d0d20] border-b border-[#1e1e3a] flex-shrink-0 overflow-x-auto">
      {/* 资产名 + 价格 */}
      <div className="flex items-center gap-2 mr-2 flex-shrink-0">
        <span className="text-white font-semibold text-sm">{symbolDisplay}</span>
        {price != null && (
          <span className="text-[#d0d0f0] font-mono text-sm">
            {price.toLocaleString()}
          </span>
        )}
        {changePercent != null && (
          <span
            className={`font-mono text-xs ${changePercent >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}
          >
            {changePercent >= 0 ? '+' : ''}
            {changePercent.toFixed(2)}%
          </span>
        )}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-[#2a2a4a] flex-shrink-0" />

      {/* 时间周期 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {TIME_INTERVALS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onIntervalChange(value)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors
              ${
                interval === value
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#8888aa] hover:text-white hover:bg-[#1e1e3a]'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="w-px h-5 bg-[#2a2a4a] flex-shrink-0" />

      {/* 指标 toggle */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {AVAILABLE_INDICATORS.map((ind) => (
          <button
            key={ind}
            onClick={() => onIndicatorToggle(ind)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors
              ${
                activeIndicators.includes(ind)
                  ? 'bg-[#1e3a5f] text-[#60a5fa]'
                  : 'text-[#6666aa] hover:text-[#aaaacc] hover:bg-[#16162a]'
              }`}
          >
            {ind}
          </button>
        ))}
      </div>
    </div>
  );
}
