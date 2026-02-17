/**
 * 精度设置使用示例
 * 展示如何在加载历史数据后自动设置精度
 */

import type Chart from '../Chart'
import type { DataLoader, DataLoaderGetBarsParams } from '../common/DataLoader'
import { calculatePrecisions } from '../utils/precisionCalculator'

/**
 * 在历史数据加载完成后自动设置精度
 * @param chart K线图表实例
 * @param dataList 历史数据
 */
export function autoSetPrecisionAfterDataLoad(chart: Chart, dataList: any[]): void {
  if (!dataList || dataList.length === 0) {
    console.warn('数据为空，无法计算精度')
    return
  }

  try {
    // 计算精度
    const { pricePrecision, volumePrecision } = calculatePrecisions(dataList)
    
    console.log(`计算得出的精度: 价格=${pricePrecision}, 交易量=${volumePrecision}`)
    
    // 设置精度（不会触发 symbol 切换和数据重新加载）
    chart.setPriceVolumePrecision({ pricePrecision, volumePrecision })
    
    console.log('精度设置完成')
  } catch (error) {
    console.error('设置精度时出错:', error)
  }
}

/**
 * 手动设置精度的示例
 * @param chart K线图表实例
 * @param pricePrecision 价格精度
 * @param volumePrecision 交易量精度
 */
export function manualSetPrecision(chart: Chart, pricePrecision: number, volumePrecision: number): void {
  try {
    chart.setPriceVolumePrecision({ pricePrecision, volumePrecision })
    console.log(`手动设置精度完成: 价格=${pricePrecision}, 交易量=${volumePrecision}`)
  } catch (error) {
    console.error('手动设置精度时出错:', error)
  }
}

/**
 * 在数据加载器中使用精度设置的完整示例
 */
export function setupDataLoaderWithPrecision(chart: Chart): void {
  // 假设这是你的数据加载器
  const dataLoader: DataLoader = {
    getBars: async (params: DataLoaderGetBarsParams) => {
      const { symbol, period, callback } = params
      
      // 你的数据加载逻辑
      const data = await fetchKLineData(symbol.ticker, period, params.timestamp)
      
      // 数据加载完成后，自动设置精度
      if (data && data.length > 0) {
        // 延迟设置精度，确保数据已经完全加载
        setTimeout(() => {
          autoSetPrecisionAfterDataLoad(chart, data)
        }, 100)
      }
      
      // 调用回调函数返回数据
      callback(data)
    }
  }
  
  chart.setDataLoader(dataLoader)
}

// 模拟数据获取函数
async function fetchKLineData(ticker: string, period: any, timestamp: any): Promise<any[]> {
  // 这里应该是你的实际数据获取逻辑
  return []
} 