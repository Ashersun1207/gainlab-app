/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isArray, isNumber } from '../common/utils/typeChecks'
import type { FootprintCell } from '../common/Data'

import ChildrenView from './ChildrenView'

// FootprintRow 表示渲染阶段的一行（可能由多个价位聚合而来）
interface FootprintRow {
  buyVolume: number
  sellVolume: number
  totalVolume: number
  delta: number
  startIndex: number
  endIndex: number
  startPrice: number
  endPrice: number
}


// 根据颜色格式（hex/rgb）套用透明度
function applyAlpha (color: string, alpha: number): string {
  if (!color) {
    return color
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const bigint = parseInt(hex.length === 3
      ? hex.split('').map((c) => c + c).join('')
      : hex, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').map(p => p.trim())
      const [r, g, b] = parts
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    })
  }
  return color
}

// 将成交量格式化成带 K/M 的字符串
function formatVolume (value: number): string {
  if (!Number.isFinite(value)) {
    return '0'
  }
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return `${Math.round(value)}`
}

// 将过多的价档按组聚合，避免屏幕高度不够时文字重叠
function mergeFootprint (footprint: FootprintCell[], maxCells: number): { rows: FootprintRow[], groupSize: number } {
  const totalCells = footprint.length
  if (totalCells <= maxCells) {
    const rows = footprint.map((cell, index) => {
      const price = Number(cell.price ?? 0)
      return {
        buyVolume: Number(cell.buyVolume ?? 0),
        sellVolume: Number(cell.sellVolume ?? 0),
        totalVolume: Number(cell.buyVolume ?? 0) + Number(cell.sellVolume ?? 0),
        delta: Number(cell.delta ?? (cell.buyVolume ?? 0) - (cell.sellVolume ?? 0)),
        startIndex: index,
        endIndex: index,
        startPrice: price,
        endPrice: price
      }
    })
    return {
      rows,
      groupSize: 1
    }
  }
  const groupSize = Math.max(1, Math.ceil(totalCells / maxCells))
  const rows: FootprintRow[] = []
  for (let i = 0; i < totalCells; i += groupSize) {
    const slice = footprint.slice(i, i + groupSize)
    let buyVolume = 0
    let sellVolume = 0
    let maxPrice = -Infinity
    let minPrice = Infinity
    slice.forEach(cell => {
      buyVolume += Number(cell.buyVolume ?? 0)
      sellVolume += Number(cell.sellVolume ?? 0)
      const price = Number(cell.price ?? 0)
      if (Number.isFinite(price)) {
        if (price > maxPrice) maxPrice = price
        if (price < minPrice) minPrice = price
      }
    })
    rows.push({
      buyVolume,
      sellVolume,
      totalVolume: buyVolume + sellVolume,
      delta: buyVolume - sellVolume,
      startIndex: i,
      endIndex: i + slice.length - 1,
      startPrice: Number.isFinite(maxPrice) ? maxPrice : 0,
      endPrice: Number.isFinite(minPrice) ? minPrice : 0
    })
  }
  return {
    rows,
    groupSize
  }
}

