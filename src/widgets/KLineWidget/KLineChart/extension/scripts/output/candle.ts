import { KLineData } from '../../../common/Data'

export interface CandleStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  full?: 'fill' | 'stroke'
  size?: number
  show?: boolean  // 是否显示
}

export interface CandleCallbackContext {
  value: KLineData
  index: number
  prev?: KLineData
}

export function outputCandle(
  scriptContext: any,
  dataList: KLineData[],
  styles: CandleStyle | ((context: CandleCallbackContext) => CandleStyle)
) {
  const { ctx, bounding, yAxis, xAxis } = scriptContext
  if (!ctx || !dataList || dataList.length === 0) return

  // 获取样式
  const getStyles = (context: CandleCallbackContext): CandleStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  // 获取可见范围
  const visibleRange = xAxis?._range
  if (!visibleRange) {
    console.warn('outputCandle: xAxis._range 无效', xAxis?._range)
    return
  }

  // 计算蜡烛宽度
  const candleWidth = Math.max(1, Math.floor((bounding.width / (visibleRange.to - visibleRange.from)) * 0.8))

  // 绘制蜡烛图
  for (let i = visibleRange.from; i < visibleRange.to && i < dataList.length; i++) {
    const data = dataList[i]
    if (!data || data.open === undefined || data.close === undefined) continue

    // 创建回调上下文
    const callbackContext: CandleCallbackContext = {
      value: data,
      index: i,
      prev: i > 0 ? dataList[i - 1] : undefined
    }

    const style = getStyles(callbackContext)
    
    // 检查是否显示
    if (style.show === false) {
      continue
    }
    
    const color: any = style.color || '#00FF00'
    const full = style.full || 'fill'
    const size = style.size || 1

    const open = data.open
    const close = data.close
    const high = data.high
    const low = data.low

    // 判断涨跌
    const isUp = close >= open
    const bodyColor = color // 直接使用回调返回的颜色，回调函数可以根据涨跌返回不同颜色

    // 计算坐标
    const x = xAxis.convertToPixel(i)
    const openY = yAxis.convertToPixel(open)
    const closeY = yAxis.convertToPixel(close)
    const highY = high !== undefined ? yAxis.convertToPixel(high) : null
    const lowY = low !== undefined ? yAxis.convertToPixel(low) : null

    if (x === null || openY === null || closeY === null) continue

    // 计算实体位置
    const bodyTop = Math.min(openY, closeY)
    const bodyBottom = Math.max(openY, closeY)
    const bodyHeight = bodyBottom - bodyTop

    // 确保最小高度为1px，避免小蜡烛体不显示
    const minBodyHeight = Math.max(1, bodyHeight)

    // 像素对齐 - 更精确的计算，避免0.5px
    const alignedX = Math.round(x)
    const alignedBodyTop = Math.round(bodyTop)
    const alignedBodyBottom = Math.round(bodyTop + minBodyHeight) // 使用最小高度
    const alignedCandleWidth = Math.max(1, Math.round(candleWidth))

    // 计算蜡烛位置 - 确保完全对齐到像素，避免颜色露出
    const candleLeft = Math.floor(alignedX - alignedCandleWidth / 2)
    const candleRight = candleLeft + alignedCandleWidth

    // 强制设置为实线
    ctx.setLineDash([])

    // 绘制实体 - 使用更精确的像素对齐
    if (full === 'fill') {
      if (Array.isArray(bodyColor)) {
        // 颜色数组，创建渐变
        const colors = bodyColor;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(0, alignedBodyTop, 0, alignedBodyBottom);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = colors[0] || '#00FF00';
        }
      } else {
        ctx.fillStyle = bodyColor;
      }
      // 确保宽度是整数，避免颜色露出，右边加1px
      const finalWidth = Math.max(1, candleRight - candleLeft + 1)
      const finalHeight = Math.max(1, alignedBodyBottom - alignedBodyTop) // 确保高度至少1px
      ctx.fillRect(candleLeft, alignedBodyTop, finalWidth, finalHeight)
    } else {
      if (Array.isArray(bodyColor)) {
        // 颜色数组，创建渐变
        const colors = bodyColor;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(0, alignedBodyTop, 0, alignedBodyBottom);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = colors[0] || '#00FF00';
        }
      } else {
        ctx.strokeStyle = bodyColor;
      }
      ctx.lineWidth = size
      // 空心时绘制边框，不填充，右边加1px
      const finalWidth = Math.max(1, candleRight - candleLeft + 1)
      const finalHeight = Math.max(1, alignedBodyBottom - alignedBodyTop) // 确保高度至少1px
      ctx.strokeRect(candleLeft, alignedBodyTop, finalWidth, finalHeight)
    }

    // 绘制上影线 - 空心时分开绘制，不贯穿
    if (highY !== null && highY < bodyBottom) {
      if (Array.isArray(bodyColor)) {
        // 颜色数组，创建渐变
        const colors = bodyColor;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(0, alignedBodyBottom, 0, Math.round(highY));
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = colors[0] || '#00FF00';
        }
      } else {
        ctx.strokeStyle = bodyColor;
      }
      ctx.lineWidth = size
      ctx.setLineDash([]) // 确保影线也是实线
      ctx.beginPath()
      if (full === 'fill') {
        // 实心：连接到实体
        ctx.moveTo(alignedX, alignedBodyBottom)
        ctx.lineTo(alignedX, Math.round(highY))
      } else {
        // 空心：分开绘制，不贯穿实体
        // 上影线从实体上方开始
        ctx.moveTo(alignedX, alignedBodyTop - size)
        ctx.lineTo(alignedX, Math.round(highY))
      }
      ctx.stroke()
    }

    // 绘制下影线 - 空心时分开绘制，不贯穿
    if (lowY !== null && lowY > bodyTop) {
      if (Array.isArray(bodyColor)) {
        // 颜色数组，创建渐变
        const colors = bodyColor;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(0, alignedBodyTop, 0, Math.round(lowY));
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = colors[0] || '#00FF00';
        }
      } else {
        ctx.strokeStyle = bodyColor;
      }
      ctx.lineWidth = size
      ctx.setLineDash([]) // 确保影线也是实线
      ctx.beginPath()
      if (full === 'fill') {
        // 实心：连接到实体
        ctx.moveTo(alignedX, alignedBodyTop)
        ctx.lineTo(alignedX, Math.round(lowY))
      } else {
        // 空心：分开绘制，不贯穿实体
        // 下影线从实体下方开始
        ctx.moveTo(alignedX, alignedBodyBottom + size)
        ctx.lineTo(alignedX, Math.round(lowY))
      }
      ctx.stroke()
    }
  }
} 