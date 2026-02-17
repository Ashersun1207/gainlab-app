/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { KLineData } from '../common/Data'
import type Bounding from '../common/Bounding'
import type { XAxis } from './XAxis'
import type { YAxis } from './YAxis'
import type { Chart } from '../Chart'
import { clone } from '../common/utils/typeChecks'

// 脚本绘制参数
export interface ScriptDrawParams {
  ctx: CanvasRenderingContext2D
  data: KLineData[]
  bounding: Bounding
  xAxis: XAxis
  yAxis: YAxis
  chart: Chart
}

// 简化的脚本接口
export interface Script {
  /**
   * 唯一标识
   */
  key: string

  /**
   * 脚本名称
   */
  name: string

  /**
   * 用户脚本代码
   */
  script: string

  /**
   * 原始加密源码
   */
  code?: string

  /**
   * 自定义数据，脚本内部可以访问
   */
  extendData?: unknown

  /**
   * 是否可见
   */
  visible: boolean

  /**
   * 位置：主图或副图
   */
  position: 'main' | 'vice'

  /**
   * 所属面板ID
   */
  paneId: string

  /**
   * 计算结果数组
   */
  result: any[]

  /**
   * 图形配置
   */
  figures: any[]

  /**
   * 输入参数数组
   */
  inputs?: any[]

  /**
   * 样式配置数组
   */
  styles?: any[]

  /**
   * 计算方法
   */
  calc: (data: any, script: any, prevResult?: any, type?: string) => any[]

  /**
   * 绘制方法
   */
  draw: (params: ScriptDrawParams) => void

  /**
   * 脚本信息
   */
  info?: {
    name: string
    title?: string
    desc?: string
    position: 'main' | 'vice'
    version?: number
    author?: string
    [key: string]: any // 支持自定义字段
  }

  /**
   * 创建tooltip数据源
   */
  createTooltipDataSource?: (params: { script: Script }) => {
    features?: any[]
    legends?: any[]
  }

  /**
   * 是否应该更新
   */
  shouldUpdate?: (prev: Script, current: Script) => boolean | { calc: boolean, draw: boolean }

  /**
   * 判断是否需要重新计算
   */
  shouldUpdateImp?: () => { calc: boolean, draw: boolean, sort: boolean }

  /**
   * Tooltip 数据数组
   */
  tooltip?: Array<{
    label: string
    value: any
    labelColor: string
    valueColor: string
  }>

  /**
   * Tooltip 工具定义数组
   */
  tooltipTools?: Array<{
    label: string
    dataSource: any
    style: any
    labelColor: string
    valueColor: string
    precision?: number
  }>
}

// 脚本创建参数
export interface ScriptCreate {
  key: string
  id?: string | number // 支持string和number类型
  name: string
  script: string
  code?: string // 原始加密源码
  extendData?: unknown // 自定义数据，脚本内部可以访问
  visible?: boolean
  position?: 'main' | 'vice'
  paneId?: string
  inputs?: any[]
  styles?: any[]
  info?: {
    name: string
    title?: string
    desc?: string
    position: 'main' | 'vice'
    version?: number
    author?: string
    [key: string]: any // 支持自定义字段
  }
}

// 脚本过滤器
export interface ScriptFilter {
  key?: string
  name?: string
  position?: 'main' | 'vice'
  paneId?: string
}

// 脚本覆盖参数
export interface ScriptOverride {
  name?: string
  script?: string
  visible?: boolean
  position?: 'main' | 'vice'
  inputs?: any[]
  styles?: any[]
}

export interface ScriptTooltipData {
  name: string
  inputsText: string
  legends: any[]
  features: any[]
}

// 脚本模板类型（类似于 IndicatorTemplate）
export type ScriptTemplate<D = unknown, C = unknown, E = unknown> = Omit<Script, 'key' | 'result' | 'figures' | 'calc' | 'draw'> & {
  shortName?: string
  calc?: (data: any[], script: Script, prevResult?: any[], type?: string) => any[]
  draw?: (params: ScriptDrawParams) => void
}

