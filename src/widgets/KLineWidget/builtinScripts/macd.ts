/**
 * MACD (Moving Average Convergence Divergence) — 副图
 * DIF + DEA + 柱状图（红绿）
 *
 * ⚠️ D.bar styles 参数支持回调函数 (ctx) => { color, size }
 *    ctx.value 是当前柱子的值
 */
export const MACD_SCRIPT = `// @name = MACD
// @position = vice

var macdResult = F.macd(dataList, 12, 26, 9)
var dif = macdResult.macd
var dea = macdResult.signal
var hist = macdResult.histogram

D.line(dif, { color: '#2196F3', size: 1.5 })
D.line(dea, { color: '#FF9800', size: 1.5 })
D.bar(hist, 0, function(ctx) { return { color: ctx.value >= 0 ? '#26A69A' : '#EF5350', size: 0.8 } })
`;
