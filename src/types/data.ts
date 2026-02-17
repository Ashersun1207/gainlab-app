export interface KLineData {
  timestamp: number // 毫秒！
  open: number
  high: number
  low: number
  close: number
  volume?: number
  turnover?: number
}

export interface HeatmapItem {
  name: string
  value: number
  change: number
}
