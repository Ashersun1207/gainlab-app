import type Nullable from '../common/Nullable'

import IndicatorImp, { type IndicatorTemplate, type IndicatorConstructor } from '../component/Indicator'

// 不再自动导入指标文件，现在使用脚本代替
// const modules = import.meta.glob('./indicator/*.ts', { eager: true })

const indicators: Record<string, IndicatorConstructor> = {}
const indicatorTemplates: Record<string, IndicatorTemplate> = {}

// 不再自动导入指标文件
// Object.entries(modules).forEach(([path, mod]: [string, any]) => {
//   // 排除 index.ts 或其它非指标文件
//   if (path.endsWith('index.ts')) return
//   const indicator: IndicatorTemplate = mod.default
//   if (indicator && indicator.name) {
//     indicatorTemplates[indicator.name] = indicator
//     indicators[indicator.name] = IndicatorImp.extend(indicator)
//   }
// })

function registerIndicator<D = unknown, C = unknown, E = unknown> (indicator: IndicatorTemplate<D, C, E>): void {
  indicatorTemplates[indicator.name] = indicator
  indicators[indicator.name] = IndicatorImp.extend(indicator)
}

function getIndicatorClass (name: string): Nullable<IndicatorConstructor> {
  return indicators[name] ?? null
}

function getSupportedIndicators (): any[] {
  return Object.values(indicatorTemplates).map(indicator => ({
    name: indicator.name,
    shortName: indicator.shortName,
    info: indicator.info,
    inputs: indicator.inputs,
    styles: indicator.styles
  }))
}

function getIndicators(name: string): any | null {
  return getSupportedIndicators().find(item => item.name.toLowerCase() === name.toLowerCase()) || null
}

export { registerIndicator, getIndicatorClass, getSupportedIndicators, getIndicators }
