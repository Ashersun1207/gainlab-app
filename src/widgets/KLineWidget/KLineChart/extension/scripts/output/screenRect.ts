/**
 * 屏幕相对矩形绘制
 * 用于绘制边框、分割线、标记框等
 */

export interface ScreenRectStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  border?: string
  size?: number
  style?: string
  show?: boolean
}

export interface ScreenRectData {
  x1: string | number
  y1: string | number
  x2: string | number
  y2: string | number
}

export interface ScreenRectCallbackContext {
  value: ScreenRectData   // 当前矩形数据
  index: number           // 当前索引
  prev?: ScreenRectData   // 前一个矩形数据（如果存在）
}

/**
 * 绘制屏幕相对矩形
 */
export function outputSRect(
  scriptContext: any,
  data: ScreenRectData | ScreenRectData[],
  styles: ScreenRectStyle | ((context: ScreenRectCallbackContext) => ScreenRectStyle)
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return

  // 获取样式函数
  const getStyles = (context: ScreenRectCallbackContext): ScreenRectStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)
  
  // 处理数组输入
  const rectData = Array.isArray(data) ? data : [data]
  
  rectData.forEach((rect, index) => {
    const pixelX1 = converter.convertX(rect.x1)
    const pixelY1 = converter.convertY(rect.y1)
    const pixelX2 = converter.convertX(rect.x2)
    const pixelY2 = converter.convertY(rect.y2)

    // 确保坐标顺序正确（x1 <= x2, y1 <= y2）
    const finalX1 = Math.min(pixelX1, pixelX2)
    const finalX2 = Math.max(pixelX1, pixelX2)
    const finalY1 = Math.min(pixelY1, pixelY2)
    const finalY2 = Math.max(pixelY1, pixelY2)



    // 创建回调上下文
    const callbackContext: ScreenRectCallbackContext = {
      value: rect,
      index,
      prev: index > 0 ? rectData[index - 1] : undefined
    }

    // 获取样式
    const style = getStyles(callbackContext)
    
    // 检查是否显示
    if (style.show === false) return

    // 应用填充样式
    if (style.color && style.color !== 'transparent') {
      if (Array.isArray(style.color)) {
        // 颜色数组，创建渐变
        const colors = style.color;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(0, pixelY1, 0, pixelY2);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = colors[0];
        }
      } else {
        ctx.fillStyle = style.color;
      }
      ctx.fillRect(finalX1, finalY1, finalX2 - finalX1, finalY2 - finalY1)
    }

    // 应用边框样式
    if (style.border) {
      ctx.strokeStyle = style.border
      ctx.lineWidth = style.size || 1
      ctx.setLineDash([]) // 重置线型
      
      // 设置线型
      if (style.style === 'dashed') {
        ctx.setLineDash([5, 5])
      } else if (style.style === 'dotted') {
        ctx.setLineDash([2, 2])
      }
      
      // 处理奇数像素宽度的模糊问题
      const lineWidth = style.size || 1
      let offsetX = 0
      let offsetY = 0
      
      if (lineWidth % 2 === 1) {
        // 奇数像素宽度，添加 0.5px 偏移
        offsetX = 0.5
        offsetY = 0.5
      }
      
      ctx.strokeRect(
        finalX1 + offsetX, 
        finalY1 + offsetY, 
        finalX2 - finalX1, 
        finalY2 - finalY1
      )
    }
  })
}

import { ScreenCoordinateConverter } from './screenUtils'; 