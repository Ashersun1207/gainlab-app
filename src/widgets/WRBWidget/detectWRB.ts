import type { KLineData, WRBSignal } from '../../types/data';

/**
 * WRB (Wide Range Body) 信号检测
 * 规则：当前 K 线 body > 前 3 根 body 均值 × 1.5 → WRB 信号
 * ⚠️ 简化版，完整 WRB Analysis 含 Hidden Gap / Zone 检测
 */
export function detectWRB(data: KLineData[]): WRBSignal[] {
  const signals: WRBSignal[] = [];

  for (let i = 3; i < data.length; i++) {
    const body = Math.abs(data[i].close - data[i].open);
    const avgBody =
      (Math.abs(data[i - 1].close - data[i - 1].open) +
        Math.abs(data[i - 2].close - data[i - 2].open) +
        Math.abs(data[i - 3].close - data[i - 3].open)) /
      3;

    if (avgBody > 0 && body > avgBody * 1.5) {
      signals.push({
        timestamp: data[i].timestamp,
        type: 'wrb',
        direction: data[i].close >= data[i].open ? 'bullish' : 'bearish',
        score: Math.min(body / avgBody, 5),
      });
    }
  }

  return signals;
}
