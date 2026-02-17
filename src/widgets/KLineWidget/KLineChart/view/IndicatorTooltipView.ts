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

import type { YAxis } from '../component/YAxis'

import type { Indicator, IndicatorFigure, IndicatorFigureStyle, IndicatorTooltipData } from '../component/Indicator'
import { eachFigures } from '../component/Indicator'

import type DrawPane from '../pane/DrawPane'
import type DrawWidget from '../widget/DrawWidget'
import View from './View'

interface TooltipFeatureInfo {
  paneId: string
  indicator?: Indicator
  script?: any
  feature: TooltipFeatureStyle
}

export default class IndicatorTooltipView extends View<YAxis> {
  private _activeFeatureInfo: Nullable<TooltipFeatureInfo> = null

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
    this.registerEvent('mouseMoveEvent', _ => {
      this._activeFeatureInfo = null
      return false
    })
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chartStore = pane.getChart().getChartStore()
    const crosshair = chartStore.getCrosshair()
    if (isValid(crosshair.kLineData)) {
      const bounding = widget.getBounding()
      const { offsetLeft, offsetTop, offsetRight } = chartStore.getStyles().indicator.tooltip
      this.drawIndicatorTooltip(
        ctx, offsetLeft, offsetTop,
        bounding.width - offsetRight
      )
    }
  }

  protected drawIndicatorTooltip (
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
      const indicators = chartStore.getIndicatorsByPaneId(pane.getId())
      const tooltipTitleStyles = tooltipStyles.title
      const tooltipLegendStyles = tooltipStyles.legend
      
      // 绘制指标 tooltip
      indicators.forEach(indicator => {
        let prevRowHeight = 0
        const coordinate = { x: left, y: top }
        const { name, inputsText, legends, features: featuresStyles } = this.getIndicatorTooltipData(indicator)
        const nameValid = name.length > 0
        const legendValid = legends.length > 0
        if (nameValid || legendValid) {
          const features = this.classifyTooltipFeatures(featuresStyles)
          prevRowHeight = this.drawStandardTooltipFeatures(
            ctx, features[0],
            coordinate, indicator,
            left, prevRowHeight, maxWidth
          )

          if (nameValid) {
            let text = name
            if (inputsText.length > 0) {
              text = `${text}${inputsText}`
            }
            const color = tooltipTitleStyles.color
            prevRowHeight = this.drawStandardTooltipLegends(
              ctx,
              [
                {
                  title: { text: '', color },
                  value: { text, color }
                }
              ],
              coordinate, left, prevRowHeight, maxWidth, tooltipTitleStyles
            )
          }

          prevRowHeight = this.drawStandardTooltipFeatures(
            ctx, features[1],
            coordinate, indicator,
            left, prevRowHeight, maxWidth
          )

          if (legendValid) {
            prevRowHeight = this.drawStandardTooltipLegends(
              ctx, legends, coordinate,
              left, prevRowHeight, maxWidth, tooltipLegendStyles
            )
          }

          // draw right features
          prevRowHeight = this.drawStandardTooltipFeatures(
            ctx, features[2],
            coordinate, indicator,
            left, prevRowHeight, maxWidth
          )
          top = coordinate.y + prevRowHeight
        }
      })
      
      // 绘制脚本 tooltip - 只显示当前面板的脚本
      const chart = pane.getChart()
      const allScripts = (chart as any).getScripts?.() || []
      const currentPaneId = pane.getId()
      const scripts = allScripts.filter((script: any) => {
        // 主图面板只显示主图脚本
        if (currentPaneId === 'candle_pane') {
          return script.position === 'main'
        }
        // 副图面板只显示副图脚本
        return script.position === 'vice'
      })
      
      scripts.forEach((script: any) => {
        if (script.createTooltipDataSource) {
          let prevRowHeight = 0
          const coordinate = { x: left, y: top }
          
          // 获取基础tooltip数据
          const { features: featuresStyles, legends: legendsStyles } = script.createTooltipDataSource({ script })
          
          // 处理O.tools数据，类似ScriptTooltipView的getScriptTooltipData逻辑
          let finalLegends = legendsStyles || []
          if (script.tooltipTools && Array.isArray(script.tooltipTools) && script.tooltipTools.length > 0) {
            // 获取当前数据索引
            const chartStore = pane.getChart().getChartStore()
            const crosshair = chartStore.getCrosshair()
            const dataIndex = crosshair.dataIndex
            
            // 动态计算当前数据索引对应的值
            const oToolsLegends = script.tooltipTools.map((tool: any) => {
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
            finalLegends = [...finalLegends, ...oToolsLegends]
          }
          
          const features = this.classifyTooltipFeatures(featuresStyles || [])
          if (featuresStyles && featuresStyles.length > 0) {
            prevRowHeight = this.drawStandardTooltipFeatures(
              ctx, features[0],
              coordinate, null,
              left, prevRowHeight, maxWidth,
              script
            )

            // 显示脚本名称
            if (script.name) {
              const color = tooltipTitleStyles.color
              prevRowHeight = this.drawStandardTooltipLegends(
                ctx,
                [
                  {
                    title: { text: '', color },
                    value: { text: script.name, color }
                  }
                ],
                coordinate, left, prevRowHeight, maxWidth, tooltipTitleStyles
              )
            }

            prevRowHeight = this.drawStandardTooltipFeatures(
              ctx, features[1],
              coordinate, null,
              left, prevRowHeight, maxWidth,
              script
            )

            // 显示脚本的 legends（数值）
            if (finalLegends && finalLegends.length > 0) {
              prevRowHeight = this.drawStandardTooltipLegends(
                ctx, finalLegends, coordinate,
                left, prevRowHeight, maxWidth, tooltipLegendStyles
              )
            }

            // draw right features
            prevRowHeight = this.drawStandardTooltipFeatures(
              ctx, features[2],
              coordinate, null,
              left, prevRowHeight, maxWidth,
              script
            )
            top = coordinate.y + prevRowHeight
          }
        }
      })
    }
    return top
  }

  protected drawStandardTooltipFeatures (
    ctx: CanvasRenderingContext2D,
    features: TooltipFeatureStyle[],
    coordinate: Coordinate,
    indicator: Nullable<Indicator>,
    left: number,
    prevRowHeight: number,
    maxWidth: number,
    script?: any
  ): number {
    if (features.length > 0) {
      let width = 0
      let height = 0
      features.forEach(feature => {
        const {
          marginLeft = 0, marginTop = 0, marginRight = 0, marginBottom = 0,
          paddingLeft = 0, paddingTop = 0, paddingRight = 0, paddingBottom = 0,
          size = 0, type, content
        } = feature
        let contentWidth = 0
        if (type === 'icon_font') {
          const iconFont = content as FeatureIconFontStyle
          ctx.font = createFont(size, 'normal', iconFont.family)
          contentWidth = ctx.measureText(iconFont.code).width
        } else {
          contentWidth = size
        }
        width += (marginLeft + paddingLeft + contentWidth + paddingRight + marginRight)
        height = Math.max(height, marginTop + paddingTop + size + paddingBottom + marginBottom)
      })
      if (coordinate.x + width > maxWidth) {
        coordinate.x = left
        coordinate.y += prevRowHeight
        prevRowHeight = height
      } else {
        prevRowHeight = Math.max(prevRowHeight, height)
      }
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()

      features.forEach(feature => {
        const {
          marginLeft = 0, marginTop = 0, marginRight = 0,
          paddingLeft = 0, paddingTop = 0, paddingRight = 0, paddingBottom = 0,
          backgroundColor, activeBackgroundColor, borderRadius,
          size = 0, color, activeColor, type, content
        } = feature

        let finalColor = color
        let finalBackgroundColor = backgroundColor
        if (
          this._activeFeatureInfo?.paneId === paneId &&
          this._activeFeatureInfo.indicator?.id === indicator?.id &&
          this._activeFeatureInfo.feature.id === feature.id
        ) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
          finalColor = activeColor ?? color
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
          finalBackgroundColor = activeBackgroundColor ?? backgroundColor
        }
        let actionType: ActionType = 'onCandleTooltipFeatureClick'
        const featureInfo: TooltipFeatureInfo = {
          paneId, feature
        }
        if (isValid(indicator)) {
          actionType = 'onIndicatorTooltipFeatureClick'
          featureInfo.indicator = indicator
        } else if (script) {
          actionType = 'onScriptTooltipFeatureClick'
          featureInfo.script = script
        }
        

        const eventHandler = {
          mouseClickEvent: this._featureClickEvent(actionType, featureInfo),
          mouseMoveEvent: this._featureMouseMoveEvent(featureInfo)
        }
        let contentWidth = 0
        if (type === 'icon_font') {
          const iconFont = content as FeatureIconFontStyle
          this.createFigure({
            name: 'text',
            attrs: { text: iconFont.code, x: coordinate.x + marginLeft, y: coordinate.y + marginTop },
            styles: {
              paddingLeft,
              paddingTop,
              paddingRight,
              paddingBottom,
              borderRadius,
              size,
              family: iconFont.family,
              color: finalColor,
              backgroundColor: finalBackgroundColor
            }
          }, eventHandler)?.draw(ctx)
          contentWidth = ctx.measureText(iconFont.code).width
        } else {
          this.createFigure({
            name: 'rect',
            attrs: { x: coordinate.x + marginLeft, y: coordinate.y + marginTop, width: size, height: size },
            styles: {
              paddingLeft,
              paddingTop,
              paddingRight,
              paddingBottom,
              color: finalBackgroundColor
            }
          }, eventHandler)?.draw(ctx)
          const path = content as FeaturePathStyle
          this.createFigure({
            name: 'path',
            attrs: { path: path.path, x: coordinate.x + marginLeft + paddingLeft, y: coordinate.y + marginTop + paddingTop, width: size, height: size },
            styles: {
              style: path.style,
              lineWidth: path.lineWidth,
              color: finalColor
            }
          })?.draw(ctx)
          contentWidth = size
        }
        coordinate.x += (marginLeft + paddingLeft + contentWidth + paddingRight + marginRight)
      })
    }
    return prevRowHeight
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

  protected isDrawTooltip (crosshair: Crosshair, styles: TooltipStyle): boolean {
    const showRule = styles.showRule
    return showRule === 'always' ||
      (showRule === 'follow_cross' && isString(crosshair.paneId))
  }

  protected getIndicatorTooltipData (indicator: Indicator): IndicatorTooltipData {
    const chartStore = this.getWidget().getPane().getChart().getChartStore()
    const styles = chartStore.getStyles().indicator
    const tooltipStyles = styles.tooltip
    const tooltipTitleStyles = tooltipStyles.title
    let name = ''
    let inputsText = ''
    if (tooltipTitleStyles.show) {
      if (tooltipTitleStyles.showName) {
        name = indicator.shortName
      }
    }
    const tooltipData: IndicatorTooltipData = { name, inputsText, legends: [], features: tooltipStyles.features }

    const dataIndex = chartStore.getCrosshair().dataIndex!
    const result = indicator.result

    const formatter = chartStore.getInnerFormatter()
    const decimalFold = chartStore.getDecimalFold()
    const thousandsSeparator = chartStore.getThousandsSeparator()
    const legends: TooltipLegend[] = []
    const widget = this.getWidget()
    const bounding = widget.getBounding()
    if (indicator.visible && bounding.width > 768) {
      const data = result[dataIndex] ?? result[dataIndex - 1] ?? {}
      const defaultValue = tooltipStyles.legend.defaultValue
      eachFigures(indicator, dataIndex, styles, (figure: IndicatorFigure, figureStyles: Required<IndicatorFigureStyle>) => {
        if (isString(figure.title) && figure.title.trim() !== '') {
          const color = figureStyles.color
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment  -- ignore
          let value = data[figure.key]
          if (isNumber(value)) {
            value = formatPrecision(value, indicator.precision)
            if (indicator.shouldFormatBigNumber) {
              value = formatter.formatBigNumber(value as string)
            }
            value = decimalFold.format(thousandsSeparator.format(value as string))
          }
          legends.push({ title: { text: figure.title, color }, value: { text: (value ?? defaultValue) as string, color } })
        }
      })
      tooltipData.legends = legends
    }

    if (isFunction(indicator.createTooltipDataSource)) {
      const widget = this.getWidget()
      const pane = widget.getPane()
      const chart = pane.getChart()
      const { name: customName, inputsText: custominputsText, legends: customLegends, features: customFeatures } = indicator.createTooltipDataSource({
        chart,
        indicator,
        crosshair: chartStore.getCrosshair(),
        bounding: widget.getBounding(),
        xAxis: pane.getChart().getXAxisPane().getAxisComponent(),
        yAxis: pane.getAxisComponent()
      })
      if (tooltipTitleStyles.show) {
        if (isString(customName) && tooltipTitleStyles.showName) {
          tooltipData.name = customName
        }
        if (isString(custominputsText) && tooltipTitleStyles.showParams) {
          tooltipData.inputsText = custominputsText
        }
      }

      if (isValid(customFeatures)) {
        tooltipData.features = customFeatures
      }
      if (isValid(customLegends) && indicator.visible) {
        const optimizedLegends: TooltipLegend[] = []
        const color = styles.tooltip.legend.color
        customLegends.forEach(data => {
          let title = { text: '', color }
          if (isObject(data.title)) {
            title = data.title
          } else {
            title.text = data.title
          }
          let value = { text: '', color }
          if (isObject(data.value)) {
            value = data.value
          } else {
            value.text = data.value
          }
          if (isNumber(Number(value.text))) {
            value.text = decimalFold.format(thousandsSeparator.format(value.text))
          }
          optimizedLegends.push({ title, value })
        })
        tooltipData.legends = optimizedLegends
      }
    }
    return tooltipData
  }

  protected classifyTooltipFeatures (features: TooltipFeatureStyle[]): TooltipFeatureStyle[][] {
    const leftFeatures: TooltipFeatureStyle[] = []
    const middleFeatures: TooltipFeatureStyle[] = []
    const rightFeatures: TooltipFeatureStyle[] = []
    features.forEach(feature => {
      switch (feature.position) {
        case 'left': {
          leftFeatures.push(feature)
          break
        }
        case 'middle': {
          middleFeatures.push(feature)
          break
        }
        case 'right': {
          rightFeatures.push(feature)
          break
        }
      }
    })
    return [leftFeatures, middleFeatures, rightFeatures]
  }
}
