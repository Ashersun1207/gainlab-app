/**
 * EMA (Exponential Moving Average) — 主图叠加
 * EMA 双线，周期和颜色可调
 */
export const EMA_SCRIPT = `// @name = EMA
// @position = main

var p1 = input.int(12, name='EMA1 周期', min=1, max=200)
var p2 = input.int(26, name='EMA2 周期', min=1, max=200)

var c1 = style.color('#FF9800', name='EMA1 颜色')
var c2 = style.color('#03A9F4', name='EMA2 颜色')

var ema1 = F.ema(dataList, p1, 'close')
var ema2 = F.ema(dataList, p2, 'close')

D.line(ema1, { color: c1, size: 1.5 })
D.line(ema2, { color: c2, size: 1.5 })
`;
