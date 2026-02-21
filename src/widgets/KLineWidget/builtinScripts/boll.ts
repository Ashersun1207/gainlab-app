/**
 * BOLL (Bollinger Bands) — 主图叠加
 * 中轨 + 上轨 + 下轨 + 填充区域
 */
export const BOLL_SCRIPT = `// @name = BOLL
// @position = main

var period = input.int(20, name='周期', min=5, max=100)
var mult = input.float(2, name='标准差倍数', min=0.5, max=5)

var cMid = style.color('#FFD54F', name='中轨颜色')
var cBand = style.color('#4FC3F7', name='带颜色')

var bollData = F.boll(dataList, period, mult, 'close')
var mid = bollData.map(function(d) { return d ? d.mid : null })
var ub = bollData.map(function(d) { return d ? d.ub : null })
var lb = bollData.map(function(d) { return d ? d.lb : null })

D.line(mid, { color: cMid, size: 1 })
D.line(ub, { color: cBand, size: 1, style: 'dashed' })
D.line(lb, { color: cBand, size: 1, style: 'dashed' })
D.area(ub, lb, { color: 'rgba(79,195,247,0.08)' })
`;
