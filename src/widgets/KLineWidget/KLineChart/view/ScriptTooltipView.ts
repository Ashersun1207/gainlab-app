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

import type Crosshair from '../common/Crosshair'
import type { TooltipStyle, TooltipTextStyle, TooltipLegend, TooltipLegendChild, TooltipFeatureStyle, FeatureIconFontStyle, FeaturePathStyle } from '../common/Styles'
import { formatPrecision } from '../common/utils/format'
import { isValid, isObject, isString, isNumber, isFunction } from '../common/utils/typeChecks'
import { createFont } from '../common/utils/canvas'
import type Coordinate from '../common/Coordinate'
import type Nullable from '../common/Nullable'
import type { ActionType } from '../common/Action'
import type { MouseTouchEvent } from '../common/EventHandler'

import type { YAxis } from '../component/YAxis'

import type { ScriptTooltipData } from '../component/Script'
import type ScriptImp from '../component/Script'

import type DrawPane from '../pane/DrawPane'
import type DrawWidget from '../widget/DrawWidget'
import View from './View'
import { WidgetNameConstants } from '../widget/types'

interface TooltipFeatureInfo {
  paneId: string
  script?: ScriptImp
  feature: TooltipFeatureStyle
}

export default class ScriptTooltipView extends View<YAxis> {
  private _activeFeatureInfo: Nullable<TooltipFeatureInfo> = null

  getName(): string {
    return WidgetNameConstants.SCRIPT
  }

  private readonly _featureClickEvent = (type: ActionType, featureInfo: TooltipFeatureInfo) => () => {
    const pane = this.getWidget().getPane()
    if (featureInfo.script) {
      // 脚本工具点击事件
      pane.getChart().getChartStore().executeAction('onScriptTooltipFeatureClick', featureInfo)
    } else {
      // 指标工具点击事件
      pane.getChart().getChartStore().executeAction(type, featureInfo)
    }
    return true
  }

  private readonly _featureMouseMoveEvent = (featureInfo: TooltipFeatureInfo) => () => {
    this._activeFeatureInfo = featureInfo
    return true
  }

  constructor (widget: DrawWidget<DrawPane<YAxis>>) {
    super(widget)
    this.registerEvent('mouseMoveEvent', event => {
      // 检查鼠标是否在脚本按钮区域内
      if (this._isMouseInScriptButtons(event)) {
        // 不消费事件，让事件继续传递以支持 hover 效果
        return false
      }
      // 如果鼠标不在按钮上，清除激活状态
      this._activeFeatureInfo = null
      return false
    })
    
    this.registerEvent('mouseClickEvent', event => {
      // 检查鼠标是否在脚本按钮区域内
      if (this._isMouseInScriptButtons(event)) {
        return true // 消费事件，阻止传递给OverlayView
      }
      return false
    })
  }

  private _isMouseInScriptButtons(event: MouseTouchEvent): boolean {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chartStore = pane.getChart().getChartStore()
    const crosshair = chartStore.getCrosshair()
    
    // 只有在显示tooltip时才检查
    if (!isValid(crosshair.kLineData)) {
      return false
    }
    
    const bounding = widget.getBounding()
    const scripts = chartStore.getScriptsByPaneId(pane.getId())
    const { offsetLeft, offsetTop, offsetRight } = chartStore.getStyles().indicator.tooltip
    
    // 模拟绘制时的坐标计算，需要与 drawScriptTooltip 方法保持一致
    let top = offsetTop // 当前绘制的垂直位置
    const left = offsetLeft
    const maxWidth = bounding.width - offsetRight
    
    // 检查鼠标是否在脚本按钮区域内
    for (const script of scripts) {
      const tooltipData = this.getScriptTooltipData(script)
      const { features } = tooltipData
      
      const nameValid = tooltipData.name.length > 0
      const legendValid = tooltipData.legends.length > 0
      const featuresValid = tooltipData.features.length > 0
      
      if (nameValid || legendValid || featuresValid) {
        const featuresStyles = this.classifyTooltipFeatures(tooltipData.features)
        const coordinate = { x: left, y: top }
        
        // 检查左侧操作按钮
        if (featuresStyles[0].length > 0) {
          const leftCoordinate = { x: coordinate.x, y: coordinate.y }
          if (this._checkFeaturesInCoordinate(event, featuresStyles[0], leftCoordinate, script, bounding)) {
            return true
          }
          // 更新坐标（模拟绘制时的逻辑）
          coordinate.x = leftCoordinate.x
        }
        
        // 检查中间操作按钮
        if (featuresStyles[1].length > 0) {
          const middleCoordinate = { x: coordinate.x, y: coordinate.y }
          if (this._checkFeaturesInCoordinate(event, featuresStyles[1], middleCoordinate, script, bounding)) {
            return true
          }
          // 更新坐标（模拟绘制时的逻辑）
          coordinate.x = middleCoordinate.x
        }
        
        // 检查右侧操作按钮
        if (featuresStyles[2].length > 0) {
          const rightCoordinate = { x: coordinate.x, y: coordinate.y }
          if (this._checkFeaturesInCoordinate(event, featuresStyles[2], rightCoordinate, script, bounding)) {
            return true
          }
          // 更新坐标（模拟绘制时的逻辑）
          coordinate.x = rightCoordinate.x
        }
        
        // 更新垂直位置（模拟绘制时的逻辑）
        top += 20 // 每个脚本行的高度
      }
    }
    
    return false
  }
  
