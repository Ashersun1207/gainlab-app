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
import { getRayLine } from './utils'

/**
 * 获取线性Y值
 * @param c1
 * @param c2
 * @param targetC
 * @returns {number}
 */
function getLinearY (c1: Coordinate, c2: Coordinate, targetC: Coordinate): number {
  if (c1.x === c2.x) {
    return targetC.y
  }
  const k = (c2.y - c1.y) / (c2.x - c1.x)
  const b = c1.y - k * c1.x
  return k * targetC.x + b
}

/**
 * 获取两条线的交点
 * @param p1
 * @param p2
 * @param p3
 * @param p4
 * @returns {*|null}
 */
function getIntersectPoint (p1: Coordinate, p2: Coordinate, p3: Coordinate, p4: Coordinate): Coordinate | null {
  const E = (p2.y - p1.y) * (p4.x - p3.x) - (p4.y - p3.y) * (p2.x - p1.x)
  if (E === 0) {
    return null
  }
  const t = ((p3.y - p1.y) * (p4.x - p3.x) - (p4.y - p3.y) * (p3.x - p1.x)) / E
  const x = p1.x + t * (p2.x - p1.x)
  const y = p1.y + t * (p2.y - p1.y)
  return { x, y }
}

const headShoulders: OverlayTemplate = {
  name: 'headShoulders',
  totalStep: 8,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding }) => {
    const lines: LineAttrs[] = []
    const texts: TextAttrs[] = []
    const polygons: PolygonAttrs[] = []
    const textLabels = [null, '左肩', null, '头部', null, '右肩', null]

    if (coordinates.length > 0) {
      // 绘制连接线和标签
      coordinates.forEach((point, i) => {
        if (i > 0) {
          lines.push({ coordinates: [coordinates[i - 1], point] })
        }
        const text = textLabels[i]
        if (text) {
          texts.push({
            x: point.x,
            y: point.y - 10,
            text,
            baseline: 'bottom'
          })
        }
      })

      let neckLineP1: Coordinate | null = null
      let neckLineP2: Coordinate | null = null

      if (coordinates.length >= 5) {
        polygons.push({ coordinates: [coordinates[2], coordinates[3], coordinates[4]] })
        const y0 = getLinearY(coordinates[2], coordinates[4], coordinates[0])
        if (y0 < coordinates[0].y) {
          neckLineP1 = { x: 0, y: getLinearY(coordinates[2], coordinates[4], { x: 0, y: 0 }) }
          neckLineP2 = { x: bounding.width, y: getLinearY(coordinates[2], coordinates[4], { x: bounding.width, y: 0 }) }
        } else {
          const intersect = getIntersectPoint(coordinates[0], coordinates[1], coordinates[2], coordinates[4])
          if (intersect) {
            neckLineP1 = intersect
            const ray = getRayLine([intersect, coordinates[4]], bounding) as LineAttrs
            neckLineP2 = ray.coordinates[1]
            polygons.push({ coordinates: [intersect, coordinates[1], coordinates[2]] })
          }
        }
      }

      if (coordinates.length >= 7) {
        const y0 = getLinearY(coordinates[2], coordinates[4], coordinates[6])
        if (y0 >= coordinates[6].y) {
          const intersect = getIntersectPoint(coordinates[5], coordinates[6], coordinates[2], coordinates[4])
          if (intersect && neckLineP1) {
            neckLineP2 = intersect
            polygons.push({ coordinates: [intersect, coordinates[4], coordinates[5]] })
          }
        }
      }

      if (neckLineP1 && neckLineP2) {
        lines.push({ coordinates: [neckLineP1, neckLineP2] })
      }
    }

    const figures = [
      { type: 'line', attrs: lines },
      { type: 'polygon', ignoreEvent: true, attrs: polygons },
      { type: 'text', ignoreEvent: true, attrs: texts }
    ]
    return figures
  }
}

export default headShoulders
