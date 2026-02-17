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
import { formatPrecision, formatTemplateString } from '../common/utils/format'
import { createFont } from '../common/utils/canvas'
import { isValid, isObject, isString, isNumber, isFunction } from '../common/utils/typeChecks'
import { PeriodTypeCrosshairTooltipFormat } from '../common/Period'

import type { YAxis } from '../component/YAxis'
import type Coordinate from '../common/Coordinate'
import type Nullable from '../common/Nullable'
import type { Indicator } from '../component/Indicator'
import type { ActionType } from '../common/Action'

import type DrawPane from '../pane/DrawPane'
import type DrawWidget from '../widget/DrawWidget'
import View from './View'
import IndicatorTooltipView from './IndicatorTooltipView'

import { PaneIdConstants } from '../pane/types'

import { i18n } from '../extension/i18n/index'

interface TooltipFeatureInfo {
  paneId: string
  indicator?: Indicator
  script?: any
  feature: TooltipFeatureStyle
}

export default class CandleTooltipView extends IndicatorTooltipView {
  private _isStatusBarCollapsed: boolean = false;
  private _isCollapseBtnHovered: boolean = false;
  private _buttonAreas: Array<{
    left: number
    top: number
    right: number
    bottom: number
    type: string
  }> = []

  // 获取按钮区域
  getButtonAreas(): Array<{
    left: number
    top: number
    right: number
    bottom: number
    type: string
  }> {
    return this._buttonAreas
  }

  // 清除按钮区域
  clearButtonAreas(): void {
    this._buttonAreas = []
  }

  override drawImp(ctx: CanvasRenderingContext2D): void {
    // 清除旧的按钮区域
    this.clearButtonAreas()
    
    const widget = this.getWidget()
    const chartStore = widget.getPane().getChart().getChartStore()
    const crosshair = chartStore.getCrosshair()
    const styles = chartStore.getStyles();
    
    // 检查指标数量
    const indicators = chartStore.getIndicatorsByPaneId(widget.getPane().getId())
    const hasIndicators = indicators.length > 0

    // 检查脚本数量 - 只显示主图脚本
    const chart = widget.getPane().getChart()
    const paneId = widget.getPane().getId()
    const allScripts = (chart as any).getScripts?.() || []
    const scripts = allScripts.filter((script: any) => script.position === 'main')
    const hasScripts = scripts.length > 0

    
    // 检查tooltip设置
    const candleStyles = styles.candle
    const tooltipStyles = candleStyles.tooltip
    const shouldShowButton = (hasIndicators || hasScripts) &&
                           tooltipStyles.showRule === 'always' && 
                           tooltipStyles.showType === 'standard'
    

    if (isValid(crosshair.kLineData)) {
      const bounding = widget.getBounding()
      const indicatorStyles = styles.indicator
      if (
        candleStyles.tooltip.showType === 'rect' &&
        indicatorStyles.tooltip.showType === 'rect'
      ) {
        const isDrawCandleTooltip = this.isDrawTooltip(crosshair, candleStyles.tooltip)
        // 指标只受自己的收起功能控制
        const isDrawIndicatorTooltip = !this._isStatusBarCollapsed && this.isDrawTooltip(crosshair, indicatorStyles.tooltip)
        this._drawRectTooltip(
          ctx, isDrawCandleTooltip, isDrawIndicatorTooltip,
          candleStyles.tooltip.offsetTop
        )
      } else if (
        candleStyles.tooltip.showType === 'standard' &&
        indicatorStyles.tooltip.showType === 'standard'
      ) {

        const { offsetLeft, offsetTop, offsetRight } = candleStyles.tooltip
        const maxWidth = bounding.width - offsetRight


        const top = this._drawCandleStandardTooltip(
          ctx, offsetLeft, offsetTop, maxWidth
        )
        let closeBtnY = top
        // 指标只受自己的收起功能控制
        if (!this._isStatusBarCollapsed) {
          closeBtnY = this.drawIndicatorTooltip(ctx, offsetLeft, top, maxWidth)
        }

        // 只在满足条件时才显示按钮
        if (shouldShowButton) {
          this._drawCloseBtn(ctx, 0, closeBtnY, this.getWidget().getBounding().width);
        }
      } else if (
        candleStyles.tooltip.showType === 'rect' &&
        indicatorStyles.tooltip.showType === 'standard'
      ) {
        const { offsetLeft, offsetTop, offsetRight } = candleStyles.tooltip
        const maxWidth = bounding.width - offsetRight
        const top = !this._isStatusBarCollapsed ? this.drawIndicatorTooltip(
          ctx, offsetLeft, offsetTop, maxWidth
        ) : offsetTop
        const isDrawCandleTooltip = this.isDrawTooltip(crosshair, candleStyles.tooltip)
        this._drawRectTooltip(
          ctx, isDrawCandleTooltip, false, top
        )
      } else {
        const { offsetLeft, offsetTop, offsetRight } = candleStyles.tooltip
        const maxWidth = bounding.width - offsetRight
        const top = this._drawCandleStandardTooltip(
          ctx, offsetLeft, offsetTop, maxWidth
        )
        // 指标只受自己的收起功能控制
        const isDrawIndicatorTooltip = !this._isStatusBarCollapsed && this.isDrawTooltip(crosshair, indicatorStyles.tooltip)
        this._drawRectTooltip(
          ctx, false, isDrawIndicatorTooltip, top
        )
      }
    }

    // 只在满足条件时才画按钮
    if (shouldShowButton) {
      const btnX = 10, btnY = 4, btnSize = 16;
      // 全局检测鼠标是否在按钮区域
      const mouseX = crosshair.realX ?? -1;
      const mouseY = crosshair.y ?? -1;
      const inBtn = mouseX >= btnX && mouseX <= btnX + btnSize && mouseY >= btnY && mouseY <= btnY + btnSize;
      if (!inBtn && this._isCollapseBtnHovered) {
        this._isCollapseBtnHovered = false;
        this.getWidget().update && this.getWidget().update();
      }
    }

    // 计算所有按钮的总区域
    if (this._buttonAreas.length > 0) {
      let totalLeft = Infinity
      let totalTop = Infinity
      let totalRight = -Infinity
      let totalBottom = -Infinity
      
      for (const area of this._buttonAreas) {
        totalLeft = Math.min(totalLeft, area.left)
        totalTop = Math.min(totalTop, area.top)
        totalRight = Math.max(totalRight, area.right)
        totalBottom = Math.max(totalBottom, area.bottom)
      }
      
      // 替换所有按钮区域为总区域
      this._buttonAreas = [{
        left: totalLeft,
        top: totalTop,
        right: totalRight,
        bottom: totalBottom,
        type: 'all'
      }]
    }
  }



