/**
 * 脚本常量定义
 * 包含所有脚本中可以使用的常量对象
 */

/**
 * 数据源常量
 * 定义脚本中可以使用的数据源选项
 */
export const SOURCE = {
  open: "open",
  high: "high", 
  low: "low",
  close: "close",
  volume: "volume",
  hl2: "hl2",     // (high + low) / 2
  oc2: "oc2",     // (open + close) / 2
  hlc3: "hlc3",   // (high + low + close) / 3
  ohl3: "ohl3",   // (open + high + low) / 3
  ohlc4: "ohlc4"  // (open + high + low + close) / 4
} as const;

/**
 * 时间周期常量
 * 定义脚本中可以使用的时间周期
 */
export const TIMEFRAME = {
  "1m": "1m",       // 1分钟
  "5m": "5m",       // 5分钟
  "15m": "15m",     // 15分钟
  "30m": "30m",     // 30分钟
  "1h": "1h",       // 1小时
  "4h": "4h",       // 4小时
  "1d": "1d",       // 1天
  "1w": "1w",       // 1周
  "1M": "1M"        // 1月
} as const;

/**
 * 所有常量的集合
 * 方便统一导出和使用
 */
export const SCRIPT_CONSTANTS = {
  SOURCE,
  TIMEFRAME,
} as const;

/**
 * 常量类型定义
 * 为TypeScript提供类型支持
 */
export type SourceType = typeof SOURCE[keyof typeof SOURCE];
export type TimeframeType = typeof TIMEFRAME[keyof typeof TIMEFRAME]; 