/**
 * Widget 组件注册表
 *
 * Widget type → React 组件 + 渲染配置。
 * AgentView 用此注册表替代 switch-case 分发。
 * App.tsx 用 isKlineWidget() 替代 klineTools 硬编码。
 */

import type { ComponentType, LazyExoticComponent } from 'react';
import type { WidgetState } from '../types/widget-state';

export interface WidgetRegistration {
  /** React lazy 组件 */
  component: LazyExoticComponent<ComponentType<Record<string, unknown>>>;
  /** 渲染包裹方式：kline = KLineHeader + KLineWidget，panel = WidgetPanel 包裹 */
  wrapper: 'panel' | 'kline';
  /** WidgetPanel 标题（wrapper='panel' 时使用） */
  title?: string;
  /** 从 widgetState 提取组件所需 props */
  propsMapper: (ws: WidgetState) => Record<string, unknown>;
}

const registry = new Map<string, WidgetRegistration>();

/** 注册一个 Widget 渲染器 */
export function registerWidget(type: string, reg: WidgetRegistration): void {
  registry.set(type, reg);
}

/** 查询 Widget 渲染器 */
export function getWidget(type: string): WidgetRegistration | undefined {
  return registry.get(type);
}

/** 某个 widget type 是否为 kline 类型（需要 klineData 转换） */
export function isKlineWidget(type: string): boolean {
  return registry.get(type)?.wrapper === 'kline';
}
