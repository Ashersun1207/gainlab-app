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

function formatSeconds(seconds: number): string {
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

const ruler: OverlayTemplate = {
    name: 'ruler',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates, overlay }) => {
        if (coordinates.length !== 2) {
            return []
        }
        const points = overlay.points as Point[]
        if (points.length !== 2) {
            return []
        }
        const p1 = points[0]
        const p2 = points[1]
        const c1 = coordinates[0]
        const c2 = coordinates[1]

        const priceDiff = p2.value - p1.value
        const pricePtg = (priceDiff / p1.value) * 100
        const text1 = `${priceDiff.toFixed(2)} (${pricePtg.toFixed(2)}%)`

        const barCount = Math.abs(p2.dataIndex - p1.dataIndex)
        const timeDiff = Math.abs(p2.timestamp - p1.timestamp)
        let text2 = `${barCount} bars`
        if (timeDiff > 0) {
            text2 += ` (${formatSeconds(timeDiff / 1000)})`
        }

        const centerX = (c1.x + c2.x) / 2
        const centerY = (c1.y + c2.y) / 2

        const verticalArrowYOffset = c1.y < c2.y ? -8 : 8
        const horizontalArrowXOffset = c1.x < c2.x ? -8 : 8

        const textSize = 12
        const textLineHeight = textSize * 1.3
        const rectBottom = Math.max(c1.y, c2.y)
        const textX = centerX
        const text1Y = rectBottom + textLineHeight / 2 + 5
        const text2Y = text1Y + textLineHeight + 6

        return [
            {
                type: 'polygon',
                attrs: [{
                    coordinates: [c1, { x: c2.x, y: c1.y }, c2, { x: c1.x, y: c2.y }]
                }]
            },
            {
                type: 'line',
                attrs: [
                    { coordinates: [c1, { x: c2.x, y: c1.y }] },
                    { coordinates: [{ x: c2.x, y: c1.y }, c2] },
                    { coordinates: [c2, { x: c1.x, y: c2.y }] },
                    { coordinates: [{ x: c1.x, y: c2.y }, c1] }
                ],
            },
            {
                type: 'line',
                attrs: [
                    // Vertical arrow
                    { coordinates: [{ x: centerX, y: c1.y }, { x: centerX, y: c2.y }] },
                    { coordinates: [{ x: centerX, y: c2.y }, { x: centerX - 4, y: c2.y + verticalArrowYOffset }] },
                    { coordinates: [{ x: centerX, y: c2.y }, { x: centerX + 4, y: c2.y + verticalArrowYOffset }] },
                    // Horizontal arrow
                    { coordinates: [{ x: c1.x, y: centerY }, { x: c2.x, y: centerY }] },
                    { coordinates: [{ x: c2.x, y: centerY }, { x: c2.x + horizontalArrowXOffset, y: centerY - 4 }] },
                    { coordinates: [{ x: c2.x, y: centerY }, { x: c2.x + horizontalArrowXOffset, y: centerY + 4 }] }
                ]
            },
            {
                type: 'text',
                ignoreEvent: true,
                attrs: [
                    { x: textX, y: text1Y, text: text1, align: 'center', baseline: 'middle' },
                    { x: textX, y: text2Y, text: text2, align: 'center', baseline: 'middle' }
                ]
            }
        ]
    }
}

export default ruler
