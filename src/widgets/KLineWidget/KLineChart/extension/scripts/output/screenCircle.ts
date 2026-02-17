/**
 * 屏幕相对圆形绘制
 * 用于绘制屏幕相对位置的圆形
 */

export interface ScreenCircleStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（径向渐变）
  border?: string
  size?: number
  style?: string
  show?: boolean
}

export interface ScreenCircleData {
  x1: string | number
  y1: string | number
  x2: string | number
  y2: string | number
}

/**
 * 绘制屏幕相对圆形
 * @param scriptContext 脚本上下文
 * @param data 圆形数据，包含两个点作为直径端点
 * @param styles 样式对象
 */
export function outputSCircle(
  scriptContext: any,
  data: ScreenCircleData | ScreenCircleData[],
  styles: ScreenCircleStyle
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return
  if (styles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)

  const circleData = Array.isArray(data) ? data : [data]

  circleData.forEach(circle => {
    const pixelX1 = converter.convertX(circle.x1)
    const pixelY1 = converter.convertY(circle.y1)
    const pixelX2 = converter.convertX(circle.x2)
    const pixelY2 = converter.convertY(circle.y2)

    // 计算圆心和半径
    const centerX = (pixelX1 + pixelX2) / 2
    const centerY = (pixelY1 + pixelY2) / 2
    const diameter = Math.sqrt(Math.pow(pixelX2 - pixelX1, 2) + Math.pow(pixelY2 - pixelY1, 2))
    const radius = diameter / 2



    // 绘制圆形
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)

    if (styles.color && styles.color !== 'transparent') {
      if (Array.isArray(styles.color)) {
        // 颜色数组，创建径向渐变
        const colors = styles.color;
        if (colors.length >= 2) {
          const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = colors[0];
        }
      } else {
        ctx.fillStyle = styles.color;
      }
      ctx.fill()
    }

    if (styles.border) {
      ctx.strokeStyle = styles.border
      ctx.lineWidth = styles.size || 1
      ctx.setLineDash([]) // 重置线型
      
      // 设置线型
      if (styles.style === 'dashed') {
        ctx.setLineDash([5, 5])
      } else if (styles.style === 'dotted') {
        ctx.setLineDash([2, 2])
      }

      const lineWidth = styles.size || 1
      if (lineWidth % 2 === 1) {
        // 对于奇数线宽，使用0.5px偏移避免模糊
        ctx.save()
        ctx.translate(0.5, 0.5)
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.restore()
      } else {
        ctx.stroke()
      }
    }
  })
}

import { ScreenCoordinateConverter } from './screenUtils'; 