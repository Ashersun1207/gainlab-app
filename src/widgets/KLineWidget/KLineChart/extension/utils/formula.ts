/**
 * K线数据接口
 */
interface KLineData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
  turnover?: number
}

/**
 * 交叉信号接口
 */
interface CrossSignal {
  val1: number
  val2: number
  type?: 'up' | 'down'
}

/**
 * 穿越信号接口
 */
interface ThroughSignal {
  val1: number
  val2: number
}

/**
 * 高低值结果接口
 */
interface HighLowResult {
  index: number
  val: number | null
}

/**
 * KDJ指标结果接口
 */
interface KDJResult {
  k?: number
  d?: number
  j?: number
}

/**
 * BOLL指标结果接口
 */
interface BOLLResult {
  mid?: number
  ub?: number
  lb?: number
}

/**
 * MACD指标结果接口
 */
interface MACDResult {
  dif: number
  dea: number
  macd: number
}

/**
 * Normalized MACD结果接口
 */
interface NMACDResult {
  macNorm2: number
  trigger: number
  hist: number
  hist2: number
}

/**
 * DMI指标结果接口
 */
interface DMIResult {
  pdi?: number
  mdi?: number
  adx?: number
  adxr?: number
}

/**
 * BRAR指标结果接口
 */
interface BRARResult {
  ar?: number
  br?: number
}

/**
 * VO指标结果接口
 */
interface VOResult {
  up: number
  down: number
  val: number
}

/**
 * 周期信息接口
 */
interface PeriodInfo {
  count: number
  unit: 'year' | 'month' | 'day' | 'hour' | 'min'
}

/**
 * 精度信息接口
 */
interface PrecisionInfo {
  price: number
  amount: number
}

/**
 * 指标计算公式类
 */
class Formula {
  static getPrice(priceType: string, kLineData: KLineData): number {
    let val = 0
    switch (priceType) {
      case 'close':
        return kLineData.close
      case 'open':
        return kLineData.open
      case 'high':
        val = kLineData.high
        break
      case 'low':
        val = kLineData.low
        break
        case 'high_low_average':
          val = (kLineData.high + kLineData.low) / 2
          break
        case 'open_close_average':
        val = (kLineData.open + kLineData.close) / 2
        break
      case 'high_low_close_average':
        val = (kLineData.high + kLineData.low + kLineData.close) / 3
        break
      case 'open_high_low_average':
        val = (kLineData.high + kLineData.low + kLineData.open) / 3
        break
      case 'open_high_low_close_average':
        val = (kLineData.high + kLineData.low + kLineData.close + kLineData.open) / 4
        break
    }
    return val
  }
  /**
   * 获取数组某属性值列表
   */
  static attr<T extends Record<string, any>>(
    list: T[],
    attr?: string | null
  ): (any | null)[] {
    if (list.length === 0) return []

    if (typeof attr === 'string' && attr !== '') {
      return list.map(item => {
        if (!item) return null

        if (typeof item[attr] === 'undefined') {
          switch (attr) {
            case 'percentage':
              if (
                typeof item.close === 'number' &&
                !isNaN(item.close) &&
                typeof item.open === 'number' &&
                !isNaN(item.open) &&
                item.open !== 0
              ) {
                return parseFloat(
                  (((item.close - item.open) / item.open) * 100).toFixed(2)
                )
              }
              break
            case 'avg':
              if (
                typeof item.high === 'number' &&
                !isNaN(item.high) &&
                typeof item.low === 'number' &&
                !isNaN(item.low)
              ) {
                return (item.high + item.low) / 2 // 修正：应该是加法后除以2
              }
              break
          }
          return null
        }
        return item[attr]
      })
    }

    return list.map(item => item)
  }

  /**
   * 交叉检测
   */
  static cross(
    list1: any[] | number,
    list2: any[] | number,
    key: string | null = null
  ): (CrossSignal | null)[] {
    let arrA: any[] | null = null
    let arrB: any[] | null = null
    let n: number | null = null

    // 参数处理逻辑优化
    if (Array.isArray(list1)) {
      if (Array.isArray(list2)) {
        arrA = list1.length <= list2.length ? list1 : list2
        arrB = list1.length <= list2.length ? list2 : list1
      } else {
        const _n = Number(list2)
        if (!isNaN(_n)) {
          arrA = list1
          n = _n
        }
      }
    } else if (Array.isArray(list2)) {
      const _n = Number(list1)
      if (!isNaN(_n)) {
        arrA = list2
        n = _n
      }
    }

    if (!arrA) return []

    let prevA: number, prevB: number
    return arrA.map((item, index) => {
      if (n === null && arrB === null) return null

      const aVal = typeof key === 'string' && key !== '' ? item[key] : item
      let bVal: number

      if (n === null && arrB) {
        bVal = typeof key === 'string' && key !== '' ? arrB[index][key] : arrB[index]
      } else {
        bVal = n!
      }

      let result: CrossSignal | null = null
      if (index > 0) {
        if (!isNaN(prevA) && !isNaN(prevB) && !isNaN(aVal) && !isNaN(bVal)) {
          if (prevA > prevB && aVal <= bVal) {
            result = {
              val1: aVal,
              val2: bVal,
              type: 'down'
            }
          } else if (prevA < prevB && aVal >= bVal) {
            result = {
              val1: aVal,
              val2: bVal,
              type: 'up'
            }
          }
        }
      }

      prevA = aVal
      prevB = bVal
      return result
    })
  }

  /**
   * 上穿检测
   */
  static throughUp(
    list1: any[],
    list2: any[] | number,
    key: string | null = null
  ): (ThroughSignal | null)[] {
    let prevA: number, prevB: number

    return list1.map((item, index) => {
      const aVal = typeof key === 'string' && key !== '' ? item[key] : item
      let bVal: number

      if (Array.isArray(list2)) {
        bVal = typeof key === 'string' && key !== '' ? list2[index][key] : list2[index]
      } else {
        const n = Number(list2)
        bVal = !isNaN(n) ? n : 0
      }

      let result: ThroughSignal | null = null
      if (index > 0) {
        if (!isNaN(prevA) && !isNaN(prevB) && !isNaN(aVal) && !isNaN(bVal)) {
          if (prevA < prevB && aVal >= bVal) {
            result = {
              val1: aVal,
              val2: bVal
            }
          }
        }
      }

      prevA = aVal
      prevB = bVal
      return result
    })
  }

  /**
   * 下穿检测
   */
  static throughDown(
    list1: any[],
    list2: any[] | number,
    key: string | null = null
  ): (ThroughSignal | null)[] {
    let prevA: number, prevB: number

    return list1.map((item, index) => {
      const aVal = typeof key === 'string' && key !== '' ? item[key] : item
      let bVal: number

      if (Array.isArray(list2)) {
        bVal = typeof key === 'string' && key !== '' ? list2[index][key] : list2[index]
      } else {
        const n = Number(list2)
        bVal = !isNaN(n) ? n : 0
      }

      let result: ThroughSignal | null = null
      if (index > 0) {
        if (!isNaN(prevA) && !isNaN(prevB) && !isNaN(aVal) && !isNaN(bVal)) {
          if (prevA > prevB && aVal <= bVal) {
            result = {
              val1: aVal,
              val2: bVal
            }
          }
        }
      }

      prevA = aVal
      prevB = bVal
      return result
    })
  }

