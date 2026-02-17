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

import type Coordinate from '../../common/Coordinate'
import type Bounding from '../../common/Bounding'

import type { OverlayTemplate } from '../../component/Overlay'

import { getLinearYFromCoordinates, type LineAttrs } from '../figure/line'
import { PolygonAttrs } from '../figure/polygon'

/**
 * 获取平行射线
 * @param coordinates
 * @param bounding
 * @param extendParallelLineCount
 * @returns {Array}
 */
export function getParallelRays(
  coordinates: Coordinate[],
  bounding: Bounding,
  extendParallelLineCount?: number
): LineAttrs[] {
  const count = extendParallelLineCount ?? 0
  const lines: LineAttrs[] = []
  if (coordinates.length > 1) {
    // 竖射线
    if (coordinates[0].x === coordinates[1].x) {
      let endY = bounding.height
      if (coordinates[1].y < coordinates[0].y) endY = 0
      lines.push({ coordinates: [coordinates[0], { x: coordinates[0].x, y: endY }] })
      for (let i = 2; i < coordinates.length; i++) {
        lines.push({ coordinates: [coordinates[i], { x: coordinates[i].x, y: endY }] })
      }
    } else {
      // 斜射线
      const k = (coordinates[1].y - coordinates[0].y) / (coordinates[1].x - coordinates[0].x)
      const b = coordinates[0].y - k * coordinates[0].x
      let endX = bounding.width
      if (coordinates[1].x < coordinates[0].x) endX = 0
      // 第一条射线
      lines.push({
        coordinates: [
          coordinates[0],
          {
            x: endX,
            y: k * endX + b
          }
        ]
      })
      // 其它平行射线
      for (let i = 2; i < coordinates.length; i++) {
        const b_i = coordinates[i].y - k * coordinates[i].x
        let endX_i = bounding.width
        if (coordinates[1].x < coordinates[0].x) endX_i = 0
        lines.push({
          coordinates: [
            coordinates[i],
            {
              x: endX_i,
              y: k * endX_i + b_i
            }
          ]
        })
      }
    }
  }
  return lines
}

const parallelRay: OverlayTemplate = {
  name: 'parallelRay',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding }) => {
    const lines = getParallelRays(coordinates, bounding)
    if (lines.length > 1) {
      const polygon: PolygonAttrs = {
        coordinates: [
          lines[0].coordinates[0],
          lines[0].coordinates[1],
          lines[1].coordinates[1],
          lines[1].coordinates[0]
        ]
      }
      return [
        {
          type: 'polygon',
          attrs: polygon
        },
        {
          type: 'line',
          attrs: lines
        }
      ]
    }
    return [
      {
        type: 'line',
        attrs: lines
      }
    ]
  }
}

export default parallelRay