  private _checkFeaturesInCoordinate(
    event: MouseTouchEvent, 
    features: TooltipFeatureStyle[], 
    coordinate: Coordinate, 
    script: any, 
    bounding: any
  ): boolean {
    for (const feature of features) {
      const {
        marginLeft = 0, marginTop = 0, marginRight = 0,
        paddingLeft = 0, paddingTop = 0, paddingRight = 0, paddingBottom = 0,
        size = 10
      } = feature
      
      // 计算按钮的实际位置（与绘制时一致）
      const buttonLeft = bounding.left + coordinate.x + marginLeft
      const buttonTop = bounding.top + coordinate.y + marginTop
      const buttonWidth = size
      const buttonHeight = size
      
      if (
        event.x >= buttonLeft && 
        event.x <= buttonLeft + buttonWidth &&
        event.y >= buttonTop && 
        event.y <= buttonTop + buttonHeight
      ) {
        // 设置激活的按钮信息
        this._activeFeatureInfo = {
          paneId: this.getWidget().getPane().getId(),
          script: script,
          feature: feature
        }
        return true
      }
      
      // 更新坐标（与绘制时一致）
      coordinate.x += (marginLeft + paddingLeft + size + paddingRight + marginRight)
    }
    return false
  }

  override checkEventOn (event: MouseTouchEvent): boolean {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chartStore = pane.getChart().getChartStore()
    const crosshair = chartStore.getCrosshair()
    
    // 只有在显示tooltip时才处理事件
    if (!isValid(crosshair.kLineData)) {
      return false
    }
    
    // 检查鼠标是否在脚本按钮区域内
    return this._isMouseInScriptButtons(event)
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chartStore = pane.getChart().getChartStore()
    const crosshair = chartStore.getCrosshair()
    
    if (isValid(crosshair.kLineData)) {
      const bounding = widget.getBounding()
      const { offsetLeft, offsetTop, offsetRight } = chartStore.getStyles().indicator.tooltip
      
      this.drawScriptTooltip(
        ctx, offsetLeft, offsetTop, // 恢复原来的Y轴位置
        bounding.width - offsetRight
      )
    } else {
    }
  }

