/**
 * Widget State 运行时验证
 *
 * 用 Zod schema 验证 AI 返回的 widgetState JSON。
 * 不合法 → 返回 null + console.warn（不抛错，不白屏）。
 */

import { WIDGET_CATALOG, type WidgetType } from './widget-catalog';
import type { WidgetState } from '../types/widget-state';

/**
 * 验证 widgetState 是否合法。
 *
 * @param raw - 来自 SSE 的原始 widgetState JSON
 * @returns 验证通过的 WidgetState（含 Zod 默认值），或 null
 */
export function validateWidgetState(raw: unknown): WidgetState | null {
  // 1. 基本结构检查
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  // 2. type 字段检查
  if (typeof obj.type !== 'string') return null;

  const type = obj.type;

  // 3. type 在 catalog 中？
  if (!(type in WIDGET_CATALOG)) {
    console.warn(`[Catalog] Unknown widget type: "${type}"`);
    return null;
  }

  // 4. Zod safeParse
  const entry = WIDGET_CATALOG[type as WidgetType];
  const result = entry.schema.safeParse(raw);

  if (!result.success) {
    console.warn(`[Catalog] Invalid ${type} widgetState:`, result.error.issues);
    return null;
  }

  // 5. 返回验证后的数据
  return result.data as unknown as WidgetState;
}
