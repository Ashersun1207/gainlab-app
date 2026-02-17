/**
 * 精度计算工具
 * 用于分析历史K线数据，自动计算价格和交易量的精度
 */

import type { KLineData } from '../common/Data'

/**
 * 计算数字的小数位数
 * @param num 数字
 * @returns 小数位数
 */
function getDecimalPlaces(num: number): number {
  if (Math.floor(num) === num) return 0
  const str = num.toString()
  if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
    return str.split('.')[1].length
  } else if (str.indexOf('e-') !== -1) {
    const parts = str.split('e-')
    return parseInt(parts[1]) + (parts[0].split('.')[1]?.length || 0)
  }
  return 0
}

/**
 * 分析历史数据计算价格精度
 * @param dataList K线数据数组
 * @returns 价格精度（小数位数）
 */
export function calculatePricePrecision(dataList: KLineData[]): number {
  if (!dataList || dataList.length === 0) {
    return 2 // 默认精度
  }

  let maxDecimalPlaces = 0

  dataList.forEach(data => {
    // 分析所有价格字段
    const prices = [data.open, data.high, data.low, data.close]
    prices.forEach(price => {
      if (typeof price === 'number' && !isNaN(price)) {
        const decimalPlaces = getDecimalPlaces(price)
        maxDecimalPlaces = Math.max(maxDecimalPlaces, decimalPlaces)
      }
    })
  })

  return maxDecimalPlaces
}

/**
 * 分析历史数据计算交易量精度
 * @param dataList K线数据数组
 * @returns 交易量精度（小数位数）
 */
export function calculateVolumePrecision(dataList: KLineData[]): number {
  if (!dataList || dataList.length === 0) {
    return 0 // 默认精度
  }

  let maxDecimalPlaces = 0

  dataList.forEach(data => {
    // 分析交易量字段
    if (typeof data.volume === 'number' && !isNaN(data.volume)) {
      const decimalPlaces = getDecimalPlaces(data.volume)
      maxDecimalPlaces = Math.max(maxDecimalPlaces, decimalPlaces)
    }
  })

  return maxDecimalPlaces
}

/**
 * 分析历史数据计算价格和交易量精度
 * @param dataList K线数据数组
 * @returns 包含价格和交易量精度的对象
 */
export function calculatePrecisions(dataList: KLineData[]): {
  pricePrecision: number
  volumePrecision: number
} {
  return {
    pricePrecision: calculatePricePrecision(dataList),
    volumePrecision: calculateVolumePrecision(dataList)
  }
}

/**
 * 格式化数字到指定精度
 * @param num 数字
 * @param precision 精度
 * @returns 格式化后的数字
 */
export function formatToPrecision(num: number, precision: number): number {
  return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision)
} 