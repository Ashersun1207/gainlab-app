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
import { PolygonAttrs } from '../figure/polygon'
const fibonacciExtension: OverlayTemplate = {
    name: 'fibonacciExtension',
    totalStep: 4,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ chart, coordinates, overlay, yAxis }) => {
        const fbLines: LineAttrs[] = []
        const texts: TextAttrs[] = []
        const polygons: PolygonAttrs[] = []
        if (coordinates.length > 2) {
            let precision = 0
            if (yAxis?.isInCandle() ?? true) {
                precision = chart.getSymbol()?.pricePrecision ?? 2
            } else {
                const indicators = chart.getIndicators({ paneId: overlay.paneId })
                indicators.forEach(indicator => {
                    precision = Math.max(precision, indicator.precision)
                })
            }
            const points = overlay.points
            const valueDif = (points[1] as any).value - (points[0] as any).value
            const yDif = coordinates[1].y - coordinates[0].y
            const percents = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
            const textX = coordinates[2].x > coordinates[1].x ? coordinates[1].x : coordinates[2].x
            percents.forEach(percent => {
                const y = coordinates[2].y + yDif * percent
                const value = chart.getDecimalFold().format(chart.getThousandsSeparator().format(((points[1].value ?? 0) + valueDif * percent).toFixed(precision)))
                fbLines.push({ coordinates: [{ x: coordinates[1].x, y }, { x: coordinates[2].x, y }] })
                texts.push({
                    x: textX,
                    y,
                    text: `${value} (${(percent * 100).toFixed(1)}%)`,
                    baseline: 'bottom'
                })
            })
            polygons.push({
                coordinates: [
                    { x: coordinates[1].x, y: coordinates[2].y },
                    { x: coordinates[2].x, y: coordinates[2].y },
                    { x: coordinates[2].x, y: coordinates[2].y + yDif },
                    { x: coordinates[1].x, y: coordinates[2].y + yDif }
                ]
            })
        }
        return [
            {
                type: 'line',
                attrs: { coordinates },
                styles: { style: 'dashed' }
            },
            {
                type: 'polygon',
                attrs: polygons
            },
            {
                type: 'line',
                attrs: fbLines
            },
            {
                type: 'text',
                ignoreEvent: true,
                attrs: texts
            }
        ]
    }
}

export default fibonacciExtension