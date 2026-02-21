/**
 * ATR (Average True Range) — 副图
 * ATR(14) 单线
 */
export const ATR_SCRIPT = `// @name = ATR
// @position = vice

var atrData = F.atr(dataList, 14)

D.line(atrData, { color: '#26A69A', size: 1.5 })
`;
