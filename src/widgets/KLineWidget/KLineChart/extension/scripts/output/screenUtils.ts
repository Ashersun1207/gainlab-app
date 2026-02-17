/**
 * 屏幕坐标转换器
 * 用于屏幕相对绘图的坐标转换
 */

export class ScreenCoordinateConverter {
  private ctx: any
  private bounding: any
  private xAxis: any
  private yAxis: any
  private dataList: any[]

  constructor(ctx: any, bounding: any, xAxis: any, yAxis: any, dataList: any[]) {
    this.ctx = ctx
    this.bounding = bounding
    this.xAxis = xAxis
    this.yAxis = yAxis
    this.dataList = dataList
  }

  convertX(value: string | number): number {
    if (typeof value === 'number') {
      // 数值：直接作为像素坐标处理（X轴解析方法）
      // 支持负数从右边算
      if (value >= 0) return value
      return this.bounding.width + value // 负数从右边算
    }

    const str = String(value)
    
    // 相对位置
    if (str === 'left') return 0
    if (str === 'center') return this.bounding.width / 2
    if (str === 'right') return this.bounding.width
    
    // 绝对像素
    if (str.endsWith('px')) {
      const num = parseFloat(str.slice(0, -2))
      if (num >= 0) return num
      return this.bounding.width + num // 负数从右边算
    }
    
    // 百分比
    if (str.endsWith('%')) {
      const percent = parseFloat(str.slice(0, -1)) / 100
      return this.bounding.width * percent
    }
    
    // K线索引
    if (str.startsWith('index:')) {
      const indexStr = str.substring(6)
      if (indexStr === 'end') {
        // 直接用X坐标计算最后一根K线的位置
        const lastIndex = this.dataList.length - 1
        if (lastIndex >= 0) {
          return this.xAxis.convertToPixel(lastIndex)
        }
        return 0 // 没有数据时返回0
      }
      const index = parseInt(indexStr)
      if (!isNaN(index)) {
        const dataIndex = index < 0 ? this.dataList.length + index : index
        if (dataIndex >= 0 && dataIndex < this.dataList.length) {
          // 直接用X坐标计算索引位置
          return this.xAxis.convertToPixel(dataIndex)
        } else {
          // 超出范围时，返回最后一个K线的位置
          const lastIndex = this.dataList.length - 1
          if (lastIndex >= 0) {
            return this.xAxis.convertToPixel(lastIndex)
          }
        }
      }
    }
    
    // 默认返回0
    return 0
  }

  convertY(value: string | number): number {
    if (typeof value === 'number') {
      // 数值：通过yAxis转换为像素坐标（Y轴解析方法）
      return this.yAxis.convertToPixel(value)
    }

    const str = String(value)
    
    // 相对位置
    if (str === 'top') return 0
    if (str === 'center') return this.bounding.height / 2
    if (str === 'bottom') return this.bounding.height
    
    // 绝对像素
    if (str.endsWith('px')) {
      const num = parseFloat(str.slice(0, -2))
      if (num >= 0) return num
      return this.bounding.height + num // 负数从下边算
    }
    
    // 百分比
    if (str.endsWith('%')) {
      const percent = parseFloat(str.slice(0, -1)) / 100
      return this.bounding.height * percent
    }
    
    // K线数据属性（high, low, open, close等）
    if (['high', 'low', 'open', 'close', 'hl2', 'oc2', 'hlc3', 'ohl3', 'ohlc4'].includes(str)) {
      // 获取当前K线数据（假设是最后一个）
      const currentData = this.dataList[this.dataList.length - 1]
      if (currentData && typeof currentData[str] === 'number') {
        return this.yAxis.convertToPixel(currentData[str])
      }
    }
    
    // K线索引（Y轴也支持index格式）
    if (str.startsWith('index:')) {
      const indexStr = str.substring(6)
      if (indexStr === 'end') {
        // 返回最后一个K线的价格值对应的Y坐标
        const lastIndex = this.dataList.length - 1
        if (lastIndex >= 0) {
          const dataPoint = this.dataList[lastIndex]
          if (dataPoint && typeof dataPoint.close === 'number') {
            return this.yAxis.convertToPixel(dataPoint.close)
          }
        }
        return this.bounding.height
      }
      const index = parseInt(indexStr)
      if (!isNaN(index)) {
        const dataIndex = index < 0 ? this.dataList.length + index : index
        if (dataIndex >= 0 && dataIndex < this.dataList.length) {
          // 使用数据点的价格值
          const dataPoint = this.dataList[dataIndex]
          if (dataPoint && typeof dataPoint.close === 'number') {
            return this.yAxis.convertToPixel(dataPoint.close)
          }
        }
      }
    }
    
    // 默认返回0
    return 0
  }

  convertSize(value: string | number): number {
    if (typeof value === 'number') {
      return value
    }

    const str = String(value)
    
    // 绝对像素
    if (str.endsWith('px')) {
      return parseFloat(str.slice(0, -2))
    }
    
    // 百分比
    if (str.endsWith('%')) {
      const percent = parseFloat(str.slice(0, -1)) / 100
      return this.bounding.width * percent
    }
    
    // 默认返回数值
    return parseFloat(str) || 0
  }
} 