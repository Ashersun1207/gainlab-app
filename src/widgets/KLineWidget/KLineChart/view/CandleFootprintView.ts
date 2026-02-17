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
}

const BODY_WIDTH_MARGIN_RATIO = 0.18
const MIN_BODY_WIDTH = 36

// 根据颜色格式（hex/rgb）套用透明度
function applyAlpha(color: string, alpha: number): string {
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
function formatVolume(value: number): string {
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
function mergeFootprint(footprint: FootprintCell[], maxCells: number): { rows: FootprintRow[], groupSize: number } {
  const totalCells = footprint.length
  if (totalCells <= maxCells) {
    const rows = footprint.map((cell, index) => ({
      buyVolume: Number(cell.buyVolume ?? 0),
      sellVolume: Number(cell.sellVolume ?? 0),
      totalVolume: Number(cell.buyVolume ?? 0) + Number(cell.sellVolume ?? 0),
      delta: Number(cell.delta ?? (cell.buyVolume ?? 0) - (cell.sellVolume ?? 0)),
      startIndex: index,
      endIndex: index
    }))
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
    slice.forEach(cell => {
      buyVolume += Number(cell.buyVolume ?? 0)
      sellVolume += Number(cell.sellVolume ?? 0)
    })
    rows.push({
      buyVolume,
      sellVolume,
      totalVolume: buyVolume + sellVolume,
      delta: buyVolume - sellVolume,
      startIndex: i,
      endIndex: i + slice.length - 1
    })
  }
  return {
    rows,
    groupSize
  }
}

export default class CandleFootprintView extends ChildrenView {
  override drawImp(ctx: CanvasRenderingContext2D): void {
    // 获取当前小部件、面板以及样式等基础对象
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chart = pane.getChart()
    const styles = chart.getStyles().candle.footprint
    
    // 如果样式未传入（关键属性不存在），则不绘制，等待样式设置
    if (!styles || (!styles.buyColor && !styles.sellColor)) {
      return
    }
    
    const yAxis = pane.getAxisComponent()

    const padding = styles.padding
    const cellStyle = styles.cell
    const borderStyle = styles.border
    const deltaStyle = styles.delta
    const volStyle = styles.vol

    const bodyPadding = padding.body
    const textTopMargin = padding.textTop
    const textBottomMargin = padding.textBottom
    const textHorizontalPadding = padding.textHorizontal

    const targetCellHeight = cellStyle.height
    const cellTextSize = cellStyle.size

    const dividerWidth = borderStyle.dividerWidth
    const borderSize = borderStyle.size

    // 从样式读取所有颜色配置
    const dividerColor = styles.dividerColor
    const pocHighlightColor = styles.pocHighlightColor
    const buyThemeColor = styles.buyColor
    const sellThemeColor = styles.sellColor
    
    // Delta 配置
    const deltaShow = deltaStyle.show
    const deltaSize = deltaStyle.size
    
    // 总成交量配置
    const volShow = volStyle.show
    const volColor = volStyle.color
    const volSize = volStyle.size
    const volFamily = volStyle.family
    const volWeight = volStyle.weight

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

      let isBull: boolean
      if (close > open) {
        isBull = true
      } else if (close < open) {
        isBull = false
      } else {
        isBull = delta >= 0
      }
      // 计算柱体宽度以及左右两列的宽度
      const availableBarWidth = Math.max(barSpace.gapBar, MIN_BODY_WIDTH)
      const margin = Math.max(1, availableBarWidth * BODY_WIDTH_MARGIN_RATIO)
      const bodyWidth = Math.min(availableBarWidth, Math.max(availableBarWidth - margin, MIN_BODY_WIDTH))
      const displayDividerWidth = Math.max(1, dividerWidth)
      const bodyLeft = visibleData.x - bodyWidth / 2

      const bounding = widget.getBounding()
      const bodyTopClamped = Math.max(bounding.top, bodyTop)
      const bodyBottomClamped = Math.min(bounding.top + bounding.height, bodyBottom)

      // 使用足迹图样式中的颜色，而不是 K 线 bar 的颜色
      const backgroundColor = applyAlpha(isBull ? buyThemeColor : sellThemeColor, 0.1)
      const borderColor = isBull ? buyThemeColor : sellThemeColor
      const openY = yAxis.convertToPixel(open)
      const closeY = yAxis.convertToPixel(close)
      let bodyOcTop = Math.min(openY, closeY)
      let bodyOcBottom = Math.max(openY, closeY)
      bodyOcTop = Math.max(bodyTopClamped, Math.min(bodyBottomClamped, bodyOcTop))
      bodyOcBottom = Math.min(bodyBottomClamped, Math.max(bodyTopClamped, bodyOcBottom))
      let bodyOcHeight = Math.max(1, bodyOcBottom - bodyOcTop)
      if (bodyOcHeight <= 0) {
        bodyOcTop = bodyTopClamped
        bodyOcBottom = bodyBottomClamped
        bodyOcHeight = Math.max(1, bodyOcBottom - bodyOcTop)
      }
      // 绘制实体矩形及边框（仅覆盖开收盘区间）
      this.createFigure({
        name: 'rect',
        attrs: {
          x: bodyLeft,
          y: bodyOcTop,
          width: bodyWidth,
          height: bodyOcHeight
        },
        styles: {
          style: 'stroke_fill',
          color: backgroundColor,
          borderColor,
          size: borderSize
        }
      })?.draw(ctx)

      // 绘制上下影线
      this.createFigure({
        name: 'line',
        attrs: {
          coordinates: [
            { x: visibleData.x, y: Math.min(highY, lowY) },
            { x: visibleData.x, y: Math.max(highY, lowY) }
          ]
        },
        styles: {
          color: borderColor,
          size: 1
        }
      })?.draw(ctx)

      // 绘制左右列的分隔线
      this.createFigure({
        name: 'line',
        attrs: {
          coordinates: [
            { x: visibleData.x, y: bodyTopClamped },
            { x: visibleData.x, y: bodyBottomClamped }
          ]
        },
        styles: {
          color: dividerColor,
          size: dividerWidth
        }
      })?.draw(ctx)

      // 文字颜色：有成交量时使用对应的主题色，无成交量时使用默认文字颜色
      const buyTextColor = buyThemeColor
      const sellTextColor = sellThemeColor

      let pocGroupIndex = -1
      if (pocIndex !== -1) {
        pocGroupIndex = Math.floor(pocIndex / groupSize)
      }

      // 绘制每一档（或聚合档）的数据
      for (let i = 0; i < rowCount; i++) {
        const row = rows[i]
        const rectTop = bodyTop + i * cellHeight
        const rectBottom = rectTop + cellHeight
        const rectHeight = Math.max(targetCellHeight, rectBottom - rectTop)

        const isPocRow = i === pocGroupIndex

        // 先绘制 POC 高亮背景（如果有），这样文字会绘制在它上面
        const pocWidth = Math.max(1, bodyWidth - borderSize * 2)
        const pocLeft = bodyLeft + borderSize
        if (isPocRow) {
          this.createFigure({
            name: 'rect',
            attrs: {
              x: pocLeft,
              y: rectTop,
              width: pocWidth,
              height: rectHeight
            },
            styles: {
              style: 'fill',
              color: pocHighlightColor
            }
          })?.draw(ctx)
          this.createFigure({
            name: 'rect',
            attrs: {
              x: pocLeft,
              y: rectTop,
              width: pocWidth,
              height: rectHeight
            },
            styles: {
              style: 'stroke',
              color: pocHighlightColor,
              size: 1
            }
          })?.draw(ctx)
        }

        // 绘制文字（在 POC 高亮之后，确保文字显示在最上层）
        // 使用 cell.size 作为单元格内文字大小
        if (rectHeight > 0 && cellTextSize > 0) {
          const centerY = rectTop + rectHeight / 2
          const buyText = formatVolume(row.buyVolume)
          const sellText = formatVolume(row.sellVolume)

          const textMargin = Math.max(textHorizontalPadding, borderSize + 2)
          const buyTextX = visibleData.x - displayDividerWidth / 2 - textMargin
          const sellTextX = visibleData.x + displayDividerWidth / 2 + textMargin

          // 买方成交量（即使为0也显示）
          if (buyText) {
            const buyFigure = this.createFigure({
              name: 'text',
              attrs: {
                x: buyTextX,
                y: centerY,
                text: buyText,
                align: 'right',
                baseline: 'middle'
              },
              styles: {
                color: buyThemeColor,
                size: cellTextSize
              }
            })
            if (buyFigure) {
              buyFigure.draw(ctx)
            }
          }

          // 卖方成交量（即使为0也显示）
          if (sellText) {
            const sellFigure = this.createFigure({
              name: 'text',
              attrs: {
                x: sellTextX,
                y: centerY,
                text: sellText,
                align: 'left',
                baseline: 'middle'
              },
              styles: {
                color: sellThemeColor,
                size: cellTextSize
              }
            })
            if (sellFigure) {
              sellFigure.draw(ctx)
            }
          }
        }
      }

      // 重新描边，避免被 POC 高亮覆盖
      this.createFigure({
        name: 'rect',
        attrs: {
          x: bodyLeft,
          y: bodyOcTop,
          width: bodyWidth,
          height: bodyOcHeight
        },
        styles: {
          style: 'stroke',
          color: borderColor,
          size: 1
        }
      })?.draw(ctx)

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

  stopAnimation(): void {
    // footprint 当前没有动画效果，占位以保持接口一致
  }
}

