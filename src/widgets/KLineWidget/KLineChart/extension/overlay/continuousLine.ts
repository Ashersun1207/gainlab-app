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

const continuousLine: OverlayTemplate = {
    name: 'continuousLine',
    totalStep: Number.MAX_SAFE_INTEGER,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: true,
    needDefaultYAxisFigure: true,
    createPointFigures: ({ coordinates }) => {
        let lastY = 0
        const texts: any[] = []
        coordinates.forEach((coordinate, i) => {
            let x = coordinate.x
            let y = coordinate.y
            x = coordinate.x - 11
            if (i > 0) {
                if (y > lastY) {
                    if (i === 1) {
                        texts[0].y = texts[0].y - 6
                    }
                    y += 26

                } else {
                    if (i === 1) {
                        texts[0].y = texts[0].y + 26
                    }
                    y -= 6
                }
            }

            lastY = y
            texts.push({
                x: x,
                y: y,
                text: `(${i})`,
                baseline: 'bottom'
            })
        })
        return [
            {
                type: 'line',
                attrs: { coordinates }
            },
            {
                type: 'text',
                ignoreEvent: true,
                attrs: texts
            }
        ]
    }
}

export default continuousLine