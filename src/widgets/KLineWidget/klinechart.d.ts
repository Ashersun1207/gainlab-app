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

export interface OverlayCreate {
  name: string;
  id?: string;
  groupId?: string;
  group?: string;
  paneId?: string;
  lock?: boolean;
  visible?: boolean;
  zLevel?: number;
  points?: Array<Partial<{ timestamp: number; dataIndex: number; value: number }>>;
  extendData?: unknown;
  styles?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface OverlayFilter {
  id?: string;
  groupId?: string;
  group?: string;
  name?: string;
  paneId?: string;
}

export interface Chart {
  setDataList(data: KLineData[]): void;
  getDataList(): KLineData[];
  updateData(data: KLineData): void;
  createIndicator(name: string, isStack?: boolean, options?: { id?: string }): string | null;
  createOverlay(value: string | OverlayCreate | Array<string | OverlayCreate>): string | null | Array<string | null>;
  removeOverlay(filter?: OverlayFilter): boolean;
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