// 脚本构造函数类型
export type ScriptConstructor = new (script: ScriptCreate) => ScriptImp

// 脚本实现类
export default class ScriptImp implements Script {
  key: string
  id?: string | number // 支持string和number类型
  name: string
  script: string
  code?: string // 原始加密源码
  extendData?: unknown // 自定义数据，脚本内部可以访问
  visible: boolean
  position: 'main' | 'vice'
  paneId: string
  result: any[]
  figures: any[]
  inputs?: any[]
  styles?: any[]
  info?: {
    name: string
    title?: string
    desc?: string
    position: 'main' | 'vice'
    version?: number
    author?: string
    [key: string]: any // 支持自定义字段
  }
  calc: (data: any, script: any, prevResult?: any, type?: string) => any[]
  draw: (params: ScriptDrawParams) => void

  shouldUpdate?: (prev: Script, current: Script) => boolean | { calc: boolean, draw: boolean }

  shouldUpdateImp(): { calc: boolean, draw: boolean, sort: boolean } {
    // 按照指标的方式，检查脚本属性是否发生变化
    if (this.shouldUpdate) {
      const result = this.shouldUpdate(this._prevScript, this)
      if (typeof result === 'boolean') {
        return { calc: result, draw: result, sort: false }
      }
      return { calc: result.calc, draw: result.draw, sort: false }
    }
    
    // 默认实现：检查关键属性是否发生变化
    const prev = this._prevScript
    if (!prev) return { calc: true, draw: true, sort: false }
    
    const calc = JSON.stringify(prev.inputs) !== JSON.stringify(this.inputs) ||
      prev.styles !== this.styles ||
      prev.calc !== this.calc
    
    return { calc, draw: calc, sort: false }
  }

  tooltip?: Array<{
    label: string
    value: any
    labelColor: string
    valueColor: string
  }>

  tooltipTools?: Array<{
    label: string
    dataSource: any
    style: any
    labelColor: string
    valueColor: string
    precision?: number
  }>

  precision?: number | null // 脚本精度设置，默认为null

  private _prevScript: Script
  private _prevCrosshairDataIndex: number | undefined

  constructor(script: ScriptCreate) {
    this.key = script.key
    this.id = script.id // 保存id字段
    this.name = script.name
    this.script = script.script
    this.code = script.code // 保存原始加密源码
    this.extendData = script.extendData // 保存自定义数据
    this.visible = script.visible ?? true
    this.position = script.position ?? 'main'
    this.paneId = script.paneId ?? '' // 占位符，后续设置
    this.result = [] // 占位符，后续计算
    this.figures = [] // 占位符，后续配置
    this.inputs = script.inputs || [] // 输入参数
    this.styles = script.styles || [] // 样式配置
    this.info = script.info // 脚本信息
    this.calc = () => [] // 占位符，后续实现
    this.draw = () => {} // 默认空实现
    this.tooltip = [] // 初始化 tooltip 数组
    this.tooltipTools = [] // 初始化 tooltipTools 数组
    this.precision = null // 初始化精度为null
    this._prevCrosshairDataIndex = undefined // 初始化十字星索引
  }

  /**
   * 计算实现方法（复制指标系统）
   */
  async calcImp(dataList: any[], prevResult?: any[], type: 'init' | 'append' | 'tick' = 'init'): Promise<boolean> {
    try {
      // 占位符：调用 calc 方法
      const result = await this.calc(dataList, this, prevResult, type)
      this.result = result
      return true
    } catch (error) {
      console.error('Script calcImp error:', error)
      return false
    }
  }

  /**
   * 覆盖脚本属性
   */
  override(override: ScriptOverride): void {
    // 保存当前状态作为之前的状态
    const { result, ...currentOthers } = this
    this._prevScript = { ...clone(currentOthers), result }
    
    // 应用新的属性
    if (override.name !== undefined) this.name = override.name
    if (override.script !== undefined) this.script = override.script
    if (override.visible !== undefined) this.visible = override.visible
    if (override.position !== undefined) this.position = override.position
    if (override.inputs !== undefined) this.inputs = override.inputs
    if (override.styles !== undefined) this.styles = override.styles
  }

