import type Coordinate from '../../common/Coordinate'
import type { PolygonStyle } from '../../common/Styles'
import { isString } from '../../common/utils/typeChecks'
import { isTransparent } from '../../common/utils/color'

import type { FigureTemplate } from '../../component/Figure'

// 添加箭头方向类型
export type ArrowDirection = 'up' | 'down' | 'left' | 'right'

// 添加箭头样式接口
export interface ArrowStyle {
  color?: string
  borderColor?: string
  borderSize?: number
  alpha?: number
  show?: boolean
  size?: number          // 箭头大小  
  filled?: boolean       // 是否实心，true=实心，false=空心  
  style?: 'fill' | 'stroke' | 'stroke_fill'  // 绘制样式，与多边形保持一致  
}

export function checkCoordinateOnPolygon(coordinate: Coordinate, attrs: PolygonAttrs | PolygonAttrs[]): boolean {
  let polygons: PolygonAttrs[] = []
  polygons = polygons.concat(attrs)
  for (const polygon of polygons) {
    let on = false
    const { coordinates } = polygon
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      if (
        (coordinates[i].y > coordinate.y) !== (coordinates[j].y > coordinate.y) &&
        (coordinate.x < (coordinates[j].x - coordinates[i].x) * (coordinate.y - coordinates[i].y) / (coordinates[j].y - coordinates[i].y) + coordinates[i].x)
      ) {
        on = !on
      }
    }
    if (on) {
      return true
    }
  }
  return false
}

export function drawPolygon(ctx: CanvasRenderingContext2D, attrs: PolygonAttrs | PolygonAttrs[], styles: Partial<PolygonStyle>): void {
  let polygons: PolygonAttrs[] = []
  polygons = polygons.concat(attrs)
  const {
    style = 'fill',
    color = 'currentColor',
    borderSize = 1,
    borderColor = 'currentColor',
    borderStyle = 'solid',
    borderDashedValue = [2, 2],
    show = true
  } = styles
  if (!show) {
    return
  }
  if (
    (style === 'fill' || styles.style === 'stroke_fill') &&
    (!isString(color) || !isTransparent(color))) {
    ctx.fillStyle = color
    polygons.forEach(({ coordinates }) => {
      ctx.beginPath()
      ctx.moveTo(coordinates[0].x, coordinates[0].y)
      for (let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(coordinates[i].x, coordinates[i].y)
      }
      ctx.closePath()
      ctx.fill()
    })
  }
  if ((style === 'stroke' || styles.style === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    switch (borderStyle) {
      case 'dashed':
        ctx.setLineDash(borderDashedValue.map(v => v * borderSize))
        break
      case 'dotted':
        ctx.setLineDash([borderSize, borderSize * 2])
        break
      default:
        ctx.setLineDash([])
        break
    }
    polygons.forEach(({ coordinates }) => {
      ctx.beginPath()
      ctx.moveTo(coordinates[0].x, coordinates[0].y)
      for (let i = 1; i < coordinates.length; i++) {
        ctx.lineTo(coordinates[i].x, coordinates[i].y)
      }
      ctx.closePath()
      ctx.stroke()
    })
  }
}

export interface PolygonAttrs {
  coordinates: Coordinate[]
}

const polygon: FigureTemplate<PolygonAttrs | PolygonAttrs[], Partial<PolygonStyle>> = {
  name: 'polygon',
  checkEventOn: checkCoordinateOnPolygon,
  draw: (ctx: CanvasRenderingContext2D, attrs: PolygonAttrs | PolygonAttrs[], styles: Partial<PolygonStyle>) => {
    drawPolygon(ctx, attrs, styles)
  }
}
export default polygon


// 通用图形样式类型
type ShapeStyle = {
  color?: string
  borderColor?: string
  borderSize?: number
  alpha?: number
  show?: boolean
  size?: number
  filled?: boolean
  style?: 'fill' | 'stroke' | 'stroke_fill'
}
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {},
  direction: ArrowDirection,
): void {
  const {
    color = '#000000',
    borderColor = '#000000',
    borderSize = 1,
    alpha = 1,
    show = true,
    size = 10,
    filled = true,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style

  if (!show) {
    return
  }

  const { x, y } = coordinate

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])

  ctx.beginPath()

  // 箭头尺寸参数
  const headSize = size
  const shaftWidth = size * 0.3  // 箭杆宽度
  const shaftLength = size * 0.6 // 箭杆长度

  // 根据方向绘制完整箭头（包含箭杆）
  switch (direction) {
    case 'up':
      // 箭头尖
      ctx.moveTo(x, y)
      ctx.lineTo(x - headSize / 2, y + headSize * 0.6)
      // 左侧箭杆
      ctx.lineTo(x - shaftWidth / 2, y + headSize * 0.6)
      ctx.lineTo(x - shaftWidth / 2, y + headSize * 0.6 + shaftLength)
      // 底部
      ctx.lineTo(x + shaftWidth / 2, y + headSize * 0.6 + shaftLength)
      // 右侧箭杆
      ctx.lineTo(x + shaftWidth / 2, y + headSize * 0.6)
      ctx.lineTo(x + headSize / 2, y + headSize * 0.6)
      break
    case 'down':
      // 箭头尖
      ctx.moveTo(x, y)
      ctx.lineTo(x - headSize / 2, y - headSize * 0.6)
      // 左侧箭杆
      ctx.lineTo(x - shaftWidth / 2, y - headSize * 0.6)
      ctx.lineTo(x - shaftWidth / 2, y - headSize * 0.6 - shaftLength)
      // 底部
      ctx.lineTo(x + shaftWidth / 2, y - headSize * 0.6 - shaftLength)
      // 右侧箭杆
      ctx.lineTo(x + shaftWidth / 2, y - headSize * 0.6)
      ctx.lineTo(x + headSize / 2, y - headSize * 0.6)
      break
    case 'left':
      // 箭头尖
      ctx.moveTo(x, y)
      ctx.lineTo(x + headSize * 0.6, y - headSize / 2)
      // 上侧箭杆
      ctx.lineTo(x + headSize * 0.6, y - shaftWidth / 2)
      ctx.lineTo(x + headSize * 0.6 + shaftLength, y - shaftWidth / 2)
      // 右侧
      ctx.lineTo(x + headSize * 0.6 + shaftLength, y + shaftWidth / 2)
      // 下侧箭杆
      ctx.lineTo(x + headSize * 0.6, y + shaftWidth / 2)
      ctx.lineTo(x + headSize * 0.6, y + headSize / 2)
      break
    case 'right':
      // 箭头尖
      ctx.moveTo(x, y)
      ctx.lineTo(x - headSize * 0.6, y - headSize / 2)
      // 上侧箭杆
      ctx.lineTo(x - headSize * 0.6, y - shaftWidth / 2)
      ctx.lineTo(x - headSize * 0.6 - shaftLength, y - shaftWidth / 2)
      // 左侧
      ctx.lineTo(x - headSize * 0.6 - shaftLength, y + shaftWidth / 2)
      // 下侧箭杆
      ctx.lineTo(x - headSize * 0.6, y + shaftWidth / 2)
      ctx.lineTo(x - headSize * 0.6, y + headSize / 2)
      break
  }

  ctx.closePath()

  // 根据样式绘制
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }

  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}
