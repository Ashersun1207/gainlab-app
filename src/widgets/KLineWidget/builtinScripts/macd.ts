/**
 * MACD (Moving Average Convergence Divergence) — 副图
 * DIF + DEA + 柱状图（红绿）
 *
 * ⚠️ D.bar styles 参数支持回调函数 (ctx) => { color, size }
 *    ctx.value 是当前柱子的值
 * ⚠️ 柱色保持硬编码（红绿切换是逻辑代码，不是声明式样式，P2 再做）
 */
export const MACD_SCRIPT = `// @name = MACD
// @position = vice

var fast = input.int(12, name='快线周期', min=1, max=100)
var slow = input.int(26, name='慢线周期', min=1, max=200)
var sig = input.int(9, name='信号周期', min=1, max=50)

var cDif = style.color('#2196F3', name='DIF 颜色')
var cDea = style.color('#FF9800', name='DEA 颜色')

var macdResult = F.macd(dataList, fast, slow, sig)
var dif = macdResult.macd
var dea = macdResult.signal
var hist = macdResult.histogram

D.line(dif, { color: cDif, size: 1.5 })
D.line(dea, { color: cDea, size: 1.5 })
D.bar(hist, 0, function(ctx) { return { color: ctx.value >= 0 ? '#26A69A' : '#EF5350', size: 0.8 } })
`;
