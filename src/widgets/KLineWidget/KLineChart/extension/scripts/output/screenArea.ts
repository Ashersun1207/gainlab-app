/**
 * 屏幕相对多边形区域绘制
 * 用于绘制任意形状的多边形区域
 */

export interface ScreenAreaStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  border?: string
  size?: number
  style?: string
  show?: boolean
}

export interface ScreenAreaPoint {
  x: string | number
  y: string | number
}

export type ScreenAreaData = ScreenAreaPoint[]

/**
 * 绘制屏幕相对多边形区域
 */
export function outputSArea(
  scriptContext: any,
  data: ScreenAreaData | ScreenAreaData[],
  styles: ScreenAreaStyle
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return

  // 检查是否显示
  if (styles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)
  
  // 处理数组输入
  const areaData = Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'x' in data[0] 
    ? [data] // 单个多边形
    : data as ScreenAreaData[] // 多个多边形
  
  areaData.forEach(points => {
    if (points.length < 3) {
      console.warn('sarea: 至少需要3个点才能绘制多边形');
      return;
    }

    // 转换所有点到像素坐标
    const pixelPoints = points.map(point => ({
      x: converter.convertX(point.x),
      y: converter.convertY(point.y)
    }));

    // 开始绘制路径
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    
    for (let i = 1; i < pixelPoints.length; i++) {
      ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    }
    
    ctx.closePath();

    // 应用填充样式
    if (styles.color && styles.color !== 'transparent') {
      if (Array.isArray(styles.color)) {
        // 颜色数组，创建渐变
        const colors = styles.color;
        if (colors.length >= 2) {
          // 计算多边形的边界框
          const minY = Math.min(...pixelPoints.map(p => p.y));
          const maxY = Math.max(...pixelPoints.map(p => p.y));
          const gradient = ctx.createLinearGradient(0, minY, 0, maxY);
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

    // 应用边框样式
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
      
      // 处理奇数像素宽度的模糊问题
      const lineWidth = styles.size || 1
      if (lineWidth % 2 === 1) {
        // 奇数像素宽度，重新绘制路径并添加偏移
        ctx.save();
        ctx.translate(0.5, 0.5);
        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        for (let i = 1; i < pixelPoints.length; i++) {
          ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.stroke();
      }
    }
  })
}

import { ScreenCoordinateConverter } from './screenUtils'; 