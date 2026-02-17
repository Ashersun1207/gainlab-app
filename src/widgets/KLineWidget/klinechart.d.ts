/**
 * KLineChart 类型声明（极简版）
 * 完整类型在 KLineChart/index.ts，但因 strict mode 不兼容故排除
 */

export interface KLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  turnover?: number;
  [key: string]: unknown;
}

export interface Chart {
  setDataList(data: KLineData[]): void;
  updateData(data: KLineData): void;
  createIndicator(name: string, isStack?: boolean, options?: { id?: string }): string | null;
  resize(): void;
  destroy(): void;
}

export interface ChartOptions {
  styles?: Record<string, unknown>;
}

declare module './KLineChart/index' {
  export function init(dom: HTMLElement, options?: ChartOptions): Chart | null;
  export function dispose(dom: HTMLElement): void;
}
