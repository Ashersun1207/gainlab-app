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

export interface ScriptCreate {
  id: string | number;
  name: string;
  code: string; // 加密的脚本代码
  key?: string;
  [key: string]: unknown;
}

export interface ScriptFilter {
  key?: string;
  id?: string | number;
  [key: string]: unknown;
}

export interface ScriptData {
  key: string;
  name: string;
  inputs?: Array<{ key: string; title: string; type: string; defaultValue: unknown; value: unknown; min?: number; max?: number }>;
  styles?: Array<{ key: string; title: string; type: string; defaultValue: unknown; value: unknown }>;
  [key: string]: unknown;
}

export interface Chart {
  setDataList(data: KLineData[]): void;
  getDataList(): KLineData[];
  updateData(data: KLineData): void;
  createIndicator(name: string, isStack?: boolean, options?: { id?: string }): string | null;
  createOverlay(value: string | OverlayCreate | Array<string | OverlayCreate>): string | null | Array<string | null>;
  removeOverlay(filter?: OverlayFilter): boolean;
  // Script engine methods (T17 migration)
  addScript(script: ScriptCreate, paneId: string, isStack: boolean): string | null;
  removeScript(filter?: ScriptFilter): boolean;
  // Script config methods (T18 parameter tuning)
  setScriptConfig(key: string, config: { inputs?: ScriptData['inputs']; styles?: ScriptData['styles'] }): Promise<void>;
  getScriptsByFilter(filter?: ScriptFilter): ScriptData[];
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
