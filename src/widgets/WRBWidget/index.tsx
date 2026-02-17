import { useMemo } from 'react';
import type { KLineData } from '../../types/data';
import { detectWRB } from './detectWRB';

interface WRBWidgetProps {
  klineData: KLineData[];
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function WRBWidget({ klineData }: WRBWidgetProps) {
  const signals = useMemo(() => detectWRB(klineData), [klineData]);

  if (klineData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#6666aa] text-sm">
        请先选择资产以检测 WRB 信号
      </div>
    );
  }

  const bullish = signals.filter((s) => s.direction === 'bullish').length;
  const bearish = signals.filter((s) => s.direction === 'bearish').length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0d0d20]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e3a] flex-shrink-0">
        <div className="text-sm text-[#d0d0f0] font-medium">
          WRB 信号检测
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[#22c55e]">▲ 多 {bullish}</span>
          <span className="text-[#ef4444]">▼ 空 {bearish}</span>
          <span className="text-[#8888aa]">共 {signals.length}</span>
        </div>
      </div>

      {/* Description */}
      <div className="px-3 py-1 text-[10px] text-[#4a4a7a] border-b border-[#1e1e3a] flex-shrink-0">
        body &gt; 前3根均值 × 1.5 = WRB 信号（简化版，非完整 WRB Analysis）
      </div>

      {/* Signal list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {signals.length === 0 ? (
          <div className="text-[#6666aa] text-sm text-center pt-8">
            未检测到 WRB 信号
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {signals
              .slice()
              .reverse()
              .slice(0, 50)
              .map((s) => (
                <div
                  key={s.timestamp}
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-[#13132a] text-xs"
                >
                  <span className="text-[#aaaacc]">
                    {formatDate(s.timestamp)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        s.direction === 'bullish'
                          ? 'text-[#22c55e]'
                          : 'text-[#ef4444]'
                      }
                    >
                      {s.direction === 'bullish' ? '▲ 多' : '▼ 空'}
                    </span>
                    <span className="text-[#8888aa]">
                      {s.score.toFixed(1)}×
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