  protected drawScriptTooltip(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    maxWidth: number
  ): number {
    
    const pane = this.getWidget().getPane()
    const chartStore = pane.getChart().getChartStore()
    const styles = chartStore.getStyles().indicator
    const tooltipStyles = styles.tooltip
    
    if (this.isDrawTooltip(chartStore.getCrosshair(), tooltipStyles)) {
      const scripts = chartStore.getScriptsByPaneId(pane.getId())
      
      const tooltipTitleStyles = tooltipStyles.title
      const tooltipLegendStyles = tooltipStyles.legend
      
      // 绘制脚本 tooltip
      scripts.forEach(script => {
        
        let prevRowHeight = 0
        const coordinate = { x: left, y: top }
        
        // 脚本隐藏时仍然显示tooltip操作按钮，只是不显示绘图内容
        const tooltipData = this.getScriptTooltipData(script)
        
        const nameValid = tooltipData.name.length > 0
        const legendValid = tooltipData.legends.length > 0
        const featuresValid = tooltipData.features.length > 0
        
        if (nameValid || legendValid || featuresValid) {
          const featuresStyles = this.classifyTooltipFeatures(tooltipData.features)
          
          // 绘制左侧操作按钮
          prevRowHeight = this.drawStandardTooltipFeatures(
            ctx, featuresStyles[0],
            coordinate, script,
            left, prevRowHeight, maxWidth
          )
          
          // 绘制标题
          if (nameValid) {
            const color = tooltipTitleStyles.color
            prevRowHeight = this.drawStandardTooltipLegends(
              ctx,
              [
                {
                  title: { text: '', color },
                  value: { text: tooltipData.name, color }
                }
              ],
              coordinate, left, prevRowHeight, maxWidth, tooltipTitleStyles
            )
          }
          
          // 绘制中间操作按钮
          prevRowHeight = this.drawStandardTooltipFeatures(
            ctx, featuresStyles[1],
            coordinate, script,
            left, prevRowHeight, maxWidth
          )
          
          // 绘制legends（MA数据）- 只有在脚本可见时才显示
          if (legendValid && script.visible) {
            prevRowHeight = this.drawStandardTooltipLegends(
              ctx, tooltipData.legends, coordinate,
              left, prevRowHeight, maxWidth, tooltipLegendStyles
            )
          }
          
          // 绘制右侧操作按钮
          prevRowHeight = this.drawStandardTooltipFeatures(
            ctx, featuresStyles[2],
            coordinate, script,
            left, prevRowHeight, maxWidth
          )
          
          top = coordinate.y + prevRowHeight
        }
      })
      
      return top
    } else {
    }
    
    return 0
  }

  protected drawStandardTooltipFeatures(
    ctx: CanvasRenderingContext2D,
    features: TooltipFeatureStyle[],
    coordinate: Coordinate,
    script: Nullable<ScriptImp>,
    left: number,
    prevRowHeight: number,
    maxWidth: number
  ): number {
    if (features.length === 0) {
      return 0
    }

    const pane = this.getWidget().getPane()
    const paneId = pane.getId()

    features.forEach(feature => {
      const {
        marginLeft = 0, marginTop = 0, marginRight = 0,
        paddingLeft = 0, paddingTop = 0, paddingRight = 0, paddingBottom = 0,
        backgroundColor, activeBackgroundColor, borderRadius,
        size = 10, color, activeColor, type, content
      } = feature

      let finalColor = color
      let finalBackgroundColor = backgroundColor
      if (
        this._activeFeatureInfo?.paneId === paneId &&
        this._activeFeatureInfo.script?.key === script?.key &&
        this._activeFeatureInfo.feature.id === feature.id
      ) {
        finalColor = activeColor ?? color
        finalBackgroundColor = activeBackgroundColor ?? backgroundColor
      }

      const featureInfo: TooltipFeatureInfo = {
        paneId, script: script || undefined, feature
      }

      const eventHandler = {
        mouseClickEvent: this._featureClickEvent('onScriptTooltipFeatureClick', featureInfo),
        mouseMoveEvent: this._featureMouseMoveEvent(featureInfo)
      }

      let contentWidth = 0
      if (type === 'icon_font') {
        const iconFont = content as FeatureIconFontStyle
        // 创建可点击区域
        this.createFigure({
          name: 'rect',
          attrs: { x: coordinate.x + marginLeft, y: coordinate.y + marginTop, width: size, height: size },
          styles: {
            paddingLeft,
            paddingTop,
            paddingRight,
            paddingBottom,
            borderRadius,
            backgroundColor: finalBackgroundColor
          }
        }, eventHandler)?.draw(ctx)
        
        // 绘制字体图标
        ctx.save()
        ctx.font = `${size}px ${iconFont.family}`
        ctx.fillStyle = finalColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(iconFont.code, coordinate.x + marginLeft + size / 2, coordinate.y + marginTop + size / 2)
        ctx.restore()
        
        contentWidth = size
      } else {
        this.createFigure({
          name: 'rect',
          attrs: { x: coordinate.x + marginLeft, y: coordinate.y + marginTop, width: size, height: size },
          styles: {
            paddingLeft,
            paddingTop,
            paddingRight,
            paddingBottom,
            borderRadius,
            color: finalColor,
            backgroundColor: finalBackgroundColor
          }
        }, eventHandler)?.draw(ctx)
        contentWidth = size
      }
      coordinate.x += (marginLeft + paddingLeft + contentWidth + paddingRight + marginRight)
    })

    return 20 // 返回固定高度
  }