  /**
   * MA 移动平均线（优化版本）
   */
  static ma(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))
    const result: (number | null)[] = []
    let sum = 0

    return list.map((item, index) => {
      const val = typeof key === 'string' && key !== ''
        ? Number(item[key])
        : Number(item)

      if (isNaN(val)) {
        result.push(null)
        return null
      }

      if (index < period - 1) {
        sum += val
        result.push(null) // 不足周期返回null
        return null
      } else if (index === period - 1) {
        sum += val
        const ma = sum / period
        result.push(ma)
        return ma
      } else {
        const oldVal = typeof key === 'string' && key !== ''
          ? Number(list[index - period][key])
          : Number(list[index - period])

        if (!isNaN(oldVal)) {
          sum = sum - oldVal + val
        }
        const ma = sum / period
        result.push(ma)
        return ma
      }
    })
  }

  /**
   * EMA 指数移动平均线（修正版本）
   */
  static ema(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))
    const multiplier = 2 / (period + 1)
    let previousEma: number | null = null

    return list.map((item, index) => {
      const val = typeof key === 'string' && key !== ''
        ? Number(item[key])
        : Number(item)

      if (isNaN(val)) return null

      if (index < period - 1) {
        return null // 不足周期返回null
      }

      if (previousEma === null) {
        previousEma = val
        return val
      }

      const ema = val * multiplier + previousEma * (1 - multiplier)
      previousEma = ema
      return ema
    })
  }

  /**
   * WMA 加权移动平均线（修正版本）
   */
  static wma(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))

    return list.map((item, index) => {
      if (index < period - 1) return null // 不足周期返回null

      let sum = 0
      let weightSum = 0

      for (let i = 0; i < period; i++) {
        const dataIndex = index - period + 1 + i
        const val = typeof key === 'string' && key !== ''
          ? Number(list[dataIndex][key])
          : Number(list[dataIndex])

        if (!isNaN(val)) {
          const weight = i + 1
          sum += val * weight
          weightSum += weight
        }
      }

      return weightSum > 0 ? sum / weightSum : null
    })
  }

  /**
   * SMA 平滑移动平均线
   */
  static sma(
    list: any[],
    num: number,
    weight: number = 1,
    key: string | null = null
  ): (number | null)[] {
    const period = Number(num)
    const alpha = Number(weight) / period
    let previousSma = 0

    return list.map((item, index) => {
      const val = typeof key === 'string' && key !== ''
        ? Number(item[key])
        : Number(item)

      if (isNaN(val)) return null

      if (index < period - 1) {
        return null // 不足周期返回null
      }

      if (index === 0) {
        previousSma = val
        return val
      }

      const sma = alpha * val + (1 - alpha) * previousSma
      previousSma = sma
      return sma
    })
  }

  /**
   * STD 标准差（修正版本）
   */
  static std(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))
    const maList = Formula.ma(list, period, key)

    return list.map((item, index) => {
      if (index < period - 1 || maList[index] === null) return null

      let sum = 0
      let count = 0

      for (let i = index - period + 1; i <= index; i++) {
        const val = typeof key === 'string' && key !== ''
          ? Number(list[i][key])
          : Number(list[i])

        if (!isNaN(val)) {
          sum += Math.pow(val - maList[index]!, 2)
          count++
        }
      }

      return count > 0 ? Math.sqrt(sum / count) : null
    })
  }

  /**
   * SLOPE 线性回归斜率（修正版本）
   */
  static slope(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))

    return list.map((item, index) => {
      if (index < period - 1) return null // 不足周期返回null

      let sumX = 0
      let sumY = 0
      let sumXY = 0
      let sumXX = 0
      let count = 0

      for (let i = 0; i < period; i++) {
        const dataIndex = index - period + 1 + i
        const val = typeof key === 'string' && key !== ''
          ? Number(list[dataIndex][key])
          : Number(list[dataIndex])

        if (!isNaN(val)) {
          sumX += i
          sumY += val
          sumXY += i * val
          sumXX += i * i
          count++
        }
      }

      if (count < 2) return null

      const denominator = count * sumXX - sumX * sumX
      return denominator !== 0 ? (count * sumXY - sumX * sumY) / denominator : null
    })
  }

  /**
   * HHV 最高值（修正版本）
   */
  static hhv(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))

    return list.map((item, index) => {
      if (index < period - 1) return null // 不足周期返回null

      let highest: number | null = null

      for (let i = index - period + 1; i <= index; i++) {
        const val = typeof key === 'string' && key !== ''
          ? Number(list[i][key])
          : Number(list[i])

        if (!isNaN(val)) {
          highest = highest === null ? val : Math.max(highest, val)
        }
      }

      return highest
    })
  }

  /**
   * LLV 最低值（修正版本）
   */
  static llv(list: any[], num: number, key: string | null = null): (number | null)[] {
    const period = Math.max(1, parseInt(String(num)))

    return list.map((item, index) => {
      if (index < period - 1) return null // 不足周期返回null

      let lowest: number | null = null

      for (let i = index - period + 1; i <= index; i++) {
        const val = typeof key === 'string' && key !== ''
          ? Number(list[i][key])
          : Number(list[i])

        if (!isNaN(val)) {
          lowest = lowest === null ? val : Math.min(lowest, val)
        }
      }

      return lowest
    })
  }

  /**
   * KDJ指标（修正版本）
   */
  static kdj(
    list: KLineData[],
    num1: number = 9,
    num2: number = 3,
    num3: number = 3,
    key: keyof KLineData = 'close'
  ): KDJResult[] {
    const result: KDJResult[] = []

    return list.map((item, i) => {
      const kdj: KDJResult = {}

      if (i >= num1 - 1) {
        const slice = list.slice(i - (num1 - 1), i + 1)
        const ln = Formula.low(slice, 'low')
        const hn = Formula.high(slice, 'high')

        if (ln.val !== null && hn.val !== null) {
          const close = item[key] as number
          const hnSubLn = hn.val - ln.val
          const rsv = hnSubLn === 0 ? 0 : ((close - ln.val) / hnSubLn) * 100

          const prevK = result[i - 1]?.k || 50
          const prevD = result[i - 1]?.d || 50

          kdj.k = ((num2 - 1) * prevK + rsv) / num2
          kdj.d = ((num3 - 1) * prevD + kdj.k) / num3
          kdj.j = 3.0 * kdj.k - 2.0 * kdj.d
        }
      }

      result.push(kdj)
      return kdj
    })
  }

  /**
   * BOLL布林带指标（修正版本）
   */
  static boll(
    list: any[],
    num1: number = 20,
    num2: number = 2,
    key: string = 'close'
  ): BOLLResult[] {
    const period = num1
    let sum = 0

    return list.map((item, i) => {
      const val = typeof key === 'string' && key !== '' ? item[key] : item
      const boll: BOLLResult = {}

      if (i < period - 1) {
        sum += val
        return boll
      }

      if (i === period - 1) {
        sum += val
      } else {
        const oldVal = typeof key === 'string' && key !== ''
          ? list[i - period][key]
          : list[i - period]
        sum = sum - oldVal + val
      }

      boll.mid = sum / period

      // 计算标准差
      let variance = 0
      for (let j = i - period + 1; j <= i; j++) {
        const dataVal = typeof key === 'string' && key !== '' ? list[j][key] : list[j]
        variance += Math.pow(dataVal - boll.mid, 2)
      }

      const std = Math.sqrt(variance / period)
      boll.ub = boll.mid + num2 * std
      boll.lb = boll.mid - num2 * std

      return boll
    })
  }

  /**
   * ROC 变动率指标
   */
  static roc(list: KLineData[], num: number = 12): number[] {
    const period = Math.max(1, parseInt(String(num)))

    return list.map((item, i) => {
      if (i < period) return 0

      const currentVal = item.close
      const pastVal = list[i - period].close

      return pastVal !== 0 ? ((currentVal - pastVal) / pastVal) * 100 : 0
    })
  }

  /**
   * CCI 顺势指标（修正版本）
   */
  static cci(list: KLineData[], num: number = 20): (number | null)[] {
    const period = num
    let tpSum = 0

    return list.map((kLineData, i) => {
      const tp = (kLineData.high + kLineData.low + kLineData.close) / 3

      if (i < period - 1) {
        tpSum += tp
        return null
      }

      if (i === period - 1) {
        tpSum += tp
      } else {
        const oldTp = (list[i - period].high + list[i - period].low + list[i - period].close) / 3
        tpSum = tpSum - oldTp + tp
      }

      const ma = tpSum / period

      // 计算平均绝对偏差
      let sum = 0
      for (let j = i - period + 1; j <= i; j++) {
        const dataTP = (list[j].high + list[j].low + list[j].close) / 3
        sum += Math.abs(dataTP - ma)
      }

      const md = sum / period
      return md !== 0 ? (tp - ma) / md / 0.015 : 0
    })
  }

  /**
   * MACD指标（修正版本）
   */
  static macd(
    list: KLineData[],
    num1: number = 12,
    num2: number = 26,
    num3: number = 9
  ): MACDResult[] {
    const emaFast = Formula.ema(list, num1, 'close')
    const emaSlow = Formula.ema(list, num2, 'close')

    let previousDEA = 0
    const deaMultiplier = 2 / (num3 + 1)

    return list.map((kLineData, i) => {
      const fast = emaFast[i]
      const slow = emaSlow[i]

      if (fast === null || slow === null) {
        return { dif: 0, dea: 0, macd: 0 }
      }

      const dif = fast - slow

      if (i === 0) {
        previousDEA = dif
      } else {
        previousDEA = dif * deaMultiplier + previousDEA * (1 - deaMultiplier)
      }

      const macd = (dif - previousDEA) * 2

      return {
        dif,
        dea: previousDEA,
        macd
      }
    })
  }

  /**
   * 找到最高值
   */
  static high(list: any[], key: string | null = null): HighLowResult {
    const result: HighLowResult = {
      index: -1,
      val: null
    }

    list.forEach((item, index) => {
      const val = typeof key === 'string' && key !== '' ? item[key] : item

      if (typeof val === 'number' && !isNaN(val)) {
        if (result.val === null || val > result.val) {
          result.val = val
          result.index = index
        }
      }
    })

    return result
  }

  /**
   * 找到最低值
   */
  static low(list: any[], key: string | null = null): HighLowResult {
    const result: HighLowResult = {
      index: -1,
      val: null
    }

    list.forEach((item, index) => {
      const val = typeof key === 'string' && key !== '' ? item[key] : item

      if (typeof val === 'number' && !isNaN(val)) {
        if (result.val === null || val < result.val) {
          result.val = val
          result.index = index
        }
      }
    })

    return result
  }

  /**
   * 返回列表平均值
   */
  static avg(list: any[], key: string | null = null, precision: number = 4): number {
    let sum = 0
    let count = 0

    list.forEach(item => {
      const val = typeof key === 'string' && key !== '' ? item[key] : item
      if (typeof val === 'number' && !isNaN(val)) {
        sum += val
        count++
      }
    })

    return count > 0 ? Number((sum / count).toFixed(precision)) : 0
  }

  /**
   * 科学计数法转数字（优化版本）
   */
  static toNumber(val: any): number {
    const str = String(val)
    const scientificRegex = /^-?(\d)\.?(\d*)e-(\d+)$/i

    if (!scientificRegex.test(str)) return Number(val)

    const matches = str.match(scientificRegex)
    if (!matches) return Number(val)

    const [, intPart, fracPart = '', expPart] = matches
    const digits = intPart + fracPart
    const exp = parseInt(expPart)
    const isNegative = str.startsWith('-')

    const result = '0.' + '0'.repeat(exp - 1) + digits
    return parseFloat((isNegative ? '-' : '') + result)
  }

  /**
   * 模运算
   */
  static mod(a: number, b: number): number {
    return a % b
  }
  /**  
 * SAR 抛物线转向指标  
 */
  static sar(list: KLineData[], num1: number = 2, num2: number = 20): number[] {
    const startAf = num1 / 100 // 加速因子  
    const maxAf = num2 / 100   // 极限价格  
    let af = startAf           // 当前加速因子  
    let ep = -100              // 极值点  
    let isIncreasing = false   // 趋势方向  
    let sar = 0

    return list.map((item, i) => {
      const preSar = sar
      const high = item.high
      const low = item.low

      if (isIncreasing) {
        // 上涨趋势  
        if (ep === -100 || ep < high) {
          ep = high
          af = Math.min(af + startAf, maxAf)
        }

        sar = preSar + af * (ep - preSar)
        const lowMin = Math.min(list[Math.max(1, i) - 1].low, low)

        if (sar > item.low) {
          sar = ep
          af = startAf
          ep = -100
          isIncreasing = false
        } else if (sar > lowMin) {
          sar = lowMin
        }
      } else {
        // 下跌趋势  
        if (ep === -100 || ep > low) {
          ep = low
          af = Math.min(af + startAf, maxAf)
        }

        sar = preSar + af * (ep - preSar)
        const highMax = Math.max(list[Math.max(1, i) - 1].high, high)

        if (sar < item.high) {
          sar = ep
          af = startAf
          ep = -100
          isIncreasing = true
        } else if (sar < highMax) {
          sar = highMax
        }
      }

      return sar
    })
  }

  /**  
   * DMI 动向指数（修正版本）  
   */
  static dmi(
    list: KLineData[],
    num1: number = 14,
    num2: number = 6
  ): DMIResult[] {
    let trSum = 0
    let hSum = 0
    let lSum = 0
    let mtr = 0
    let dmp = 0
    let dmm = 0
    let adx = 0
    const adxArr: number[] = []
    let adxr = 0

    return list.map((kLineData, index) => {
      const dmi: DMIResult = {}
      const preKLineData = list[index - 1] || kLineData
      const preClose = preKLineData.close
      const high = kLineData.high
      const low = kLineData.low

      const hl = high - low
      const hcy = Math.abs(high - preClose)
      const lcy = Math.abs(preClose - low)
      const hhy = high - preKLineData.high
      const lyl = preKLineData.low - low

      const tr = Math.max(Math.max(hl, hcy), lcy)
      const h = hhy > 0 && hhy > lyl ? hhy : 0
      const l = lyl > 0 && lyl > hhy ? lyl : 0

      trSum += tr
      hSum += h
      lSum += l

      if (index >= num1 - 1) {
        if (index > num1 - 1) {
          mtr = mtr - mtr / num1 + tr
          dmp = dmp - dmp / num1 + h
          dmm = dmm - dmm / num1 + l
        } else {
          mtr = trSum
          dmp = hSum
          dmm = lSum
        }

        let pdi = 0
        let mdi = 0
        if (mtr !== 0) {
          pdi = (dmp * 100) / mtr
          mdi = (dmm * 100) / mtr
        }

        dmi.pdi = pdi
        dmi.mdi = mdi

        let dx = 0
        if (mdi + pdi !== 0) {
          dx = (Math.abs(mdi - pdi) / (mdi + pdi)) * 100
        }

        if (index === num1 - 1) {
          adx = dx
        } else {
          adx = (dx + adx * (num2 - 1)) / num2
        }

        adxArr.push(adx)

        if (index >= num1 + num2 - 2) {
          dmi.adx = adx
        }

        if (index >= num1 + num2 * 2 - 3) {
          if (index === num1 + num2 * 2 - 3) {
            adxr = adx
          } else {
            adxr = (adx + adxr * (num2 - 1)) / num2
          }
          dmi.adxr = adxr
        }
      }

      return dmi
    })
  }

  /**  
   * DMA 平行线差指标  
   */
  static dma(list: KLineData[], num1: number = 10, num2: number = 50): (number | null)[] {
    const maxParam = Math.max(num1, num2)
    let closeSum1 = 0
    let closeSum2 = 0

    return list.map((kLineData, i) => {
      const close = kLineData.close
      closeSum1 += close
      closeSum2 += close

      let ma1: number | null = null
      let ma2: number | null = null

      if (i >= num1 - 1) {
        ma1 = closeSum1 / num1
        closeSum1 -= list[i - (num1 - 1)].close
      }

      if (i >= num2 - 1) {
        ma2 = closeSum2 / num2
        closeSum2 -= list[i - (num2 - 1)].close
      }

      if (i >= maxParam - 1 && ma1 !== null && ma2 !== null) {
        return ma1 - ma2
      }

      return null
    })
  }

  /**  
   * TRIX 三重指数平滑移动平均指标  
   */
  static trix(list: KLineData[], num1: number = 12): (number | null)[] {
    let emaClose1: number
    let emaClose2: number
    let emaClose3: number
    let oldEmaClose1: number
    let oldEmaClose2: number
    let oldEmaClose3: number

    return list.map((kLineData, i) => {
      const close = kLineData.close

      if (i === 0) {
        emaClose1 = close
        emaClose2 = close
        emaClose3 = close
      } else {
        emaClose1 = (2 * close + (num1 - 1) * oldEmaClose1) / (num1 + 1)
        emaClose2 = (2 * emaClose1 + (num1 - 1) * oldEmaClose2) / (num1 + 1)
        emaClose3 = (2 * emaClose2 + (num1 - 1) * oldEmaClose3) / (num1 + 1)
      }

      oldEmaClose1 = emaClose1
      oldEmaClose2 = emaClose2
      oldEmaClose3 = emaClose3

      if (i === 0) return null

      return oldEmaClose3 === 0 ? 0 : ((emaClose3 - oldEmaClose3) / oldEmaClose3) * 100
    })
  }

  /**  
   * BRAR 人气意愿指标  
   */
  static brar(list: KLineData[], num1: number = 26): BRARResult[] {
    let hcy = 0
    let cyl = 0
    let ho = 0
    let ol = 0

    return list.map((kLineData, i) => {
      const brar: BRARResult = {}

      if (i > 0) {
        const high = kLineData.high
        const low = kLineData.low
        const open = kLineData.open
        const preClose = list[i - 1].close

        ho += high - open
        ol += open - low
        hcy += high - preClose
        cyl += preClose - low

        if (i >= num1 - 1) {
          brar.ar = ol !== 0 ? (ho / ol) * 100 : 0
          brar.br = cyl !== 0 ? (hcy / cyl) * 100 : 0

          const agoHigh = list[i - (num1 - 1)].high
          const agoLow = list[i - (num1 - 1)].low
          const agoOpen = list[i - (num1 - 1)].open
          const agoPreClose = list[i - num1].close

          hcy -= agoHigh - agoPreClose
          cyl -= agoPreClose - agoLow
          ho -= agoHigh - agoOpen
          ol -= agoOpen - agoLow
        }
      }

      return brar
    })
  }

  /**  
   * VR 成交量变异率指标  
   */
  static vr(list: KLineData[], num1: number = 26): (number | null)[] {
    let avs = 0
    let bvs = 0
    let cvs = 0

    return list.map((kLineData, i) => {
      const close = kLineData.close
      const open = i === 0 ? kLineData.open : list[i - 1].close
      const volume = kLineData.volume ?? 0

      if (close > open) {
        avs += volume
      } else if (close < open) {
        bvs += volume
      } else {
        cvs += volume
      }

      if (i >= num1 - 1) {
        const halfcvs = cvs / 2
        const vr = (bvs + halfcvs === 0) ? 0 : ((avs + halfcvs) / (bvs + halfcvs)) * 100

        const agoIndex = i - (num1 - 1)
        const agoData = list[agoIndex]
        const agoOpen = agoIndex === 0 ? agoData.open : list[agoIndex - 1].close
        const agoClose = agoData.close
        const agoVolume = agoData.volume ?? 0

        if (agoClose > agoOpen) {
          avs -= agoVolume
        } else if (agoClose < agoOpen) {
          bvs -= agoVolume
        } else {
          cvs -= agoVolume
        }

        return vr
      }

      return null
    })
  }

  /**  
   * OBV 能量潮指标  
   */
  static obv(list: KLineData[]): (number | null)[] {
    const obvArr: number[] = []

    return list.map((kLineData, i) => {
      const close = kLineData.close
      const volume = kLineData.volume ?? 0
      let obv: number | null = null

      if (i === 0) {
        obv = null
      } else if (i === 1) {
        obv = volume
      } else {
        const prevClose = list[i - 1].close
        const diff = close - prevClose

        if (diff > 0) {
          obv = (volume ?? 0) + obvArr[obvArr.length - 1]
        } else if (diff < 0) {
          obv = -(volume ?? 0) + obvArr[obvArr.length - 1]
        } else {
          obv = obvArr[obvArr.length - 1]
        }
      }

      obvArr.push(obv || 0)
      return obv
    })
  }

  /**  
   * EMV 简易波动指标  
   */
  static emv(list: KLineData[], num1: number = 14): (number | null)[] {
    let emSum = 0
    const emList: number[] = []

    return list.map((item, index) => {
      if (index === 0) return null

      const pre = list[index - 1]
      const vol = item.turnover ?? 0
      const a = (item.high + item.low) / 2
      const b = (pre.high + pre.low) / 2
      const c = item.high - item.low

      let em = 0
      if (vol !== 0) {
        em = ((a - b) * c) / vol
      }

      em = Formula.toNumber(em)
      emList.push(em)
      emSum += em

      if (index >= num1 - 1) {
        const emv = emSum
        emSum -= emList[index - (num1 - 1)]
        return emv
      }

      return null
    })
  }

  /**  
   * RSI 相对强弱指标  
   */
  static rsi(list: KLineData[], num1: number = 6): (number | null)[] {
    let lc: number
    let o = { a: 0, b: 0 }

    return list.map((item, index) => {
      if (index === 0) {
        lc = item.open
        return null
      }

      const a = Math.max(item.close - lc, 0)
      const b = Math.abs(item.close - lc)

      o.a = (a + (num1 - 1) * o.a) / num1
      o.b = (b + (num1 - 1) * o.b) / num1

      lc = item.close

      if (index >= num1 - 1) {
        return o.b !== 0 ? (o.a / o.b) * 100 : 0
      }

      return null
    })
  }



  /**  
   * WR 威廉指标  
   */
  static wr(list: KLineData[], num1: number = 10): (number | null)[] {
    return list.map((item, i) => {
      if (i < num1 - 1) return null

      const slice = list.slice(i - (num1 - 1), i + 1)
      const high = Formula.high(slice, 'high')
      const low = Formula.low(slice, 'low')

      if (high.val === null || low.val === null) return null

      const hnSubLn = high.val - low.val
      return hnSubLn === 0 ? 0 : ((high.val - item.close) / hnSubLn) * -100
    })
  }

  /**  
   * MTM 动量指标  
   */
  static mtm(list: any[], num1: number = 12, key: string = 'close'): (number | null)[] {
    return list.map((item, i) => {
      if (i < num1) return null

      const currentVal = typeof key === 'string' && key !== '' ? item[key] : item
      const pastVal = typeof key === 'string' && key !== '' ? list[i - num1][key] : list[i - num1]

      return currentVal - pastVal
    })
  }
  /**  
* PSY 心理线指标  
*/
  static psy(list: KLineData[], num1: number = 12): (number | null)[] {
    return list.map((item, i) => {
      if (i < num1 - 1) return null

      let count = 0
      for (let j = i - num1 + 1; j <= i; j++) {
        const current = list[j]
        const prev = j > 0 ? list[j - 1] : current
        if (current.close > prev.close) {
          count++
        }
      }

      return (count / num1) * 100
    })
  }

  /**  
   * VO 量价指标  
   */
  static vo(list: KLineData[], num1: number = 5, num2: number = 10): VOResult[] {
    return list.map((item, i) => {
      const vo: VOResult = { up: 0, down: 0, val: 0 }

      if (i === 0) return vo

      const prev = list[i - 1]
      const volume = item.volume ?? 0

      if (item.close > prev.close) {
        vo.up = volume
        vo.down = 0
      } else if (item.close < prev.close) {
        vo.up = 0
        vo.down = volume
      } else {
        vo.up = volume / 2
        vo.down = volume / 2
      }

      if (i >= Math.max(num1, num2) - 1) {
        let upSum1 = 0, downSum1 = 0
        let upSum2 = 0, downSum2 = 0

        // 计算短期均值  
        for (let j = i - num1 + 1; j <= i; j++) {
          const data = list[j]
          const prevData = j > 0 ? list[j - 1] : data
          const vol = data.volume ?? 0

          if (data.close > prevData.close) {
            upSum1 += vol
          } else if (data.close < prevData.close) {
            downSum1 += vol
          } else {
            upSum1 += vol / 2
            downSum1 += vol / 2
          }
        }

        // 计算长期均值  
        for (let j = i - num2 + 1; j <= i; j++) {
          const data = list[j]
          const prevData = j > 0 ? list[j - 1] : data
          const vol = data.volume ?? 0

          if (data.close > prevData.close) {
            upSum2 += vol
          } else if (data.close < prevData.close) {
            downSum2 += vol
          } else {
            upSum2 += vol / 2
            downSum2 += vol / 2
          }
        }

        const shortPct = upSum1 + downSum1 !== 0 ? (upSum1 / (upSum1 + downSum1)) * 100 : 50
        const longPct = upSum2 + downSum2 !== 0 ? (upSum2 / (upSum2 + downSum2)) * 100 : 50

        vo.val = shortPct - longPct
      }

      return vo
    })
  }

  /**  
   * Normalized MACD 标准化MACD  
   */
  static nmacd(
    list: KLineData[],
    num1: number = 12,
    num2: number = 26,
    num3: number = 9,
    num4: number = 30
  ): NMACDResult[] {
    const macdData = Formula.macd(list, num1, num2, num3)

    return list.map((item, i) => {
      const nmacd: NMACDResult = {
        macNorm2: 0,
        trigger: 0,
        hist: 0,
        hist2: 0
      }

      if (i < num4 - 1) return nmacd

      // 计算MACD的标准化  
      const slice = macdData.slice(i - num4 + 1, i + 1)
      const macdValues = slice.map(d => d.macd)
      const maxMacd = Math.max(...macdValues)
      const minMacd = Math.min(...macdValues)

      if (maxMacd !== minMacd) {
        nmacd.macNorm2 = ((macdData[i].macd - minMacd) / (maxMacd - minMacd)) * 2 - 1
      }

      // 计算触发线  
      if (i > 0) {
        const prevNorm = i >= num4 ?
          ((macdData[i - 1].macd - minMacd) / (maxMacd - minMacd)) * 2 - 1 : 0
        nmacd.trigger = (nmacd.macNorm2 + prevNorm) / 2
      }

      nmacd.hist = nmacd.macNorm2 - nmacd.trigger
      nmacd.hist2 = nmacd.hist * 2

      return nmacd
    })
  }

  /**  
   * BIAS 乖离率指标  
   */
  static bias(list: any[], num1: number = 6, key: string = 'close'): (number | null)[] {
    const maData = Formula.ma(list, num1, key)

    return list.map((item, i) => {
      if (i < num1 - 1 || maData[i] === null) return null

      const currentVal = typeof key === 'string' && key !== '' ? item[key] : item
      const ma = maData[i]!

      return ma !== 0 ? ((currentVal - ma) / ma) * 100 : 0
    })
  }

  /**  
   * ASI 振动升降指标  
   */
  static asi(list: KLineData[], num1: number = 6): (number | null)[] {
    let asiSum = 0

    return list.map((item, i) => {
      if (i === 0) return null

      const prev = list[i - 1]
      const high = item.high
      const low = item.low
      const close = item.close
      const open = item.open
      const prevHigh = prev.high
      const prevLow = prev.low
      const prevClose = prev.close

      const a = Math.abs(high - prevClose)
      const b = Math.abs(low - prevClose)
      const c = Math.abs(high - prevLow)
      const d = Math.abs(prevClose - prevLow)

      let r = 0
      if (a > b && a > c) {
        r = a + b / 2 + d / 4
      } else if (b > c && b > a) {
        r = b + a / 2 + d / 4
      } else if (c > a && c > b) {
        r = c + d / 4
      }

      const x = close - prevClose
      const y = close - open
      const z = prevClose - prevClose

      let si = 0
      if (r !== 0) {
        si = 16 * (x + y / 2 + z) / r * Math.max(a, b)
      }

      asiSum += si

      if (i >= num1 - 1) {
        return asiSum
      }

      return null
    })
  }

  /**  
   * PeriodInfo 获取周期信息  
   */
  static getPeriodInfo(period: string): PeriodInfo {
    const periodMap: { [key: string]: PeriodInfo } = {
      '1m': { count: 1, unit: 'min' },
      '3m': { count: 3, unit: 'min' },
      '5m': { count: 5, unit: 'min' },
      '15m': { count: 15, unit: 'min' },
      '30m': { count: 30, unit: 'min' },
      '1h': { count: 1, unit: 'hour' },
      '2h': { count: 2, unit: 'hour' },
      '4h': { count: 4, unit: 'hour' },
      '6h': { count: 6, unit: 'hour' },
      '8h': { count: 8, unit: 'hour' },
      '12h': { count: 12, unit: 'hour' },
      '1d': { count: 1, unit: 'day' },
      '3d': { count: 3, unit: 'day' },
      '1w': { count: 7, unit: 'day' },
      '1M': { count: 1, unit: 'month' }
    }

    return periodMap[period] || { count: 1, unit: 'day' }
  }

  /**  
   * 获取精度信息  
   */
  static getPrecisionInfo(symbol: string): PrecisionInfo {
    // 这里可以根据实际需求返回不同交易对的精度信息  
    const defaultPrecision: PrecisionInfo = {
      price: 2,
      amount: 4
    }

    // 示例：不同交易对的精度配置  
    const precisionMap: { [key: string]: PrecisionInfo } = {
      'BTCUSDT': { price: 2, amount: 6 },
      'ETHUSDT': { price: 2, amount: 5 },
      'BNBUSDT': { price: 2, amount: 4 }
    }

    return precisionMap[symbol] || defaultPrecision
  }

  /**  
   * 格式化数字  
   */
  static formatNumber(
    num: number,
    precision: number = 2,
    useThousandSeparator: boolean = false
  ): string {
    if (isNaN(num)) return '0'

    const fixed = num.toFixed(precision)

    if (!useThousandSeparator) return fixed

    const parts = fixed.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return parts.join('.')
  }

  /**  
   * 计算涨跌幅  
   */
  static calcPercentage(current: number, previous: number): number {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  /**  
   * 获取K线形态（简化版本）  
   */
  static getCandlePattern(item: KLineData): string {
    const { open, high, low, close } = item
    const body = Math.abs(close - open)
    const upperShadow = high - Math.max(open, close)
    const lowerShadow = Math.min(open, close) - low
    const totalRange = high - low

    if (totalRange === 0) return 'doji'

    const bodyRatio = body / totalRange
    const upperRatio = upperShadow / totalRange
    const lowerRatio = lowerShadow / totalRange

    // 十字星  
    if (bodyRatio < 0.1) {
      if (upperRatio > 0.4 && lowerRatio < 0.1) return 'dragonfly-doji'
      if (lowerRatio > 0.4 && upperRatio < 0.1) return 'gravestone-doji'
      return 'doji'
    }

    // 锤子线  
    if (lowerRatio > 0.5 && upperRatio < 0.1 && bodyRatio < 0.3) {
      return close > open ? 'hammer' : 'hanging-man'
    }

    // 倒锤子线  
    if (upperRatio > 0.5 && lowerRatio < 0.1 && bodyRatio < 0.3) {
      return close > open ? 'inverted-hammer' : 'shooting-star'
    }

    // 长阳/长阴  
    if (bodyRatio > 0.7) {
      return close > open ? 'long-white' : 'long-black'
    }

    // 普通阳/阴线  
    return close > open ? 'white' : 'black'
  }

  /**  
   * 批量计算多个指标  
   */
  static calcMultipleIndicators(
    list: KLineData[],
    indicators: { name: string; params: number[] }[]
  ): { [key: string]: any[] } {
    const results: { [key: string]: any[] } = {}

    indicators.forEach(({ name, params }) => {
      switch (name.toLowerCase()) {
        case 'ma':
          results[`ma${params[0]}`] = Formula.ma(list, params[0], 'close')
          break
        case 'ema':
          results[`ema${params[0]}`] = Formula.ema(list, params[0], 'close')
          break
        case 'kdj':
          results.kdj = Formula.kdj(list, params[0], params[1], params[2])
          break
        case 'macd':
          results.macd = Formula.macd(list, params[0], params[1], params[2])
          break
        case 'boll':
          results.boll = Formula.boll(list, params[0], params[1], 'close')
          break
        case 'rsi':
          results[`rsi${params[0]}`] = Formula.rsi(list, params[0])
          break
        // 可以继续添加其他指标  
        default:
          console.warn(`Unknown indicator: ${name}`)
      }
    })

    return results
  }

  /**  
   * 数据验证  
   */
  static validateKLineData(data: any[]): KLineData[] {
    return data.filter(item => {
      return (
        typeof item === 'object' &&
        typeof item.timestamp === 'number' &&
        typeof item.open === 'number' &&
        typeof item.high === 'number' &&
        typeof item.low === 'number' &&
        typeof item.close === 'number' &&
        typeof item.volume === 'number' &&
        !isNaN(item.open) &&
        !isNaN(item.high) &&
        !isNaN(item.low) &&
        !isNaN(item.close) &&
        !isNaN(item.volume) &&
        item.high >= item.low &&
        item.high >= Math.max(item.open, item.close) &&
        item.low <= Math.min(item.open, item.close)
      )
    })
  }

  /**  
   * 计算支撑阻力位（简化版本）  
   */
  static calcSupportResistance(
    list: KLineData[],
    lookback: number = 20
  ): { support: number[], resistance: number[] } {
    const result = { support: [] as number[], resistance: [] as number[] }

    if (list.length < lookback * 2) return result

    for (let i = lookback; i < list.length - lookback; i++) {
      const current = list[i]
      let isSupport = true
      let isResistance = true

      // 检查是否为局部低点（支撑位）  
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && list[j].low < current.low) {
          isSupport = false
          break
        }
      }

      // 检查是否为局部高点（阻力位）  
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && list[j].high > current.high) {
          isResistance = false
          break
        }
      }

      if (isSupport) {
        result.support.push(current.low)
      }
      if (isResistance) {
        result.resistance.push(current.high)
      }
    }

    // 去重并排序
    result.support = [...new Set(result.support)].sort((a, b) => b - a)
    result.resistance = [...new Set(result.resistance)].sort((a, b) => a - b)

    return result
  }

  /**
   * 计算波动率
   */
  static calcVolatility(list: KLineData[], period: number = 20): (number | null)[] {
    return list.map((item, i) => {
      if (i < period) return null

      const returns: number[] = []
      for (let j = i - period + 1; j <= i; j++) {
        const current = list[j].close
        const previous = list[j - 1]?.close || current
        if (previous !== 0) {
          returns.push(Math.log(current / previous))
        }
      }

      if (returns.length === 0) return null

      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length
      const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length

      return Math.sqrt(variance * 252) * 100 // 年化波动率百分比
    })
  }

  /**
   * 计算真实波动幅度均值 (ATR)
   */
  static atr(list: KLineData[], period: number = 14): (number | null)[] {
    let atrSum = 0
    let atr = 0

    return list.map((item, i) => {
      if (i === 0) return null

      const previous = list[i - 1]
      const tr = Math.max(
        item.high - item.low,
        Math.abs(item.high - previous.close),
        Math.abs(item.low - previous.close)
      )

      if (i < period) {
        atrSum += tr
        if (i === period - 1) {
          atr = atrSum / period
          return atr
        }
        return null
      } else {
        atr = (atr * (period - 1) + tr) / period
        return atr
      }
    })
  }

  /**
   * 计算商品通道指数 (CCI) - 完整版本
   */
  static cciComplete(list: KLineData[], period: number = 20): (number | null)[] {
    return Formula.cci(list, period)
  }

  /**
   * 计算随机指标 (Stochastic) - 完整版本
   */
  static stochastic(
    list: KLineData[],
    kPeriod: number = 14,
    dPeriod: number = 3
  ): { k: (number | null)[], d: (number | null)[] } {
    const kValues: (number | null)[] = []
    const dValues: (number | null)[] = []

    // 计算 %K
    list.forEach((item, i) => {
      if (i < kPeriod - 1) {
        kValues.push(null)
        return
      }

      const slice = list.slice(i - kPeriod + 1, i + 1)
      const highest = Math.max(...slice.map(d => d.high))
      const lowest = Math.min(...slice.map(d => d.low))

      const k = lowest === highest ? 0 : ((item.close - lowest) / (highest - lowest)) * 100
      kValues.push(k)
    })

    // 计算 %D (K的移动平均)
    kValues.forEach((k, i) => {
      if (k === null || i < dPeriod - 1) {
        dValues.push(null)
        return
      }

      let sum = 0
      let count = 0
      for (let j = i - dPeriod + 1; j <= i; j++) {
        if (kValues[j] !== null) {
          sum += kValues[j]!
          count++
        }
      }

      dValues.push(count > 0 ? sum / count : null)
    })

    return { k: kValues, d: dValues }
  }

  /**
   * 价格通道 (Donchian Channel)
   */
  static donchianChannel(
    list: KLineData[],
    period: number = 20
  ): { upper: (number | null)[], lower: (number | null)[], middle: (number | null)[] } {
    const upper: (number | null)[] = []
    const lower: (number | null)[] = []
    const middle: (number | null)[] = []

    list.forEach((item, i) => {
      if (i < period - 1) {
        upper.push(null)
        lower.push(null)
        middle.push(null)
        return
      }

      const slice = list.slice(i - period + 1, i + 1)
      const high = Math.max(...slice.map(d => d.high))
      const low = Math.min(...slice.map(d => d.low))
      const mid = (high + low) / 2

      upper.push(high)
      lower.push(low)
      middle.push(mid)
    })

    return { upper, lower, middle }
  }

  /**
   * 市场促进指数 (MFI)
   */
  static mfi(list: KLineData[], period: number = 14): (number | null)[] {
    return list.map((item, i) => {
      if (i < period) return null

      let positiveFlow = 0
      let negativeFlow = 0

      for (let j = i - period + 1; j <= i; j++) {
        const current = list[j]
        const previous = list[j - 1]

        const tp = (current.high + current.low + current.close) / 3
        const prevTp = (previous.high + previous.low + previous.close) / 3
        const rawMoneyFlow = tp * (current.volume ?? 0)

        if (tp > prevTp) {
          positiveFlow += rawMoneyFlow
        } else if (tp < prevTp) {
          negativeFlow += rawMoneyFlow
        }
      }

      if (negativeFlow === 0) return 100
      if (positiveFlow === 0) return 0

      const moneyRatio = positiveFlow / negativeFlow
      return 100 - (100 / (1 + moneyRatio))
    })
  }

  /**
   * 获取趋势方向
   */
  static getTrend(
    list: any[],
    shortPeriod: number = 10,
    longPeriod: number = 20,
    key: string = 'close'
  ): ('up' | 'down' | 'sideways' | null)[] {
    const shortMA = Formula.ma(list, shortPeriod, key)
    const longMA = Formula.ma(list, longPeriod, key)

    return list.map((item, i) => {
      if (i < longPeriod - 1 || shortMA[i] === null || longMA[i] === null) {
        return null
      }

      const short = shortMA[i]!
      const long = longMA[i]!
      const threshold = long * 0.001 // 0.1% 阈值

      if (short > long + threshold) {
        return 'up'
      } else if (short < long - threshold) {
        return 'down'
      } else {
        return 'sideways'
      }
    })
  }

  /**
   * 计算斐波那契回调位
   */
  static fibonacciRetracement(high: number, low: number): {
    level: number
    price: number
    percentage: string
  }[] {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
    const range = high - low

    return levels.map(level => ({
      level,
      price: high - (range * level),
      percentage: `${(level * 100).toFixed(1)}%`
    }))
  }

  /**
   * 检测图表模式（简化版本）
   */
  static detectPattern(
    list: KLineData[],
    lookback: number = 50
  ): { type: string; confidence: number; startIndex: number; endIndex: number }[] {
    const patterns: { type: string; confidence: number; startIndex: number; endIndex: number }[] = []

    if (list.length < lookback) return patterns

    for (let i = lookback; i < list.length - lookback; i++) {
      // 检测双顶/双底
      const leftPeak = this.findLocalPeak(list, i - lookback, i - lookback / 2, 'high')
      const rightPeak = this.findLocalPeak(list, i + lookback / 2, i + lookback, 'high')

      if (leftPeak && rightPeak) {
        const priceDiff = Math.abs(leftPeak.price - rightPeak.price)
        const avgPrice = (leftPeak.price + rightPeak.price) / 2
        const similarity = 1 - (priceDiff / avgPrice)

        if (similarity > 0.98) { // 98% 相似度
          patterns.push({
            type: 'double-top',
            confidence: similarity,
            startIndex: leftPeak.index,
            endIndex: rightPeak.index
          })
        }
      }
    }

    return patterns
  }

  /**
   * 查找局部峰值
   */
  private static findLocalPeak(
    list: KLineData[],
    start: number,
    end: number,
    type: 'high' | 'low'
  ): { index: number; price: number } | null {
    let peakIndex = start
    let peakPrice = type === 'high' ? list[start].high : list[start].low

    for (let i = start + 1; i <= end && i < list.length; i++) {
      const currentPrice = type === 'high' ? list[i].high : list[i].low

      if (type === 'high' && currentPrice > peakPrice) {
        peakPrice = currentPrice
        peakIndex = i
      } else if (type === 'low' && currentPrice < peakPrice) {
        peakPrice = currentPrice
        peakIndex = i
      }
    }

    return { index: peakIndex, price: peakPrice }
  }

  /**
   * 计算资金流向
   */
  static moneyFlow(list: KLineData[]): (number | null)[] {
    return list.map((item, i) => {
      if (i === 0) return null

      const current = item
      const previous = list[i - 1]

      const currentTypicalPrice = (current.high + current.low + current.close) / 3
      const previousTypicalPrice = (previous.high + previous.low + previous.close) / 3

      const moneyFlow = currentTypicalPrice * (current.volume ?? 0)

      if (currentTypicalPrice > previousTypicalPrice) {
        return moneyFlow // 正向资金流
      } else if (currentTypicalPrice < previousTypicalPrice) {
        return -moneyFlow // 负向资金流
      } else {
        return 0 // 中性
      }
    })
  }
  /**
 * RMA 威尔德移动平均（Running Moving Average / Wilder's Moving Average）
 * 也称为 Wilder's Smoothing 或 Modified Moving Average
 * 公式: RMA[i] = (RMA[i-1] * (n-1) + Price[i]) / n
 * 等价于: RMA[i] = RMA[i-1] + (Price[i] - RMA[i-1]) / n
 */
  static rma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(1, parseInt(String(period)))
    let rma = 0
    let sum = 0
    let isInitialized = false

    return list.map((item, index) => {
      const val = typeof key === 'string' && key !== ''
        ? Number(item[key])
        : Number(item)

      if (isNaN(val)) {
        return null
      }

      if (!isInitialized) {
        // 初始化阶段：累加前n个值
        sum += val

        if (index === n - 1) {
          // 第一个RMA值是前n个值的简单平均
          rma = sum / n
          isInitialized = true
          return rma
        }

        return null
      } else {
        // 使用威尔德公式计算后续RMA值
        rma = rma + (val - rma) / n
        return rma
      }
    })
  }

  /**
   * RMA支持自定义平滑因子版本
   */
  static rmaWithAlpha(
    list: any[],
    period: number,
    alpha?: number,
    key: string | null = null
  ): (number | null)[] {
    const n = Math.max(1, parseInt(String(period)))
    // 如果没有提供alpha，使用威尔德默认值 1/n
    const smoothingFactor = alpha !== undefined ? alpha : 1 / n

    let rma = 0
    let sum = 0
    let isInitialized = false

    return list.map((item, index) => {
      const val = typeof key === 'string' && key !== ''
        ? Number(item[key])
        : Number(item)

      if (isNaN(val)) {
        return null
      }

      if (!isInitialized) {
        sum += val

        if (index === n - 1) {
          rma = sum / n
          isInitialized = true
          return rma
        }

        return null
      } else {
        // 使用自定义平滑因子
        rma = rma * (1 - smoothingFactor) + val * smoothingFactor
        return rma
      }
    })
  }

  /**
   * ATR 使用RMA计算的真实波动幅度均值
   */
  static atrWithRMA(list: KLineData[], period: number = 14): (number | null)[] {
    // 首先计算真实波动幅度序列
    const trList = list.map((item, i) => {
      if (i === 0) return { tr: item.high - item.low }

      const previous = list[i - 1]
      const tr = Math.max(
        item.high - item.low,
        Math.abs(item.high - previous.close),
        Math.abs(item.low - previous.close)
      )

      return { tr }
    })

    // 使用RMA计算ATR
    return Formula.rma(trList, period, 'tr')
  }
  /**
   * ADX 使用RMA计算的平均方向性指数
   */
  static adxWithRMA(list: KLineData[], period: number = 14): (number | null)[] {
    const dmiData = list.map((item, i) => {
      if (i === 0) return { tr: 0, dmPlus: 0, dmMinus: 0 }

      const previous = list[i - 1]
      const high = item.high
      const low = item.low
      const prevHigh = previous.high
      const prevLow = previous.low
      const prevClose = previous.close

      // 计算真实波动幅度
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )

      // 计算方向性运动
      const upMove = high - prevHigh
      const downMove = prevLow - low

      let dmPlus = 0
      let dmMinus = 0

      if (upMove > downMove && upMove > 0) {
        dmPlus = upMove
      }
      if (downMove > upMove && downMove > 0) {
        dmMinus = downMove
      }

      return { tr, dmPlus, dmMinus }
    })

    // 使用RMA计算平滑值
    const atr = Formula.rma(dmiData, period, 'tr')
    const smoothedDMPlus = Formula.rma(dmiData, period, 'dmPlus')
    const smoothedDMMinus = Formula.rma(dmiData, period, 'dmMinus')

    // 计算DI+和DI-
    const diPlus = list.map((item, i) => {
      if (atr[i] === null || atr[i] === 0 || smoothedDMPlus[i] === null) {
        return null
      }
      return (smoothedDMPlus[i]! / atr[i]!) * 100
    })

    const diMinus = list.map((item, i) => {
      if (atr[i] === null || atr[i] === 0 || smoothedDMMinus[i] === null) {
        return null
      }
      return (smoothedDMMinus[i]! / atr[i]!) * 100
    })

    // 计算DX
    const dx = list.map((item, i) => {
      if (diPlus[i] === null || diMinus[i] === null) {
        return null
      }

      const plus = diPlus[i]!
      const minus = diMinus[i]!
      const sum = plus + minus

      if (sum === 0) return null

      return Math.abs(plus - minus) / sum * 100
    })

    // 使用RMA计算ADX
    const dxForRMA = dx.map((val, i) => ({ dx: val || 0 }))
    return Formula.rma(dxForRMA, period, 'dx')
  }
  /**
 * DEMA 双重指数移动平均
 * 公式: DEMA = 2 × EMA - EMA(EMA)
 */
  static dema(list: any[], period: number, key: string | null = null): (number | null)[] {
    const ema1 = Formula.ema(list, period, key)
    const ema1Data = ema1.map(val => ({ value: val }))
    const ema2 = Formula.ema(ema1Data, period, 'value')

    return list.map((item, i) => {
      if (i < period * 2 - 2 || ema1[i] === null || ema2[i] === null) return null
      return 2 * ema1[i]! - ema2[i]!
    })
  }
  /**
 * TEMA 三重指数移动平均
 * 公式: TEMA = 3×EMA1 - 3×EMA2 + EMA3
 */
  static tema(list: any[], period: number, key: string | null = null): (number | null)[] {
    const ema1 = Formula.ema(list, period, key)
    const ema1Data = ema1.map(val => ({ value: val }))
    const ema2 = Formula.ema(ema1Data, period, 'value')
    const ema2Data = ema2.map(val => ({ value: val }))
    const ema3 = Formula.ema(ema2Data, period, 'value')

    return list.map((item, i) => {
      if (i < period * 2 - 2 || ema1[i] === null || ema2[i] === null || ema3[i] === null) return null
      return 3 * ema1[i]! - 3 * ema2[i]! + ema3[i]!
    })
  }
  /**
   * LSMA 最小二乘移动平均
   * 基于线性回归的移动平均
   */
  static lsma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(1, parseInt(String(period)))

    return list.map((item, i) => {
      if (i < n - 1) return null // 不足周期返回null

      const slice = list.slice(i - n + 1, i + 1)
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0

      slice.forEach((dataPoint, index) => {
        const x = index
        const y = typeof key === 'string' && key !== '' ? dataPoint[key] : dataPoint

        sumX += x
        sumY += y
        sumXY += x * y
        sumXX += x * x
      })

      // 线性回归公式
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n

      // 预测下一个点的值（x = n-1）
      return slope * (n - 1) + intercept
    })
  }
  /**
   * MF 市场促进指数或资金流
   */
  static mf(list: KLineData[]): (number | null)[] {
    return list.map((item, i) => {
      if (i === 0) return null

      const previous = list[i - 1]
      const typicalPrice = (item.high + item.low + item.close) / 3
      const prevTypicalPrice = (previous.high + previous.low + previous.close) / 3

      const moneyFlow = typicalPrice * (item.volume ?? 0)

      if (typicalPrice > prevTypicalPrice) {
        return moneyFlow
      } else if (typicalPrice < prevTypicalPrice) {
        return -moneyFlow
      } else {
        return 0
      }
    })
  }
  /**
   * VAMA 成交量调整移动平均
   */
  static vama(list: KLineData[], period: number): (number | null)[] {
    return list.map((item, i) => {
      if (i < period - 1) return null // 不足周期返回null

      const slice = list.slice(i - period + 1, i + 1)
      let weightedSum = 0
      let volumeSum = 0

      slice.forEach(data => {
        const close = data.close ?? 0
        const volume = data.volume ?? 0
        weightedSum += close * volume
        volumeSum += volume
      })

      return volumeSum === 0 ? null : weightedSum / volumeSum
    })
  }
  /**
   * TMA 三角移动平均
   * 对SMA再做一次SMA
   */
  static tma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const halfPeriod = Math.ceil(period / 2)
    const sma1 = Formula.ma(list, halfPeriod, key)
    const sma1Data = sma1.map(val => ({ value: val }))
    return Formula.ma(sma1Data, halfPeriod, 'value')
  }
  /**
   * HMA 赫尔移动平均
   * 公式: HMA = WMA(2 × WMA(n/2) - WMA(n), sqrt(n))
   */
  static hma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(1, parseInt(String(period)))
    const halfPeriod = Math.floor(n / 2)
    const sqrtPeriod = Math.floor(Math.sqrt(n))

    const wma1 = Formula.wma(list, halfPeriod, key)  // WMA(n/2)
    const wma2 = Formula.wma(list, n, key)           // WMA(n)

    // 计算 2 × WMA(n/2) - WMA(n)
    const diffData = list.map((item, i) => {
      if (wma1[i] === null || wma2[i] === null) return { value: null }
      return { value: 2 * wma1[i]! - wma2[i]! }
    })

    // 对差值序列应用WMA(sqrt(n))
    return Formula.wma(diffData, sqrtPeriod, 'value')
  }
  /**
   * JMA Jurik移动平均（简化版本）
   * 这是一个复杂的专有算法，这里提供近似实现
   */
  static jma(list: any[], period: number, phase: number = 0, key: string | null = null): (number | null)[] {
    const length = Math.max(1, period)
    const phaseRatio = phase < -100 ? 0.5 : phase > 100 ? 2.5 : phase / 100 + 1.5

    // 更准确的JMA参数计算
    const beta = 0.45 * (length - 1) / (0.45 * (length - 1) + 2)
    const alpha = Math.pow(beta, phaseRatio)

    let e0 = 0, e1 = 0, e2 = 0
    let ma1 = 0, det0 = 0, ma2 = 0, det1 = 0, jma = 0

    return list.map((item, i) => {
      const price = typeof key === 'string' && key !== '' ? item[key] : item

      if (i === 0) {
        e0 = e1 = e2 = ma1 = ma2 = jma = price
        return price
      }

      e0 = (1 - alpha) * price + alpha * e0
      e1 = (price - e0) * (1 - beta) + beta * e1
      e2 = (e0 + phaseRatio * e1 - jma) * alpha * alpha + jma

      // 附加的JMA特有计算
      ma1 = e2
      det0 = (ma1 - ma2) * (0.5 * (length - 1) + 1) / length
      ma2 = ma1
      det1 = det0
      jma = ma1 + det1

      return jma
    })
  }
  /**
   * Kijun v2 改进版基准线
   */
  static kijunV2(list: KLineData[], period: number = 26, factor: number = 1.0): (number | null)[] {
    return list.map((item, i) => {
      if (i < period - 1) return null

      const slice = list.slice(i - period + 1, i + 1)
      const highest = Math.max(...slice.map(d => d.high))
      const lowest = Math.min(...slice.map(d => d.low))
      const kijun = (highest + lowest) / 2

      // v2版本添加了因子调整
      const close = item.close
      return kijun + (close - kijun) * (factor - 1)
    })
  }
  /**
   * EDSMA Ehlers动态平滑移动平均
   */
  static edsma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(2, period)
    let prevEdsma = 0

    return list.map((item, i) => {
      const price = typeof key === 'string' && key !== '' ? item[key] : item

      if (i === 0) {
        return prevEdsma = price
      }

      // 动态平滑因子
      const alpha = 2 / (n + 1)
      const edsma = alpha * price + (1 - alpha) * prevEdsma

      return prevEdsma = edsma
    })
  }
  /**
   * McGinley Dynamic 麦金利动态指标
   * 自适应移动平均，根据价格变化调整平滑因子
   */
  static mcginley(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(1, period)
    let prevMd = 0

    return list.map((item, i) => {
      const price = typeof key === 'string' && key !== '' ? item[key] : item

      if (i === 0) {
        return prevMd = price
      }

      // McGinley Dynamic公式
      const md = prevMd + (price - prevMd) / (n * Math.pow(price / prevMd, 4))

      return prevMd = md
    })
  }
  /**
 * 线性回归 (Linear Regression)
 * @param dataList 数据数组
 * @param period 回归周期
 * @param offset 偏移量（正数向前偏移，负数向后偏移）
 * @param key 数据字段名
 * @returns 线性回归值数组
 */
  static linreg(dataList: any[], period: number, offset: number = 0, key: string = 'close'): (number | null)[] {
    if (!dataList || dataList.length === 0 || period <= 0) {
      return []
    }

    const result: (number | null)[] = []

    for (let i = 0; i < dataList.length; i++) {
      if (i < period - 1) {
        result.push(null)
        continue
      }

      try {
        // 获取回归窗口的数据
        const windowData = dataList.slice(i - period + 1, i + 1)

        // 计算线性回归
        let sumX = 0
        let sumY = 0
        let sumXY = 0
        let sumX2 = 0
        const n = windowData.length

        for (let j = 0; j < n; j++) {
          const x = j  // 时间序列索引
          const y = windowData[j][key] || 0

          sumX += x
          sumY += y
          sumXY += x * y
          sumX2 += x * x
        }

        // 计算线性回归系数
        // y = a + b*x
        // b = (n*∑xy - ∑x*∑y) / (n*∑x² - (∑x)²)
        // a = (∑y - b*∑x) / n

        const denominator = n * sumX2 - sumX * sumX
        if (Math.abs(denominator) < 1e-10) {
          // 避免除零错误，返回平均值
          result.push(sumY / n)
          continue
        }

        const slope = (n * sumXY - sumX * sumY) / denominator
        const intercept = (sumY - slope * sumX) / n

        // 计算回归值，考虑偏移
        // 在Pine Script中，offset为正数时向未来预测，为负数时回到过去
        const targetX = (n - 1) + offset  // 最后一个点的x坐标是n-1
        const regressionValue = intercept + slope * targetX

        result.push(regressionValue)

      } catch (error) {
        result.push(null)
      }
    }

    return result
  }
}
export default Formula