  /**
   * 设置绘制方法
   */
  setDraw(draw: (params: ScriptDrawParams) => void): void {
    this.draw = draw
  }

  /**
   * 设置计算方法
   */
  setCalc(calc: (data: any, script: any, prevResult?: any, type?: string) => any[]): void {
    this.calc = calc
  }

  /**
   * 设置图形配置
   */
  setFigures(figures: any[]): void {
    this.figures = figures
  }

  /**
   * 创建tooltip数据源（默认实现）
   */
  createTooltipDataSource(params: { script: Script }): {
    features: any[]
    legends: any[]
  } {
    const features = [
      {
        id: 'visibility',
        type: 'icon_font',
        content: { code: '👁', family: 'Arial' },
        size: 12,
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        marginLeft: 4,
        marginRight: 4
      },
      {
        id: 'settings',
        type: 'icon_font',
        content: { code: '⚙', family: 'Arial' },
        size: 12,
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        marginLeft: 4,
        marginRight: 4
      },
      {
        id: 'delete',
        type: 'icon_font',
        content: { code: '🗑', family: 'Arial' },
        size: 12,
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        marginLeft: 4,
        marginRight: 4
      }
    ]

    // 从脚本的tooltipTools生成legends数据
    const legends: any[] = []
    if (this.tooltipTools && this.tooltipTools.length > 0) {
      // 通过ScriptManager获取chart对象
      const scriptManager = (params.script as any).chart?._ScriptManager
      const chartStore = scriptManager?.chart?.getChartStore()
      const crosshair = chartStore?.getCrosshair()
      const dataIndex = crosshair?.dataIndex
      
      this.tooltipTools.forEach(tool => {
        if (tool.dataSource && Array.isArray(tool.dataSource)) {
          const value = dataIndex !== undefined && dataIndex < tool.dataSource.length 
            ? tool.dataSource[dataIndex] 
            : 'N/A'
          
          // 格式化值
          let displayValue = value
          if (value !== 'N/A' && tool.precision !== undefined && tool.precision !== null) {
            displayValue = value.toFixed(tool.precision)
          }
          

          

          
          legends.push({
            title: { text: tool.label, color: tool.style?.color || '#999' },
            value: { text: displayValue, color: tool.style?.color || '#999' }
          })
        }
      })
    }

    return { features, legends }
  }

  /**
   * 扩展脚本类（类似于 IndicatorImp.extend）
   */
  static extend<D = unknown, C = unknown, E = unknown> (template: ScriptTemplate<D, C, E>): ScriptConstructor {
    class Custom extends ScriptImp {
      constructor (script: ScriptCreate) {
        super(script)
        // 应用模板中的属性
        if (template.name) this.name = template.name
        if (template.script) this.script = template.script
        if (template.code) this.code = template.code
        if (template.extendData !== undefined) this.extendData = template.extendData
        if (template.visible !== undefined) this.visible = template.visible
        if (template.position) this.position = template.position
        if (template.paneId) this.paneId = template.paneId
        if (template.inputs) this.inputs = template.inputs
        if (template.styles) this.styles = template.styles
        if (template.info) this.info = template.info
        if (template.calc) this.calc = template.calc
        if (template.draw) this.draw = template.draw
        if (template.shouldUpdate) this.shouldUpdate = template.shouldUpdate
        if (template.createTooltipDataSource) {
          this.createTooltipDataSource = (params: { script: Script }) => {
            const result = template.createTooltipDataSource!(params)
            return {
              features: result.features || [],
              legends: result.legends || []
            }
          }
        }
        if (template.tooltip) this.tooltip = template.tooltip
        if (template.tooltipTools) this.tooltipTools = template.tooltipTools
      }
    }
    return Custom
  }
} 