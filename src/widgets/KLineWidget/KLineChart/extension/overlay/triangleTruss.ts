/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { OverlayTemplate } from '../../component/Overlay'
import type Coordinate from '../../common/Coordinate'
import type { LineAttrs } from '../figure/line'
import type { PolygonAttrs } from '../figure/polygon'
import type { TextAttrs } from '../figure/text'

interface LineParams {
  k: number
  b: number
}

interface IntersectResult {
  point: Coordinate
  kb1: LineParams
  kb2: LineParams
}

function getLinearY (c1: Coordinate, c2: Coordinate, targetC: Coordinate): number {
  if (c1.x === c2.x) {
    return targetC.y
  }
  const k = (c2.y - c1.y) / (c2.x - c1.x)
  const b = c1.y - k * c1.x
  return k * targetC.x + b
}

function getIntersectPointWithSlope (p1: Coordinate, p2: Coordinate, p3: Coordinate, p4: Coordinate): IntersectResult | null {
  const isLine1Vertical = p1.x === p2.x
  const isLine2Vertical = p3.x === p4.x

  let k1: number, b1: number, k2: number, b2: number

  if (isLine1Vertical) {
    k1 = Infinity
    b1 = Infinity
  } else {
    k1 = (p2.y - p1.y) / (p2.x - p1.x)
    b1 = p1.y - k1 * p1.x
  }

  if (isLine2Vertical) {
    k2 = Infinity
    b2 = Infinity
  } else {
    k2 = (p4.y - p3.y) / (p4.x - p3.x)
    b2 = p3.y - k2 * p3.x
  }

  if (k1 === k2) {
    return null
  }

  let x: number, y: number

  if (isLine1Vertical) {
    x = p1.x
    y = k2 * x + b2
  } else if (isLine2Vertical) {
    x = p3.x
    y = k1 * x + b1
  } else {
    x = (b2 - b1) / (k1 - k2)
    y = k1 * x + b1
  }

  return {
    point: { x, y },
    kb1: { k: k1, b: b1 },
    kb2: { k: k2, b: b2 }
  }
}

const triangleTruss: OverlayTemplate = {
  name: 'triangleTruss',
  totalStep: 5,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates }) => {
    const lines: LineAttrs[] = []
    const polygons: PolygonAttrs[] = []
    const texts: TextAttrs[] = []
    const textLabels = ['A', 'B', 'C', 'D']

    if (coordinates.length > 0) {
      coordinates.forEach((point, i) => {
        const text = textLabels[i]
        if (text) {
          texts.push({
            x: point.x,
            y: point.y - 10,
            text,
            baseline: 'bottom'
          })
        }
        if (i > 0) {
          lines.push({ coordinates: [coordinates[i - 1], point] })
        }
      })
    }

    if (coordinates.length === 3 && coordinates[2].x > coordinates[0].x) {
      const y0 = getLinearY(coordinates[2], coordinates[1], coordinates[0])
      const p0 = { x: coordinates[0].x, y: y0 }
      lines.push({ coordinates: [coordinates[0], coordinates[2]] })
      lines.push({ coordinates: [coordinates[0], p0] })
      lines.push({ coordinates: [p0, coordinates[2]] })
      polygons.push({ coordinates: [coordinates[0], coordinates[2], p0] })
    }

    if (coordinates.length === 4) {
      const intersect = getIntersectPointWithSlope(coordinates[0], coordinates[2], coordinates[1], coordinates[3])
      if (intersect) {
        let x1, y1, x2, y2
        if (intersect.kb1.k > intersect.kb2.k) {
          if (coordinates[0].x < coordinates[1].x) {
            x1 = coordinates[0].x
            y1 = coordinates[0].y
            x2 = coordinates[0].x
            y2 = getLinearY(coordinates[1], coordinates[3], coordinates[0])
          } else {
            x1 = coordinates[1].x
            y1 = coordinates[1].y
            x2 = coordinates[1].x
            y2 = getLinearY(coordinates[2], coordinates[0], coordinates[1])
          }
        } else {
          if (coordinates[2].x < coordinates[3].x) {
            x1 = coordinates[3].x
            y1 = coordinates[3].y
            x2 = coordinates[3].x
            y2 = getLinearY(coordinates[0], coordinates[2], coordinates[3])
          } else {
            x1 = coordinates[2].x
            y1 = coordinates[2].y
            x2 = coordinates[2].x
            y2 = getLinearY(coordinates[1], coordinates[3], coordinates[2])
          }
        }
        lines.push({ coordinates: [{ x: x1, y: y1 }, intersect.point] })
        lines.push({ coordinates: [{ x: x1, y: y1 }, { x: x2, y: y2 }] })
        lines.push({ coordinates: [{ x: x1, y: y2 }, intersect.point] })
        polygons.push({ coordinates: [{ x: x1, y: y1 }, { x: x1, y: y2 }, intersect.point] })
      }
    }

    return [
      { type: 'line', attrs: lines },
      { type: 'polygon', ignoreEvent: true, attrs: polygons },
      { type: 'text', ignoreEvent: true, attrs: texts }
    ]
  }
}

export default triangleTruss
