import type { OverlayTemplate, OverlayFigure } from '../../component/Overlay'
import type Coordinate from '../../common/Coordinate'
import type Bounding from '../../common/Bounding'

function getBullishFigures(coordinates: Coordinate[], bounding: Bounding): OverlayFigure[] {
    if (coordinates.length < 4) return []

    // 约定：
    // coordinates[0] = 左中（开仓）
    // coordinates[1] = 左（止损）
    // coordinates[2] = 右（目标/止盈）
    // coordinates[3] = 下（止损）

    const [left, leftTop, right, leftBottom] = coordinates

    // 计算四个角
    const topLeft = { x: left.x, y: leftTop.y }
    const topRight = { x: right.x, y: leftTop.y }
    const bottomRight = { x: right.x, y: leftBottom.y }
    const bottomLeft = { x: left.x, y: leftBottom.y }

    // 区域
    const area = [topLeft, topRight, bottomRight, bottomLeft]

    // 线
    const figures: OverlayFigure[] = [
        { key: 'area', type: 'polygon', attrs: { coordinates: area } },
        { key: 'left_line', type: 'line', attrs: { coordinates: [topLeft, bottomLeft] } },
        { key: 'top_line', type: 'line', attrs: { coordinates: [topLeft, topRight] } },
        { key: 'bottom_line', type: 'line', attrs: { coordinates: [bottomLeft, bottomRight] } },
        { key: 'right_line', type: 'line', attrs: { coordinates: [topRight, bottomRight] } },
        // 标签（可选，具体渲染方式看你的Overlay系统）
        { key: 'label_open', type: 'label', attrs: { coordinate: left, text: '开仓' } },
        { key: 'label_tp', type: 'label', attrs: { coordinate: right, text: '目标' } },
        { key: 'label_sl', type: 'label', attrs: { coordinate: leftBottom, text: '止损' } }
    ]

    return figures
}

const bullish: OverlayTemplate = {
    name: 'bullish',
    totalStep: 2, // 只需点击一次
    needDefaultPointFigure: true,
    createPointFigures: ({ coordinates, bounding }) => {
        if (!coordinates || coordinates.length < 1) return []
        if (coordinates.length === 1) {
            let point = coordinates[0]
            let point2 = { x: point.x - 100, y: point.y }
            let point3 = { x: point.x + 100, y: point.y }
            let point4 = { x: point.x, y: point.y + 100 }
            coordinates = [point, point2, point3, point4]
        }
        return getBullishFigures(coordinates as Coordinate[], bounding)
    },
}

export default bullish
