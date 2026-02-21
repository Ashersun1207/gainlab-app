/**
 * VWAP (Volume Weighted Average Price) — 主图叠加
 */
export const VWAP_SCRIPT = `// @name = VWAP
// @position = main

var vwapData = F.vwap(dataList)

D.line(vwapData, { color: '#AB47BC', size: 1.5 })
`;
