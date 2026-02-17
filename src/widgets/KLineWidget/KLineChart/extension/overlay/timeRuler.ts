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
import type { LineAttrs } from '../figure/line'
import type { TextAttrs } from '../figure/text'
import type { PolygonAttrs } from '../figure/polygon'
import type Point from '../../common/Point'

function formatSeconds (seconds: number): string {
  const ss = Math.round(seconds)
  const d = Math.floor(ss / (24 * 3600))
  const h = Math.floor((ss % (24 * 3600)) / 3600)
  const m = Math.floor((ss % 3600) / 60)
  let str = ''
  if (d > 0) {
    str += `${d}D`
  }
  if (h > 0) {
    str += `${h}H`
  }
  if (m > 0) {
    str += `${m}M`
  }
  return str
}

const timeRuler: OverlayTemplate = {
  name: 'timeRuler',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: true,
  needDefaultYAxisFigure: true,
  styles: {
    polygon: {
      color: 'rgba(22, 119, 255, 0.15)',
      style: 'fill',
      borderColor: 'rgba(22, 119, 255, 1)',
    },
    line: {
      color: 'rgba(22, 119, 255, 1)'
    },
    text: {
      color: '#FFF',
      size: 12,
      paddingLeft: 4,
      paddingRight: 4,
      backgroundColor: 'rgba(22, 119, 255, 0.8)'
    }
  },
  createPointFigures: ({ coordinates, overlay }) => {
    if (coordinates.length === 2) {
      const points = overlay.points as Point[]
      if (points.length !== 2) {
        return []
      }
      const p1 = points[0]
      const p2 = points[1]
      const c1 = coordinates[0]
      const c2 = coordinates[1]

      const figures: any[] = []

      // 1. Polygon for fill
      const polygonFillAttrs: PolygonAttrs[] = [{
        coordinates: [c1, { x: c2.x, y: c1.y }, c2, { x: c1.x, y: c2.y }]
      }]
      figures.push({ type: 'polygon', attrs: polygonFillAttrs })

      figures.push({
        type: 'line',
        attrs: [
          { coordinates: [c1, { x: c2.x, y: c1.y }] },
          { coordinates: [{ x: c2.x, y: c1.y }, c2] },
          { coordinates: [c2, { x: c1.x, y: c2.y }] },
          { coordinates: [{ x: c1.x, y: c2.y }, c1] }
        ],
        styles: { style: 'dashed' }
      })

      // 3. Line attributes for horizontal arrow
      const lineAttrs: LineAttrs[] = []
      const centerY = (c1.y + c2.y) / 2
      lineAttrs.push({ coordinates: [{ x: c1.x, y: centerY }, { x: c2.x, y: centerY }] })
      if (c1.x < c2.x) {
        lineAttrs.push({ coordinates: [{ x: c2.x, y: centerY }, { x: c2.x - 8, y: centerY - 4 }] })
        lineAttrs.push({ coordinates: [{ x: c2.x, y: centerY }, { x: c2.x - 8, y: centerY + 4 }] })
      } else {
        lineAttrs.push({ coordinates: [{ x: c2.x, y: centerY }, { x: c2.x + 8, y: centerY - 4 }] })
        lineAttrs.push({ coordinates: [{ x: c2.x, y: centerY }, { x: c2.x + 8, y: centerY + 4 }] })
      }
      figures.push({ type: 'line', attrs: lineAttrs })

      // 4. Text box and content
      const barCount = Math.abs(p2.dataIndex - p1.dataIndex)
      const timeDiff = Math.abs(p2.timestamp - p1.timestamp)
      let text = `${barCount} bars`
      if (timeDiff > 0) {
        text += ` (${formatSeconds(timeDiff / 1000)})`
      }
      const rectBottom = Math.max(c1.y, c2.y)
      const centerX = (c1.x + c2.x) / 2

      const textY = rectBottom + 16
      const textAttrs: TextAttrs[] = [
        { x: centerX, y: textY, text, align: 'center', baseline: 'middle' }
      ]
      figures.push({ type: 'text', attrs: textAttrs, ignoreEvent: true })

      return figures
    }
    return []
  }
}

export default timeRuler
