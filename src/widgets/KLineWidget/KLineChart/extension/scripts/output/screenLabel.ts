/**
 * 屏幕相对标签绘制
 * 用于在屏幕相对位置绘制文本标签
 */

export interface ScreenLabelStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  size?: number
  align?: string
  bold?: boolean
  italic?: boolean
  show?: boolean
  text?: string
  // 兼容旧版本，背景相关属性现在由 backgroundStyles 处理
  background?: string | string[]
  padding?: number
  // 偏移量
  x?: number
  y?: number
}

export interface ScreenLabelData {
  x: string | number
  y: string | number
  text?: string
}

/**
 * 绘制屏幕相对标签
 * @param scriptContext 脚本上下文
 * @param data 标签数据
 * @param styles 样式对象
 */
export function outputSLabel(
  scriptContext: any,
  data: ScreenLabelData | ScreenLabelData[],
  labelStyles: ScreenLabelStyle,
  backgroundStyles?: any
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return
  if (labelStyles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)

  const labelData = Array.isArray(data) ? data : [data]

  labelData.forEach(label => {
    // 先计算出正常的位置
    let pixelX = converter.convertX(label.x)
    let pixelY = converter.convertY(label.y)
    

    
    // 应用样式中的偏移量（在正常位置计算之后）
    if (labelStyles.x !== undefined) {
      pixelX += Number(labelStyles.x)
    }
    if (labelStyles.y !== undefined) {
      pixelY += Number(labelStyles.y)
    }

    // 解析文本：优先样式中的 text，再用数据中的 text；都没有则跳过
    let text = ''
    if (labelStyles.text && String(labelStyles.text).length > 0) {
      text = String(labelStyles.text)
    } else if (label.text !== undefined && label.text !== null && String(label.text).length > 0) {
      text = String(label.text)
    }
    if (!text) return

    // 设置文本样式
    const fontSize = labelStyles.size || 12
    const fontFamily = 'Arial, sans-serif'
    const fontWeight = labelStyles.bold ? 'bold' : 'normal'
    const fontStyle = labelStyles.italic ? 'italic' : 'normal'
    
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.textAlign = labelStyles.align || 'left'
    ctx.textBaseline = 'middle'

    // 测量文本尺寸
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize

    // 合并背景样式：优先使用 backgroundStyles，如果没有则使用 labelStyles 中的背景属性
    const mergedBackgroundStyles = backgroundStyles || {}
    const padding = mergedBackgroundStyles.padding || labelStyles.padding || 4

    // 处理边缘位置的偏移调整（在样式偏移之后）
    const strX = String(label.x)
    const strY = String(label.y)
    
    // 如果是 right 或 100%，需要减去文本宽度（考虑对齐方式）
    if (strX === 'right' || strX.endsWith('%') && parseFloat(strX) >= 100) {
      if (ctx.textAlign === 'left') {
        pixelX -= textWidth + padding * 2
      } else if (ctx.textAlign === 'center') {
        pixelX -= (textWidth + padding * 2) / 2
      }
      // right 对齐不需要调整，因为文本右边缘已经对齐到 right 位置
    }
    // 如果是 left 或 0%，需要加上内边距
    else if (strX === 'left' || strX === '0' || strX === '0%') {
      if (ctx.textAlign === 'right') {
        pixelX += textWidth + padding * 2
      } else if (ctx.textAlign === 'center') {
        pixelX += (textWidth + padding * 2) / 2
      }
      // left 对齐不需要调整，因为文本左边缘已经对齐到 left 位置
    }
    
    // 如果是 bottom 或 100%，需要减去文本高度和内边距
    if (strY === 'bottom' || strY.endsWith('%') && parseFloat(strY) >= 100) {
      pixelY -= textHeight / 2 + padding
    }
    // 如果是 top 或 0%，需要加上文本高度和内边距
    else if (strY === 'top' || strY === '0' || strY === '0%') {
      pixelY += textHeight / 2 + padding
    }

    // 在调整后的位置计算背景位置和尺寸
    const bgX = pixelX - (ctx.textAlign === 'center' ? textWidth / 2 : ctx.textAlign === 'right' ? textWidth : 0)
    const bgY = pixelY - textHeight / 2
    const bgWidth = textWidth + padding * 2
    const bgHeight = textHeight + padding * 2

    // 绘制背景
    const bgColor = mergedBackgroundStyles.color || labelStyles.background
    const radius = mergedBackgroundStyles.radius || 0
    
    // 检查背景是否显示
    if (mergedBackgroundStyles.show === false) {
      // 背景不显示，跳过背景绘制
    } else if (bgColor && bgColor !== 'transparent') {
      if (Array.isArray(bgColor)) {
        // 背景颜色数组，创建渐变
        const colors = bgColor;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(bgX, bgY, bgX, bgY + bgHeight);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = colors[0];
        }
      } else {
        ctx.fillStyle = bgColor;
      }
      
      // 绘制圆角矩形
      if (radius > 0) {
        ctx.beginPath()
        ctx.roundRect(bgX, bgY, bgWidth, bgHeight, radius)
        ctx.fill()
      } else {
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
      }
    }

    // 绘制文本
    if (labelStyles.color) {
      if (Array.isArray(labelStyles.color)) {
        // 文本颜色数组，创建渐变
        const colors = labelStyles.color;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(bgX, bgY, bgX, bgY + bgHeight);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = colors[0];
        }
      } else {
        ctx.fillStyle = labelStyles.color;
      }
    } else {
      ctx.fillStyle = '#333333'
    }
    
    // 计算文本在背景中的居中位置
    const textX = bgX + bgWidth / 2  // 背景中心X
    const textY = bgY + bgHeight / 2  // 背景中心Y
    
    // 临时设置文本对齐为居中，确保文本在背景中心
    const originalTextAlign = ctx.textAlign
    ctx.textAlign = 'center'
    ctx.fillText(text, textX, textY)
    ctx.textAlign = originalTextAlign  // 恢复原来的对齐方式
  })
}

import { ScreenCoordinateConverter } from './screenUtils'; 