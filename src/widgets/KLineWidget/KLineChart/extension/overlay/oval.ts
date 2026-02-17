import type { OverlayTemplate } from '../../component/Overlay'
import type Coordinate from '../../common/Coordinate'

const oval: OverlayTemplate = {
    name: 'oval',
    totalStep: 3,
    needDefaultPointFigure: true,
    createPointFigures: ({ coordinates }) => {
        if (coordinates.length >= 2) {
            const [p1, p2] = coordinates
            const x = (p1.x + p2.x) / 2
            const y = (p1.y + p2.y) / 2
            const rx = Math.abs(p1.x - p2.x) / 2
            const ry = Math.abs(p1.y - p2.y) / 2

            if (rx <= 0 || ry <= 0) {
                return []
            }

            // 用参数方程生成椭圆上的点来拟合
            const step = (Math.PI * 2) / 180 
            const ovalCoordinates: Coordinate[] = []
            for (let i = 0; i < Math.PI * 2; i += step) {
                ovalCoordinates.push({
                    x: x + rx * Math.cos(i),
                    y: y + ry * Math.sin(i)
                })
            }

            return [
                {
                    type: 'polygon',
                    attrs: {
                        coordinates: ovalCoordinates
                    },
                }
            ]
        }
        return []
    }
}

export default oval