  private _drawCandleStandardTooltip(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    maxWidth: number
  ): number {
    const chartStore = this.getWidget().getPane().getChart().getChartStore()
    const styles = chartStore.getStyles().candle
    const tooltipStyles = styles.tooltip
    const tooltipLegendStyles = tooltipStyles.legend
    let prevRowHeight = 0
    const coordinate = { x: left, y: top }
    const crosshair = chartStore.getCrosshair()
    if (this.isDrawTooltip(crosshair, tooltipStyles)) {
      const tooltipTitleStyles = tooltipStyles.title
      if (tooltipTitleStyles.show) {
        const { type = '', span = '' } = chartStore.getPeriod() ?? {}
        const text = formatTemplateString(tooltipTitleStyles.template, { ...chartStore.getSymbol(), period: `${span}${i18n(type, chartStore.getLocale())}` })
        const color = tooltipTitleStyles.color
        const height = this.drawStandardTooltipLegends(
          ctx, [
          {
            title: { text: '', color },
            value: { text, color }
          }
        ], { x: left, y: top }, left,
          0, maxWidth, tooltipTitleStyles
        )
        coordinate.y = coordinate.y + height
      }
      
      // 读取状态行显示开关，只控制数据行显示
      let showStatusBar = true;
      try {
        const legend = tooltipLegendStyles as any;
        showStatusBar = legend.show !== false;
      } catch (e) { }
      
      const legends = this._getCandleTooltipLegends()
      const features = this.classifyTooltipFeatures(tooltipStyles.features)
      prevRowHeight = this.drawStandardTooltipFeatures(
        ctx, features[0], coordinate,
        null, left, prevRowHeight, maxWidth
      )
      prevRowHeight = this.drawStandardTooltipFeatures(
        ctx, features[1], coordinate,
        null, left, prevRowHeight, maxWidth
      )
      // 只有状态行开关为 true 时才显示数据行
      if (showStatusBar && legends.length > 0) {
        prevRowHeight = this.drawStandardTooltipLegends(
          ctx, legends, coordinate, left,
          prevRowHeight, maxWidth, tooltipLegendStyles
        )
      }

      prevRowHeight = this.drawStandardTooltipFeatures(
        ctx, features[2], coordinate,
        null, left, prevRowHeight, maxWidth
      )
    }
    return coordinate.y + prevRowHeight;
  }

