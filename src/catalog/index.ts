/**
 * Widget Catalog — 统一导出
 *
 * @see widget-catalog.ts      — Schema 定义（单一真相源）
 * @see validate.ts            — 运行时验证
 * @see build-prompt.ts        — AI Prompt 生成
 * @see widget-registry.ts     — 组件注册表
 * @see widget-registration.ts — 渲染器注册（副作用 import）
 */

export {
  WIDGET_CATALOG,
  WIDGET_TYPES,
  type WidgetType,
  type WidgetCatalogEntry,
} from './widget-catalog';

export { validateWidgetState } from './validate';
export { buildWidgetPrompt } from './build-prompt';
export { registerWidget, getWidget, isKlineWidget } from './widget-registry';
