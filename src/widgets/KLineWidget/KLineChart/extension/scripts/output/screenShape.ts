/**
 * 屏幕相对图形绘制（复用通用 Shape 实现）
 */

export interface ScreenShapeStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  size?: number
  show?: boolean
  // 兼容从样式中传入图标
  icon?: string
  // 填充方式：'fill'（实心） | 'stroke'（空心）
  full?: 'fill' | 'stroke'
  // 偏移量
  x?: number
  y?: number
}

export interface ScreenShapeData {
  x: string | number
  y: string | number
}

export function outputSShape(
  scriptContext: any,
  data: ScreenShapeData | ScreenShapeData[],
  styles: ScreenShapeStyle
) {
  const { ctx, bounding, xAxis, yAxis, dataList } = scriptContext
  if (!ctx || !bounding) return
  if (styles.show === false) return

  const converter = new ScreenCoordinateConverter(ctx, bounding, xAxis, yAxis, dataList)
  const shapeData = Array.isArray(data) ? data : [data]

  shapeData.forEach(shape => {
    if (!shape || typeof shape !== 'object') return
    // 先计算出正常的位置
    let pixelX = converter.convertX((shape as any).x)
    let pixelY = converter.convertY((shape as any).y)
    
    // 应用样式中的偏移量（在正常位置计算之后）
    if (styles.x !== undefined) {
      pixelX += Number(styles.x)
    }
    if (styles.y !== undefined) {
      pixelY += Number(styles.y)
    }

    const iconRaw = styles.icon ?? 'circle'
    const iconKey = normalizeIcon(iconRaw)

    const draw = (Shape as any)[iconKey]
    if (typeof draw !== 'function') return

    const mappedStyle = mapStyles(styles)
    const size = mappedStyle.size || 5

    // 处理边缘位置的偏移调整（在样式偏移之后）
    const strX = String((shape as any).x)
    const strY = String((shape as any).y)
    
    // 如果是 right 或 100%，需要减去图形半径
    if (strX === 'right' || strX.endsWith('%') && parseFloat(strX) >= 100) {
      pixelX -= size / 2
    }
    // 如果是 left 或 0%，需要加上图形半径
    else if (strX === 'left' || strX === '0' || strX === '0%') {
      pixelX += size / 2
    }
    
    // 如果是 bottom 或 100%，需要减去图形半径
    if (strY === 'bottom' || strY.endsWith('%') && parseFloat(strY) >= 100) {
      pixelY -= size / 2
    }
    // 如果是 top 或 0%，需要加上图形半径
    else if (strY === 'top' || strY === '0' || strY === '0%') {
      pixelY += size / 2
    }

    draw(ctx, { x: pixelX, y: pixelY }, mappedStyle)
  })
}

function normalizeIcon(icon: string): string {
  if (!icon) return 'circle'
  const raw = String(icon).toLowerCase().replace(/[^a-z]/g, '')
  const map: Record<string, string> = {
    // 箭头
    arrowup: 'arrowUp',
    arrowdown: 'arrowDown',
    arrowleft: 'arrowLeft',
    arrowright: 'arrowRight',
    arrow: 'arrowUp',
    // 三角
    triangle: 'triangle',
    triangleup: 'triangleUp',
    triangledown: 'triangleDown',
    triangleleft: 'triangleLeft',
    triangleright: 'triangleRight',
    // 基础
    circle: 'circle',
    square: 'square',
    diamond: 'diamond',
    star: 'star',
    cross: 'cross',
    x: 'x',
    flag: 'flag',
    heart: 'heart',
    check: 'check'
  }
  return map[raw] || 'circle'
}

function mapStyles(styles: ScreenShapeStyle): any {
  const s: any = {}
  const drawStyle = styles.full || 'fill'
  s.size = styles.size ?? 5
  s.show = styles.show !== false

  // 处理颜色数组渐变
  if (Array.isArray(styles.color)) {
    const colors = styles.color;
    if (colors.length >= 2) {
      // 创建径向渐变（从中心向外）
      const gradient = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        const radialGradient = ctx.createRadialGradient(x, y, 0, x, y, s.size || 5);
        colors.forEach((c, index) => {
          const offset = index / (colors.length - 1);
          radialGradient.addColorStop(offset, c);
        });
        return radialGradient;
      };
      
      if (drawStyle === 'fill') {
        s.color = gradient;
      } else if (drawStyle === 'stroke') {
        s.borderColor = gradient;
        s.borderSize = 1;
      } else {
        s.color = gradient;
      }
    } else {
      const color = colors[0] || '#000';
      if (drawStyle === 'fill') {
        s.color = color;
      } else if (drawStyle === 'stroke') {
        s.borderColor = color;
        s.borderSize = 1;
      } else {
        s.color = color;
      }
    }
  } else {
    // 只有两种模式：
    // - 实心(fill)：color 用于填充，无边框
    // - 空心(stroke)：color 用于边框，边框宽度固定为1，实线
    if (drawStyle === 'fill') {
      s.color = styles.color;
    } else if (drawStyle === 'stroke') {
      s.borderColor = styles.color;
      s.borderSize = 1;
    } else {
      // 兜底按实心处理
      s.color = styles.color;
    }
  }

  return s
}

import { ScreenCoordinateConverter } from './screenUtils';
import { Shape } from '../../figure/polygon'; 