/**
 * EMA (Exponential Moving Average) — 主图叠加
 * EMA(12) + EMA(26)
 */
export const EMA_SCRIPT = `// @name = EMA
// @position = main

var ema12 = F.ema(dataList, 12, 'close')
var ema26 = F.ema(dataList, 26, 'close')

D.line(ema12, { color: '#FF9800', size: 1.5 })
D.line(ema26, { color: '#03A9F4', size: 1.5 })
`;
