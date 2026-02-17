import type { OverlayTemplate, OverlayFigure } from '../../component/Overlay'
import type Coordinate from '../../common/Coordinate'
import type Bounding from '../../common/Bounding'
import { getRayLine } from './utils'
import type { LineAttrs } from '../figure/line'

function getBifurcateFigures(coordinates: Coordinate[], bounding: Bounding): OverlayFigure[] {
  if (coordinates.length < 3) return []

  const [A, B, C] = coordinates
  const figures: OverlayFigure[] = []

  // 1. 基准线（B-C线段，只画两点之间）
  figures.push({
    key: 'base_segment',
    type: 'line',
    attrs: { coordinates: [B, C] },
  })

  // 2. B、C中点
  const mid = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }

  // 3. 中轴线（A->mid，射线）
  const medianLine = (getRayLine([A, mid], bounding) as LineAttrs).coordinates

  // 4. 过B的分叉线（射线）
  const B2 = { x: B.x - A.x + mid.x, y: B.y - A.y + mid.y }
  const upperLine = (getRayLine([B, B2], bounding) as LineAttrs).coordinates

  // 5. 过C的分叉线（射线）
  const C2 = { x: C.x - A.x + mid.x, y: C.y - A.y + mid.y }
  const lowerLine = (getRayLine([C, C2], bounding) as LineAttrs).coordinates

  // 6. 辅助线5（B与中轴线之间的中线，射线）
  const Bmid = { x: (B.x + mid.x) / 2, y: (B.y + mid.y) / 2 }
  const Bmid2 = { x: Bmid.x - A.x + mid.x, y: Bmid.y - A.y + mid.y }
  const assistLine5 = (getRayLine([Bmid, Bmid2], bounding) as LineAttrs).coordinates

  // 7. 辅助线6（C与中轴线之间的中线，射线）
  const Cmid = { x: (C.x + mid.x) / 2, y: (C.y + mid.y) / 2 }
  const Cmid2 = { x: Cmid.x - A.x + mid.x, y: Cmid.y - A.y + mid.y }
  const assistLine6 = (getRayLine([Cmid, Cmid2], bounding) as LineAttrs).coordinates

  // 8. 区域填充（用射线的端点）
  figures.push({
    key: 'area',
    type: 'polygon',
    attrs: { coordinates: [upperLine[0], upperLine[1], lowerLine[1], lowerLine[0]] },
  })

  // 9. 其它射线
  figures.push(
    { key: 'median_line', type: 'line', attrs: { coordinates: medianLine } },
    { key: 'upper_line', type: 'line', attrs: { coordinates: upperLine }},
    { key: 'lower_line', type: 'line', attrs: { coordinates: lowerLine } },
    { key: 'assist5', type: 'line', attrs: { coordinates: assistLine5 } },
    { key: 'assist6', type: 'line', attrs: { coordinates: assistLine6 } }
  )

  return figures
}

const bifurcate: OverlayTemplate = {
  name: 'bifurcate',
  totalStep: 4,
  needDefaultPointFigure: true,
  createPointFigures: ({ coordinates, bounding }) => {
    if (!coordinates || coordinates.length < 3) return []
    return getBifurcateFigures(coordinates as Coordinate[], bounding)
  },
}

export default bifurcate