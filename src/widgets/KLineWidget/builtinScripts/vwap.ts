/**
 * VWAP (Volume Weighted Average Price) — 主图叠加
 * 无 input 参数，仅颜色可调
 */
export const VWAP_SCRIPT = `// @name = VWAP
// @position = main

var c1 = style.color('#AB47BC', name='VWAP 颜色')

var vwapData = F.vwap(dataList)

D.line(vwapData, { color: c1, size: 1.5 })
`;
