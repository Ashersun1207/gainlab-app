/**
 * 屏幕线条绘图功能
 * 支持相对于屏幕坐标的线条绘制
 * 包括水平线、垂直线、任意线段
 */

export interface ScreenLineStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
  show?: boolean
}

export interface ScreenLinePoint {
  x: string | number
  y: string | number
}

export interface ScreenLineData {
  x1: string | number
  y1: string | number
  x2: string | number
  y2: string | number
}

/**
 * 绘制水平线
 */
export function outputHLine(
  scriptContext: any,
  y: string | number | (string | number)[],
  styles: ScreenLineStyle,
  x1?: string | number,
  x2?: string | number
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return

  // 检查是否显示
  if (styles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)
  
  // 处理数组输入
  const yValues = Array.isArray(y) ? y : [y]
  
  yValues.forEach(yValue => {
    const pixelY = converter.convertY(yValue)
    const pixelX1 = x1 !== undefined ? converter.convertX(x1) : 0
    const pixelX2 = x2 !== undefined ? converter.convertX(x2) : bounding.width

    // 应用样式
    if (styles.color) {
      if (Array.isArray(styles.color)) {
        // 颜色数组，创建渐变
        const colors = styles.color;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(pixelX1, pixelY, pixelX2, pixelY);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = colors[0];
        }
      } else {
        ctx.strokeStyle = styles.color;
      }
    }
    // 处理奇数线宽问题：所有奇数线宽都使用坐标偏移
    let lineWidth = styles.size || 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (lineWidth % 2 === 1) {
      // 所有奇数线宽都偏移0.5px以确保线条落在像素边界上
      offsetX = 0.5;
      offsetY = 0.5;
    }
    ctx.lineWidth = lineWidth;

    if (styles.style) {
      switch (styles.style) {
        case 'dashed':
          ctx.setLineDash([5 * lineWidth, 5 * lineWidth])
          break
        case 'dotted':
          ctx.setLineDash([2 * lineWidth, 2 * lineWidth])
          break
        default:
          ctx.setLineDash([])
      }
    }

    // 绘制水平线
    ctx.beginPath()
    ctx.moveTo(pixelX1 + offsetX, pixelY + offsetY)
    ctx.lineTo(pixelX2 + offsetX, pixelY + offsetY)
    ctx.stroke()
  })
}

/**
 * 绘制垂直线
 */
export function outputVLine(
  scriptContext: any,
  x: string | number | (string | number)[],
  styles: ScreenLineStyle,
  y1?: string | number,
  y2?: string | number
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return

  // 检查是否显示
  if (styles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)
  
  // 处理数组输入
  const xValues = Array.isArray(x) ? x : [x]
  
  xValues.forEach(xValue => {
    const pixelX = converter.convertX(xValue)
    const pixelY1 = y1 !== undefined ? converter.convertY(y1) : 0
    const pixelY2 = y2 !== undefined ? converter.convertY(y2) : bounding.height

    // 应用样式
    if (styles.color) {
      if (Array.isArray(styles.color)) {
        // 颜色数组，创建渐变
        const colors = styles.color;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(pixelX, pixelY1, pixelX, pixelY2);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = colors[0];
        }
      } else {
        ctx.strokeStyle = styles.color;
      }
    }
    // 处理奇数线宽问题：所有奇数线宽都使用坐标偏移
    let lineWidth = styles.size || 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (lineWidth % 2 === 1) {
      // 所有奇数线宽都偏移0.5px以确保线条落在像素边界上
      offsetX = 0.5;
      offsetY = 0.5;
    }
    ctx.lineWidth = lineWidth;
    if (styles.style) {
      switch (styles.style) {
        case 'dashed':
          ctx.setLineDash([5 * lineWidth, 5 * lineWidth])
          break
        case 'dotted':
          ctx.setLineDash([2 * lineWidth, 2 * lineWidth])
          break
        default:
          ctx.setLineDash([])
      }
    }

    // 绘制垂直线
    ctx.beginPath()
    ctx.moveTo(pixelX + offsetX, pixelY1 + offsetY)
    ctx.lineTo(pixelX + offsetX, pixelY2 + offsetY)
    ctx.stroke()
  })
}

/**
 * 绘制任意线段
 */
export function outputSLine(
  scriptContext: any,
  data: ScreenLineData | ScreenLineData[],
  styles: ScreenLineStyle
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return

  // 检查是否显示
  if (styles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)
  
  // 处理数组输入
  const lineData = Array.isArray(data) ? data : [data]
  
  lineData.forEach(line => {
    const pixelX1 = converter.convertX(line.x1)
    const pixelY1 = converter.convertY(line.y1)
    const pixelX2 = converter.convertX(line.x2)
    const pixelY2 = converter.convertY(line.y2)

    // 应用样式
    if (styles.color) {
      if (Array.isArray(styles.color)) {
        // 颜色数组，创建渐变
        const colors = styles.color;
        if (colors.length >= 2) {
          const gradient = ctx.createLinearGradient(pixelX1, pixelY1, pixelX2, pixelY2);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = colors[0];
        }
      } else {
        ctx.strokeStyle = styles.color;
      }
    }
    // 处理奇数线宽问题：所有奇数线宽都使用坐标偏移
    let lineWidth = styles.size || 1;
    let offsetX = 0;
    let offsetY = 0;
    
    if (lineWidth % 2 === 1) {
      // 所有奇数线宽都偏移0.5px以确保线条落在像素边界上
      offsetX = 0.5;
      offsetY = 0.5;
    }
    ctx.lineWidth = lineWidth;
    if (styles.style) {
      switch (styles.style) {
        case 'dashed':
          ctx.setLineDash([5 * lineWidth, 5 * lineWidth])
          break
        case 'dotted':
          ctx.setLineDash([2 * lineWidth, 2 * lineWidth])
          break
        default:
          ctx.setLineDash([])
      }
    }

    // 绘制线段
    ctx.beginPath()
    ctx.moveTo(pixelX1 + offsetX, pixelY1 + offsetY)
    ctx.lineTo(pixelX2 + offsetX, pixelY2 + offsetY)
    ctx.stroke()
  })
} 

import { ScreenCoordinateConverter } from './screenUtils'; 