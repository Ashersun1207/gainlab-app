/**
 * KDJ (Stochastic Oscillator) — 副图
 * K/D/J 三线 + 超买/超卖参考线
 *
 * ⚠️ KDJ 变量名不能叫 d（与 D=DrawAPI 冲突），用 dLine
 * ⚠️ 参考线颜色保持硬编码（P2 再做可配置）
 */
export const KDJ_SCRIPT = `// @name = KDJ
// @position = vice

var kPeriod = input.int(9, name='K 周期', min=1, max=100)
var dPeriod = input.int(3, name='D 平滑', min=1, max=20)

var cK = style.color('#2196F3', name='K 线颜色')
var cD = style.color('#FF9800', name='D 线颜色')
var cJ = style.color('#E040FB', name='J 线颜色')

var kdjResult = F.kdj(dataList, kPeriod, dPeriod)
var kLine = kdjResult.k
var dLine = kdjResult.d
var jLine = kdjResult.j

D.line(kLine, { color: cK, size: 1.5 })
D.line(dLine, { color: cD, size: 1.5 })
D.line(jLine, { color: cJ, size: 1 })
D.hline(80, { color: '#EF5350', size: 0.5, style: 'dashed' })
D.hline(20, { color: '#26A69A', size: 0.5, style: 'dashed' })
`;
