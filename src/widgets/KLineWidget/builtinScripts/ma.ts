/**
 * MA (Moving Average) — 主图叠加
 * 4 条均线，周期和颜色均可调节
 */
export const MA_SCRIPT = `// @name = MA
// @position = main

var p1 = input.int(5, name='MA1 周期', min=1, max=200)
var p2 = input.int(10, name='MA2 周期', min=1, max=200)
var p3 = input.int(20, name='MA3 周期', min=1, max=200)
var p4 = input.int(60, name='MA4 周期', min=1, max=200)

var c1 = style.color('#FF6D00', name='MA1 颜色')
var c2 = style.color('#2196F3', name='MA2 颜色')
var c3 = style.color('#E040FB', name='MA3 颜色')
var c4 = style.color('#00E676', name='MA4 颜色')

var ma1 = F.ma(close, p1)
var ma2 = F.ma(close, p2)
var ma3 = F.ma(close, p3)
var ma4 = F.ma(close, p4)

D.line(ma1, { color: c1, size: 1 })
D.line(ma2, { color: c2, size: 1 })
D.line(ma3, { color: c3, size: 1 })
D.line(ma4, { color: c4, size: 1 })
`;
