/**
 * MA (Moving Average) — 主图叠加
 * 5/10/20/60 四条均线
 */
export const MA_SCRIPT = `// @name = MA
// @position = main

var ma5 = F.ma(close, 5)
var ma10 = F.ma(close, 10)
var ma20 = F.ma(close, 20)
var ma60 = F.ma(close, 60)

D.line(ma5, { color: '#FF6D00', size: 1 })
D.line(ma10, { color: '#2196F3', size: 1 })
D.line(ma20, { color: '#E040FB', size: 1 })
D.line(ma60, { color: '#00E676', size: 1 })
`;
