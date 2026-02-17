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

import { type LineAttrs } from '../figure/line'
import { PolygonAttrs } from '../figure/polygon'

/**
 * 获取平行线段
 * @param coordinates
 * @param bounding
 * @param extendParallelLineCount
 * @returns {Array}
 */
export function getParallelSegments(
  coordinates: Coordinate[],
  bounding: Bounding,
  extendParallelLineCount?: number
): LineAttrs[] {
  const lines: LineAttrs[] = []
  if (coordinates.length > 1) {
    // 线段向量
    const dx = coordinates[1].x - coordinates[0].x
    const dy = coordinates[1].y - coordinates[0].y
    // 第1条线段
    lines.push({ coordinates: [coordinates[0], coordinates[1]] })
    // 其它平行线段
    for (let i = 2; i < coordinates.length; i++) {
      lines.push({
        coordinates: [
          coordinates[i],
          { x: coordinates[i].x + dx, y: coordinates[i].y + dy }
        ]
      })
    }
  }
  return lines
}

const parallelSegment: OverlayTemplate = {
  name: 'parallelSegment',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  createPointFigures: ({ coordinates, bounding }) => {
    const lines = getParallelSegments(coordinates, bounding)
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

export default parallelSegment