  protected drawStandardTooltipFeature(
    ctx: CanvasRenderingContext2D,
    feature: TooltipFeatureStyle,
    coordinate: Coordinate,
    featureInfo: TooltipFeatureInfo,
    iconWidth: number,
    iconHeight: number,
    iconSize: number,
    iconMargin: number,
    eventHandler?: { mouseClickEvent: (event: any) => boolean; mouseMoveEvent: (event: any) => boolean }
  ): void {
    const { x, y } = coordinate
    const { content } = feature
    
    // 调整按钮的Y坐标，减少1px
    const adjustedY = y - 1

    // 创建可点击区域
    if (eventHandler) {
      this.createFigure({
        name: 'rect',
        attrs: { x, y: adjustedY, width: iconWidth, height: iconHeight },
        styles: {
          backgroundColor: 'transparent'
        }
      }, eventHandler)?.draw(ctx)
    }

    if (content && 'path' in content) {
      // 绘制路径图标
      ctx.save()
      ctx.translate(x + iconMargin, adjustedY + iconMargin)
      ctx.scale(iconSize / 16, iconSize / 16)
      const path = new Path2D(content.path)
      ctx.fillStyle = feature.color
      ctx.fill(path)
      ctx.restore()
    } else if (content && 'code' in content) {
      // 绘制字体图标
      ctx.save()
      ctx.translate(x + iconMargin, adjustedY + iconMargin)
      ctx.scale(iconSize / 16, iconSize / 16)
      ctx.fillStyle = feature.color
      // 使用正确的字体
      ctx.font = `${iconSize}px iconfont`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(content.code, iconSize / 2, iconSize / 2)
      ctx.restore()
    }
  }

  protected drawStandardTooltipLegends (
    ctx: CanvasRenderingContext2D,
    legends: TooltipLegend[],
    coordinate: Coordinate,
    left: number,
    prevRowHeight: number,
    maxWidth: number,
    styles: TooltipTextStyle
  ): number {
    if (legends.length > 0) {
      const { marginLeft, marginTop, marginRight, marginBottom, size, family, weight } = styles
      ctx.font = createFont(size, weight, family)
      legends.forEach(data => {
        const title = data.title as TooltipLegendChild
        const value = data.value as TooltipLegendChild
        const titleTextWidth = ctx.measureText(title.text).width
        const valueTextWidth = ctx.measureText(value.text).width
        const totalTextWidth = titleTextWidth + valueTextWidth
        const h = marginTop + size + marginBottom
        if (coordinate.x + marginLeft + totalTextWidth + marginRight > maxWidth) {
          coordinate.x = left
          coordinate.y += prevRowHeight
          prevRowHeight = h
        } else {
          prevRowHeight = Math.max(prevRowHeight, h)
        }
        if (title.text.length > 0) {
          this.createFigure({
            name: 'text',
            attrs: { x: coordinate.x + marginLeft, y: coordinate.y + marginTop, text: title.text },
            styles: { color: title.color, size, family, weight }
          })?.draw(ctx)
        }
        this.createFigure({
          name: 'text',
          attrs: { x: coordinate.x + marginLeft + titleTextWidth, y: coordinate.y + marginTop, text: value.text },
          styles: { color: value.color, size, family, weight }
        })?.draw(ctx)
        coordinate.x += (marginLeft + totalTextWidth + marginRight)
      })
    }
    return prevRowHeight
  }

  protected isDrawTooltip(crosshair: Crosshair, styles: TooltipStyle): boolean {
    // 使用与指标相同的显示条件
    const showRule = styles.showRule
    return showRule === 'always' ||
      (showRule === 'follow_cross' && isString(crosshair.paneId))
  }