export function drawArrowUp(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  drawArrow(ctx, coordinate, style, 'up')
}
export function drawArrowDown(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawArrow(ctx, coordinate, style, 'down')
}
export function drawArrowLeft(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawArrow(ctx, coordinate, style, 'left')
}
export function drawArrowRight(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawArrow(ctx, coordinate, style, 'right')
}
// 三角形方向类型
export type TriangleDirection = 'up' | 'down' | 'left' | 'right'

// 绘制三角形
export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {},
  direction: TriangleDirection = 'up'
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  ctx.beginPath()
  let points: { x: number; y: number }[] = []
  const h = (Math.sqrt(3) / 2) * size
  switch (direction) {
    case 'up':
      points = [
        { x: x, y: y - h / 2 },
        { x: x - size / 2, y: y + h / 2 },
        { x: x + size / 2, y: y + h / 2 },
      ]
      break
    case 'down':
      points = [
        { x: x, y: y + h / 2 },
        { x: x - size / 2, y: y - h / 2 },
        { x: x + size / 2, y: y - h / 2 },
      ]
      break
    case 'left':
      points = [
        { x: x - h / 2, y: y },
        { x: x + h / 2, y: y - size / 2 },
        { x: x + h / 2, y: y + size / 2 },
      ]
      break
    case 'right':
      points = [
        { x: x + h / 2, y: y },
        { x: x - h / 2, y: y - size / 2 },
        { x: x - h / 2, y: y + size / 2 },
      ]
      break
  }
  ctx.moveTo(points[0].x, points[0].y)
  ctx.lineTo(points[1].x, points[1].y)
  ctx.lineTo(points[2].x, points[2].y)
  ctx.closePath()
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}
export function drawTriangleUp(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawTriangle(ctx, coordinate, style, 'up')
}
export function drawTriangleDown(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawTriangle(ctx, coordinate, style, 'down')
}
export function drawTriangleLeft(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawTriangle(ctx, coordinate, style, 'left')
}
export function drawTriangleRight(ctx: CanvasRenderingContext2D, coordinate: Coordinate, style: ShapeStyle = {}) {
  drawTriangle(ctx, coordinate, style, 'right')
}