export default class CandleFootprintPeriodView extends ChildrenView {
  override drawImp (ctx: CanvasRenderingContext2D): void {
    // 获取当前小部件、面板以及样式等基础对象
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chart = pane.getChart()
    const styles = chart.getStyles().candle.footprintPeriod
    
    // 如果样式未传入（关键属性不存在），则不绘制，等待样式设置
    if (!styles || (!styles.buyColor && !styles.sellColor)) {
      return
    }
    
    const yAxis = pane.getAxisComponent()

    const padding = styles.padding
    const cellStyle = styles.cell
    const leftBarStyle = styles.leftBar
    const histogramStyle = styles.histogram
    const textOffset = styles.textOffset
    const deltaStyle = styles.delta
    const volStyle = styles.vol

    const bodyPadding = padding.body
    const textTopMargin = padding.textTop
    const textBottomMargin = padding.textBottom
    const targetCellHeight = cellStyle.height
    const cellTextStyle = cellStyle.text
    const leftBarWidth = leftBarStyle.width
    const leftBarGap = leftBarStyle.gap
    const leftBarBackgroundAlpha = leftBarStyle.backgroundAlpha
    const leftBarBorderAlpha = leftBarStyle.borderAlpha
    const histogramMinAlpha = histogramStyle.minAlpha
    const histogramMaxAlpha = histogramStyle.maxAlpha
    const textGap = textOffset.gap
    const textCenterOffset = textOffset.centerOffset
    const textRightPadding = textOffset.rightPadding

    const buyThemeColor = styles.buyColor
    const sellThemeColor = styles.sellColor
    const neutralThemeColor = styles.neutralColor
    
    // Delta 配置
    const deltaShow = deltaStyle.show
    const deltaSize = deltaStyle.size
    
    // 总成交量配置
    const volShow = volStyle.show
    const volColor = volStyle.color
    const volSize = volStyle.size
    const volFamily = volStyle.family
    const volWeight = volStyle.weight
    
    // 单元格文字配置
    const cellTextShow = cellTextStyle.show
    const cellTextColor = cellTextStyle.color
    const cellTextSizeValue = cellTextStyle.size
    const cellTextFamily = cellTextStyle.family
    const cellTextWeight = cellTextStyle.weight

    // 针对每个可见的 k 线柱进行渲染
    this.eachChildren((visibleData, barSpace) => {
      const { current: kLineData } = visibleData.data
      if (kLineData === null) {
        return
      }
      const high = kLineData?.high
      const low = kLineData?.low
      const open = kLineData?.open
      const close = kLineData?.close
      if (!isNumber(high) || !isNumber(low) || !isNumber(open) || !isNumber(close)) {
        return
      }

      const footprint = (kLineData as any)?.[styles.dataKey]
      if (!isArray<FootprintCell>(footprint) || footprint.length === 0) {
        return
      }

      // 按价格降序排列，方便从上到下绘制
      const sortedFootprint = [...footprint].sort((a, b) => b.price - a.price)
      const totalBuyVolume = sortedFootprint.reduce((sum, cell) => sum + Number(cell.buyVolume ?? 0), 0)
      const totalSellVolume = sortedFootprint.reduce((sum, cell) => sum + Number(cell.sellVolume ?? 0), 0)
      const totalVolume = totalBuyVolume + totalSellVolume
      const delta = totalBuyVolume - totalSellVolume
      const pocPrice = (kLineData as any)?.pocPrice
      const pocIndex = sortedFootprint.findIndex(cell => Number(cell.price) === Number(pocPrice))

      // 将价格转换为像素坐标，得到柱体上下边界
      const highY = yAxis.convertToPixel(high)
      const lowY = yAxis.convertToPixel(low)
      let bodyTop = Math.min(highY, lowY) + bodyPadding
      let bodyBottom = Math.max(highY, lowY) - bodyPadding

      if (bodyBottom <= bodyTop) {
        const adjustment = targetCellHeight * sortedFootprint.length
        bodyTop = Math.min(highY, lowY)
        bodyBottom = bodyTop + adjustment
      }

      const availableHeight = Math.max(targetCellHeight, bodyBottom - bodyTop)
      const maxRenderableCells = Math.max(1, Math.floor(availableHeight / targetCellHeight))

      // 聚合/分组后得到实际要绘制的行
      const { rows, groupSize } = mergeFootprint(sortedFootprint, maxRenderableCells)
      const rowCount = rows.length
      const cellHeight = Math.max(targetCellHeight, availableHeight / rowCount)
      
      const bounding = widget.getBounding()
      const bodyTopClamped = Math.max(bounding.top, bodyTop)
      const bodyBottomClamped = Math.min(bounding.top + bounding.height, bodyBottom)

      const isBull = close >= open
      const baseBarColor = isBull ? buyThemeColor : sellThemeColor
      const openY = yAxis.convertToPixel(open)
      const closeY = yAxis.convertToPixel(close)
      const bodyTopY = Math.min(openY, closeY)
      const bodyBottomY = Math.max(openY, closeY)

      const columnWidth = Math.max(barSpace.gapBar, leftBarWidth + leftBarGap + textGap + textRightPadding + 24)
      const columnLeft = visibleData.x - columnWidth / 2
      const columnRight = columnLeft + columnWidth
      const leftBarLeftX = columnLeft
      const leftBarRightX = leftBarLeftX + leftBarWidth
      const volumeStartX = leftBarRightX + leftBarGap
      const volumeMaxWidth = Math.max(12, columnWidth - leftBarWidth - leftBarGap - textGap - textRightPadding)

      let pocGroupIndex = -1
      if (pocIndex !== -1) {
        pocGroupIndex = Math.floor(pocIndex / groupSize)
      }

      const overallMaxVolume = rows.reduce((max, row) => Math.max(max, row.totalVolume), 0)
      const pocVolume = Number((kLineData as any)?.pocVolume ?? overallMaxVolume)
      const maxVolume = Math.max(pocVolume, overallMaxVolume, 1)

      // 绘制左侧开盘/收盘窄实体
      const bodyHeight = Math.max(1, bodyBottomY - bodyTopY)
      this.createFigure({
        name: 'rect',
        attrs: {
          x: leftBarLeftX,
          y: bodyTopY,
          width: Math.max(2, leftBarWidth),
          height: bodyHeight
        },
        styles: {
          style: 'fill',
          color: applyAlpha(baseBarColor, leftBarBackgroundAlpha)
        }
      })?.draw(ctx)

      // 绘制每一档（或聚合档）的数据
      for (let i = 0; i < rowCount; i++) {
        const row = rows[i]
        const rectTop = bodyTop + i * cellHeight
        const rectBottom = rectTop + cellHeight
        const rectHeight = Math.max(targetCellHeight, rectBottom - rectTop - 1)

        const ratio = row.totalVolume / maxVolume
        const widthRatio = Math.min(Math.max(ratio, 0), 1)
        const baseWidth = Math.max(2, volumeMaxWidth * widthRatio)

        const alpha = histogramMinAlpha + (histogramMaxAlpha - histogramMinAlpha) * widthRatio
        let histogramColor = applyAlpha(baseBarColor, alpha)

        // 绘制主体成交量条
        if (baseWidth > 0) {
          this.createFigure({
            name: 'rect',
            attrs: {
              x: volumeStartX,
              y: rectTop,
              width: baseWidth,
              height: rectHeight
            },
            styles: {
              style: 'fill',
              color: histogramColor
            }
          })?.draw(ctx)
        }

        // 绘制文字（如果启用且高度足够，且 cell.height >= cell.text.size）
        if (cellTextShow && rectHeight > 0 && cellTextSizeValue > 0 && targetCellHeight >= cellTextSizeValue) {
          const centerY = rectTop + rectHeight / 2
          const buyText = formatVolume(row.buyVolume)
          const sellText = formatVolume(row.sellVolume)
          const pairText = `${buyText}|${sellText}`
          const textX = columnLeft + columnWidth / 2 + textCenterOffset

          this.createFigure({
            name: 'text',
            attrs: {
              x: textX,
              y: centerY,
              text: pairText,
              align: 'center',
              baseline: 'middle'
            },
            styles: {
              color: cellTextColor,
              size: cellTextSizeValue,
              family: cellTextFamily,
              weight: cellTextWeight
            }
          })?.draw(ctx)
        }
      }

      // 顶部显示 delta（如果启用）
      if (deltaShow) {
        const deltaText = delta > 0 ? `+${formatVolume(delta)}` : `${formatVolume(delta)}`
        const deltaColor = delta >= 0 ? buyThemeColor : sellThemeColor
        const topY = bodyTop - textTopMargin

        this.createFigure({
          name: 'text',
          attrs: {
            x: visibleData.x,
            y: topY,
            text: deltaText,
            align: 'center',
            baseline: 'bottom'
          },
          styles: {
            color: deltaColor,
            size: deltaSize
          }
        })?.draw(ctx)
      }

      // 底部显示总成交量（如果启用）
      if (volShow) {
        const bottomY = bodyBottomClamped + textBottomMargin
        const totalVolumeText = formatVolume(totalVolume)

        this.createFigure({
          name: 'text',
          attrs: {
            x: visibleData.x,
            y: bottomY,
            text: totalVolumeText,
            align: 'center',
            baseline: 'top'
          },
          styles: {
            color: volColor,
            size: volSize,
            family: volFamily,
            weight: volWeight
          }
        })?.draw(ctx)
      }
    })
  }

  stopAnimation (): void {
    // footprint 当前没有动画效果，占位以保持接口一致
  }
}

