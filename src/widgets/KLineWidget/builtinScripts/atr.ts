/**
 * ATR (Average True Range) — 副图
 * ATR 单线，周期和颜色可调
 */
export const ATR_SCRIPT = `// @name = ATR
// @position = vice

var period = input.int(14, name='ATR 周期', min=1, max=100)

var c1 = style.color('#26A69A', name='ATR 颜色')

var atrData = F.atr(dataList, period)

D.line(atrData, { color: c1, size: 1.5 })
`;
