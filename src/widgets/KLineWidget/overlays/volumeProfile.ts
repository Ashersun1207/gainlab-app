/**
 * Volume Profile Overlay for KLineChart
 *
 * 在 K 线图右侧绘制水平量能柱（Volume Profile），直接叠加在主图上。
 * - POC (Point of Control): 金色高亮
 * - Value Area (VAH ~ VAL): 绿色半透明
 * - 区域外: 暗紫色
 * - 买量: 右侧绿色 | 卖量: 左侧红色（双色分割）
 *
 * 通过 registerOverlay 从外部注册，不修改 KLineChart 内部文件。
 */

import type { VolumeProfileData } from '../../../types/data';

export interface VPExtendData {
  vpData: VolumeProfileData;
}

/** 最大柱宽占图表宽度的比例 */
const MAX_WIDTH_RATIO = 0.25;
/** 柱高缩放（留间隔） */
const BAR_HEIGHT_FACTOR = 0.85;

const COLORS = {
  poc: 'rgba(255, 193, 7, 0.6)',       // 金色 — POC
  pocBorder: 'rgba(255, 193, 7, 0.9)',
  valueArea: 'rgba(34, 197, 94, 0.3)',  // 绿色 — Value Area
  outside: 'rgba(100, 100, 180, 0.15)', // 暗紫 — 区域外
  buy: 'rgba(34, 197, 94, 0.45)',       // 买量
  sell: 'rgba(239, 68, 68, 0.35)',      // 卖量
  pocLine: 'rgba(255, 193, 7, 0.4)',    // POC 水平虚线
  vahValLine: 'rgba(34, 197, 94, 0.25)',// VAH/VAL 水平虚线
} as const;

export const volumeProfileTemplate = {
  name: 'volume_profile',
  totalStep: 0, // 程序化创建，无用户交互
  lock: true,
  visible: true,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({
    overlay,
    bounding,
    yAxis,
  }: {
    overlay: { extendData: VPExtendData };
    bounding: { width: number; height: number };
    yAxis: { convertToPixel: (value: number) => number } | null;
    coordinates: Array<{ x: number; y: number }>;
  }) => {
    const vpData = overlay.extendData?.vpData;
    if (!vpData || !vpData.levels || vpData.levels.length === 0 || !yAxis) {
      return [];
    }

    const { levels, poc, vah, val } = vpData;
    const figures: Array<{
      type: string;
      attrs: Record<string, unknown>;
      styles?: Record<string, unknown>;
      ignoreEvent: boolean;
    }> = [];

    const chartWidth = bounding.width;
    const maxBarWidth = chartWidth * MAX_WIDTH_RATIO;
    const maxVolume = Math.max(...levels.map((l) => l.volume));
    if (maxVolume === 0) return [];

    // 计算每层的高度（px）
    const binCount = levels.length;
    const priceRange = levels[binCount - 1].price - levels[0].price;
    const topY = yAxis.convertToPixel(levels[binCount - 1].price);
    const bottomY = yAxis.convertToPixel(levels[0].price);
    const totalPxHeight = Math.abs(bottomY - topY);
    const barHeight = Math.max((totalPxHeight / binCount) * BAR_HEIGHT_FACTOR, 1);

    // 从右侧向左画柱子
    const rightEdge = chartWidth;

    for (const level of levels) {
      const y = yAxis.convertToPixel(level.price);
      const barWidth = (level.volume / maxVolume) * maxBarWidth;
      if (barWidth < 0.5) continue;

      const isPOC = Math.abs(level.price - poc) < priceRange / binCount;
      const isValueArea = level.price >= val && level.price <= vah;

      // 买卖分割
      const totalVol = level.volume || 1;
      const buyRatio = level.buyVolume / totalVol;
      const buyWidth = barWidth * buyRatio;
      const sellWidth = barWidth - buyWidth;

      // 卖量（左边红色部分）
      if (sellWidth > 0.5) {
        figures.push({
          type: 'rect',
          attrs: {
            x: rightEdge - barWidth,
            y: y - barHeight / 2,
            width: sellWidth,
            height: barHeight,
          },
          styles: {
            style: 'fill',
            color: COLORS.sell,
          },
          ignoreEvent: true,
        });
      }

      // 买量（右边绿色部分）
      if (buyWidth > 0.5) {
        figures.push({
          type: 'rect',
          attrs: {
            x: rightEdge - buyWidth,
            y: y - barHeight / 2,
            width: buyWidth,
            height: barHeight,
          },
          styles: {
            style: 'fill',
            color: isPOC ? COLORS.poc : isValueArea ? COLORS.valueArea : COLORS.buy,
          },
          ignoreEvent: true,
        });
      }

      // POC 特殊边框
      if (isPOC) {
        figures.push({
          type: 'rect',
          attrs: {
            x: rightEdge - barWidth,
            y: y - barHeight / 2,
            width: barWidth,
            height: barHeight,
          },
          styles: {
            style: 'stroke',
            borderColor: COLORS.pocBorder,
            borderSize: 1,
          },
          ignoreEvent: true,
        });
      }
    }

    // POC 水平虚线（贯穿整个图表宽度）
    const pocY = yAxis.convertToPixel(poc);
    figures.push({
      type: 'line',
      attrs: {
        coordinates: [
          { x: 0, y: pocY },
          { x: chartWidth, y: pocY },
        ],
      },
      styles: {
        style: 'dashed',
        color: COLORS.pocLine,
        dashedValue: [4, 4],
        size: 1,
      },
      ignoreEvent: true,
    });

    // VAH 水平虚线
    const vahY = yAxis.convertToPixel(vah);
    figures.push({
      type: 'line',
      attrs: {
        coordinates: [
          { x: 0, y: vahY },
          { x: chartWidth, y: vahY },
        ],
      },
      styles: {
        style: 'dashed',
        color: COLORS.vahValLine,
        dashedValue: [3, 5],
        size: 1,
      },
      ignoreEvent: true,
    });

    // VAL 水平虚线
    const valY = yAxis.convertToPixel(val);
    figures.push({
      type: 'line',
      attrs: {
        coordinates: [
          { x: 0, y: valY },
          { x: chartWidth, y: valY },
        ],
      },
      styles: {
        style: 'dashed',
        color: COLORS.vahValLine,
        dashedValue: [3, 5],
        size: 1,
      },
      ignoreEvent: true,
    });

    return figures;
  },
};