// 绘制方形
export function drawSquare(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  const half = size / 2
  ctx.beginPath()
  ctx.rect(x - half, y - half, size, size)
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制菱形
export function drawDiamond(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  const half = size / 2
  ctx.beginPath()
  ctx.moveTo(x, y - half)
  ctx.lineTo(x + half, y)
  ctx.lineTo(x, y + half)
  ctx.lineTo(x - half, y)
  ctx.closePath()
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制圆形
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.arc(x, y, size / 2, 0, Math.PI * 2)
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制五星
export function drawStar(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  ctx.beginPath()
  const outerR = size / 2
  const innerR = outerR * 0.5
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI / 5) * (2 * i - 0.5)
    const sx = x + Math.cos(angle) * outerR
    const sy = y + Math.sin(angle) * outerR
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
    const angle2 = angle + Math.PI / 5
    ctx.lineTo(x + Math.cos(angle2) * innerR, y + Math.sin(angle2) * innerR)
  }
  ctx.closePath()
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制十字星
export function drawCross(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  const half = size / 2
  const bar = size * 0.2
  ctx.beginPath()
  // 竖条
  ctx.rect(x - bar / 2, y - half, bar, size)
  // 横条
  ctx.rect(x - half, y - bar / 2, size, bar)
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制X叉
export function drawX(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  const half = size / 2
  const bar = size * 0.2
  ctx.beginPath()
  // 斜条1
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 4)
  ctx.rect(-bar / 2, -half, bar, size)
  ctx.restore()
  // 斜条2
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-Math.PI / 4)
  ctx.rect(-bar / 2, -half, bar, size)
  ctx.restore()
  ctx.closePath()
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制旗形
export function drawFlag(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])

  // 旗杆参数
  const poleH = size
  const poleX = x - size * 0.2
  const flagW = size * 0.6
  const flagH = size * 0.5
  const flagY = y - poleH / 2

  // 旗面+旗杆合并路径
  ctx.beginPath()
  ctx.moveTo(poleX, y - poleH / 2) // 旗杆顶
  ctx.lineTo(poleX, y + poleH / 2) // 旗杆底
  ctx.moveTo(poleX, flagY) // 旗面起点
  ctx.lineTo(poleX + flagW, flagY + flagH / 2)
  ctx.lineTo(poleX, flagY + flagH)
  ctx.closePath()
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  // 填充后单独画旗杆，保证旗杆始终可见
  ctx.beginPath()
  ctx.moveTo(poleX, y - poleH / 2)
  ctx.lineTo(poleX, y + poleH / 2)
  ctx.strokeStyle = borderColor
  ctx.lineWidth = Math.max(1, borderSize)
  ctx.stroke()
  ctx.restore()
}

// 绘制心形
export function drawHeart(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 1,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  const r = size / 4
  ctx.beginPath()
  ctx.moveTo(x, y + r)
  ctx.bezierCurveTo(x + r * 2, y - r, x + r, y - r * 2, x, y - r)
  ctx.bezierCurveTo(x - r, y - r * 2, x - r * 2, y - r, x, y + r)
  ctx.closePath()
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill') && !isTransparent(color)) {
    ctx.fillStyle = color
    ctx.fill()
  }
  if ((drawStyle === 'stroke' || drawStyle === 'stroke_fill') && borderSize > 0 && !isTransparent(borderColor)) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderSize
    ctx.stroke()
  }
  ctx.restore()
}

// 绘制对号（check）
export function drawCheck(
  ctx: CanvasRenderingContext2D,
  coordinate: Coordinate,
  style: ShapeStyle = {}
): void {
  const {
    color = '#000',
    borderColor = '#000',
    borderSize = 2,
    alpha = 1,
    show = true,
    filled = true,
    size = 10,
    style: drawStyle = filled ? 'fill' : 'stroke',
  } = style
  if (!show) return
  const { x, y } = coordinate
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.setLineDash([])
  ctx.beginPath()
  // 对号路径（相对中心点，适配size）
  const w = size * 0.5
  const h = size * 0.5
  ctx.moveTo(x - w * 0.5, y)
  ctx.lineTo(x - w * 0.1, y + h * 0.4)
  ctx.lineTo(x + w * 0.5, y - h * 0.4)
  if ((drawStyle === 'fill' || drawStyle === 'stroke_fill')) {
    ctx.strokeStyle = color
    ctx.lineWidth = borderSize
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  ctx.restore()
}

export const Shape = {
  arrow: drawArrow,
  arrowUp: drawArrowUp,
  arrowDown: drawArrowDown,
  arrowLeft: drawArrowLeft,
  arrowRight: drawArrowRight,
  drawArrowUp: drawArrowUp,
  drawArrowDown: drawArrowDown,
  drawArrowLeft: drawArrowLeft,
  drawArrowRight: drawArrowRight,
  circle: drawCircle,
  square: drawSquare,
  triangle: drawTriangle,
  triangleUp: drawTriangleUp,
  triangleDown: drawTriangleDown,
  triangleLeft: drawTriangleLeft,
  triangleRight: drawTriangleRight,
  diamond: drawDiamond,
  star: drawStar,
  cross: drawCross,
  x: drawX,
  flag: drawFlag,
  heart: drawHeart,
  check: drawCheck,
}