  public getScriptTooltipData(script: ScriptImp): ScriptTooltipData {
    let tooltipData: ScriptTooltipData
    
    // 首先使用脚本的createTooltipDataSource获取基础数据
    if (script.createTooltipDataSource) {
      const result = script.createTooltipDataSource({ script })
      tooltipData = {
        name: (result as any).name || script.name || 'Script',
        inputsText: (result as any).inputsText || '',
        legends: (result as any).legends || [],
        features: (result as any).features || []
      }
    } else {
      // 默认的 tooltip 数据
      tooltipData = {
        name: script.name || 'Script',
        inputsText: '',
        legends: [],
        features: []
      }
    }
    
    // 然后检查是否有通过O.tools添加的工具定义，如果有则追加到legends
    if (script.tooltipTools && Array.isArray(script.tooltipTools) && script.tooltipTools.length > 0) {
      // 获取当前数据索引
      const chartStore = this.getWidget().getPane().getChart().getChartStore()
      const crosshair = chartStore.getCrosshair()
      const dataIndex = crosshair.dataIndex
      
      // 动态计算当前数据索引对应的值
      const oToolsLegends: TooltipLegend[] = script.tooltipTools.map(tool => {
        let value = 'N/A'
        let isValidValue = false
        
        // 从数据源中获取当前索引的值
        if (Array.isArray(tool.dataSource) && tool.dataSource.length > 0) {
          const currentValue = tool.dataSource[dataIndex ?? 0] || tool.dataSource[tool.dataSource.length - 1]
          
          // 检查值是否有效（不是null、undefined、NaN）
          if (currentValue !== null && currentValue !== undefined && !isNaN(currentValue)) {
            value = String(currentValue)
            isValidValue = true
          }
        } else if (!Array.isArray(tool.dataSource)) {
          // 处理非数组类型的数据源（字符串或数值）
          const dataValue = tool.dataSource
          if (dataValue !== null && dataValue !== undefined) {
            // 对于字符串，检查是否是数值字符串；对于数值，检查是否为NaN
            if (typeof dataValue === 'string') {
              // 检查字符串是否是有效数值
              const numValue = parseFloat(dataValue)
              if (!isNaN(numValue) && isFinite(numValue)) {
                value = String(numValue)  // 使用数值形式，这样可以应用精度格式化
                isValidValue = true
              } else {
                value = dataValue  // 非数值字符串直接使用
                isValidValue = true
              }
            } else if (typeof dataValue === 'number' && !isNaN(dataValue) && isFinite(dataValue)) {
              value = String(dataValue)
              isValidValue = true
            }
          }
        }
        
        // 获取样式颜色，如果没有则使用默认颜色
        const styleColor = tool.style?.color || tool.valueColor || '#333'
        
        // 获取精度信息
        const precision = tool.precision
        
        // 根据precision是否为null来决定是否格式化数值
        let displayValue = value
        if (isValidValue && precision !== null && precision !== undefined) {
          // 如果设置了精度，则格式化数值
          displayValue = Number(value).toFixed(precision)
        } else if (isValidValue) {
          // 如果没有设置精度，则显示原始值
          displayValue = String(value)
        }
        
        return {
          title: { text: tool.label + ':', color: styleColor }, // 标签使用和值一样的颜色，加冒号
          value: { text: displayValue, color: styleColor }    // 值使用样式颜色
        }
      })
      
      // 将O.tools的数据追加到现有的legends
      tooltipData.legends = [...tooltipData.legends, ...oToolsLegends]
    }
    
    return tooltipData
  }

  protected classifyTooltipFeatures(features: TooltipFeatureStyle[]): TooltipFeatureStyle[][] {
    const leftFeatures: TooltipFeatureStyle[] = []
    const middleFeatures: TooltipFeatureStyle[] = []
    const rightFeatures: TooltipFeatureStyle[] = []
    features.forEach(feature => {
      const { position } = feature
      switch (position) {
        case 'left': {
          leftFeatures.push(feature)
          break
        }
        case 'right': {
          rightFeatures.push(feature)
          break
        }
        default: {
          middleFeatures.push(feature)
          break
        }
      }
    })
    return [leftFeatures, middleFeatures, rightFeatures]
  }
} 