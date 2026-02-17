import type Coordinate from '../../common/Coordinate'
import type { PolygonStyle } from '../../common/Styles'
import { isString } from '../../common/utils/typeChecks'
import { isTransparent } from '../../common/utils/color'

import type { FigureTemplate } from '../../component/Figure'

export function checkCoordinateOnCircle (coordinate: Coordinate, attrs: CircleAttrs | CircleAttrs[]): boolean {
  let circles: CircleAttrs[] = []
  circles = circles.concat(attrs)
  for (const circle of circles) {
    const { x, y, r } = circle
    const difX = coordinate.x - x
    const difY = coordinate.y - y
    if (!(difX * difX + difY * difY > r * r)) {
      return true
    }
  }
  return false
}

export function drawCircle (ctx: CanvasRenderingContext2D, attrs: CircleAttrs | CircleAttrs[], styles: Partial<PolygonStyle>): void {
  let circles: CircleAttrs[] = []
  circles = circles.concat(attrs)
  const {
    show = true,
    style = 'fill',
    color = 'currentColor',
    borderSize = 1,
    borderColor = 'currentColor',
    borderStyle = 'solid',
    borderDashedValue = [2, 2]
  } = styles
  const size = 0 // size 属性不在 PolygonStyle 中，使用默认值
  if (!show) {
    return
  }

  const solid = (style === 'fill' || styles.style === 'stroke_fill') && (!isString(color) || !isTransparent(color))
  if (solid) {
    ctx.fillStyle = color
    circles.forEach(({ x, y, r }) => {
      ctx.beginPath()
      let _r = size > 0 ? size : r
      if(_r > r){
        _r = r
      }
      ctx.arc(x, y, _r, 0, Math.PI * 2)
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
    circles.forEach(({ x, y, r }) => {
      if (!solid || r > borderSize) {
        let _r = size > 0 ? size : r
        if(_r > r){
          _r = r
        }
        ctx.beginPath()
        ctx.arc(x, y, _r, 0, Math.PI * 2)
        ctx.closePath()
        ctx.stroke()
      }
    })
  }
}

export interface CircleAttrs {
  x: number
  y: number
  r: number
}

const circle: FigureTemplate<CircleAttrs | CircleAttrs[], Partial<PolygonStyle>> = {
  name: 'circle',
  checkEventOn: checkCoordinateOnCircle,
  draw: (ctx: CanvasRenderingContext2D, attrs: CircleAttrs | CircleAttrs[], styles: Partial<PolygonStyle>) => {
    drawCircle(ctx, attrs, styles)
  }
}

export default circle
