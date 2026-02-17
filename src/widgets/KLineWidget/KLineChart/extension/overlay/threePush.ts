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
import type Point from '../../common/Point'
import type { LineAttrs } from '../figure/line'
import type { TextAttrs } from '../figure/text'
import type { PolygonAttrs } from '../figure/polygon'

/**
 * 计算三点之间的价格比例
 * @param p1
 * @param p2
 * @param p3
 * @returns
 */
function getPointsProportion (p1?: Point, p2?: Point, p3?: Point): string {
  if (!p1 || !p2 || !p3) {
    return ''
  }
  const v1 = p1.value ?? 0
  const v2 = p2.value ?? 0
  const v3 = p3.value ?? 0

  const totalDiff = v1 - v2
  const partialDiff = v3 - v2

  if (totalDiff === 0) {
    return 'N/A'
  }
  const proportion = partialDiff / totalDiff
  return proportion.toFixed(3)
}

const threePush: OverlayTemplate = {
  name: 'threePush',
  totalStep: 8,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, overlay }) => {
    const solidLines: LineAttrs[] = []
    const dashedLines: LineAttrs[] = []
    const texts: TextAttrs[] = []
    const polygons: PolygonAttrs[] = []
    const points = overlay.points

    if (coordinates.length > 1) {
      coordinates.forEach((point, i) => {
        if (i > 0) {
          solidLines.push({ coordinates: [coordinates[i - 1], point] })
        }
        if (i === 3) {
          const p1 = points[i - 2]
          const p2 = points[i - 1]
          const p3 = points[i]
          if (p1 && p2 && p3) {
            dashedLines.push({ coordinates: [coordinates[i - 2], point] })
            const text = getPointsProportion(p1 as Point, p2 as Point, p3 as Point)
            if (text) {
              texts.push({
                x: point.x,
                y: point.y + 8,
                text,
                baseline: 'bottom'
              })
            }
            polygons.push({
              coordinates: [coordinates[i - 2], coordinates[i - 1], point]
            })
          }
        }
        if (i === 5) {
          const p1 = points[i - 2]
          const p2 = points[i - 1]
          const p3 = points[i]
          if (p1 && p2 && p3) {
            dashedLines.push({ coordinates: [coordinates[i - 2], point] })
            const text = getPointsProportion(p1 as Point, p2 as Point, p3 as Point)
            if (text) {
              texts.push({
                x: point.x,
                y: point.y + 8,
                text,
                baseline: 'bottom'
              })
            }
            polygons.push({
              coordinates: [coordinates[i - 2], coordinates[i - 1], point]
            })
          }
        }
      })
    }
    return [
      { type: 'polygon', attrs: polygons },
      { type: 'line', attrs: solidLines },
      { type: 'line', attrs: dashedLines, styles: { style: 'dashed' } },
      { type: 'text', ignoreEvent: true, attrs: texts }
    ]
  }
}

export default threePush
