import { TIME_INTERVALS } from '../constants/markets';
import type { TimeInterval } from '../types/market';

interface IntervalPickerProps {
  value: TimeInterval;
  onChange: (interval: TimeInterval) => void;
}

export function IntervalPicker({ value, onChange }: IntervalPickerProps) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Time interval">
      {TIME_INTERVALS.map(({ value: interval, label }) => {
        const isActive = value === interval;
        return (
          <button
            key={interval}
            onClick={() => onChange(interval)}
            className={[
              'px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors',
              isActive
                ? 'bg-[#2563eb] text-white'
                : 'text-[#5a5a8a] hover:text-[#e0e0f0]',
            ].join(' ')}
            aria-pressed={isActive}
            title={label}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
