/**
 * RSI (Relative Strength Index) — 副图
 * RSI(14) + 超买/超卖/中线参考线
 */
export const RSI_SCRIPT = `// @name = RSI
// @position = vice

var rsiData = F.rsi(dataList, 14, 100, 1, 'close')

D.line(rsiData, { color: '#AB47BC', size: 1.5 })
D.hline(70, { color: '#EF5350', size: 0.5, style: 'dashed' })
D.hline(30, { color: '#26A69A', size: 0.5, style: 'dashed' })
D.hline(50, { color: '#666', size: 0.5, style: 'dotted' })
`;
