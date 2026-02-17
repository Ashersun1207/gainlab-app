import type { OverlayTemplate } from '../../component/Overlay'
import type { LineAttrs } from '../figure/line'
import type { TextAttrs } from '../figure/text'
import { PolygonAttrs } from '../figure/polygon'

const fibonacciChannel: OverlayTemplate = {
    name: 'fibonacciChannel',
    totalStep: 4,
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    styles: {
        polygon: {
            color: 'rgba(22, 119, 255, 0.15)'
        }
    },
    createPointFigures: ({ chart, coordinates, overlay, yAxis }) => {
        const lines: LineAttrs[] = []
        const texts: TextAttrs[] = []
        const polygons: PolygonAttrs[] = []
        
        if (coordinates.length === 2) {
            // 只有两个点时，显示两点之间的线段
            lines.push({
                coordinates: [{ x: coordinates[0].x, y: coordinates[0].y }, { x: coordinates[1].x, y: coordinates[1].y }]
            })
            return [
                {
                    type: 'line',
                    attrs: lines
                }
            ]
        } else if (coordinates.length >= 3) {
            // 有三个点时，计算斐波那契平行线
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
            const value1 = points[0]?.value ?? 0
            const value2 = points[1]?.value ?? 0
            const value3 = points[2]?.value ?? 0
            
            const param = overlay.styles?.param
            const percents = Array.isArray(param) && param.length > 0 ? param : [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.618, 2.618, 3.618]
            
            // 预计算基准值，避免重复计算
            const baseDistance = value3 - value1
            const directionX = coordinates[1].x - coordinates[0].x
            const directionY = coordinates[1].y - coordinates[0].y
            
            // 预计算坐标差值，避免重复计算
            const coordDeltaX = coordinates[2].x - coordinates[0].x
            const coordDeltaY = coordinates[2].y - coordinates[0].y
            
            // 批量创建线条坐标，减少DOM操作
            const lineCoordinates: LineAttrs[] = []
            const textCoordinates: TextAttrs[] = []
            const polygonCoordinates: PolygonAttrs[] = []
            
            // 优化：减少循环中的计算
            for (let i = 0; i < percents.length; i++) {
                const percent = percents[i]
                
                // 计算当前比例对应的价格
                const currentValue = value1 + baseDistance * percent
                
                // 计算分割点在第一个点到第三个点之间的位置
                const splitX = coordinates[0].x + coordDeltaX * percent
                const splitY = coordinates[0].y + coordDeltaY * percent
                
                // 计算平行线的起点和终点
                const startX = splitX
                const startY = splitY
                const endX = splitX + directionX
                const endY = splitY + directionY
                
                // 批量添加线条坐标
                lineCoordinates.push({ 
                    coordinates: [{ x: startX, y: startY }, { x: endX, y: endY }]
                })
                
                // 优化：减少字符串格式化调用
                const formattedValue = currentValue.toFixed(precision)
                textCoordinates.push({
                    x: splitX,
                    y: splitY,
                    text: `${formattedValue} (${(percent * 100).toFixed(1)}%)`,
                    baseline: 'bottom'
                })
                
                // 添加填充区域（相邻两条线之间的区域）
                if (i > 0) {
                    const prevPercent = percents[i - 1]
                    const prevSplitX = coordinates[0].x + coordDeltaX * prevPercent
                    const prevSplitY = coordinates[0].y + coordDeltaY * prevPercent
                    const prevEndX = prevSplitX + directionX
                    const prevEndY = prevSplitY + directionY
                    
                    polygonCoordinates.push({
                        coordinates: [
                            { x: prevSplitX, y: prevSplitY },
                            { x: prevEndX, y: prevEndY },
                            { x: endX, y: endY },
                            { x: startX, y: startY }
                        ]
                    })
                }
            }
            
            // 批量添加所有线条
            lines.push(...lineCoordinates)
            texts.push(...textCoordinates)
            polygons.push(...polygonCoordinates)
            
            return [
                {
                    type: 'polygon',
                    attrs: polygons
                },
                {
                    type: 'line',
                    attrs: lines
                },
                {
                    type: 'text',
                    ignoreEvent: true,
                    attrs: texts
                }
            ]
        }
        
        return []
    }
}

export default fibonacciChannel
