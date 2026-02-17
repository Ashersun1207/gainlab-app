import type { KLineData, VPLevel, VolumeProfileData } from '../../types/data';

/**
 * 本地计算 Volume Profile
 * POC = Point of Control（最大成交量价位）
 * VAH/VAL = Value Area High/Low（包含 70% 成交量的区间）
 */
export function calculateVP(
  data: KLineData[],
  bins = 50,
): VolumeProfileData {
  if (data.length === 0) {
    return { levels: [], poc: 0, vah: 0, val: 0 };
  }

  const prices = data.flatMap((d) => [d.high, d.low]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const step = (max - min) / bins || 1;

  const levels: VPLevel[] = Array.from({ length: bins }, (_, i) => ({
    price: min + step * (i + 0.5),
    volume: 0,
    buyVolume: 0,
    sellVolume: 0,
  }));

  for (const d of data) {
    const mid = (d.high + d.low) / 2;
    const idx = Math.min(Math.floor((mid - min) / step), bins - 1);
    if (idx >= 0 && idx < bins) {
      const vol = d.volume ?? 0;
      levels[idx].volume += vol;
      if (d.close >= d.open) {
        levels[idx].buyVolume += vol;
      } else {
        levels[idx].sellVolume += vol;
      }
    }
  }

  const maxVol = Math.max(...levels.map((l) => l.volume));
  const pocLevel = levels.find((l) => l.volume === maxVol) ?? levels[0];
  const pocIdx = levels.indexOf(pocLevel);

  // Value Area = 70% of total volume around POC
  const totalVol = levels.reduce((s, l) => s + l.volume, 0);
  let vaVol = pocLevel.volume;
  let lo = pocIdx;
  let hi = pocIdx;

  while (vaVol < totalVol * 0.7 && (lo > 0 || hi < bins - 1)) {
    const below = lo > 0 ? levels[lo - 1].volume : 0;
    const above = hi < bins - 1 ? levels[hi + 1].volume : 0;
    if (below >= above && lo > 0) {
      lo--;
      vaVol += levels[lo].volume;
    } else if (hi < bins - 1) {
      hi++;
      vaVol += levels[hi].volume;
    } else {
      lo--;
      vaVol += levels[lo].volume;
    }
  }

  return {
    levels,
    poc: pocLevel.price,
    vah: levels[hi].price,
    val: levels[lo].price,
  };
}
