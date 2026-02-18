/**
 * WRB (Wide Range Body) Highlight Overlay
 *
 * 在 K 线蜡烛体上绘制半透明矩形高亮，标识 WRB 信号。
 * - 多头 WRB: 绿色
 * - 空头 WRB: 红色
 *
 * 通过 registerOverlay 从外部注册，不修改 KLineChart 内部文件。
 */

export interface WRBExtendData {
  direction: 'bullish' | 'bearish';
  score: number;
}

const COLORS = {
  bullish: {
    fill: 'rgba(34, 197, 94, 0.25)',
    border: 'rgba(34, 197, 94, 0.6)',
  },
  bearish: {
    fill: 'rgba(239, 68, 68, 0.25)',
    border: 'rgba(239, 68, 68, 0.6)',
  },
} as const;

/**
 * OverlayTemplate for wrb_highlight.
 *
 * Each instance uses 2 points on the same timestamp:
 *   point[0] = { timestamp, value: open }
 *   point[1] = { timestamp, value: close }
 *
 * createPointFigures draws a rect figure covering the candle body.
 */
export const wrbHighlightTemplate = {
  name: 'wrb_highlight',
  totalStep: 0, // programmatic creation only — no user interaction
  lock: true,
  visible: true,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({
    coordinates,
    overlay,
  }: {
    coordinates: Array<{ x: number; y: number }>;
    overlay: { extendData: WRBExtendData };
  }) => {
    if (coordinates.length < 2) return [];

    const direction = overlay.extendData?.direction ?? 'bullish';
    const colors = COLORS[direction];

    const x0 = coordinates[0].x;
    const y0 = coordinates[0].y;
    const y1 = coordinates[1].y;

    const top = Math.min(y0, y1);
    const height = Math.abs(y1 - y0);

    // Width: approximate candle body width (fixed visual width centered on x)
    const candleWidth = 8;
    const left = x0 - candleWidth / 2;

    return [
      {
        type: 'rect',
        attrs: {
          x: left,
          y: top,
          width: candleWidth,
          height: Math.max(height, 1), // at least 1px
        },
        styles: {
          style: 'stroke_fill',
          color: colors.fill,
          borderColor: colors.border,
          borderSize: 1,
        },
        ignoreEvent: true,
      },
    ];
  },
};
