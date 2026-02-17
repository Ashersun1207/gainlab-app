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

const fibonacciSegment: OverlayTemplate = {
    name: 'fibonacciSegment',
    totalStep: 3,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    styles: {
        polygon: {
            color: 'rgba(22, 119, 255, 0.15)'
        }
    },
    createPointFigures: ({ chart, coordinates, overlay, yAxis  }) => {
        if (coordinates.length > 0) {
            let precision = 0
            if (yAxis?.isInCandle() ?? true) {
                precision = chart.getSymbol()?.pricePrecision ?? 2
            } else {
                const indicators = chart.getIndicators({ paneId: overlay.paneId })
                indicators.forEach(indicator => {
                    precision = Math.max(precision, indicator.precision)
                })
            }
            const lines: LineAttrs[] = []
            const texts: TextAttrs[] = []
            const polygons: PolygonAttrs[] = []
            if (coordinates.length > 1) {
                const textX = coordinates[1].x > coordinates[0].x ? coordinates[0].x : coordinates[1].x
                const param = overlay.styles?.param
                const percents = Array.isArray(param) && param.length > 0 ? param : [1, 0.786, 0.618, 0.5, 0.382, 0.236, 0]
                const yDif = coordinates[0].y - coordinates[1].y
                const points = overlay.points
                const valueDif = (points[0] as any).value - (points[1] as any).value
                percents.forEach(percent => {
                    const y = coordinates[1].y + yDif * percent
                    const value = chart.getDecimalFold().format(chart.getThousandsSeparator().format(((points[1].value ?? 0) + valueDif * percent).toFixed(precision)))
                    lines.push({ coordinates: [{ x: coordinates[0].x, y }, { x: coordinates[1].x, y }] })
                    texts.push({
                        x: textX,
                        y,
                        text: `${value} (${(percent * 100).toFixed(1)}%)`,
                        baseline: 'bottom'
                    })
                })
                polygons.push({
                  coordinates: [
                    { x: coordinates[0].x, y: coordinates[0].y },
                    { x: coordinates[1].x, y: coordinates[0].y },
                    { x: coordinates[1].x, y: coordinates[1].y },
                    { x: coordinates[0].x, y: coordinates[1].y }
                  ]
                })
            }
            return [
                {
                    type: 'polygon',
                    attrs: polygons
                },
                {
                    type: 'line',
                    attrs: lines
                }, {
                    type: 'text',
                    ignoreEvent: true,
                    attrs: texts
                }
            ]
        }
        return []
    }
}

export default fibonacciSegment