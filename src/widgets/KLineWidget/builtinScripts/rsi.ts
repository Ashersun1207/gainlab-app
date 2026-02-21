/**
 * RSI (Relative Strength Index) — 副图
 * RSI 单线 + 超买/超卖/中线参考线
 * 参考线颜色保持硬编码（P2 再做可配置）
 */
export const RSI_SCRIPT = `// @name = RSI
// @position = vice

var period = input.int(14, name='RSI 周期', min=2, max=100)

var c1 = style.color('#FFD54F', name='RSI 颜色')

var rsiData = F.rsi(dataList, period, 100, 1, 'close')

D.line(rsiData, { color: c1, size: 1.5 })
D.hline(70, { color: '#EF5350', size: 0.5, style: 'dashed' })
D.hline(30, { color: '#26A69A', size: 0.5, style: 'dashed' })
D.hline(50, { color: '#666', size: 0.5, style: 'dotted' })
`;
