import type { OverlayTemplate, OverlayFigure } from '../../component/Overlay'
import type Coordinate from '../../common/Coordinate'
import type Bounding from '../../common/Bounding'
import { getRayLine } from './utils'
import type { LineAttrs } from '../figure/line'

function getRectangleChannelFigures(coordinates: Coordinate[], bounding: Bounding): OverlayFigure[] {
    if (coordinates.length < 2) return []

    const [P1, P2] = coordinates
    // 找出x小的点和x大的点
    const left = P1.x <= P2.x ? P1 : P2
    const right = P1.x > P2.x ? P1 : P2

    // 上下y
    const yTop = Math.min(P1.y, P2.y)
    const yBottom = Math.max(P1.y, P2.y)

    // 水平射线：起点为left，方向为right，y不变
    const topRay = (getRayLine(
        [ { x: left.x, y: yTop }, { x: right.x, y: yTop } ],
        bounding
    ) as LineAttrs).coordinates

    const bottomRay = (getRayLine(
        [ { x: left.x, y: yBottom }, { x: right.x, y: yBottom } ],
        bounding
    ) as LineAttrs).coordinates

    const leftVerticalLine = [
        { x: left.x, y: yTop },
        { x: left.x, y: yBottom }
    ]

    // 区域polygon用两条射线的端点
    const area = [
        topRay[0],
        topRay[1],
        bottomRay[1],
        bottomRay[0]
    ]

    return [
        { key: 'area', type: 'polygon', attrs: { coordinates: area } },
        { key: 'top_line', type: 'line', attrs: { coordinates: topRay } },
        { key: 'bottom_line', type: 'line', attrs: { coordinates: bottomRay } },
        { key: 'left_line', type: 'line', attrs: { coordinates: leftVerticalLine } }
    ]
}

const horizontalChannel: OverlayTemplate = {
    name: 'horizontalChannel',
    totalStep: 3,
    needDefaultPointFigure: true,
    createPointFigures: ({ coordinates, bounding }) => {
        if (!coordinates || coordinates.length < 2) return []
        return getRectangleChannelFigures(coordinates as Coordinate[], bounding)
    },
}

export default horizontalChannel
