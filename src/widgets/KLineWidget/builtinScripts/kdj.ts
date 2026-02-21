/**
 * KDJ (Stochastic Oscillator) — 副图
 * K/D/J 三线 + 超买/超卖参考线
 *
 * ⚠️ KDJ 变量名不能叫 d（与 D=DrawAPI 冲突），用 dLine
 */
export const KDJ_SCRIPT = `// @name = KDJ
// @position = vice

var kdjResult = F.kdj(dataList, 9, 3)
var kLine = kdjResult.k
var dLine = kdjResult.d
var jLine = kdjResult.j

D.line(kLine, { color: '#2196F3', size: 1.5 })
D.line(dLine, { color: '#FF9800', size: 1.5 })
D.line(jLine, { color: '#E040FB', size: 1 })
D.hline(80, { color: '#EF5350', size: 0.5, style: 'dashed' })
D.hline(20, { color: '#26A69A', size: 0.5, style: 'dashed' })
`;
