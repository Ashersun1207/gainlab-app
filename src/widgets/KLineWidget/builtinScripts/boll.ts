/**
 * BOLL (Bollinger Bands) — 主图叠加
 * 中轨 + 上轨 + 下轨 + 填充区域
 */
export const BOLL_SCRIPT = `// @name = BOLL
// @position = main

var bollData = F.boll(dataList, 20, 2, 'close')
var mid = bollData.map(function(d) { return d ? d.mid : null })
var ub = bollData.map(function(d) { return d ? d.ub : null })
var lb = bollData.map(function(d) { return d ? d.lb : null })

D.line(mid, { color: '#FFD54F', size: 1 })
D.line(ub, { color: '#4FC3F7', size: 1, style: 'dashed' })
D.line(lb, { color: '#4FC3F7', size: 1, style: 'dashed' })
D.area(ub, lb, { color: 'rgba(79,195,247,0.08)' })
`;