  private _drawRectTooltip(
    ctx: CanvasRenderingContext2D,
    isDrawCandleTooltip: boolean,
    isDrawIndicatorTooltip: boolean,
    top: number
  ): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chartStore = pane.getChart().getChartStore()

    const styles = chartStore.getStyles()
    const candleStyles = styles.candle
    const indicatorStyles = styles.indicator
    const candleTooltipStyles = candleStyles.tooltip
    const indicatorTooltipStyles = indicatorStyles.tooltip
    if (isDrawCandleTooltip || isDrawIndicatorTooltip) {
      const candleLegends = this._getCandleTooltipLegends()
      const { offsetLeft, offsetTop, offsetRight, offsetBottom } = candleTooltipStyles

      const {
        marginLeft: baseLegendMarginLeft,
        marginRight: baseLegendMarginRight,
        marginTop: baseLegendMarginTop,
        marginBottom: baseLegendMarginBottom,
        size: baseLegendSize,
        weight: baseLegendWeight,
        family: baseLegendFamily
      } = candleTooltipStyles.legend

      const {
        position: rectPosition,
        paddingLeft: rectPaddingLeft,
        paddingRight: rectPaddingRight,
        paddingTop: rectPaddingTop,
        paddingBottom: rectPaddingBottom,
        offsetLeft: rectOffsetLeft,
        offsetRight: rectOffsetRight,
        offsetTop: rectOffsetTop,
        offsetBottom: rectOffsetBottom,
        borderSize: rectBorderSize,
        borderRadius: rectBorderRadius,
        borderColor: rectBorderColor,
        color: rectBackgroundColor
      } = candleTooltipStyles.rect

      let maxTextWidth = 0
      let rectWidth = 0
      let rectHeight = 0
      if (isDrawCandleTooltip) {
        ctx.font = createFont(baseLegendSize, baseLegendWeight, baseLegendFamily)
        candleLegends.forEach(data => {
          const title = data.title as TooltipLegendChild
          const value = data.value as TooltipLegendChild
          const text = `${title.text}${value.text}`
          const labelWidth = ctx.measureText(text).width + baseLegendMarginLeft + baseLegendMarginRight
          maxTextWidth = Math.max(maxTextWidth, labelWidth)
        })
        rectHeight += ((baseLegendMarginBottom + baseLegendMarginTop + baseLegendSize) * candleLegends.length)
      }

      const {
        marginLeft: indicatorLegendMarginLeft,
        marginRight: indicatorLegendMarginRight,
        marginTop: indicatorLegendMarginTop,
        marginBottom: indicatorLegendMarginBottom,
        size: indicatorLegendSize,
        weight: indicatorLegendWeight,
        family: indicatorLegendFamily
      } = indicatorTooltipStyles.legend
      const indicatorLegendsArray: TooltipLegend[][] = []
      if (isDrawIndicatorTooltip) {
        const indicators = chartStore.getIndicatorsByPaneId(pane.getId())
        ctx.font = createFont(indicatorLegendSize, indicatorLegendWeight, indicatorLegendFamily)
        indicators.forEach(indicator => {
          const tooltipDataLegends = this.getIndicatorTooltipData(indicator).legends
          indicatorLegendsArray.push(tooltipDataLegends)
          tooltipDataLegends.forEach(data => {
            const title = data.title as TooltipLegendChild
            const value = data.value as TooltipLegendChild
            const text = `${title.text}${value.text}`
            const textWidth = ctx.measureText(text).width + indicatorLegendMarginLeft + indicatorLegendMarginRight
            maxTextWidth = Math.max(maxTextWidth, textWidth)
            rectHeight += (indicatorLegendMarginTop + indicatorLegendMarginBottom + indicatorLegendSize)
          })
        })
      }
      rectWidth += maxTextWidth
      if (rectWidth !== 0 && rectHeight !== 0) {
        const crosshair = chartStore.getCrosshair()
        const bounding = widget.getBounding()
        const yAxisBounding = pane.getYAxisWidget()!.getBounding()
        rectWidth += (rectBorderSize * 2 + rectPaddingLeft + rectPaddingRight)
        rectHeight += (rectBorderSize * 2 + rectPaddingTop + rectPaddingBottom)
        const centerX = bounding.width / 2
        const isPointer = rectPosition === 'pointer' && crosshair.paneId === PaneIdConstants.CANDLE
        const isLeft = (crosshair.realX ?? 0) > centerX
        let rectX = 0
        if (isPointer) {
          const realX = crosshair.realX!
          if (isLeft) {
            rectX = realX - rectOffsetRight - rectWidth
          } else {
            rectX = realX + rectOffsetLeft
          }
        } else {
          const yAxis = this.getWidget().getPane().getAxisComponent()
          if (isLeft) {
            rectX = rectOffsetLeft + offsetLeft
            if (yAxis.inside && yAxis.position === 'left') {
              rectX += yAxisBounding.width
            }
          } else {
            rectX = bounding.width - rectOffsetRight - rectWidth - offsetRight
            if (yAxis.inside && yAxis.position === 'right') {
              rectX -= yAxisBounding.width
            }
          }
        }

        let rectY = top + rectOffsetTop
        if (isPointer) {
          const y = crosshair.y!
          rectY = y - rectHeight / 2
          if (rectY + rectHeight > bounding.height - rectOffsetBottom - offsetBottom) {
            rectY = bounding.height - rectOffsetBottom - rectHeight - offsetBottom
          }
          if (rectY < top + rectOffsetTop) {
            rectY = top + rectOffsetTop + offsetTop
          }
        }
        this.createFigure({
          name: 'rect',
          attrs: {
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight
          },
          styles: {
            style: 'stroke_fill',
            color: rectBackgroundColor,
            borderColor: rectBorderColor,
            borderSize: rectBorderSize,
            borderRadius: rectBorderRadius
          }
        })?.draw(ctx)
        const candleTextX = rectX + rectBorderSize + rectPaddingLeft + baseLegendMarginLeft
        let textY = rectY + rectBorderSize + rectPaddingTop
        if (isDrawCandleTooltip) {
          // render candle texts
          candleLegends.forEach(data => {
            textY += baseLegendMarginTop
            const title = data.title as TooltipLegendChild
            this.createFigure({
              name: 'text',
              attrs: {
                x: candleTextX,
                y: textY,
                text: title.text
              },
              styles: {
                color: title.color,
                size: baseLegendSize,
                family: baseLegendFamily,
                weight: baseLegendWeight
              }
            })?.draw(ctx)
            const value = data.value as TooltipLegendChild
            this.createFigure({
              name: 'text',
              attrs: {
                x: rectX + rectWidth - rectBorderSize - baseLegendMarginRight - rectPaddingRight,
                y: textY,
                text: value.text,
                align: 'right'
              },
              styles: {
                color: value.color,
                size: baseLegendSize,
                family: baseLegendFamily,
                weight: baseLegendWeight
              }
            })?.draw(ctx)
            textY += (baseLegendSize + baseLegendMarginBottom)
          })
        }
        if (isDrawIndicatorTooltip) {
          // render indicator legends
          const indicatorTextX = rectX + rectBorderSize + rectPaddingLeft + indicatorLegendMarginLeft
          indicatorLegendsArray.forEach(legends => {
            legends.forEach(data => {
              textY += indicatorLegendMarginTop
              const title = data.title as TooltipLegendChild
              const value = data.value as TooltipLegendChild
              this.createFigure({
                name: 'text',
                attrs: {
                  x: indicatorTextX,
                  y: textY,
                  text: title.text
                },
                styles: {
                  color: title.color,
                  size: indicatorLegendSize,
                  family: indicatorLegendFamily,
                  weight: indicatorLegendWeight
                }
              })?.draw(ctx)

              this.createFigure({
                name: 'text',
                attrs: {
                  x: rectX + rectWidth - rectBorderSize - indicatorLegendMarginRight - rectPaddingRight,
                  y: textY,
                  text: value.text,
                  align: 'right'
                },
                styles: {
                  color: value.color,
                  size: indicatorLegendSize,
                  family: indicatorLegendFamily,
                  weight: indicatorLegendWeight
                }
              })?.draw(ctx)
              textY += (indicatorLegendSize + indicatorLegendMarginBottom)
            })
          })
        }
      }
    }
  }

  private _getCandleTooltipLegends(): TooltipLegend[] {
    const chartStore = this.getWidget().getPane().getChart().getChartStore()
    const styles = chartStore.getStyles().candle
    const dataList = chartStore.getDataList()
    const formatter = chartStore.getInnerFormatter()
    const decimalFold = chartStore.getDecimalFold()
    const thousandsSeparator = chartStore.getThousandsSeparator()
    const locale = chartStore.getLocale()
    const { pricePrecision = 2, volumePrecision = 0 } = chartStore.getSymbol() ?? {}
    const period = chartStore.getPeriod()
    const dataIndex = chartStore.getCrosshair().dataIndex ?? 0

    const tooltipStyles = styles.tooltip
    const { color: textColor, defaultValue, template } = tooltipStyles.legend
    const prev = dataList[dataIndex - 1] ?? null
    const current = dataList[dataIndex]

    // 根据涨跌参照设置计算涨跌
    let referencePrice: number
    if (styles.bar?.compareRule === 'current_open') {
      // 今开盘价作为参照
      referencePrice = current.open
    } else {
      // 前收盘价作为参照（默认）
      referencePrice = prev?.close ?? current.close
    }
    
    const changeValue = current.close - referencePrice
    const mapping = {
      ...current,
      time: formatter.formatDate(current.timestamp, PeriodTypeCrosshairTooltipFormat[period?.type ?? 'day'], 'tooltip'),
      open: decimalFold.format(thousandsSeparator.format(formatPrecision(current.open, pricePrecision))),
      high: decimalFold.format(thousandsSeparator.format(formatPrecision(current.high, pricePrecision))),
      low: decimalFold.format(thousandsSeparator.format(formatPrecision(current.low, pricePrecision))),
      close: decimalFold.format(thousandsSeparator.format(formatPrecision(current.close, pricePrecision))),
      volume: decimalFold.format(thousandsSeparator.format(
        formatter.formatBigNumber(formatPrecision(current.volume ?? defaultValue, volumePrecision))
      )),
      turnover: decimalFold.format(thousandsSeparator.format(
        formatPrecision(current.turnover ?? defaultValue, pricePrecision)
      )),
      change: referencePrice === 0 ? defaultValue : `${thousandsSeparator.format(formatPrecision(changeValue / referencePrice * 100))}%`
    }
    const legends: TooltipLegend[] = (
      isFunction(template)
        ? template({ prev, current, next: dataList[dataIndex + 1] ?? null }, styles) as TooltipLegend[]
        : template as TooltipLegend[]
    )

    return legends.map(({ title, value }) => {
      let t: TooltipLegendChild = { text: '', color: textColor }
      if (isObject(title)) {
        t = { ...title } as TooltipLegendChild
      } else {
        t.text = title
      }
      t.text = i18n(t.text, locale)
      let v: TooltipLegendChild = { text: defaultValue, color: textColor }
      if (isObject(value)) {
        v = { ...value } as TooltipLegendChild
      } else {
        v.text = value
      }
      
      // 根据当前价格与参照价格的比较来设置颜色
      if (isValid(/{change}/.exec(v.text))) {
        // change字段使用涨跌色
        v.color = changeValue === 0 ? styles.priceMark.last.noChangeColor : (changeValue > 0 ? styles.priceMark.last.upColor : styles.priceMark.last.downColor)
      } else if (isValid(/{close}/.exec(v.text))) {
        // close字段根据价格比较设置颜色
        v.color = changeValue === 0 ? textColor : (changeValue > 0 ? styles.priceMark.last.upColor : styles.priceMark.last.downColor)
      } else if (isValid(/{open}/.exec(v.text))) {
        // open字段根据价格比较设置颜色
        v.color = changeValue === 0 ? textColor : (changeValue > 0 ? styles.priceMark.last.upColor : styles.priceMark.last.downColor)
      } else if (isValid(/{high}/.exec(v.text))) {
        // high字段根据价格比较设置颜色
        v.color = changeValue === 0 ? textColor : (changeValue > 0 ? styles.priceMark.last.upColor : styles.priceMark.last.downColor)
      } else if (isValid(/{low}/.exec(v.text))) {
        // low字段根据价格比较设置颜色
        v.color = changeValue === 0 ? textColor : (changeValue > 0 ? styles.priceMark.last.upColor : styles.priceMark.last.downColor)
      }
      
      v.text = formatTemplateString(v.text, mapping)
      return { title: t, value: v }
    })
  }
  private _drawCloseBtn(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    maxWidth: number
  ): number {
    const btnWidth = 24;
    const btnHeight = 14;
    const btnX = left + 10;
    const btnY = top + 4;
    const radius = 4;

    // 记录按钮区域
    this._buttonAreas.push({
      left: btnX,
      top: btnY,
      right: btnX + btnWidth,
      bottom: btnY + btnHeight,
      type: 'collapse'
    })

    // 背景色
    ctx.save();
    ctx.translate(0.5, 0.5);
    ctx.beginPath();
    ctx.moveTo(btnX, btnY + radius);
    ctx.arcTo(btnX, btnY, btnX + btnWidth, btnY, radius);
    ctx.arcTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + btnHeight, radius);
    ctx.arcTo(btnX + btnWidth, btnY + btnHeight, btnX, btnY + btnHeight, radius);
    ctx.arcTo(btnX, btnY + btnHeight, btnX, btnY, radius);
    ctx.closePath();
    ctx.fillStyle = this._isCollapseBtnHovered ? 'rgba(57, 109, 253, 0.2)' : 'rgba(57, 109, 253,0.1)';
    ctx.fill();
    ctx.restore();

    // 边框
    ctx.save();
    ctx.translate(0.5, 0.5);
    ctx.beginPath();
    ctx.moveTo(btnX, btnY + radius);
    ctx.arcTo(btnX, btnY, btnX + btnWidth, btnY, radius);
    ctx.arcTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + btnHeight, radius);
    ctx.arcTo(btnX + btnWidth, btnY + btnHeight, btnX, btnY + btnHeight, radius);
    ctx.arcTo(btnX, btnY + btnHeight, btnX, btnY, radius);
    ctx.closePath();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(32, 159, 243)';
    ctx.stroke();
    ctx.restore();

    // 箭头
    this.createFigure({
      name: 'text',
      attrs: {
        x: btnX + btnWidth / 2,
        y: btnY + btnHeight / 2,
        text: this._isStatusBarCollapsed ? '∨' : '∧',
        align: 'center',
        baseline: 'middle'
      },
      styles: {
        color: this._isCollapseBtnHovered ? 'rgba(49, 129, 250, 0.7)' : 'rgba(49, 129, 250,1)',
        size: 8,
        cursor: 'pointer'
      }
    })?.draw(ctx);

    // 事件区域
    this.createFigure({
      name: 'rect',
      attrs: {
        x: btnX,
        y: btnY,
        width: btnWidth,
        height: btnHeight
      },
      styles: {
        color: 'rgba(0,0,0,0)',
        borderColor: 'rgba(128,128,128,0)',
        borderSize: 1
      }
    }, {
      mouseMoveEvent: () => {
        if (!this._isCollapseBtnHovered) {
          this._isCollapseBtnHovered = true;
          this.getWidget().update && this.getWidget().update();
        }
        return true;
      },
      mouseLeaveEvent: () => {
        if (this._isCollapseBtnHovered) {
          this._isCollapseBtnHovered = false;
          this.getWidget().update && this.getWidget().update();
        }
        return true;
      },
      mouseClickEvent: () => {
        this._isStatusBarCollapsed = !this._isStatusBarCollapsed;
        this.getWidget().update && this.getWidget().update();
        return true;
      }
    })?.draw(ctx);

    return btnHeight + 8;
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
    // 调用父类方法
    const result = super.drawStandardTooltipFeatures(ctx, features, coordinate, indicator, left, prevRowHeight, maxWidth, script)
    
    // 记录按钮位置
    const pane = this.getWidget().getPane()
    const paneId = pane.getId()
    
    // 计算整个按钮组的区域
    let groupLeft = Infinity
    let groupTop = Infinity
    let groupRight = -Infinity
    let groupBottom = -Infinity
    
    features.forEach((feature, index) => {
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
      
      // 计算按钮的实际位置
      const buttonX = coordinate.x + marginLeft
      const buttonY = coordinate.y + marginTop
      const buttonWidth = marginLeft + paddingLeft + contentWidth + paddingRight + marginRight
      const buttonHeight = marginTop + paddingTop + size + paddingBottom + marginBottom
      
      // 更新按钮组的边界
      groupLeft = Math.min(groupLeft, buttonX)
      groupTop = Math.min(groupTop, buttonY)
      groupRight = Math.max(groupRight, buttonX + buttonWidth)
      groupBottom = Math.max(groupBottom, buttonY + buttonHeight)
    })
    
    // 记录整个按钮组的区域
    if (features.length > 0) {
      this._buttonAreas.push({
        left: groupLeft,
        top: groupTop,
        right: groupRight,
        bottom: groupBottom,
        type: indicator ? 'indicator' : (script ? 'script' : 'feature')
      })
    }
    
    return result
  }

  


}
