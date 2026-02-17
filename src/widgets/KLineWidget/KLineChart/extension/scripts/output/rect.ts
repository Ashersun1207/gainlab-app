import { KLineData } from '../../../common/Data'

export interface RectStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  full?: 'fill' | 'stroke'
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
  show?: boolean
}

export interface RectData {
  start: number      // 矩形开始价格
  end: number        // 矩形结束价格
  startIndex: number // 矩形开始索引
  endIndex: number   // 矩形结束索引
  [key: string]: any // 允许用户添加任意字段用于自己的逻辑判断
}

export interface RectCallbackContext {
  value: RectData   // 当前矩形数据
  index: number     // 当前索引
  prev?: RectData   // 前一个矩形数据（如果存在）
}

export function outputRect(
  scriptContext: any,
  rectData: (RectData | RectData[] | null)[],
  styles: RectStyle | ((context: RectCallbackContext) => RectStyle)
) {
  const { ctx, bounding, yAxis, xAxis } = scriptContext
  if (!ctx || !rectData || rectData.length === 0) return



  // 获取可见范围
  const visibleRange = xAxis?._range
  if (!visibleRange) {
    console.warn('outputRect: xAxis._range 无效', xAxis?._range)
    return
  }

  // 获取样式
  const getStyles = (context: RectCallbackContext): RectStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  // 绘制矩形
  for (let i = 0; i < rectData.length; i++) {
    const rects = rectData[i]
    
    if (!rects) continue  // 无矩形数据，跳过
    
    // 处理单个矩形
    if (!Array.isArray(rects)) {
      // 检查是否为有效对象
      if (!rects || typeof rects !== 'object' || !rects.hasOwnProperty('start') || 
          !rects.hasOwnProperty('end') || !rects.hasOwnProperty('startIndex') || 
          !rects.hasOwnProperty('endIndex')) {
        continue // 跳过无效数据
      }
      
      // 检查矩形是否与可视区域有交集
      if (rects.endIndex < visibleRange.from || rects.startIndex > visibleRange.to) {
        continue // 矩形完全在可视区域外，跳过
      }
      
      // 获取前一个矩形数据
      const prevRect = i > 0 ? rectData[i - 1] : undefined
      const prevRectData = prevRect && !Array.isArray(prevRect) ? prevRect : undefined
      
      drawRect(ctx, rects, i, xAxis, yAxis, getStyles, prevRectData)
      continue
    }
    
    // 处理多个矩形
    for (const rect of rects) {
      // 检查是否为有效对象
      if (!rect || typeof rect !== 'object' || !rect.hasOwnProperty('start') || 
          !rect.hasOwnProperty('end') || !rect.hasOwnProperty('startIndex') || 
          !rect.hasOwnProperty('endIndex')) {
        continue // 跳过无效数据
      }
      
      // 检查矩形是否与可视区域有交集
      if (rect.endIndex < visibleRange.from || rect.startIndex > visibleRange.to) {
        continue // 矩形完全在可视区域外，跳过
      }
      
      // 获取前一个矩形数据
      const prevRect = i > 0 ? rectData[i - 1] : undefined
      const prevRectData = prevRect && !Array.isArray(prevRect) ? prevRect : undefined
      
      drawRect(ctx, rect, i, xAxis, yAxis, getStyles, prevRectData)
    }
  }
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  rect: RectData,
  index: number,
  xAxis: any,
  yAxis: any,
  getStyles: (context: RectCallbackContext) => RectStyle,
  prevRect?: RectData
) {
  // 计算矩形坐标
  const x1 = xAxis.convertToPixel(rect.startIndex)
  const x2 = xAxis.convertToPixel(rect.endIndex)
  const y1 = yAxis.convertToPixel(rect.start)
  const y2 = yAxis.convertToPixel(rect.end)

  if (x1 === null || x2 === null || y1 === null || y2 === null) return

  // 创建回调上下文
  const callbackContext: RectCallbackContext = {
    value: rect,
    index,
    prev: prevRect
  }

  // 获取样式
  const style = getStyles(callbackContext)
  
  // 检查是否显示
  if (style.show === false) return
  
  const color: any = style.color || '#00FF00'
  const full = style.full || 'fill'
  const size = style.size || 1
  const lineStyle = style.style || 'solid'

  // 像素对齐并确保正确的矩形方向
  const alignedX1 = Math.round(Math.min(x1, x2))
  const alignedX2 = Math.round(Math.max(x1, x2))
  const alignedY1 = Math.round(Math.min(y1, y2))
  const alignedY2 = Math.round(Math.max(y1, y2))

  // 计算矩形尺寸
  const width = alignedX2 - alignedX1
  const height = alignedY2 - alignedY1

  if (width <= 0 || height <= 0) return

  // 设置线型
  if (lineStyle === 'dashed') {
    ctx.setLineDash([5, 5])
  } else if (lineStyle === 'dotted') {
    ctx.setLineDash([2, 2])
  } else {
    ctx.setLineDash([])
  }

  // 绘制矩形
  if (full === 'fill') {
    if (Array.isArray(color)) {
      // 颜色数组，创建渐变
      const colors = color;
      if (colors.length >= 2) {
        const gradient = ctx.createLinearGradient(0, alignedY1, 0, alignedY2);
        colors.forEach((c, index) => {
          const offset = index / (colors.length - 1);
          gradient.addColorStop(offset, c);
        });
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = colors[0] || '#00FF00';
      }
    } else {
      ctx.fillStyle = color;
    }
    ctx.fillRect(alignedX1, alignedY1, width, height)
  } else {
    if (Array.isArray(color)) {
      // 颜色数组，创建渐变
      const colors = color;
      if (colors.length >= 2) {
        const gradient = ctx.createLinearGradient(0, alignedY1, 0, alignedY2);
        colors.forEach((c, index) => {
          const offset = index / (colors.length - 1);
          gradient.addColorStop(offset, c);
        });
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = colors[0] || '#00FF00';
      }
    } else {
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size
    ctx.strokeRect(alignedX1, alignedY1, width, height)
  }
} 