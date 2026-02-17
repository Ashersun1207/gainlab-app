import { ScriptUtils } from './ScriptUtils'

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
 * BOLL指标结果接口
 */
interface BOLLResult {
  mid?: number
  ub?: number
  lb?: number
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
 * 指标计算公式类
 */
class Formula {
  static getNumVal(key: string | null, data: KLineData | number | string): number {
    // 如果data是null或undefined，返回NaN
    if (data === null || data === undefined) {
      return NaN
    }
    // 如果data是数值，直接返回（不管key）
    if (typeof data === 'number') {
      return data
    }
    // 如果data是字符串，尝试转换为数值（不管key）
    if (typeof data === 'string') {
      const num = parseFloat(data)
      return ScriptUtils.isValid(num) ? num : NaN
    }
    // 如果data是对象，才需要key
    if (typeof data === 'object') {
      // 如果没有key，返回NaN
      if (!key || key === '') {
        return NaN
      }
      if (key) {
        // 如果key存在且data中有该属性，直接返回
        if (key && data[key] !== undefined) {
          const val = data[key]
          return ScriptUtils.isValid(val) ? val : NaN
        }
        switch (key) {
          case 'hl2':
            return (data.high + data.low) / 2
          case 'oc2':
            return (data.open + data.close) / 2
          case 'hlc3':
            return (data.high + data.low + data.close) / 3
          case 'ohl3':
            return (data.high + data.low + data.open) / 3
          case 'ohlc4':
            return (data.high + data.low + data.close + data.open) / 4
          case 'percentage':
            if (
              ScriptUtils.isValid(data.close) &&
              ScriptUtils.isValid(data.open) &&
              data.open !== 0
            ) {
              return parseFloat(
                (((data.close - data.open) / data.open) * 100).toFixed(2)
              )
            } else {
              return NaN
            }
          default:
            return NaN
        }
      } else {
        return NaN
      }
    }
    // 其他情况返回NaN
    return NaN
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
        return Formula.getNumVal(attr, item as any)
      })
    }
    return list.map(item => item)
  }
  /**
   * MA - 移动平均线工具函数（pandas_ta标准）
   * 支持两种调用方式：
   * 1. ma(list, num, key) - 简单移动平均线
   * 2. ma(name, dataList, key, ...args) - 根据名称选择移动平均线类型
   */
  static ma(
    list: any[],
    period: number,
    attr?: string | null
  ): (number | null)[] {
    // 简单移动平均线
    const num = Math.max(1, parseInt(String(period)));
    let sum = 0;
    let validCount = 0;

    return list.map((item, index) => {
      const val = Formula.getNumVal(attr, item);

      if (!ScriptUtils.isValid(val)) {
        return null;
      }

      // 添加新值到滑动窗口
      sum += val;
      validCount++;

      // 如果超过周期，移除最旧的值
      if (index >= num) {
        const oldVal = Formula.getNumVal(attr, list[index - num]);
        if (ScriptUtils.isValid(oldVal)) {
          sum -= oldVal;
        } else {
          // 如果旧值无效，减少有效计数
          validCount--;
        }
      }

      // 如果有效数据不足周期，返回null
      if (validCount < num) {
        return null;
      }

      // 计算移动平均
      const ma = sum / num;
      return isFinite(ma) ? ma : null;
    });
  }
  /**
   * Exponential Moving Average (EMA)
   * 指数移动平均线，比简单移动平均线更敏感
   */
  static ema(
    list: any[],
    period: number,
    attr?: string | null
  ): (number | null)[] {
    // 简单指数移动平均线
    const num = Math.max(1, parseInt(String(period)));
    const multiplier = 2 / (num + 1);
    let previousEma: number | null = null;
    return list.map((item, index) => {
      const val = Formula.getNumVal(attr, item);

      if (!ScriptUtils.isValid(val)) {
        return null;
      }
      if (index < num - 1) {
        return null; // 不足周期返回null
      }
      if (previousEma === null) {
        // 初始化EMA值，使用前num个值的平均值
        let sum = 0;
        let validCount = 0;
        for (let j = 0; j < num; j++) {
          const prevVal = Formula.getNumVal(attr, list[index - j]);
          if (ScriptUtils.isValid(prevVal)) {
            sum += prevVal;
            validCount++;
          }
        }
        if (validCount === num) {
          previousEma = sum / num;
          return previousEma;
        } else {
          return null;
        }
      }

      // 计算EMA：EMA = current * multiplier + previous * (1 - multiplier)
      const emaValue = val * multiplier + previousEma * (1 - multiplier);
      previousEma = emaValue;
      return emaValue;
    });
  }
  /**
   * WMA Weighted Moving Average (WMA)
   * 加权移动平均线，权重线性递增，最近数据具有最重权重
   * 这是 pandas_ta 标准的实现
   */
  static wma(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const weights: number[] = [];
    for (let i = 1; i <= length; i++) {
      weights.push(i);
    }
    const wma: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        wma.push(null);
        continue;
      }
      let sum = 0;
      let weightSum = 0;

      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        const currentClose = Formula.getNumVal(key, (dataList as KLineData[])[dataIndex]);

        if (ScriptUtils.isValid(currentClose)) {
          sum += currentClose * weights[j];
          weightSum += weights[j];
        }
      }
      if (weightSum > 0) {
        const wmaValue = sum / weightSum;
        wma.push(isFinite(wmaValue) ? wmaValue : null);
      } else {
        wma.push(null);
      }
    }
    return wma;
  }
  /**
   * FWMA Fibonacci's Weighted Moving Average
   * 斐波那契加权移动平均线，基于斐波那契数列的权重
   */
  static fwma(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const fibWeights = Formula.generateFibonacciWeights(length);
    const fwma: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        fwma.push(null);
        continue;
      }
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        const currentClose = Formula.getNumVal(key, dataList[dataIndex]);
        if (ScriptUtils.isValid(currentClose)) {
          sum += currentClose * fibWeights[j];
          weightSum += fibWeights[j];
        }
      }
      fwma.push(weightSum > 0 ? sum / weightSum : null);
    }
    return fwma;
  }
  /**
   * SMA Simple Moving Average (SMA)
   * 简单移动平均线，这是经典的移动平均线，是n个周期内等权重平均
   * 这是 pandas_ta 标准的实现
   */
  static sma(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }

    // 参数验证
    length = Math.max(1, Math.floor(length)) || 10;

    // 检查数据长度
    if (dataList.length < length) {
      return [];
    }

    // 计算SMA（简单移动平均线）
    const sma: (number | null)[] = [];

    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        sma.push(null);
        continue;
      }

      let sum = 0;
      let count = 0;

      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        const price = Formula.getNumVal(key, dataList[dataIndex]);

        if (ScriptUtils.isValid(price)) {
          sum += price;
          count++;
        }
      }

      sma.push(count > 0 ? sum / count : null);
    }

    return sma;
  }
  /**
   * RMA wildeR's Moving Average (RMA)
   * 威尔德移动平均线，使用 alpha = 1/length 的指数移动平均线
   * 这是 pandas_ta 标准的实现
   */
  static rma(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    const alpha = 1.0 / length;
    if (dataList.length < length) {
      return [];
    }
    const rma: (number | null)[] = [];

    let sum = 0;
    for (let i = 0; i < length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      if (ScriptUtils.isValid(price)) {
        sum += price;
      }
    }
    let currentRma = sum / length;
    rma.push(currentRma);
    for (let i = length; i < dataList.length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      if (ScriptUtils.isValid(price)) {
        currentRma = alpha * price + (1 - alpha) * currentRma;
        rma.push(currentRma);
      } else {
        rma.push(null);
      }
    }
    for (let i = 0; i < length - 1; i++) {
      rma.unshift(null);
    }
    return rma;
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
    const smoothingFactor = alpha !== undefined ? alpha : 1 / n
    let rma = 0
    let sum = 0
    let isInitialized = false
    return list.map((item, index) => {
      const val = Formula.getNumVal(key, item)
      if (!ScriptUtils.isValid(val)) {
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
   * TRIMA Triangular Moving Average (TRIMA)
   * 三角移动平均线，权重形状为三角形，最大权重在周期中间
   * 这是 pandas_ta 标准的实现
   */
  static trima(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const halfLength = Math.round(0.5 * (length + 1));
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const sma1 = Formula.ma(close, halfLength);
    const trima = Formula.ma(sma1, halfLength);
    return trima;
  }
  /**
   * Kaufman's Adaptive Moving Average (KAMA)
   * 考夫曼自适应移动平均线，能够根据市场波动性自动调整其响应速度
   */
  static kama(
    dataList: KLineData[] | any[],
    length: number = 10,
    fast: number = 2,
    slow: number = 30,
    drift: number = 1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    fast = Math.max(1, Math.floor(fast)) || 2;
    slow = Math.max(1, Math.floor(slow)) || 30;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const maxLength = Math.max(fast, slow, length);
    if (dataList.length < maxLength) {
      return [];
    }
    const weight = (length: number): number => {
      return 2 / (length + 1);
    };
    const fr = weight(fast);
    const sr = weight(slow);
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const absDiff: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        absDiff.push(null);
        continue;
      }

      const currentClose = close[i];
      const prevClose = close[i - length];

      if (currentClose !== null && prevClose !== null) {
        absDiff.push(Math.abs(currentClose - prevClose));
      } else {
        absDiff.push(null);
      }
    }
    const peerDiff: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        peerDiff.push(null);
        continue;
      }
      const currentClose = close[i];
      const prevClose = close[i - drift];
      if (currentClose !== null && prevClose !== null) {
        peerDiff.push(Math.abs(currentClose - prevClose));
      } else {
        peerDiff.push(null);
      }
    }
    const peerDiffSum: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        peerDiffSum.push(null);
        continue;
      }
      let sum = 0;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const index = i - j;
        if (index >= 0 && peerDiff[index] !== null) {
          sum += peerDiff[index]!;
          validCount++;
        }
      }
      if (validCount === length) {
        peerDiffSum.push(sum);
      } else {
        peerDiffSum.push(null);
      }
    }
    const er: (number | null)[] = [];
    const sc: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const absDiffVal = absDiff[i];
      const peerDiffSumVal = peerDiffSum[i];

      if (absDiffVal !== null && peerDiffSumVal !== null && peerDiffSumVal !== 0) {
        const efficiencyRatio = absDiffVal / peerDiffSumVal;
        er.push(efficiencyRatio);

        const x = efficiencyRatio * (fr - sr) + sr;
        sc.push(x * x);
      } else {
        er.push(null);
        sc.push(null);
      }
    }
    const result: (number | null)[] = [];
    for (let i = 0; i < length - 1; i++) {
      result.push(null);
    }
    result.push(0);
    for (let i = length; i < dataList.length; i++) {
      const currentClose = close[i];
      const currentSc = sc[i];
      const prevResult = result[i - 1];

      if (currentClose !== null && currentSc !== null && prevResult !== null) {
        const kamaValue = currentSc * currentClose + (1 - currentSc) * prevResult;
        result.push(kamaValue);
      } else {
        result.push(null);
      }
    }
    return result;
  }
  /**
   * T3 Tim Tillson's T3 Moving Average
   * Tim Tillson的T3移动平均线，被认为比其他移动平均线更平滑和响应更快
   * 这是 pandas_ta 标准的实现
   */
  static t3(
    dataList: KLineData[] | any[],
    length: number = 10,
    a: number = 0.7,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    a = Math.max(0.1, Math.min(0.9, parseFloat(a.toString()))) || 0.7; // 0 < a < 1
    if (dataList.length < length) {
      return [];
    }
    const c1 = -a * Math.pow(a, 2);
    const c2 = 3 * Math.pow(a, 2) + 3 * Math.pow(a, 3);
    const c3 = -6 * Math.pow(a, 2) - 3 * a - 3 * Math.pow(a, 3);
    const c4 = Math.pow(a, 3) + 3 * Math.pow(a, 2) + 3 * a + 1;
    const ema1 = Formula.ema(dataList, length, key);
    const ema2 = Formula.ema(ema1, length);
    const ema3 = Formula.ema(ema2, length);
    const ema4 = Formula.ema(ema3, length);
    const ema5 = Formula.ema(ema4, length);
    const ema6 = Formula.ema(ema5, length);
    const t3: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length * 6 - 1) {
        t3.push(null);
        continue;
      }
      const ema6Val = ema6[i];
      const ema5Val = ema5[i];
      const ema4Val = ema4[i];
      const ema3Val = ema3[i];
      if (ema6Val !== null && ema5Val !== null && ema4Val !== null && ema3Val !== null) {
        const t3Value = c1 * ema6Val + c2 * ema5Val + c3 * ema4Val + c4 * ema3Val;
        t3.push(isFinite(t3Value) ? t3Value : null);
      } else {
        t3.push(null);
      }
    }
    return t3;
  }
  /**
   * Double Exponential Moving Average (DEMA)
   * 双重指数移动平均线，比普通EMA更平滑且滞后更少
   */
  static dema(
    dataList: KLineData[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const ema1 = Formula.ema(dataList, length, key);
    const ema2 = Formula.ema(ema1, length);
    const dema: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const ema1Value = ema1[i];
      const ema2Value = ema2[i];
      if (ema1Value !== null && ema2Value !== null) {
        const demaValue = 2 * ema1Value - ema2Value;
        dema.push(demaValue);
      } else {
        dema.push(null);
      }
    }
    return dema;
  }
  /**
   * TEMA Triple Exponential Moving Average (TEMA)
   * 三重指数移动平均线，比普通EMA更平滑且滞后更少
   * 这是 pandas_ta 标准的实现
   */
  static tema(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const ema1 = Formula.ema(dataList, length, key);
    const ema2 = Formula.ema(ema1, length);
    const ema3 = Formula.ema(ema2, length);
    const tema: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length * 3 - 3) {
        tema.push(null);
        continue;
      }
      const ema1Val = ema1[i];
      const ema2Val = ema2[i];
      const ema3Val = ema3[i];
      if (ema1Val !== null && ema2Val !== null && ema3Val !== null) {
        const temaValue = 3 * (ema1Val - ema2Val) + ema3Val;
        tema.push(isFinite(temaValue) ? temaValue : null);
      } else {
        tema.push(null);
      }
    }
    return tema;
  }
  /**
   * VIDYA Variable Index Dynamic Average (VIDYA)
   * 可变指数动态平均线，由Tushar Chande开发
   * 类似于指数移动平均线，但具有动态调整的回看周期
   * 依赖于相对价格波动性，通过Chande动量振荡器(CMO)测量
   * 当波动性高时，VIDYA对价格变化反应更快
   * 这是 pandas_ta 标准的实现
   */
  static vidya(
    dataList: KLineData[] | any[],
    length: number = 14,
    drift: number = 1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const cmo: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        cmo.push(null);
        continue;
      }
      let positiveSum = 0;
      let negativeSum = 0;
      for (let j = 0; j < length; j++) {
        if (i - j - drift >= 0 && close[i - j] !== null && close[i - j - drift] !== null) {
          const momentum = close[i - j]! - close[i - j - drift]!;
          if (momentum > 0) {
            positiveSum += momentum;
          } else {
            negativeSum += Math.abs(momentum);
          }
        }
      }
      if (positiveSum + negativeSum === 0) {
        cmo.push(0);
      } else {
        cmo.push((positiveSum - negativeSum) / (positiveSum + negativeSum));
      }
    }
    const alpha = 2 / (length + 1);
    const vidya: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        vidya.push(null);
        continue;
      }
      const currentClose = close[i];
      const currentCmo = cmo[i];
      const prevVidya = vidya[i - 1];
      if (currentClose !== null && currentCmo !== null && prevVidya !== null) {
        const absCmo = Math.abs(currentCmo);
        const vidyaValue = alpha * absCmo * currentClose + prevVidya * (1 - alpha * absCmo);
        vidya.push(isFinite(vidyaValue) ? vidyaValue : null);
      } else {
        vidya.push(null);
      }
    }
    return vidya;
  }
  /**
   * VWAP Volume Weighted Average Price (VWAP)
   * 成交量加权平均价格，通过成交量加权的平均价格
   * 通常用于日内图表以识别总体方向
   * 这是 pandas_ta 标准的实现
   */
  static vwap(
    dataList: KLineData[] | any[],
    anchor: string = 'D',
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    anchor = (anchor && typeof anchor === 'string' && anchor.length >= 1) ? anchor.toUpperCase() : 'D';
    if (dataList.length < 1) {
      return [];
    }
    const vwap: (number | null)[] = [];
    let cumulativeTypicalPriceVolume = 0;
    let cumulativeVolume = 0;
    let currentAnchor = '';
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (!bar || typeof bar.high !== 'number' || typeof bar.low !== 'number' ||
        typeof bar.close !== 'number' || typeof bar.volume !== 'number') {
        vwap.push(null);
        continue;
      }
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      const typicalPriceVolume = typicalPrice * bar.volume;
      const shouldReset = this.shouldResetAnchor(i, anchor);
      if (shouldReset) {
        cumulativeTypicalPriceVolume = 0;
        cumulativeVolume = 0;
        currentAnchor = this.getCurrentAnchor(i, anchor);
      }
      cumulativeTypicalPriceVolume += typicalPriceVolume;
      cumulativeVolume += bar.volume;
      if (cumulativeVolume > 0) {
        const vwapValue = cumulativeTypicalPriceVolume / cumulativeVolume;
        vwap.push(isFinite(vwapValue) ? vwapValue : null);
      } else {
        vwap.push(null);
      }
    }
    return vwap;
  }
  /**
   * WCP Weighted Closing Price (WCP)
   * 加权收盘价，通过high、low和2倍close的加权计算
   * 这是 pandas_ta 标准的实现
   */
  static wcp(
    dataList: KLineData[] | any[],
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    const wcp: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (bar && ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low) && ScriptUtils.isValid(bar.close)) {
        const wcpValue = (bar.high + bar.low + 2 * bar.close) / 4;
        wcp.push(isFinite(wcpValue) ? wcpValue : null);
      } else {
        wcp.push(null);
      }
    }
    return wcp;
  }
  /**
   * VWMA Volume Weighted Moving Average (VWMA)
   * 成交量加权移动平均线，通过成交量加权的移动平均线
   * 这是 pandas_ta 标准的实现
   */
  static vwma(
    dataList: KLineData[] | any[],
    length: number = 10,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    // 检查数据长度
    if (dataList.length < length) {
      return [];
    }
    const vwma: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        vwma.push(null);
        continue;
      }
      let cumulativePriceVolume = 0;
      let cumulativeVolume = 0;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const index = i - j;
        if (index >= 0) {
          const bar = dataList[index];
          if (bar && ScriptUtils.isValid(bar.close) && ScriptUtils.isValid(bar.volume)) {
            cumulativePriceVolume += bar.close * bar.volume;
            cumulativeVolume += bar.volume;
            validCount++;
          }
        }
      }
      if (validCount === length && cumulativeVolume > 0) {
        const vwmaValue = cumulativePriceVolume / cumulativeVolume;
        vwma.push(isFinite(vwmaValue) ? vwmaValue : null);
      } else {
        vwma.push(null);
      }
    }
    return vwma;
  }
  /**
   * ZLMA Zero Lag Moving Average (ZLMA)
   * 零滞后移动平均线，尝试消除移动平均线的滞后
   * 这是 pandas_ta 标准的实现
   */
  static zlma(
    dataList: KLineData[] | any[],
    length: number = 10,
    mamode: string = 'ema',
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    mamode = String(mamode).toLowerCase() || 'ema';
    if (dataList.length < length) {
      return [];
    }
    const lag = Math.floor(0.5 * (length - 1));
    const source: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const currentClose = (dataList as KLineData[])[i].close;
      if (ScriptUtils.isValid(currentClose)) {
        if (i >= lag) {
          const laggedClose = (dataList as KLineData[])[i - lag].close;
          if (ScriptUtils.isValid(laggedClose)) {
            const sourceValue = 2 * currentClose - laggedClose;
            source.push(isFinite(sourceValue) ? sourceValue : null);
          } else {
            source.push(null);
          }
        } else {
          source.push(null);
        }
      } else {
        source.push(null);
      }
    }
    let zlma: (number | null)[] = [];
    switch (mamode) {
      case 'dema':
        zlma = Formula.dema(dataList, length, key);
        break;
      case 'hma':
        zlma = Formula.hma(dataList, length, key);
        break;
      case 'linreg':
        zlma = Formula.linreg(dataList, length, false, false, false, false, false, false, key);
        break;
      case 'rma':
        zlma = Formula.rma(dataList, length, key);
        break;
      case 'sma':
        zlma = Formula.sma(dataList, length, key);
        break;
      case 'swma':
        zlma = Formula.swma(dataList, length, true, key);
        break;
      case 't3':
        zlma = Formula.t3(dataList, length, 0, key);
        break;
      case 'tema':
        zlma = Formula.tema(dataList, length, key);
        break;
      case 'trima':
        zlma = Formula.trima(dataList, length, key);
        break;
      case 'vidya':
        zlma = Formula.vidya(dataList, length, 1, key);
        break;
      case 'wma':
        zlma = Formula.wma(dataList, length, key);
        break;
      case 'ema':
      default:
        zlma = Formula.ema(dataList, length, key);
        break;
    }
    return zlma;
  }
  /**
   * Drawdown (DD) 回撤指标
   * 这是 pandas_ta 标准的实现
   */
  static drawdown(
    dataList: KLineData[] | any[],
  ): { dd: (number | null)[]; dd_pct: (number | null)[]; dd_log: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { dd: [], dd_pct: [], dd_log: [] };
    }
    const maxClose: (number | null)[] = [];
    let currentMax = -Infinity;
    for (let i = 0; i < dataList.length; i++) {
      const currentClose = (dataList as KLineData[])[i].close;
      if (ScriptUtils.isValid(currentClose)) {
        if (currentClose > currentMax) {
          currentMax = currentClose;
        }
        maxClose.push(currentMax);
      } else {
        maxClose.push(null);
      }
    }
    const dd: (number | null)[] = [];
    const dd_pct: (number | null)[] = [];
    const dd_log: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const currentClose = (dataList as KLineData[])[i].close;
      const currentMaxClose = maxClose[i];
      if (ScriptUtils.isValid(currentClose) && ScriptUtils.isValid(currentMaxClose) && currentMaxClose > 0) {
        const ddValue = currentMaxClose - currentClose;
        dd.push(isFinite(ddValue) ? ddValue : null);
        const ddPctValue = 1 - (currentClose / currentMaxClose);
        dd_pct.push(isFinite(ddPctValue) ? ddPctValue : null);
        const ddLogValue = Math.log(currentMaxClose / currentClose);
        dd_log.push(isFinite(ddLogValue) ? ddLogValue : null);
      } else {
        dd.push(null);
        dd_pct.push(null);
        dd_log.push(null);
      }
    }
    return { dd, dd_pct, dd_log };
  }
  /**
   * Log Return 对数收益率指标
   * 计算价格序列的对数收益率，支持累积收益率计算
   * 这是 pandas_ta 标准的实现
   */
  static log_return(
    dataList: KLineData[] | any[],
    length: number = 1,
    cumulative: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 1;
    cumulative = Boolean(cumulative);
    if (dataList.length < length) {
      return [];
    }
    const logReturn: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        logReturn.push(null);
        continue;
      }
      const currentClose = (dataList as KLineData[])[i].close;
      const prevClose = (dataList as KLineData[])[i - length].close;
      if (ScriptUtils.isValid(currentClose) && ScriptUtils.isValid(prevClose) && prevClose > 0) {
        const logReturnValue = Math.log(currentClose / prevClose);
        logReturn.push(isFinite(logReturnValue) ? logReturnValue : null);
      } else {
        logReturn.push(null);
      }
    }
    if (cumulative) {
      let cumulativeSum = 0;
      for (let i = 0; i < logReturn.length; i++) {
        if (logReturn[i] !== null) {
          cumulativeSum += logReturn[i];
          logReturn[i] = cumulativeSum;
        }
      }
    }
    return logReturn;
  }
  /**
   * Percent Return 百分比收益率指标
   * 计算价格序列的百分比变化，支持累积收益率计算
   * 这是 pandas_ta 标准的实现
   */
  static percent_return(
    dataList: KLineData[] | any[],
    length: number = 1,
    cumulative: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 1;
    cumulative = Boolean(cumulative);
    if (dataList.length < length) {
      return [];
    }
    const pctReturn: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        pctReturn.push(null);
        continue;
      }
      const currentClose = (dataList as KLineData[])[i].close;
      const prevClose = (dataList as KLineData[])[i - length].close;
      if (ScriptUtils.isValid(currentClose) && ScriptUtils.isValid(prevClose) && prevClose > 0) {
        const pctReturnValue = (currentClose - prevClose) / prevClose;
        pctReturn.push(isFinite(pctReturnValue) ? pctReturnValue : null);
      } else {
        pctReturn.push(null);
      }
    }
    if (cumulative) {
      let cumulativeSum = 0;
      for (let i = 0; i < pctReturn.length; i++) {
        if (pctReturn[i] !== null) {
          cumulativeSum += pctReturn[i];
          pctReturn[i] = cumulativeSum;
        }
      }
    }
    return pctReturn;
  }
  /**
   * Trend Return 趋势收益率指标
   * 计算基于趋势序列的收益率和累积收益率，包括趋势、交易、入场和出场信号
   * 这是 pandas_ta 标准的实现
   */
  static trend_return(
    dataList: KLineData[] | any[],
    trend: (number | boolean)[],
    log: boolean = true,
    asbool: boolean = false,
    trend_reset: number = 0,
    trade_offset: number = -1,
  ): {
    active_returns: (number | null)[];
    cumulative_returns: (number | null)[];
    trends: (number | boolean)[];
    trades: (number | null)[];
    entries: (number | boolean)[];
    exits: (number | boolean)[];
  } {
    if (!Array.isArray(dataList) || dataList.length === 0 || !Array.isArray(trend) || trend.length === 0) {
      return {
        active_returns: [],
        cumulative_returns: [],
        trends: [],
        trades: [],
        entries: [],
        exits: []
      };
    }
    log = Boolean(log);
    asbool = Boolean(asbool);
    trend_reset = Math.floor(trend_reset) || 0;
    trade_offset = trade_offset !== 0 ? (Math.floor(trade_offset) || -1) : 0;
    if (dataList.length !== trend.length) {
      return {
        active_returns: [],
        cumulative_returns: [],
        trends: [],
        trades: [],
        entries: [],
        exits: []
      };
    }
    const returns = log ? Formula.log_return(dataList, 1, false) : Formula.percent_return(dataList, 1, false);
    const trends: (number | boolean)[] = trend.map(t => {
      if (asbool) {
        return Boolean(t);
      } else {
        return Number(t);
      }
    });
    const active_returns: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const trendValue = trends[i];
      const returnValue = returns[i];
      if (ScriptUtils.isValid(returnValue) && trendValue) {
        const trendNum = typeof trendValue === 'boolean' ? (trendValue ? 1 : 0) : Number(trendValue);
        active_returns.push(trendNum * returnValue);
      } else {
        active_returns.push(0);
      }
    }
    const cumulative_returns: (number | null)[] = [];
    let tsum = 0;
    for (let i = 0; i < dataList.length; i++) {
      const trendValue = trends[i];
      const activeReturn = active_returns[i];
      if (ScriptUtils.isValid(activeReturn)) {
        if (typeof trendValue === 'boolean') {
          if (!trendValue) {
            tsum = 0; // 趋势重置
          } else {
            tsum += activeReturn;
          }
        } else {
          if (Number(trendValue) === trend_reset) {
            tsum = 0; // 趋势重置
          } else {
            tsum += activeReturn;
          }
        }
        cumulative_returns.push(tsum);
      } else {
        cumulative_returns.push(null);
      }
    }
    const trades: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        trades.push(0);
        continue;
      }
      const currentTrend = trends[i];
      const prevTrend = trends[i - 1];
      if (ScriptUtils.isValid(currentTrend) && ScriptUtils.isValid(prevTrend)) {
        const currentTrendNum = typeof currentTrend === 'boolean' ? (currentTrend ? 1 : 0) : Number(currentTrend);
        const prevTrendNum = typeof prevTrend === 'boolean' ? (prevTrend ? 1 : 0) : Number(prevTrend);
        const tradeSignal = currentTrendNum - prevTrendNum;
        trades.push(tradeSignal);
      } else {
        trades.push(null);
      }
    }
    if (trade_offset !== 0) {
      if (trade_offset > 0) {
        for (let i = 0; i < trade_offset; i++) {
          trades.unshift(null);
        }
        trades.splice(-trade_offset);
      } else {
        for (let i = 0; i < Math.abs(trade_offset); i++) {
          trades.push(null);
        }
        trades.splice(0, Math.abs(trade_offset));
      }
    }
    const entries: (number | boolean)[] = trades.map(t => {
      if (t === null) return asbool ? false : 0;
      if (asbool) {
        return t > 0;
      } else {
        return t > 0 ? 1 : 0;
      }
    });
    const exits: (number | boolean)[] = trades.map(t => {
      if (t === null) return asbool ? false : 0;
      if (asbool) {
        return t < 0;
      } else {
        return Math.abs(t < 0 ? t : 0);
      }
    });
    return {
      active_returns,
      cumulative_returns,
      trends,
      trades,
      entries,
      exits
    };
  }
  /**
   * Entropy 信息熵指标
   * 衡量数据的不确定性和信息量，基于香农信息论
   * 这是 pandas_ta 标准的实现
   */
  static entropy(
    dataList: KLineData[] | any[],
    length: number = 10,
    base: number = 2.0,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    base = Math.max(0.1, base) || 2.0;
    if (dataList.length < length) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const entropy: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        entropy.push(null);
        continue;
      }
      let windowSum = 0;
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        const value = close[dataIndex];
        if (ScriptUtils.isValid(value)) {
          windowSum += value;
          windowValues.push(value);
        }
      }
      if (windowSum > 0 && windowValues.length > 0) {
        const probabilities = windowValues.map(val => val / windowSum);
        let entropyValue = 0;
        for (const prob of probabilities) {
          if (prob > 0) {
            const logProb = Math.log(prob);
            const logBase = Math.log(base);
            entropyValue += -prob * logProb / logBase;
          }
        }
        entropy.push(isFinite(entropyValue) ? entropyValue : null);
      } else {
        entropy.push(null);
      }
    }
    return entropy;
  }
  /**
   * Kurtosis 峰度指标
   * 衡量数据分布的尖峭程度，基于统计学原理
   * 这是 pandas_ta 标准的实现
   */
  static kurtosis(
    dataList: KLineData[] | any[],
    length: number = 30,
    min_periods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 30;
    min_periods = min_periods !== null ? Math.max(1, Math.floor(min_periods)) : length;
    if (dataList.length < Math.max(length, min_periods)) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const kurtosis: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < Math.max(length, min_periods) - 1) {
        kurtosis.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && ScriptUtils.isValid(close[dataIndex])) {
          windowValues.push(close[dataIndex]);
        }
      }
      if (windowValues.length >= min_periods) {
        const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
        const variance = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowValues.length;
        if (variance > 0) {
          const fourthMoment = windowValues.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / windowValues.length;
          const kurtosisValue = (fourthMoment / Math.pow(variance, 2)) - 3;
          kurtosis.push(isFinite(kurtosisValue) ? kurtosisValue : null);
        } else {
          kurtosis.push(null);
        }
      } else {
        kurtosis.push(null);
      }
    }
    return kurtosis;
  }
  /**
   * MAD Mean Absolute Deviation 平均绝对偏差
   * 衡量数据相对于均值的平均绝对偏差，基于统计学原理
   * 这是 pandas_ta 标准的实现
   */
  static mad(
    dataList: KLineData[] | any[],
    length: number = 30,
    min_periods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 30;
    min_periods = min_periods !== null ? Math.max(1, Math.floor(min_periods)) : length;
    if (dataList.length < Math.max(length, min_periods)) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const mad: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < Math.max(length, min_periods) - 1) {
        mad.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && ScriptUtils.isValid(close[dataIndex])) {
          windowValues.push(close[dataIndex]);
        }
      }
      if (windowValues.length >= min_periods) {
        const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
        const absoluteDeviations = windowValues.map(val => Math.abs(val - mean));
        const madValue = absoluteDeviations.reduce((a, b) => a + b, 0) / absoluteDeviations.length;
        mad.push(isFinite(madValue) ? madValue : null);
      } else {
        mad.push(null);
      }
    }
    return mad;
  }
  /**
   * Median 中位数指标
   * 计算滚动中位数，是简单移动平均线的姊妹指标
   * 这是 pandas_ta 标准的实现
   */
  static median(
    dataList: KLineData[] | any[],
    length: number = 30,
    min_periods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 30;
    min_periods = min_periods !== null ? Math.max(1, Math.floor(min_periods)) : length;
    if (dataList.length < Math.max(length, min_periods)) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const median: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < Math.max(length, min_periods) - 1) {
        median.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && ScriptUtils.isValid(close[dataIndex])) {
          windowValues.push(close[dataIndex]);
        }
      }
      if (windowValues.length >= min_periods) {
        const sortedValues = windowValues.slice().sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        let medianValue: number;
        if (sortedValues.length % 2 === 0) {
          medianValue = (sortedValues[mid - 1] + sortedValues[mid]) / 2;
        } else {
          medianValue = sortedValues[mid];
        }
        median.push(isFinite(medianValue) ? medianValue : null);
      } else {
        median.push(null);
      }
    }
    return median;
  }
  /**
   * Quantile 分位数指标
   * 计算滚动分位数，用于分析数据的分布特征
   * 这是 pandas_ta 标准的实现
   */
  static quantile(
    dataList: KLineData[] | any[],
    length: number = 30,
    q: number = 0.5,
    min_periods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 30;
    q = Math.max(0.001, Math.min(0.999, q)) || 0.5; // q必须在0到1之间
    min_periods = min_periods !== null ? Math.max(1, Math.floor(min_periods)) : length;
    if (dataList.length < Math.max(length, min_periods)) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const quantile: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < Math.max(length, min_periods) - 1) {
        quantile.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && ScriptUtils.isValid(close[dataIndex])) {
          windowValues.push(close[dataIndex]);
        }
      }
      if (windowValues.length >= min_periods) {
        const sortedValues = windowValues.slice().sort((a, b) => a - b);
        const n = sortedValues.length;
        if (n === 0) {
          quantile.push(null);
          continue;
        }
        const position = q * (n - 1);
        const lowerIndex = Math.floor(position);
        const upperIndex = Math.ceil(position);
        let quantileValue: number;
        if (lowerIndex === upperIndex) {
          quantileValue = sortedValues[lowerIndex];
        } else {
          const lowerValue = sortedValues[lowerIndex];
          const upperValue = sortedValues[upperIndex];
          const weight = position - lowerIndex;
          quantileValue = lowerValue + weight * (upperValue - lowerValue);
        }
        quantile.push(isFinite(quantileValue) ? quantileValue : null);
      } else {
        quantile.push(null);
      }
    }
    return quantile;
  }
  /**
   * Skew 偏度指标
   * 计算滚动偏度，用于衡量数据分布的偏斜程度
   * 这是 pandas_ta 标准的实现
   */
  static skew(
    dataList: KLineData[] | any[],
    length: number = 30,
    min_periods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 30;
    min_periods = min_periods !== null ? Math.max(1, Math.floor(min_periods)) : length;
    if (dataList.length < Math.max(length, min_periods)) {
      return [];
    }
    const skew: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < Math.max(length, min_periods) - 1) {
        skew.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0) {
          windowValues.push(dataList[dataIndex].close);
        }
      }
      if (windowValues.length >= min_periods) {
        const n = windowValues.length;
        if (n < 3) {
          skew.push(null);
          continue;
        }
        const mean = windowValues.reduce((a, b) => a + b, 0) / n;
        const variance = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        if (variance > 0) {
          const thirdMoment = windowValues.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
          const skewValue = thirdMoment / Math.pow(variance, 1.5);
          skew.push(isFinite(skewValue) ? skewValue : null);
        } else {
          skew.push(null);
        }
      } else {
        skew.push(null);
      }
    }
    return skew;
  }
  /**
   * HMA 赫尔移动平均
   * 公式: HMA = WMA(2 × WMA(n/2) - WMA(n), sqrt(n))
   */
  static hma(
    dataList: KLineData[] | any[],
    length: number = 10,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const halfLength = Math.floor(length / 2);
    const sqrtLength = Math.floor(Math.sqrt(length));
    const wmaf = Formula.wma(dataList, halfLength, key);  // WMA(n/2)
    const wmas = Formula.wma(dataList, length, key);       // WMA(n)
    const diffData = dataList.map((item, i) => {
      if (wmaf[i] === null || wmas[i] === null) return null;
      return 2 * wmaf[i]! - wmas[i]!;
    });
    const hma = Formula.wma(diffData, sqrtLength, null);
    return hma;
  }
  /**
   * LSMA 最小二乘移动平均
   * 基于线性回归的移动平均
   */
  static lsma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(1, parseInt(String(period)))
    return list.map((item, i) => {
      if (i < n - 1) return null
      const slice = list.slice(i - n + 1, i + 1)
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
      let validCount = 0
      slice.forEach((dataPoint, index) => {
        const x = index
        const y = Formula.getNumVal(key, dataPoint)
        if (ScriptUtils.isValid(y)) {
          sumX += x
          sumY += y
          sumXY += x * y
          sumXX += x * x
          validCount++
        }
      })
      if (validCount < n) return null
      const denominator = (n * sumXX - sumX * sumX)
      if (denominator === 0) return null
      const slope = (n * sumXY - sumX * sumY) / denominator
      const intercept = (sumY - slope * sumX) / n
      const result = slope * (n - 1) + intercept
      return isFinite(result) ? result : null
    })
  }
  /**
   * JMA Jurik移动平均（简化版本）
   * 这是一个复杂的专有算法，这里提供近似实现
   */
  static jma(list: any[], period: number, phase: number = 0, key: string | null = null): (number | null)[] {
    const length = Math.max(1, period)
    const phaseRatio = phase < -100 ? 0.5 : phase > 100 ? 2.5 : phase / 100 + 1.5
    const beta = 0.45 * (length - 1) / (0.45 * (length - 1) + 2)
    const alpha = Math.pow(beta, phaseRatio)
    let e0: number | null = null, e1: number | null = null, e2: number | null = null
    let ma1: number | null = null, det0: number | null = null, ma2: number | null = null, det1: number | null = null, jma: number | null = null
    return list.map((item, i) => {
      const price = Formula.getNumVal(key, item)
      if (!ScriptUtils.isValid(price)) return null
      if (e0 === null) {
        e0 = e1 = e2 = ma1 = ma2 = jma = price
        return price
      }
      e0 = (1 - alpha) * price + alpha * e0
      e1 = (price - e0) * (1 - beta) + beta * e1!
      e2 = (e0 + phaseRatio * e1 - jma!) * alpha * alpha + jma!
      ma1 = e2
      det0 = (ma1 - ma2!) * (0.5 * (length - 1) + 1) / length
      ma2 = ma1
      det1 = det0
      jma = ma1 + det1
      return isFinite(jma) ? jma : null
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
      const price = Formula.getNumVal(key, item)
      if (i === 0) {
        return prevMd = price
      }
      const md = prevMd + (price - prevMd) / (n * Math.pow(price / prevMd, 4))
      return prevMd = md
    })
  }
  /**
   * McGinley Dynamic Indicator (MCGD)
   * McGinley动态指标，看起来像移动平均线，但实际上是一种价格平滑机制
   */
  static mcgd(
    dataList: KLineData[] | any[],
    length: number = 10,
    c: number = 1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    c = Math.max(0.1, Math.min(1, c)) || 1; // 限制c在0.1到1之间
    if (dataList.length < length) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const mcgd: (number | null)[] = [];
    mcgd.push(close[0]);
    for (let i = 1; i < dataList.length; i++) {
      const currentClose = close[i];
      const prevClose = close[i - 1];
      const prevMcgd = mcgd[i - 1];
      if (currentClose !== null && prevClose !== null && prevMcgd !== null && prevClose !== 0) {
        const ratio = currentClose / prevClose;
        const denom = c * length * Math.pow(ratio, 4);
        if (Math.abs(denom) > 1e-10) { // 避免除零错误
          const mcgdValue = prevMcgd + ((currentClose - prevMcgd) / denom);
          mcgd.push(isFinite(mcgdValue) ? mcgdValue : currentClose);
        } else {
          mcgd.push(currentClose);
        }
      } else {
        mcgd.push(null);
      }
    }
    return mcgd;
  }
  /**
   * EDSMA Ehlers动态平滑移动平均
   */
  static edsma(list: any[], period: number, key: string | null = null): (number | null)[] {
    const n = Math.max(2, period)
    let prevEdsma = 0
    return list.map((item, i) => {
      const price = Formula.getNumVal(key, item)
      if (i === 0) {
        return prevEdsma = price
      }
      const alpha = 2 / (n + 1)
      const edsma = alpha * price + (1 - alpha) * prevEdsma
      return prevEdsma = edsma
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
   * STDEV 标准差指标（pandas_ta 标准实现）
   * 计算滚动标准差，用于衡量数据的离散程度
   * 这是 pandas_ta 标准的实现
   */
  static stdev(
    dataList: KLineData[] | any[],
    length: number = 30,
    ddof: number = 1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 30;
    ddof = Math.max(0, Math.min(ddof, length - 1)) || 1; // ddof必须在0到length-1之间
    if (dataList.length < length) {
      return [];
    }
    const stdev: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        stdev.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        let val = Formula.getNumVal(key, dataList[dataIndex]);
        if (dataIndex >= 0 && ScriptUtils.isValid(val)) {
          windowValues.push(val);
        }
      }
      if (windowValues.length >= length - ddof) {
        const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
        const variance = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (windowValues.length - ddof);
        if (variance > 0) {
          const stdevValue = Math.sqrt(variance);
          stdev.push(isFinite(stdevValue) ? stdevValue : null);
        } else {
          stdev.push(null);
        }
      } else {
        stdev.push(null);
      }
    }
    return stdev;
  }
  /**
   * VARIANCE 方差指标（pandas_ta 标准实现）
   * 计算滚动方差，用于衡量数据的离散程度
   * 这是 pandas_ta 标准的实现
   */
  static variance(
    dataList: KLineData[] | any[],
    length: number = 30,
    ddof: number = 0,
    min_periods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(2, Math.floor(length)) || 30;
    ddof = Math.max(0, Math.min(ddof, length - 1)) || 0; // ddof必须在0到length-1之间
    min_periods = min_periods !== null ? Math.max(1, Math.floor(min_periods)) : length;
    if (dataList.length < Math.max(length, min_periods)) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const variance: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < Math.max(length, min_periods) - 1) {
        variance.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && ScriptUtils.isValid(close[dataIndex])) {
          windowValues.push(close[dataIndex]);
        }
      }
      if (windowValues.length >= min_periods) {
        const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
        const varianceValue = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (windowValues.length - ddof);
        if (isFinite(varianceValue)) {
          variance.push(varianceValue);
        } else {
          variance.push(null);
        }
      } else {
        variance.push(null);
      }
    }
    return variance;
  }
  /**
   * ZSCORE Z分数指标（pandas_ta 标准实现）
   * 计算滚动Z分数，用于衡量数据点相对于均值的标准化距离
   * 这是 pandas_ta 标准的实现
   */
  static zscore(
    dataList: KLineData[] | any[],
    length: number = 30,
    std: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(2, Math.floor(length)) || 30;
    std = Math.max(0.1, parseFloat(String(std))) || 1; // std必须大于0
    if (dataList.length < length) {
      return [];
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    const zscore: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        zscore.push(null);
        continue;
      }
      const windowValues: number[] = [];
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && ScriptUtils.isValid(close[dataIndex])) {
          windowValues.push(close[dataIndex]);
        }
      }
      if (windowValues.length >= length) {
        const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
        const variance = windowValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowValues.length;
        const stdev = Math.sqrt(variance);
        if (stdev > 0) {
          const currentClose = close[i];
          if (ScriptUtils.isValid(currentClose)) {
            const zscoreValue = (currentClose - mean) / (std * stdev);
            zscore.push(isFinite(zscoreValue) ? zscoreValue : null);
          } else {
            zscore.push(null);
          }
        } else {
          zscore.push(null);
        }
      } else {
        zscore.push(null);
      }
    }
    return zscore;
  }
  /**
   * ADX 平均方向指数指标（pandas_ta 标准实现）
   * 用于衡量趋势强度，包含ADX、+DI和-DI三个指标
   * 这是 pandas_ta 标准的实现
   */
  static adx(
    dataList: KLineData[] | any[],
    length: number = 14,
    scalar: number = 100,
    mamode: string = "rma",
    drift: number = 1,
  ): { adx: (number | null)[], dmp: (number | null)[], dmn: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { adx: [], dmp: [], dmn: [] };
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = Math.max(0.1, parseFloat(String(scalar))) || 100;
    mamode = mamode || "rma";
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length + drift) {
      return { adx: [], dmp: [], dmn: [] };
    }
    const high: (number | null)[] = [];
    const low: (number | null)[] = [];
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const highPrice = (dataList as KLineData[])[i].high;
      const lowPrice = (dataList as KLineData[])[i].low;
      const closePrice = (dataList as KLineData[])[i].close;
      high.push(ScriptUtils.isValid(highPrice) ? highPrice : null);
      low.push(ScriptUtils.isValid(lowPrice) ? lowPrice : null);
      close.push(ScriptUtils.isValid(closePrice) ? closePrice : null);
    }
    const atr = Formula.atr(dataList, length);
    const up: (number | null)[] = [];
    const dn: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        up.push(null);
        dn.push(null);
        continue;
      }
      const currentHigh = high[i];
      const prevHigh = high[i - drift];
      const currentLow = low[i];
      const prevLow = low[i - drift];
      if (ScriptUtils.isValid(currentHigh) && ScriptUtils.isValid(prevHigh) &&
        ScriptUtils.isValid(currentLow) && ScriptUtils.isValid(prevLow)) {
        const upMove = currentHigh - prevHigh;
        const dnMove = prevLow - currentLow;
        up.push(upMove);
        dn.push(dnMove);
      } else {
        up.push(null);
        dn.push(null);
      }
    }
    const pos: (number | null)[] = [];
    const neg: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        pos.push(null);
        neg.push(null);
        continue;
      }
      const upMove = up[i];
      const dnMove = dn[i];
      if (ScriptUtils.isValid(upMove) && ScriptUtils.isValid(dnMove)) {
        if (upMove > dnMove && upMove > 0) {
          pos.push(upMove);
        } else {
          pos.push(0);
        }
        if (dnMove > upMove && dnMove > 0) {
          neg.push(dnMove);
        } else {
          neg.push(0);
        }
      } else {
        pos.push(null);
        neg.push(null);
      }
    }
    const dmp: (number | null)[] = [];
    const dmn: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        dmp.push(null);
        dmn.push(null);
        continue;
      }
      let posSum = 0;
      let posCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(pos[dataIndex])) {
          posSum += pos[dataIndex];
          posCount++;
        }
      }
      let negSum = 0;
      let negCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(neg[dataIndex])) {
          negSum += neg[dataIndex];
          negCount++;
        }
      }
      if (posCount > 0 && negCount > 0 && ScriptUtils.isValid(atr[i])) {
        const atrValue = atr[i];
        if (atrValue > 0) {
          const k = scalar / atrValue;
          dmp.push(k * (posSum / posCount));
          dmn.push(k * (negSum / negCount));
        } else {
          dmp.push(null);
          dmn.push(null);
        }
      } else {
        dmp.push(null);
        dmn.push(null);
      }
    }
    const dx: (number | null)[] = [];
    const adx: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        dx.push(null);
        adx.push(null);
        continue;
      }
      const currentDmp = dmp[i];
      const currentDmn = dmn[i];
      if (ScriptUtils.isValid(currentDmp) && ScriptUtils.isValid(currentDmn)) {
        const sum = currentDmp + currentDmn;
        if (sum > 0) {
          const dxValue = scalar * Math.abs(currentDmp - currentDmn) / sum;
          dx.push(dxValue);
        } else {
          dx.push(null);
        }
      } else {
        dx.push(null);
      }
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        adx.push(null);
        continue;
      }
      let dxSum = 0;
      let dxCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(dx[dataIndex])) {
          dxSum += dx[dataIndex];
          dxCount++;
        }
      }
      if (dxCount > 0) {
        adx.push(dxSum / dxCount);
      } else {
        adx.push(null);
      }
    }
    return { adx, dmp, dmn };
  }
  /**
   * AMAT Archer移动平均趋势指标（pandas_ta 标准实现）
   * 用于识别移动平均线的长期和短期趋势
   * 这是 pandas_ta 标准的实现
   */
  static amat(
    dataList: KLineData[] | any[],
    fast: number = 8,
    slow: number = 21,
    mamode: string = "ema",
    lookback: number = 2,
  ): { mas_long: (number | null)[], mas_short: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { mas_long: [], mas_short: [] };
    }
    fast = Math.max(1, Math.floor(fast)) || 8;
    slow = Math.max(1, Math.floor(slow)) || 21;
    lookback = Math.max(1, Math.floor(lookback)) || 2;
    mamode = mamode || "ema";
    const maxLength = Math.max(fast, slow, lookback);
    if (dataList.length < maxLength) {
      return { mas_long: [], mas_short: [] };
    }
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const price = (dataList as KLineData[])[i].close;
      close.push(ScriptUtils.isValid(price) ? price : null);
    }
    let fast_ma: (number | null)[] = [];
    let slow_ma: (number | null)[] = [];
    switch (mamode.toLowerCase()) {
      case "sma":
        fast_ma = Formula.sma(dataList, fast, "close");
        slow_ma = Formula.sma(dataList, slow, "close");
        break;
      case "ema":
        fast_ma = Formula.ema(dataList, fast, "close");
        slow_ma = Formula.ema(dataList, slow, "close");
        break;
      case "rma":
        fast_ma = Formula.rma(dataList, fast, "close");
        slow_ma = Formula.rma(dataList, slow, "close");
        break;
      case "hma":
        fast_ma = Formula.hma(dataList, fast, "close");
        slow_ma = Formula.hma(dataList, slow, "close");
        break;
      case "wma":
        fast_ma = Formula.wma(dataList, fast, "close");
        slow_ma = Formula.wma(dataList, slow, "close");
        break;
      default:
        fast_ma = Formula.ema(dataList, fast, "close");
        slow_ma = Formula.ema(dataList, slow, "close");
        break;
    }
    const mas_long: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < lookback - 1) {
        mas_long.push(null);
        continue;
      }
      let longCount = 0;
      for (let j = 0; j < lookback; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(fast_ma[dataIndex]) && ScriptUtils.isValid(slow_ma[dataIndex])) {
          if (fast_ma[dataIndex] > slow_ma[dataIndex]) {
            longCount++;
          }
        }
      }
      mas_long.push(longCount > lookback / 2 ? 1 : 0);
    }
    const mas_short: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < lookback - 1) {
        mas_short.push(null);
        continue;
      }
      let shortCount = 0;
      for (let j = 0; j < lookback; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(fast_ma[dataIndex]) && ScriptUtils.isValid(slow_ma[dataIndex])) {
          if (fast_ma[dataIndex] < slow_ma[dataIndex]) {
            shortCount++;
          }
        }
      }
      mas_short.push(shortCount > lookback / 2 ? 1 : 0);
    }
    return { mas_long, mas_short };
  }
  /**
   * AROON Aroon指标和Aroon振荡器（pandas_ta 标准实现）
   * 用于识别趋势的强度和方向，包含Aroon Up、Aroon Down和Aroon Oscillator
   * 这是 pandas_ta 标准的实现
   */
  static aroon(
    dataList: KLineData[] | any[],
    length: number = 14,
    scalar: number = 100,
  ): { aroon_up: (number | null)[], aroon_down: (number | null)[], aroon_osc: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { aroon_up: [], aroon_down: [], aroon_osc: [] };
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = Math.max(0.1, parseFloat(String(scalar))) || 100;
    if (dataList.length < length + 1) {
      return { aroon_up: [], aroon_down: [], aroon_osc: [] };
    }
    const high: (number | null)[] = [];
    const low: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const highPrice = (dataList as KLineData[])[i].high;
      const lowPrice = (dataList as KLineData[])[i].low;

      high.push(ScriptUtils.isValid(highPrice) ? highPrice : null);
      low.push(ScriptUtils.isValid(lowPrice) ? lowPrice : null);
    }
    const aroon_up: (number | null)[] = [];
    const aroon_down: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        aroon_up.push(null);
        aroon_down.push(null);
        continue;
      }
      let periodsFromHh = 0;
      let highestHigh = -Infinity;
      let highestIndex = i;
      for (let j = 0; j <= length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(high[dataIndex])) {
          if (high[dataIndex] > highestHigh) {
            highestHigh = high[dataIndex];
            highestIndex = dataIndex;
          }
        }
      }
      periodsFromHh = i - highestIndex;
      let periodsFromLl = 0;
      let lowestLow = Infinity;
      let lowestIndex = i;
      for (let j = 0; j <= length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(low[dataIndex])) {
          if (low[dataIndex] < lowestLow) {
            lowestLow = low[dataIndex];
            lowestIndex = dataIndex;
          }
        }
      }
      periodsFromLl = i - lowestIndex;
      const aroonUpValue = scalar * (1 - (periodsFromHh / length));
      const aroonDownValue = scalar * (1 - (periodsFromLl / length));
      aroon_up.push(isFinite(aroonUpValue) ? aroonUpValue : null);
      aroon_down.push(isFinite(aroonDownValue) ? aroonDownValue : null);
    }
    const aroon_osc: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        aroon_osc.push(null);
        continue;
      }
      const upValue = aroon_up[i];
      const downValue = aroon_down[i];
      if (ScriptUtils.isValid(upValue) && ScriptUtils.isValid(downValue)) {
        const oscValue = upValue - downValue;
        aroon_osc.push(isFinite(oscValue) ? oscValue : null);
      } else {
        aroon_osc.push(null);
      }
    }
    return { aroon_up, aroon_down, aroon_osc };
  }
  /**
   * CHOP Choppiness Index震荡指数（pandas_ta 标准实现）
   * 用于判断市场是震荡（横向交易）还是趋势（单向交易）
   * 这是 pandas_ta 标准的实现
   */
  static chop(
    dataList: KLineData[] | any[],
    length: number = 14,
    atr_length: number = 1,
    scalar: number = 100,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    atr_length = Math.max(1, Math.floor(atr_length)) || 1;
    scalar = Math.max(0.1, parseFloat(String(scalar))) || 100;
    drift = Math.floor(drift) || 1;
    if (dataList.length < Math.max(length, atr_length)) {
      return [];
    }
    const high: (number | null)[] = [];
    const low: (number | null)[] = [];
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const highPrice = (dataList as KLineData[])[i].high;
      const lowPrice = (dataList as KLineData[])[i].low;
      const closePrice = (dataList as KLineData[])[i].close;
      high.push(ScriptUtils.isValid(highPrice) ? highPrice : null);
      low.push(ScriptUtils.isValid(lowPrice) ? lowPrice : null);
      close.push(ScriptUtils.isValid(closePrice) ? closePrice : null);
    }
    const chop: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        chop.push(null);
        continue;
      }
      let highest = -Infinity;
      let lowest = Infinity;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(high[dataIndex]) && ScriptUtils.isValid(low[dataIndex])) {
          highest = Math.max(highest, high[dataIndex]);
          lowest = Math.min(lowest, low[dataIndex]);
        }
      }
      const priceRange = highest - lowest;
      let atrSum = 0;
      let atrCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0) {
          let tr = 0;
          if (dataIndex > 0 && ScriptUtils.isValid(high[dataIndex]) && ScriptUtils.isValid(low[dataIndex]) && ScriptUtils.isValid(close[dataIndex - 1])) {
            const highLow = high[dataIndex] - low[dataIndex];
            const highClose = Math.abs(high[dataIndex] - close[dataIndex - 1]);
            const lowClose = Math.abs(low[dataIndex] - close[dataIndex - 1]);

            tr = Math.max(highLow, highClose, lowClose);
          } else if (ScriptUtils.isValid(high[dataIndex]) && ScriptUtils.isValid(low[dataIndex])) {
            tr = high[dataIndex] - low[dataIndex];
          }
          if (tr > 0) {
            atrSum += tr;
            atrCount++;
          }
        }
      }
      if (atrCount > 0 && priceRange > 0 && atrSum > 0) {
        const log10ATRSum = Math.log10(atrSum);
        const log10PriceRange = Math.log10(priceRange);
        const log10Length = Math.log10(length);
        const chopValue = scalar * (log10ATRSum - log10PriceRange) / log10Length;
        chop.push(isFinite(chopValue) ? chopValue : null);
      } else {
        chop.push(null);
      }
    }
    return chop;
  }
  /**
   * CKSP Chande Kroll Stop（pandas_ta 标准实现）
   * 趋势跟踪指标，通过计算平均真实波幅来识别止损点
   * 这是 pandas_ta 标准的实现
   */
  static cksp(
    dataList: KLineData[] | any[],
    p: number = 10,
    x: number = 1,
    q: number = 9,
    tvmode: boolean = true
  ): { long_stop: (number | null)[], short_stop: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { long_stop: [], short_stop: [] };
    }
    p = Math.max(1, Math.floor(p)) || 10;
    x = Math.max(0.1, parseFloat(String(x))) || (tvmode ? 1 : 3);
    q = Math.max(1, Math.floor(q)) || (tvmode ? 9 : 20);
    tvmode = Boolean(tvmode);
    const _length = Math.max(p, q, x);
    if (dataList.length < _length) {
      return { long_stop: [], short_stop: [] };
    }
    const high: (number | null)[] = [];
    const low: (number | null)[] = [];
    const close: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const highPrice = (dataList as KLineData[])[i].high;
      const lowPrice = (dataList as KLineData[])[i].low;
      const closePrice = (dataList as KLineData[])[i].close;
      high.push(ScriptUtils.isValid(highPrice) ? highPrice : null);
      low.push(ScriptUtils.isValid(lowPrice) ? lowPrice : null);
      close.push(ScriptUtils.isValid(closePrice) ? closePrice : null);
    }
    const atr: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < p - 1) {
        atr.push(null);
        continue;
      }
      let trSum = 0;
      let validCount = 0;
      for (let j = 0; j < p; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0) {
          let tr = 0;
          if (dataIndex > 0 && ScriptUtils.isValid(high[dataIndex]) && ScriptUtils.isValid(low[dataIndex]) && ScriptUtils.isValid(close[dataIndex - 1])) {
            const highLow = high[dataIndex] - low[dataIndex];
            const highClose = Math.abs(high[dataIndex] - close[dataIndex - 1]);
            const lowClose = Math.abs(low[dataIndex] - close[dataIndex - 1]);
            tr = Math.max(highLow, highClose, lowClose);
          } else if (ScriptUtils.isValid(high[dataIndex]) && ScriptUtils.isValid(low[dataIndex])) {
            tr = high[dataIndex] - low[dataIndex];
          }
          if (tr > 0) {
            trSum += tr;
            validCount++;
          }
        }
      }
      if (validCount > 0) {
        const atrValue = trSum / validCount;
        atr.push(isFinite(atrValue) ? atrValue : null);
      } else {
        atr.push(null);
      }
    }
    const long_stop: (number | null)[] = [];
    const short_stop: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < _length - 1) {
        long_stop.push(null);
        short_stop.push(null);
        continue;
      }
      let longStop0 = -Infinity;
      let shortStop0 = Infinity;
      for (let j = 0; j < p; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && ScriptUtils.isValid(high[dataIndex]) && ScriptUtils.isValid(low[dataIndex]) && ScriptUtils.isValid(atr[dataIndex])) {
          const ls0 = high[dataIndex] - x * atr[dataIndex];
          const ss0 = low[dataIndex] + x * atr[dataIndex];

          longStop0 = Math.max(longStop0, ls0);
          shortStop0 = Math.min(shortStop0, ss0);
        }
      }
      let longStop = -Infinity;
      let shortStop = Infinity;
      for (let j = 0; j < q; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0 && dataIndex < long_stop.length && long_stop[dataIndex] !== null) {
          const ls0 = long_stop[dataIndex];
          if (ls0 !== null) {
            longStop = Math.max(longStop, ls0);
          }
        }
        if (dataIndex >= 0 && dataIndex < short_stop.length && short_stop[dataIndex] !== null) {
          const ss0 = short_stop[dataIndex];
          if (ss0 !== null) {
            shortStop = Math.min(shortStop, ss0);
          }
        }
      }
      if (longStop === -Infinity) {
        longStop = longStop0;
      }
      if (shortStop === Infinity) {
        shortStop = shortStop0;
      }
      long_stop.push(isFinite(longStop) ? longStop : null);
      short_stop.push(isFinite(shortStop) ? shortStop : null);
    }
    return { long_stop, short_stop };
  }
  /**
   * DECAY 衰减指标（pandas_ta 标准实现）
   * 从先前的信号（如交叉）向前创建衰减
   * 这是 pandas_ta 标准的实现
   */
  static decay(
    dataList: KLineData[] | any[],
    length: number = 5,
    mode: string = "linear",
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 5;
    mode = (mode || "linear").toLowerCase();
    if (dataList.length < length) {
      return [];
    }
    const decay: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const currentClose = dataList[i].close;
      if (i === 0) {
        decay.push(currentClose);
        continue;
      }
      if (i < length) {
        decay.push(currentClose);
        continue;
      }
      const previousClose = dataList[i - 1].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(previousClose)) {
        decay.push(null);
        continue;
      }
      let diff: number;
      if (mode === "exp") {
        diff = previousClose - Math.exp(-length);
      } else {
        diff = previousClose - (1 / length);
      }
      const decayValue = Math.max(currentClose, diff, 0);
      decay.push(isFinite(decayValue) ? decayValue : null);
    }
    return decay;
  }
  /**
   * DECREASING 递减指标（pandas_ta 标准实现）
   * 判断价格序列是否在指定周期内递减
   * 这是 pandas_ta 标准的实现
   */
  static decreasing(
    dataList: KLineData[] | any[],
    length: number = 1,
    strict: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 1;
    strict = Boolean(strict);
    if (dataList.length < length) {
      return [];
    }
    const decreasing: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        decreasing.push(null);
        continue;
      }
      let isDecreasing: boolean;
      if (strict) {
        let strictlyDecreasing = true;
        for (let j = 0; j < length; j++) {
          const currentIndex = i - j;
          const nextIndex = i - j - 1;
          if (currentIndex >= 0 && nextIndex >= 0) {
            if (dataList[currentIndex].close >= dataList[nextIndex].close) {
              strictlyDecreasing = false;
              break;
            }
          } else {
            strictlyDecreasing = false;
            break;
          }
        }
        isDecreasing = strictlyDecreasing;
      } else {
        const currentClose = dataList[i].close;
        const previousClose = dataList[i - length].close;
        if (ScriptUtils.isValid(currentClose) && ScriptUtils.isValid(previousClose)) {
          isDecreasing = (currentClose - previousClose) < 0;
        } else {
          isDecreasing = false;
        }
      }
      decreasing.push(isDecreasing ? 1 : 0);
    }
    return decreasing;
  }
  /**
   * DPO Detrend Price Oscillator（pandas_ta 标准实现）
   * 去趋势价格振荡器，用于去除价格趋势，使周期更容易识别
   * 这是 pandas_ta 标准的实现
   */
  static dpo(
    dataList: KLineData[] | any[],
    length: number = 20,
    centered: boolean = true,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 20;
    centered = Boolean(centered);
    if (dataList.length < length) {
      return [];
    }
    const dpo: (number | null)[] = [];
    const t = Math.floor(0.5 * length) + 1;
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        dpo.push(null);
        continue;
      }
      let sum = 0;
      let count = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0) {
          sum += dataList[dataIndex].close;
          count++;
        }
      }
      if (count === 0) {
        dpo.push(null);
        continue;
      }
      const sma = sum / count;
      let dpoValue: number;
      if (centered) {
        const shiftedClose = i + t < dataList.length ? dataList[i + t].close : null;
        if (shiftedClose !== null && ScriptUtils.isValid(shiftedClose)) {
          dpoValue = shiftedClose - sma;
        } else {
          dpoValue = 0;
        }
      } else {
        const shiftedSma = i - t >= 0 ? sma : 0;
        dpoValue = dataList[i].close - shiftedSma;
      }
      dpo.push(isFinite(dpoValue) ? dpoValue : null);
    }
    return dpo;
  }
  /**
   * INCREASING 递增指标（pandas_ta 标准实现）
   * 判断价格序列是否在指定周期内递增
   * 这是 pandas_ta 标准的实现
   */
  static increasing(
    dataList: KLineData[] | any[],
    length: number = 1,
    strict: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 1;
    strict = Boolean(strict);
    if (dataList.length < length) {
      return [];
    }
    const increasing: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        // 不足周期的数据点，返回null
        increasing.push(null);
        continue;
      }
      let isIncreasing: boolean;
      if (strict) {
        let strictlyIncreasing = true;
        for (let j = 0; j < length; j++) {
          const currentIndex = i - j;
          const nextIndex = i - j - 1;
          if (currentIndex >= 0 && nextIndex >= 0) {
            if (dataList[currentIndex].close <= dataList[nextIndex].close) {
              strictlyIncreasing = false;
              break;
            }
          } else {
            strictlyIncreasing = false;
            break;
          }
        }
        isIncreasing = strictlyIncreasing;
      } else {
        const currentClose = dataList[i].close;
        const previousClose = dataList[i - length].close;
        if (ScriptUtils.isValid(currentClose) && ScriptUtils.isValid(previousClose)) {
          isIncreasing = (currentClose - previousClose) > 0;
        } else {
          isIncreasing = false;
        }
      }
      increasing.push(isIncreasing ? 1 : 0);
    }
    return increasing;
  }
  /**
   * LONG_RUN 长跑指标（pandas_ta 标准实现）
   * 基于快速和慢速移动平均线的趋势分析，识别潜在的底部和上升趋势
   * 这是 pandas_ta 标准的实现
   */
  static longRun(
    fast: (number | null)[],
    slow: (number | null)[],
    length: number = 2,
  ): (number | null)[] {
    if (!Array.isArray(fast) || !Array.isArray(slow) || fast.length === 0 || slow.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 2;
    const minLength = Math.max(length, 2);
    if (fast.length < minLength || slow.length < minLength) {
      return [];
    }
    const longRun: (number | null)[] = [];
    for (let i = 0; i < Math.min(fast.length, slow.length); i++) {
      if (i < minLength - 1) {
        longRun.push(null);
        continue;
      }
      let fastIncreasing = false;
      let slowDecreasing = false;
      let fastIncreasing2 = false;
      let slowIncreasing = false;
      if (i >= length && ScriptUtils.isValid(fast[i]) && ScriptUtils.isValid(fast[i - length])) {
        fastIncreasing = fast[i] > fast[i - length];
      }
      if (i >= length && ScriptUtils.isValid(slow[i]) && ScriptUtils.isValid(slow[i - length])) {
        slowDecreasing = slow[i] < slow[i - length];
      }
      if (i >= length && ScriptUtils.isValid(fast[i]) && ScriptUtils.isValid(fast[i - length])) {
        fastIncreasing2 = fast[i] > fast[i - length];
      }
      if (i >= length && ScriptUtils.isValid(slow[i]) && ScriptUtils.isValid(slow[i - length])) {
        slowIncreasing = slow[i] > slow[i - length];
      }
      const pb = fastIncreasing && slowDecreasing;
      const bi = fastIncreasing2 && slowIncreasing;
      const longRunValue = pb || bi;
      longRun.push(longRunValue ? 1 : 0);
    }
    return longRun;
  }
  /**
   * PSAR Parabolic Stop and Reverse（pandas_ta 标准实现）
   * 抛物线止损反转指标，用于趋势跟踪和止损
   * 这是 pandas_ta 标准的实现
   */
  static psar(
    dataList: KLineData[] | any[],
    af: number = 0.02,
    maxAf: number = 0.2,
  ): { long: (number | null)[]; short: (number | null)[]; af: (number | null)[]; reversal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { long: [], short: [], af: [], reversal: [] };
    }
    af = Math.max(0.001, Math.min(af, 1)) || 0.02;
    maxAf = Math.max(0.001, Math.min(maxAf, 1)) || 0.2;
    if (dataList.length < 3) {
      return { long: [], short: [], af: [], reversal: [] };
    }
    const m = dataList.length;
    const af0 = af;
    let bullish = true;
    let highPoint = dataList[0].high;
    let lowPoint = dataList[0].low;
    const long: (number | null)[] = [];
    const short: (number | null)[] = [];
    const reversal: (number | null)[] = [];
    const _af: (number | null)[] = [];
    for (let i = 0; i < 2; i++) {
      long.push(null);
      short.push(null);
      reversal.push(0);
      _af.push(af0);
    }
    for (let i = 2; i < m; i++) {
      let reverse = false;
      _af.push(af);
      if (bullish) {
        let sarValue = (long[i - 1] || dataList[i - 1].low || 0) + af * (highPoint - (long[i - 1] || dataList[i - 1].low || 0));
        if (dataList[i].low && sarValue && dataList[i].low < sarValue) {
          bullish = false;
          reverse = true;
          af = af0;
          sarValue = highPoint;
          lowPoint = dataList[i].low;
        }
        long.push(sarValue);
        short.push(null);
      } else {
        let sarValue = (short[i - 1] || dataList[i - 1].high || 0) + af * (lowPoint - (short[i - 1] || dataList[i - 1].high || 0));
        if (dataList[i].high && sarValue && dataList[i].high > sarValue) {
          bullish = true;
          reverse = true;
          af = af0;
          sarValue = lowPoint;
          highPoint = dataList[i].high;
        }
        long.push(null);
        short.push(sarValue);
      }
      reversal.push(reverse ? 1 : 0);
      if (!reverse) {
        if (bullish) {
          // 多头模式下的调整
          if (dataList[i].high && dataList[i].high > highPoint) {
            highPoint = dataList[i].high;
            af = Math.min(af + af0, maxAf);
          }
          if (long[i] !== null) {
            if (dataList[i - 1].low && dataList[i - 1].low < long[i]) {
              long[i] = dataList[i - 1].low;
            }
            if (dataList[i - 2].low && dataList[i - 2].low < long[i]) {
              long[i] = dataList[i - 2].low;
            }
          }
        } else {
          if (dataList[i].low && dataList[i].low < lowPoint) {
            lowPoint = dataList[i].low;
            af = Math.min(af + af0, maxAf);
          }
          if (short[i] !== null) {
            if (dataList[i - 1].high && dataList[i - 1].high > short[i]) {
              short[i] = dataList[i - 1].high;
            }
            if (dataList[i - 2].high && dataList[i - 2].high > short[i]) {
              short[i] = dataList[i - 2].high;
            }
          }
        }
      }
    }
    return { long, short, af: _af, reversal };
  }
  /**
   * QSTICK Q Stick指标（pandas_ta 标准实现）
   * 由Tushar Chande开发的Q Stick指标，用于量化和识别K线图中的趋势
   * 这是 pandas_ta 标准的实现
   */
  static qstick(
    dataList: KLineData[] | any[],
    length: number = 10,
    ma: string = 'sma',
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    ma = ma.toLowerCase() || 'sma';
    if (dataList.length < length) {
      return [];
    }
    const diff: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const openPrice = (dataList as KLineData[])[i].open;
      const closePrice = (dataList as KLineData[])[i].close;
      if (ScriptUtils.isValid(openPrice) && ScriptUtils.isValid(closePrice)) {
        diff.push(closePrice - openPrice);
      } else {
        diff.push(null);
      }
    }
    let qstick: (number | null)[] = [];
    // 将 number[] 转换为 KLineData[] 格式
    const diffAsKLineData = diff.map((val, idx) => ({
      timestamp: dataList[idx]?.timestamp || 0,
      open: val || 0,
      high: val || 0,
      low: val || 0,
      close: val || 0,
      volume: 0
    })) as any[];
    switch (ma) {
      case 'dema':
        qstick = Formula.dema(diffAsKLineData, length);
        break;
      case 'ema':
        qstick = Formula.ema(diff, length);
        break;
      case 'hma':
        qstick = Formula.hma(diff, length);
        break;
      case 'rma':
        qstick = Formula.rma(diff, length);
        break;
      case 'sma':
      default:
        qstick = Formula.sma(diff, length);
        break;
    }
    return qstick;
  }
  /**
   * SHORT_RUN 短跑指标（pandas_ta 标准实现）
   * 基于快速和慢速移动平均线的趋势分析，识别潜在的顶部和下降趋势
   * 这是 pandas_ta 标准的实现
   */
  static short_run(
    fast: (number | null)[],
    slow: (number | null)[],
    length: number = 2,
  ): (number | null)[] {
    if (!Array.isArray(fast) || !Array.isArray(slow) || fast.length === 0 || slow.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 2;
    const minLength = Math.max(length, 2);
    if (fast.length < minLength || slow.length < minLength) {
      return [];
    }
    const shortRun: (number | null)[] = [];
    for (let i = 0; i < Math.min(fast.length, slow.length); i++) {
      if (i < minLength - 1) {
        shortRun.push(null);
        continue;
      }
      let fastDecreasing = false;
      let slowIncreasing = false;
      let fastDecreasing2 = false;
      let slowDecreasing = false;
      if (i >= length && ScriptUtils.isValid(fast[i]) && ScriptUtils.isValid(fast[i - length])) {
        fastDecreasing = fast[i] < fast[i - length];
      }
      if (i >= length && ScriptUtils.isValid(slow[i]) && ScriptUtils.isValid(slow[i - length])) {
        slowIncreasing = slow[i] > slow[i - length];
      }
      if (i >= length && ScriptUtils.isValid(fast[i]) && ScriptUtils.isValid(fast[i - length])) {
        fastDecreasing2 = fast[i] < fast[i - length];
      }
      if (i >= length && ScriptUtils.isValid(slow[i]) && ScriptUtils.isValid(slow[i - length])) {
        slowDecreasing = slow[i] < slow[i - length];
      }
      const pt = fastDecreasing && slowIncreasing;
      const bd = fastDecreasing2 && slowDecreasing;
      const shortRunValue = pt || bd;
      shortRun.push(shortRunValue ? 1 : 0);
    }
    return shortRun;
  }
  /**
   * TTM_TREND TTM Trend指标（pandas_ta 标准实现）
   * 来自John Carter的《Mastering the Trade》一书，用于绘制绿色或红色K线
   * 检查价格是否高于或低于前几个周期的平均价格
   * 这是 pandas_ta 标准的实现
   */
  static ttm_trend(
    dataList: KLineData[] | any[],
    length: number = 6,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 6;
    if (dataList.length < length) {
      return [];
    }
    const ttmTrend: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        ttmTrend.push(null);
        continue;
      }
      let trendAvg = 0;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0) {
          const highPrice = (dataList as KLineData[])[dataIndex].high;
          const lowPrice = (dataList as KLineData[])[dataIndex].low;
          if (ScriptUtils.isValid(highPrice) && ScriptUtils.isValid(lowPrice)) {
            const hl2 = (highPrice + lowPrice) / 2;
            trendAvg += hl2;
            validCount++;
          }
        }
      }
      if (validCount >= length) {
        trendAvg = trendAvg / length;
        const currentClose = (dataList as KLineData[])[i].close;
        if (ScriptUtils.isValid(currentClose)) {
          const trendValue = currentClose > trendAvg ? 1 : -1;
          ttmTrend.push(trendValue);
        } else {
          ttmTrend.push(null);
        }
      } else {
        ttmTrend.push(null);
      }
    }
    return ttmTrend;
  }
  /**
   * VORTEX Vortex指标（pandas_ta 标准实现）
   * 两个振荡器，用于捕获正向和负向趋势运动
   * 这是 pandas_ta 标准的实现
   */
  static vortex(
    dataList: KLineData[] | any[],
    length: number = 14,
    drift: number = 1,
  ): { vip: (number | null)[]; vim: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { vip: [], vim: [] };
    }
    length = Math.max(1, Math.floor(length)) || 14;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const minLength = Math.max(length, drift);
    if (dataList.length < minLength) {
      return { vip: [], vim: [] };
    }
    const vip: (number | null)[] = [];
    const vim: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < minLength - 1) {
        vip.push(null);
        vim.push(null);
        continue;
      }
      let tr = 0;
      if (i > 0) {
        const currentHigh = (dataList as KLineData[])[i].high;
        const currentLow = (dataList as KLineData[])[i].low;
        const previousClose = (dataList as KLineData[])[i - 1].close;
        if (ScriptUtils.isValid(currentHigh) && ScriptUtils.isValid(currentLow) && ScriptUtils.isValid(previousClose)) {
          const hl = Math.abs(currentHigh - currentLow);
          const hc = Math.abs(currentHigh - previousClose);
          const lc = Math.abs(currentLow - previousClose);
          tr = Math.max(hl, hc, lc);
        }
      }
      let vmp = 0;
      let vmm = 0;
      if (i >= drift) {
        const currentHigh = (dataList as KLineData[])[i].high;
        const currentLow = (dataList as KLineData[])[i].low;
        const previousHigh = (dataList as KLineData[])[i - drift].high;
        const previousLow = (dataList as KLineData[])[i - drift].low;
        if (ScriptUtils.isValid(currentHigh) && ScriptUtils.isValid(currentLow) &&
          ScriptUtils.isValid(previousHigh) && ScriptUtils.isValid(previousLow)) {
          vmp = Math.abs(currentHigh - previousLow);
          vmm = Math.abs(currentLow - previousHigh);
        }
      }
      if (i >= length - 1) {
        let trSum = 0;
        let vmpSum = 0;
        let vmmSum = 0;
        let validCount = 0;
        for (let j = 0; j < length; j++) {
          const dataIndex = i - j;
          if (dataIndex >= 0) {
            if (dataIndex > 0) {
              const high = (dataList as KLineData[])[dataIndex].high;
              const low = (dataList as KLineData[])[dataIndex].low;
              const prevClose = (dataList as KLineData[])[dataIndex - 1].close;
              if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low) && ScriptUtils.isValid(prevClose)) {
                const hl = Math.abs(high - low);
                const hc = Math.abs(high - prevClose);
                const lc = Math.abs(low - prevClose);
                const currentTr = Math.max(hl, hc, lc);
                trSum += currentTr;
              }
            }
            if (dataIndex >= drift) {
              const high = (dataList as KLineData[])[dataIndex].high;
              const low = (dataList as KLineData[])[dataIndex].low;
              const prevHigh = (dataList as KLineData[])[dataIndex - drift].high;
              const prevLow = (dataList as KLineData[])[dataIndex - drift].low;
              if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low) &&
                ScriptUtils.isValid(prevHigh) && ScriptUtils.isValid(prevLow)) {
                vmpSum += Math.abs(high - prevLow);
                vmmSum += Math.abs(low - prevHigh);
              }
            }
            validCount++;
          }
        }
        if (validCount >= length && trSum > 0) {
          const vipValue = vmpSum / trSum;
          const vimValue = vmmSum / trSum;
          vip.push(vipValue);
          vim.push(vimValue);
        } else {
          vip.push(null);
          vim.push(null);
        }
      } else {
        vip.push(null);
        vim.push(null);
      }
    }
    return { vip, vim };
  }
  /**
   * ABERRATION Aberration指标（pandas_ta 标准实现）
   * 一个类似于Keltner Channels的波动性指标
   * 这是 pandas_ta 标准的实现
   */
  static aberration(
    dataList: KLineData[] | any[],
    length: number = 5,
    atrLength: number = 15,
  ): { zg: (number | null)[]; sg: (number | null)[]; xg: (number | null)[]; atr: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { zg: [], sg: [], xg: [], atr: [] };
    }
    length = Math.max(1, Math.floor(length)) || 5;
    atrLength = Math.max(1, Math.floor(atrLength)) || 15;
    const minLength = Math.max(atrLength, length);
    if (dataList.length < minLength) {
      return { zg: [], sg: [], xg: [], atr: [] };
    }
    const zg: (number | null)[] = [];
    const sg: (number | null)[] = [];
    const xg: (number | null)[] = [];
    const atr: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < minLength - 1) {
        zg.push(null);
        sg.push(null);
        xg.push(null);
        atr.push(null);
        continue;
      }
      const currentHigh = (dataList as KLineData[])[i].high;
      const currentLow = (dataList as KLineData[])[i].low;
      const currentClose = (dataList as KLineData[])[i].close;
      if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) || !ScriptUtils.isValid(currentClose)) {
        zg.push(null);
        sg.push(null);
        xg.push(null);
        atr.push(null);
        continue;
      }
      let atrValue = 0;
      if (i >= atrLength - 1) {
        let trSum = 0;
        let validCount = 0;
        for (let j = 0; j < atrLength; j++) {
          const dataIndex = i - j;
          if (dataIndex > 0) {
            const high = (dataList as KLineData[])[dataIndex].high;
            const low = (dataList as KLineData[])[dataIndex].low;
            const prevClose = (dataList as KLineData[])[dataIndex - 1].close;

            if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low) && ScriptUtils.isValid(prevClose)) {
              const hl = Math.abs(high - low);
              const hc = Math.abs(high - prevClose);
              const lc = Math.abs(low - prevClose);
              const currentTr = Math.max(hl, hc, lc);
              trSum += currentTr;
              validCount++;
            }
          }
        }
        if (validCount > 0) {
          atrValue = trSum / validCount;
        }
      }
      let zgValue = 0;
      if (i >= length - 1) {
        let hlc3Sum = 0;
        let validCount = 0;
        for (let j = 0; j < length; j++) {
          const dataIndex = i - j;
          if (dataIndex >= 0) {
            const high = (dataList as KLineData[])[dataIndex].high;
            const low = (dataList as KLineData[])[dataIndex].low;
            const close = (dataList as KLineData[])[dataIndex].close;

            if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low) && ScriptUtils.isValid(close)) {
              const currentHlc3 = (high + low + close) / 3;
              hlc3Sum += currentHlc3;
              validCount++;
            }
          }
        }
        if (validCount > 0) {
          zgValue = hlc3Sum / validCount;
        }
      }
      const sgValue = zgValue + atrValue;
      const xgValue = zgValue - atrValue;
      zg.push(zgValue > 0 ? zgValue : null);
      sg.push(sgValue > 0 ? sgValue : null);
      xg.push(xgValue > 0 ? xgValue : null);
      atr.push(atrValue > 0 ? atrValue : null);
    }
    return { zg, sg, xg, atr };
  }
  /**
   * ACCBANDS Acceleration Bands加速带指标（pandas_ta 标准实现）
   * 由Price Headley创建，在简单移动平均线周围绘制上下包络带
   * 这是 pandas_ta 标准的实现
   */
  static accbands(
    dataList: KLineData[] | any[],
    length: number = 20,
    c: number = 4,
    drift: number = 1,
    mamode: string = 'sma',
  ): { lower: (number | null)[]; mid: (number | null)[]; upper: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { lower: [], mid: [], upper: [] };
    }
    length = Math.max(1, Math.floor(length)) || 20;
    c = Math.max(0.1, c) || 4;
    drift = Math.max(1, Math.floor(drift)) || 1;
    mamode = mamode?.toLowerCase() || 'sma';
    const minLength = Math.max(length, drift);
    if (dataList.length < minLength) {
      return { lower: [], mid: [], upper: [] };
    }
    const lower: (number | null)[] = [];
    const mid: (number | null)[] = [];
    const upper: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < minLength - 1) {
        lower.push(null);
        mid.push(null);
        upper.push(null);
        continue;
      }
      const currentHigh = (dataList as KLineData[])[i].high;
      const currentLow = (dataList as KLineData[])[i].low;
      const currentClose = (dataList as KLineData[])[i].close;
      if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) || !ScriptUtils.isValid(currentClose)) {
        lower.push(null);
        mid.push(null);
        upper.push(null);
        continue;
      }
      const highLowRange = currentHigh - currentLow;
      const highLowSum = currentHigh + currentLow;
      if (highLowSum === 0) {
        lower.push(null);
        mid.push(null);
        upper.push(null);
        continue;
      }
      const hlRatio = (c * highLowRange) / highLowSum;
      const lowValue = currentLow * (1 - hlRatio);
      const highValue = currentHigh * (1 + hlRatio);
      let lowerValue = 0;
      let midValue = 0;
      let upperValue = 0;
      if (i >= length - 1) {
        let lowSum = 0;
        let closeSum = 0;
        let highSum = 0;
        let validCount = 0;
        for (let j = 0; j < length; j++) {
          const dataIndex = i - j;
          if (dataIndex >= 0) {
            const high = (dataList as KLineData[])[dataIndex].high;
            const low = (dataList as KLineData[])[dataIndex].low;
            const close = (dataList as KLineData[])[dataIndex].close;
            if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low) && ScriptUtils.isValid(close)) {
              const range = high - low;
              const sum = high + low;
              if (sum !== 0) {
                const ratio = (c * range) / sum;
                const lowVal = low * (1 - ratio);
                const highVal = high * (1 + ratio);
                lowSum += lowVal;
                closeSum += close;
                highSum += highVal;
                validCount++;
              }
            }
          }
        }
        if (validCount > 0) {
          if (mamode === 'ema') {
            const alpha = 2 / (length + 1);
            if (i === length - 1) {
              lowerValue = lowSum / validCount;
              midValue = closeSum / validCount;
              upperValue = highSum / validCount;
            } else {
              const prevLower = lower[i - 1];
              const prevMid = mid[i - 1];
              const prevUpper = upper[i - 1];
              if (prevLower !== null && prevMid !== null && prevUpper !== null) {
                lowerValue = alpha * (lowValue) + (1 - alpha) * prevLower;
                midValue = alpha * currentClose + (1 - alpha) * prevMid;
                upperValue = alpha * (highValue) + (1 - alpha) * prevUpper;
              } else {
                lowerValue = lowSum / validCount;
                midValue = closeSum / validCount;
                upperValue = highSum / validCount;
              }
            }
          } else {
            lowerValue = lowSum / validCount;
            midValue = closeSum / validCount;
            upperValue = highSum / validCount;
          }
        }
      }
      lower.push(lowerValue > 0 ? lowerValue : null);
      mid.push(midValue > 0 ? midValue : null);
      upper.push(upperValue > 0 ? upperValue : null);
    }
    return { lower, mid, upper };
  }
  /**
   * SLOPE 线性回归斜率（修正版本）
   */
  static slope(
    dataList: KLineData[],
    length: number = 1,
    as_angle: boolean = false,
    to_degrees: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 1;
    as_angle = Boolean(as_angle);
    to_degrees = Boolean(to_degrees);
    if (dataList.length < length) {
      return [];
    }
    const slope: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        slope.push(null);
        continue;
      }
      const currentClose = dataList[i].close;
      const previousClose = dataList[i - length].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(previousClose)) {
        slope.push(null);
        continue;
      }
      let slopeValue = (currentClose - previousClose) / length;
      if (as_angle) {
        slopeValue = Math.atan(slopeValue);
        if (to_degrees) {
          slopeValue *= 180 / Math.PI;
        }
      }
      slope.push(slopeValue);
    }
    return slope;
  }
  /**
 * 线性回归 (Linear Regression)
 * @param dataList 数据数组
 * @param period 回归周期
 * @param offset 偏移量（正数向前偏移，负数向后偏移）
 * @param key 数据字段名
 * @returns 线性回归值数组
 */
  /**
   * Linear Regression Moving Average (LINREG)
   * 线性回归移动平均线，这是一个简化版的标准线性回归
   */
  static linreg(
    dataList: KLineData[] | any[],
    length: number = 14,
    angle: boolean = false,
    intercept: boolean = false,
    degrees: boolean = false,
    r: boolean = false,
    slope: boolean = false,
    tsf: boolean = false,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    if (dataList.length < length) {
      return [];
    }
    const x = Array.from({ length }, (_, i) => i + 1); // [1, 2, ..., n]
    const xSum = 0.5 * length * (length + 1);
    const x2Sum = xSum * (2 * length + 1) / 3;
    const divisor = length * x2Sum - xSum * xSum;
    const linearRegression = (series: number[]): number => {
      if (series.length !== length) return 0;
      let ySum = 0;
      let xySum = 0;
      for (let i = 0; i < length; i++) {
        ySum += series[i];
        xySum += x[i] * series[i];
      }
      const m = (length * xySum - xSum * ySum) / divisor;
      if (slope) {
        return m;
      }
      const b = (ySum * x2Sum - xSum * xySum) / divisor;
      if (intercept) {
        return b;
      }
      if (angle) {
        let theta = Math.atan(m);
        if (degrees) {
          theta *= 180 / Math.PI;
        }
        return theta;
      }
      if (r) {
        let y2Sum = 0;
        for (let i = 0; i < length; i++) {
          y2Sum += series[i] * series[i];
        }
        const rn = length * xySum - xSum * ySum;
        const rd = Math.sqrt(divisor * (length * y2Sum - ySum * ySum));
        if (Math.abs(rd) < 1e-10) return 0;
        return rn / rd;
      }
      if (tsf) {
        return m * length + b; // 时间序列预测值
      } else {
        return m * (length - 1) + b; // 标准线性回归值
      }
    };
    const result: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      try {
        const windowData: number[] = [];
        for (let j = 0; j < length; j++) {
          const index = i - length + 1 + j;
          if (index >= 0 && index < dataList.length) {
            const price = Formula.getNumVal(key, dataList[index]);
            if (ScriptUtils.isValid(price)) {
              windowData.push(price);
            } else {
              windowData.push(0);
            }
          }
        }
        if (windowData.length === length) {
          const regressionValue = linearRegression(windowData);
          result.push(isFinite(regressionValue) ? regressionValue : null);
        } else {
          result.push(null);
        }
      } catch (error) {
        result.push(null);
      }
    }
    return result;
  }
  /**
   * Midpoint 中点指标
   * 计算指定周期内最高价和最低价的中点
   */
  static midpoint(
    dataList: KLineData[] | any[],
    length: number = 2,
    minPeriods: number | null = null,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 2;
    minPeriods = minPeriods !== null ? Math.max(1, Math.floor(minPeriods)) : length;
    if (dataList.length < Math.max(length, minPeriods)) {
      return [];
    }
    const midpoint: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < minPeriods - 1) {
        midpoint.push(null);
        continue;
      }
      let highest = -Infinity;
      let lowest = Infinity;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0) {
          const price = Formula.getNumVal(key, dataList[dataIndex]);
          if (ScriptUtils.isValid(price)) {
            highest = Math.max(highest, price);
            lowest = Math.min(lowest, price);
            validCount++;
          }
        }
      }
      if (validCount >= minPeriods) {
        const midpointValue = 0.5 * (lowest + highest);
        midpoint.push(isFinite(midpointValue) ? midpointValue : null);
      } else {
        midpoint.push(null);
      }
    }
    return midpoint;
  }
  /**
   * Midprice 中间价格指标
   * 计算指定周期内最高价和最低价的中点，专门用于处理high和low数据
   */
  static midprice(
    dataList: KLineData[] | any[],
    length: number = 2,
    minPeriods: number | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 2;
    minPeriods = minPeriods !== null ? Math.max(1, Math.floor(minPeriods)) : length;
    const _length = Math.max(length, minPeriods);
    if (dataList.length < _length) {
      return [];
    }
    const midprice: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < minPeriods - 1) {
        midprice.push(null);
        continue;
      }
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - j;
        if (dataIndex >= 0) {
          const high = dataList[dataIndex].high;
          const low = dataList[dataIndex].low;
          if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low)) {
            highestHigh = Math.max(highestHigh, high);
            lowestLow = Math.min(lowestLow, low);
            validCount++;
          }
        }
      }
      if (validCount >= minPeriods) {
        const midpriceValue = 0.5 * (lowestLow + highestHigh);
        midprice.push(isFinite(midpriceValue) ? midpriceValue : null);
      } else {
        midprice.push(null);
      }
    }
    return midprice;
  }
  /**
   * PWMA Pascal's Weighted Moving Average
   * 帕斯卡加权移动平均线，基于帕斯卡三角形的权重
   */
  static pwma(
    dataList: KLineData[] | any[],
    length: number = 10,
    asc: boolean = true,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    asc = Boolean(asc);
    if (dataList.length < length) {
      return [];
    }
    const triangle = Formula.generatePascalsTriangle(length - 1, asc);
    const pwma: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        pwma.push(null);
        continue;
      }
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        const price = Formula.getNumVal(key, dataList[dataIndex]);
        if (ScriptUtils.isValid(price)) {
          sum += price * triangle[j];
          weightSum += triangle[j];
        }
      }
      pwma.push(weightSum > 0 ? sum / weightSum : null);
    }
    return pwma;
  }
  /**
   * 生成帕斯卡三角形权重数组
   * @param n 帕斯卡三角形的行数
   * @param asc 是否升序（最近的值权重更大）
   * @returns 帕斯卡三角形权重数组
   */
  private static generatePascalsTriangle(n: number, asc: boolean = true): number[] {
    const weights: number[] = [];
    for (let i = 0; i <= n; i++) {
      if (i === 0 || i === n) {
        weights.push(1);
      } else {
        let numerator = 1;
        let denominator = 1;
        for (let j = 0; j < i; j++) {
          numerator *= (n - j);
          denominator *= (j + 1);
        }
        weights.push(numerator / denominator);
      }
    }
    if (asc) {
      return weights;
    } else {
      return weights.reverse();
    }
  }
  /**
   * SINWMA Sine Weighted Moving Average
   * 正弦加权移动平均线，使用正弦周期作为权重
   */
  static sinwma(
    dataList: KLineData[] | any[],
    length: number = 14,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    if (dataList.length < length) {
      return [];
    }
    const sines = Formula.generateSineWeights(length);
    const weights = sines.map(sine => sine / sines.reduce((sum, val) => sum + val, 0));
    const sinwma: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        sinwma.push(null);
        continue;
      }
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < Math.min(length, dataList.length - (i - length + 1)); j++) {
        const dataIndex = i - length + 1 + j;
        if (dataIndex >= 0 && dataIndex < dataList.length) {
          const price = Formula.getNumVal(key, dataList[dataIndex]);
          if (ScriptUtils.isValid(price)) {
            sum += price * weights[j];
            weightSum += weights[j];
          }
        }
      }
      sinwma.push(weightSum > 0 ? sum / weightSum : null);
    }
    return sinwma;
  }
  /**
   * 生成正弦权重数组
   * @param length 计算周期
   * @returns 正弦权重数组
   */
  private static generateSineWeights(length: number): number[] {
    const sines: number[] = [];
    for (let i = 0; i < length; i++) {
      const sine = Math.sin((i + 1) * Math.PI / (length + 1));
      sines.push(sine);
    }
    return sines;
  }
  /**
   * SSF Ehler's Super Smoother Filter
   * 约翰·F·埃勒斯的超级平滑滤波器，用于减少滞后并去除混叠噪声
   * 这是 pandas_ta 标准的实现
   */
  static ssf(
    dataList: KLineData[] | any[],
    length: number = 10,
    poles: number = 2,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    poles = poles === 3 ? 3 : 2; // 只允许2或3个极点
    if (dataList.length < length) {
      return [];
    }
    const ssf: (number | null)[] = [];
    const m = dataList.length;
    for (let i = 0; i < Math.min(poles, m); i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      ssf.push(ScriptUtils.isValid(price) ? price : null);
    }
    if (poles === 3) {
      const x = Math.PI / length; // x = PI / n
      const a0 = Math.exp(-x); // e^(-x)
      const b0 = 2 * a0 * Math.cos(Math.sqrt(3) * x); // 2e^(-x)*cos(3^(.5) * x)
      const c0 = a0 * a0; // e^(-2x)
      const c4 = c0 * c0; // e^(-4x)
      const c3 = -c0 * (1 + b0); // -e^(-2x) * (1 + 2e^(-x)*cos(3^(.5) * x))
      const c2 = c0 + b0; // e^(-2x) + 2e^(-x)*cos(3^(.5) * x)
      const c1 = 1 - c2 - c3 - c4;
      for (let i = poles; i < m; i++) {
        const currentPrice = Formula.getNumVal(key, dataList[i]);
        if (!ScriptUtils.isValid(currentPrice)) {
          ssf.push(null);
          continue;
        }
        let ssfValue = c1 * currentPrice;
        if (i - 1 >= 0 && ssf[i - 1] !== null) {
          ssfValue += c2 * (ssf[i - 1] || 0);
        }
        if (i - 2 >= 0 && ssf[i - 2] !== null) {
          ssfValue += c3 * (ssf[i - 2] || 0);
        }
        if (i - 3 >= 0 && ssf[i - 3] !== null) {
          ssfValue += c4 * (ssf[i - 3] || 0);
        }
        ssf.push(ssfValue);
      }
    } else {
      const x = Math.PI * Math.sqrt(2) / length; // x = PI * 2^(.5) / n
      const a0 = Math.exp(-x); // e^(-x)
      const a1 = -a0 * a0; // -e^(-2x)
      const b1 = 2 * a0 * Math.cos(x); // 2e^(-x)*cos(x)
      const c1 = 1 - a1 - b1; // e^(-2x) - 2e^(-x)*cos(x) + 1
      for (let i = poles; i < m; i++) {
        const currentPrice = Formula.getNumVal(key, dataList[i]);
        if (!ScriptUtils.isValid(currentPrice)) {
          ssf.push(null);
          continue;
        }
        let ssfValue = c1 * currentPrice;
        if (i - 1 >= 0 && ssf[i - 1] !== null) {
          ssfValue += b1 * (ssf[i - 1] || 0);
        }
        if (i - 2 >= 0 && ssf[i - 2] !== null) {
          ssfValue += a1 * (ssf[i - 2] || 0);
        }
        ssf.push(ssfValue);
      }
    }
    return ssf;
  }
  /**
   * Supertrend 超级趋势指标
   * 用于帮助识别趋势方向、设置止损、识别支撑阻力以及生成买卖信号
   * 这是 pandas_ta 标准的实现
   */
  static supertrend(
    dataList: KLineData[] | any[],
    length: number = 7,
    multiplier: number = 3.0,
  ): { trend: (number | null)[], direction: (number | null)[], long: (number | null)[], short: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { trend: [], direction: [], long: [], short: [] };
    }
    length = Math.max(1, Math.floor(length)) || 7;
    multiplier = Math.max(0.1, parseFloat(multiplier.toString())) || 3.0;
    if (dataList.length < length) {
      return { trend: [], direction: [], long: [], short: [] };
    }
    const m = dataList.length;
    const direction: (number | null)[] = new Array(m).fill(1); // 默认方向为1（看涨）
    const trend: (number | null)[] = new Array(m).fill(null);
    const long: (number | null)[] = new Array(m).fill(null);
    const short: (number | null)[] = new Array(m).fill(null);
    const hl2: (number | null)[] = [];
    for (let i = 0; i < m; i++) {
      const high = dataList[i].high;
      const low = dataList[i].low;
      if (ScriptUtils.isValid(high) && ScriptUtils.isValid(low)) {
        hl2.push((high + low) / 2);
      } else {
        hl2.push(null);
      }
    }
    const atrValues = Formula.atr(dataList, length);
    const upperband: (number | null)[] = [];
    const lowerband: (number | null)[] = [];
    for (let i = 0; i < m; i++) {
      if (hl2[i] !== null && atrValues[i] !== null) {
        const mid = multiplier * atrValues[i]!;
        upperband.push(hl2[i]! + mid);
        lowerband.push(hl2[i]! - mid);
      } else {
        upperband.push(null);
        lowerband.push(null);
      }
    }
    for (let i = 1; i < m; i++) {
      const currentClose = dataList[i].close;
      const prevUpperband = upperband[i - 1];
      const prevLowerband = lowerband[i - 1];
      if (!ScriptUtils.isValid(currentClose) || prevUpperband === null || prevLowerband === null) {
        continue;
      }
      if (currentClose > prevUpperband) {
        direction[i] = 1; // 看涨
      } else if (currentClose < prevLowerband) {
        direction[i] = -1; // 看跌
      } else {
        direction[i] = direction[i - 1]; // 保持前一个方向
        if (direction[i] === 1 && lowerband[i] !== null && prevLowerband !== null) {
          if (lowerband[i]! < prevLowerband) {
            lowerband[i] = prevLowerband;
          }
        }
        if (direction[i] === -1 && upperband[i] !== null && prevUpperband !== null) {
          if (upperband[i]! > prevUpperband) {
            upperband[i] = prevUpperband;
          }
        }
      }
      if (direction[i] === 1) {
        trend[i] = long[i] = lowerband[i];
        short[i] = null;
      } else {
        trend[i] = short[i] = upperband[i];
        long[i] = null;
      }
    }
    return { trend, direction, long, short };
  }
  /**
   * SWMA Symmetric Weighted Moving Average
   * 对称加权移动平均线，权重基于对称三角形分布
   * 这是 pandas_ta 标准的实现
   */
  static swma(
    dataList: KLineData[] | any[],
    length: number = 10,
    asc: boolean = true,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    asc = asc !== false; // 默认为true
    if (dataList.length < length) {
      return [];
    }
    const weights = Formula.generateSymmetricTriangleWeights(length);
    const swma: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        swma.push(null);
        continue;
      }
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < length; j++) {
        const dataIndex = i - length + 1 + j;
        const price = Formula.getNumVal(key, dataList[dataIndex]);
        if (ScriptUtils.isValid(price)) {
          const weight = asc ? weights[j] : weights[length - 1 - j];
          sum += price * weight;
          weightSum += weight;
        }
      }
      swma.push(weightSum > 0 ? sum / weightSum : null);
    }
    return swma;
  }
  /**
   * 生成对称三角形权重
   * 例如：n=3 -> [1, 2, 1], n=4 -> [1, 2, 2, 1], n=5 -> [1, 2, 3, 2, 1]
   */
  private static generateSymmetricTriangleWeights(length: number): number[] {
    const weights: number[] = [];
    const mid = Math.floor(length / 2);
    for (let i = 0; i < length; i++) {
      if (length % 2 === 0) {
        // 偶数长度：n=4 -> [1, 2, 2, 1], n=6 -> [1, 2, 3, 3, 2, 1]
        if (i < mid) {
          weights.push(i + 1);
        } else {
          weights.push(length - i);
        }
      } else {
        // 奇数长度：n=3 -> [1, 2, 1], n=5 -> [1, 2, 3, 2, 1]
        if (i <= mid) {
          weights.push(i + 1);
        } else {
          weights.push(length - i);
        }
      }
    }
    return weights;
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
   * 返回列表平均值
   */
  static avg(list: any[], key: string | null = null, precision: number = 4): number {
    let sum = 0
    let count = 0
    list.forEach(item => {
      const val = Formula.getNumVal(key, item)
      if (ScriptUtils.isValid(val)) {
        sum += val
        count++
      }
    })
    return count > 0 ? Number((sum / count).toFixed(precision)) : 0
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
        const val = Formula.getNumVal(key, list[i])
        if (ScriptUtils.isValid(val)) {
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
        const val = Formula.getNumVal(key, list[i])

        if (ScriptUtils.isValid(val)) {
          lowest = lowest === null ? val : Math.min(lowest, val)
        }
      }
      return lowest
    })
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
        if (ScriptUtils.isValid(_n)) {
          arrA = list1
          n = _n
        }
      }
    } else if (Array.isArray(list2)) {
      const _n = Number(list1)
      if (ScriptUtils.isValid(_n)) {
        arrA = list2
        n = _n
      }
    }
    if (!arrA) return []
    let prevA: number, prevB: number
    return arrA.map((item, index) => {
      if (n === null && arrB === null) return null
      const aVal = Formula.getNumVal(key, item)
      let bVal: number
      if (n === null && arrB) {
        bVal = Formula.getNumVal(key, arrB[index])
      } else {
        bVal = n!
      }
      let result: CrossSignal | null = null
      if (index > 0) {
        if (ScriptUtils.isValid(prevA) && ScriptUtils.isValid(prevB) && ScriptUtils.isValid(aVal) && ScriptUtils.isValid(bVal)) {
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
      const aVal = Formula.getNumVal(key, item)
      let bVal: number

      if (Array.isArray(list2)) {
        bVal = Formula.getNumVal(key, list2[index])
      } else {
        bVal = Formula.getNumVal(key, list2)
      }
      let result: ThroughSignal | null = null
      if (index > 0) {
        if (ScriptUtils.isValid(prevA) && ScriptUtils.isValid(prevB) && ScriptUtils.isValid(aVal) && ScriptUtils.isValid(bVal)) {
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
      const aVal = Formula.getNumVal(key, item)
      let bVal: number
      if (Array.isArray(list2)) {
        bVal = Formula.getNumVal(key, list2[index])
      } else {
        bVal = Formula.getNumVal(key, list2)
      }
      let result: ThroughSignal | null = null
      if (index > 0) {
        if (ScriptUtils.isValid(prevA) && ScriptUtils.isValid(prevB) && ScriptUtils.isValid(aVal) && ScriptUtils.isValid(bVal)) {
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
   * KDJ指标（pandas_ta标准版本）
   * KDJ指标实际上是慢速随机指标的派生形式，唯一的区别是增加了一条J线
   * J线表示%D值与%K值的背离，J值可以超出[0, 100]范围
   */
  static kdj(
    dataList: KLineData[],
    length: number = 9,
    signal: number = 3,
  ): { k: (number | null)[], d: (number | null)[], j: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { k: [], d: [], j: [] };
    }
    length = Math.max(1, Math.floor(length)) || 9;
    signal = Math.max(1, Math.floor(signal)) || 3;
    const maxLength = Math.max(length, signal);
    if (dataList.length < maxLength) {
      return { k: [], d: [], j: [] };
    }
    const k: (number | null)[] = [];
    const d: (number | null)[] = [];
    const j: (number | null)[] = [];
    const highestHigh: (number | null)[] = [];
    const lowestLow: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        highestHigh.push(null);
        lowestLow.push(null);
        continue;
      }
      let maxHigh = -Infinity;
      let minLow = Infinity;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const barIndex = i - j;
        if (barIndex >= 0 && dataList[barIndex]) {
          const bar = dataList[barIndex];
          if (ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low)) {
            maxHigh = Math.max(maxHigh, bar.high);
            minLow = Math.min(minLow, bar.low);
            validCount++;
          }
        }
      }
      if (validCount === 0) {
        highestHigh.push(null);
        lowestLow.push(null);
        continue;
      }
      highestHigh.push(maxHigh);
      lowestLow.push(minLow);
    }
    const fastK: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      const highest = highestHigh[i];
      const lowest = lowestLow[i];
      if (!bar || highest === null || lowest === null ||
        !ScriptUtils.isValid(bar.close) ||
        !ScriptUtils.isValid(bar.high) ||
        !ScriptUtils.isValid(bar.low)) {
        fastK.push(null);
        continue;
      }
      const range = highest - lowest;
      if (range === 0) {
        fastK.push(0);
        continue;
      }
      const fastKValue = 100 * (bar.close - lowest) / range;
      fastK.push(fastKValue);
    }
    const kValues = Formula.rma(fastK, signal);
    const dValues = Formula.rma(kValues, signal);
    for (let i = 0; i < dataList.length; i++) {
      const kVal = kValues[i];
      const dVal = dValues[i];

      if (kVal === null || dVal === null) {
        j.push(null);
        continue;
      }
      j.push(3 * kVal - 2 * dVal);
    }
    return { k: kValues, d: dValues, j };
  }
  /**
   * BOLL布林带指标（修正版本）
   */
  static boll(
    list: any[],
    num1: number = 20,
    num2: number = 2,
    key: string | null = null
  ): BOLLResult[] {
    const period = num1
    let sum = 0
    return list.map((item, i) => {
      const val = Formula.getNumVal(key, item)
      const boll: BOLLResult = {}
      if (i < period - 1) {
        sum += val
        return boll
      }
      if (i === period - 1) {
        sum += val
      } else {
        const oldVal = Formula.getNumVal(key, list[i - period])
        sum = sum - oldVal + val
      }
      boll.mid = sum / period
      let variance = 0
      for (let j = i - period + 1; j <= i; j++) {
        const dataVal = Formula.getNumVal(key, list[j])
        variance += Math.pow(dataVal - boll.mid, 2)
      }
      const std = Math.sqrt(variance / period)
      boll.ub = boll.mid + num2 * std
      boll.lb = boll.mid - num2 * std
      return boll
    })
  }
  /**
   * MACD指标（pandas_ta标准版本）
   * Moving Average Convergence Divergence
   * 移动平均收敛发散指标
   */
  static macd(
    dataList: KLineData[],
    fast: number = 12,
    slow: number = 26,
    signal: number = 9,
  ): { macd: (number | null)[], histogram: (number | null)[], signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { macd: [], histogram: [], signal: [] };
    }
    fast = Math.max(1, Math.floor(fast)) || 12;
    slow = Math.max(1, Math.floor(slow)) || 26;
    signal = Math.max(1, Math.floor(signal)) || 9;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const maxLength = Math.max(fast, slow, signal);
    if (dataList.length < maxLength) {
      return { macd: [], histogram: [], signal: [] };
    }
    const fastma = Formula.ema(dataList, fast, 'close');
    const slowma = Formula.ema(dataList, slow, 'close');
    const macd: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const fastVal = fastma[i];
      const slowVal = slowma[i];
      if (fastVal === null || slowVal === null) {
        macd.push(null);
        continue;
      }
      macd.push(fastVal - slowVal);
    }
    const signalma = Formula.ema(macd, signal);
    const histogram: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const macdVal = macd[i];
      const signalVal = signalma[i];
      if (macdVal === null || signalVal === null) {
        histogram.push(null);
        continue;
      }
      histogram.push(macdVal - signalVal);
    }
    return { macd, histogram, signal: signalma };
  }
  /**
   * 计算真实波动幅度 (TR) - pandas_ta 标准实现
   * True Range is the greatest of the current high less the current low,
   * the absolute value of the current high less the previous close,
   * and the absolute value of the current low less the previous close.
   */
  static tr(
    dataList: KLineData[],
    drift: number = 1
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < drift) {
      return [];
    }
    const tr: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        tr.push(null);
        continue;
      }
      const current = dataList[i];
      const previous = dataList[i - drift];
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      tr.push(Math.max(tr1, tr2, tr3));
    }
    return tr;
  }
  /**
   * 计算真实波动幅度均值 (ATR) - pandas_ta 标准实现
   * Average True Range is used to measure volatility, especially volatility caused by
   * gaps or limit moves.
   */
  static atr(
    dataList: KLineData[],
    length: number = 14,
    mamode: string = "rma",
    drift: number = 1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    drift = Math.max(1, Math.floor(drift)) || 1;
    mamode = mamode.toLowerCase();
    if (dataList.length < Math.max(length, drift)) {
      return [];
    }
    const tr = Formula.tr(dataList, drift);
    let atr: (number | null)[];
    switch (mamode) {
      case 'sma':
        atr = Formula.sma(tr, length, key);
        break;
      case 'ema':
        atr = Formula.ema(tr, length, key);
        break;
      case 'wma':
        atr = Formula.wma(tr, length, key);
        break;
      case 'rma':
      default:
        atr = Formula.rma(tr, length, key);
        break;
    }
    return atr;
  }
  /**
   * ATR 使用RMA计算的真实波动幅度均值
   */
  static atrWithRMA(list: KLineData[], period: number = 14): (number | null)[] {
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
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
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
    const atr = Formula.rma(dmiData, period, 'tr')
    const smoothedDMPlus = Formula.rma(dmiData, period, 'dmPlus')
    const smoothedDMMinus = Formula.rma(dmiData, period, 'dmMinus')
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
    const dxForRMA = dx.map((val, i) => ({ dx: val || 0 }))
    return Formula.rma(dxForRMA, period, 'dx')
  }
  /**
   * Relative Strength Index (RSI)
   * 相对强弱指标，按照 pandas_ta 标准：使用 RMA (Wilder's Smoothing) 计算
   */
  static rsi(
    dataList: KLineData[],
    length: number = 14,
    scalar: number = 100,
    drift: number = 1,
    key: string | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = Math.max(0.1, scalar) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < Math.max(length, drift)) {
      return [];
    }
    const diff: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        diff.push(null);
        continue;
      }
      const currentClose = Formula.getNumVal(key, dataList[i]);
      const prevClose = Formula.getNumVal(key, dataList[i - drift]);
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose)) {
        diff.push(null);
        continue;
      }
      diff.push(currentClose - prevClose);
    }
    const positive: (number | null)[] = [];
    const negative: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const diffValue = diff[i];
      if (diffValue === null) {
        positive.push(null);
        negative.push(null);
        continue;
      }
      positive.push(diffValue > 0 ? diffValue : 0);
      negative.push(diffValue < 0 ? Math.abs(diffValue) : 0);
    }
    const positiveAvg = Formula.rma(positive, length);
    const negativeAvg = Formula.rma(negative, length);
    const rsi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const posAvg = positiveAvg[i];
      const negAvg = negativeAvg[i];
      if (posAvg === null || negAvg === null) {
        rsi.push(null);
        continue;
      }
      const denominator = posAvg + negAvg;
      if (denominator === 0) {
        rsi.push(0);
        continue;
      }
      rsi.push(scalar * posAvg / denominator);
    }
    return rsi;
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
   * 动量指标（pandas_ta标准版本）
   * Momentum (MOM)
   * 用于衡量价格变化的速度和强度
   */
  static mom(
    dataList: KLineData[],
    length: number = 1,
    key: string | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 1;
    if (dataList.length < length) {
      return [];
    }
    const momentum: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        momentum.push(null);
        continue;
      }
      const currentVal = Formula.getNumVal(key, dataList[i]);
      const pastVal = Formula.getNumVal(key, dataList[i - length]);
      if (!ScriptUtils.isValid(currentVal) || !ScriptUtils.isValid(pastVal)) {
        momentum.push(null);
        continue;
      }
      momentum.push(currentVal - pastVal);
    }
    return momentum;
  }
  /**
   * Pretty Good Oscillator (PGO)
   * 由Mark Johnson创建的突破系统指标
   * 衡量当前收盘价与其N日简单移动平均线的距离，以类似期间的平均真实波幅表示
   */
  static pgo(
    dataList: KLineData[],
    length: number = 14,
    key: string | null = null,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    if (dataList.length < length) {
      return [];
    }
    const atr = Formula.atr(dataList, length);
    const sma = Formula.sma(dataList, length);
    const emaAtr = Formula.ema(atr, length);
    const pgo: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const close = Formula.getNumVal(key, dataList[i]);
      const smaVal = sma[i];
      const emaAtrVal = emaAtr[i];
      if (!ScriptUtils.isValid(close) || smaVal === null || emaAtrVal === null || emaAtrVal === 0) {
        pgo.push(null);
        continue;
      }
      const pgoValue = (close - smaVal) / emaAtrVal;
      pgo.push(pgoValue);
    }
    return pgo;
  }
  /**
   * Percentage Price Oscillator (PPO)
   * 百分比价格振荡器，与MACD类似，用于衡量动量
   * 计算快速和慢速简单移动平均线之间的百分比差值
   */
  static ppo(
    dataList: KLineData[],
    fast: number = 12,
    slow: number = 26,
    signal: number = 9,
    scalar: number = 100,
  ): { ppo: (number | null)[], histogram: (number | null)[], signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { ppo: [], histogram: [], signal: [] };
    }
    fast = Math.max(1, Math.floor(fast)) || 12;
    slow = Math.max(1, Math.floor(slow)) || 26;
    signal = Math.max(1, Math.floor(signal)) || 9;
    scalar = Math.max(0.1, scalar) || 100;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const maxLength = Math.max(fast, slow, signal);
    if (dataList.length < maxLength) {
      return { ppo: [], histogram: [], signal: [] };
    }
    const fastma = Formula.sma(dataList, fast);
    const slowma = Formula.sma(dataList, slow);
    const ppo: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const fastVal = fastma[i];
      const slowVal = slowma[i];
      if (fastVal === null || slowVal === null || slowVal === 0) {
        ppo.push(null);
        continue;
      }
      const ppoValue = scalar * (fastVal - slowVal) / slowVal;
      ppo.push(ppoValue);
    }
    const signalma = Formula.ema(ppo, signal);
    const histogram: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const ppoVal = ppo[i];
      const signalVal = signalma[i];
      if (ppoVal === null || signalVal === null) {
        histogram.push(null);
        continue;
      }
      histogram.push(ppoVal - signalVal);
    }
    return { ppo, histogram, signal: signalma };
  }
  /**
   * 符号函数（类似numpy.sign）
   * 返回数字的符号：正数返回1，负数返回-1，零返回0
   */
  private static sign(value: number): number {
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  }
  /**
   * Psychological Line (PSL)
   * 心理线是一个振荡器类型的指标，比较上升期间的数量与总期间数量的比例
   * 在给定期间内收盘价高于前一根K线的K线百分比
   */
  static psl(
    dataList: KLineData[],
    length: number = 12,
    scalar: number = 100,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 12;
    scalar = Math.max(0.1, scalar) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < Math.max(length, drift)) {
      return [];
    }
    const diff: number[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        diff.push(0);
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - drift].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose)) {
        diff.push(0);
        continue;
      }
      const difference = currentClose - prevClose;
      const signValue = Formula.sign(difference);
      diff.push(signValue > 0 ? 1 : 0);
    }
    const psl: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        psl.push(null);
        continue;
      }
      let sum = 0;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const index = i - j;
        if (index >= 0 && diff[index] !== undefined) {
          sum += diff[index];
          validCount++;
        }
      }
      if (validCount === 0) {
        psl.push(null);
        continue;
      }
      const pslValue = scalar * sum / length;
      psl.push(pslValue);
    }
    return psl;
  }
  /**
   * Percentage Volume Oscillator (PVO)
   * 百分比成交量振荡器是一个基于成交量的动量振荡器指标
   * 通过比较快速和慢速成交量移动平均线的差异来衡量成交量的动量变化
   */
  static pvo(
    dataList: KLineData[],
    fast: number = 12,
    slow: number = 26,
    signal: number = 9,
    scalar: number = 100,
  ): { pvo: (number | null)[]; histogram: (number | null)[]; signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { pvo: [], histogram: [], signal: [] };
    }
    fast = Math.max(1, Math.floor(fast)) || 12;
    slow = Math.max(1, Math.floor(slow)) || 26;
    signal = Math.max(1, Math.floor(signal)) || 9;
    scalar = Math.max(0.1, scalar) || 100;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const maxPeriod = Math.max(fast, slow, signal);
    if (dataList.length < maxPeriod) {
      return { pvo: [], histogram: [], signal: [] };
    }
    const volumes = dataList.map(bar => bar.volume || 0);
    const fastMA = Formula.ema(volumes, fast);
    const slowMA = Formula.ema(volumes, slow);
    const pvo: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < slow - 1) {
        pvo.push(null);
        continue;
      }
      const fastValue = fastMA[i];
      const slowValue = slowMA[i];
      if (fastValue === null || slowValue === null || slowValue === 0) {
        pvo.push(null);
        continue;
      }
      const pvoValue = scalar * (fastValue - slowValue) / slowValue;
      pvo.push(pvoValue);
    }
    const signalMA = Formula.ema(pvo, signal);
    const histogram: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const pvoValue = pvo[i];
      const signalValue = signalMA[i];
      if (pvoValue === null || signalValue === null) {
        histogram.push(null);
        continue;
      }
      histogram.push(pvoValue - signalValue);
    }
    return {
      pvo: pvo,
      histogram: histogram,
      signal: signalMA
    };
  }
  /**
   * Quantitative Qualitative Estimation (QQE)
   * 定量定性估计(QQE)是一个类似SuperTrend的指标
   * 使用平滑的RSI和上下轨道，轨道宽度使用Wilder平滑和因子4.236
   */
  static qqe(
    dataList: KLineData[],
    length: number = 14,
    smooth: number = 5,
    factor: number = 4.236,
    mamode: string = 'ema',
    drift: number = 1,
  ): { qqe: (number | null)[]; rsi_ma: (number | null)[]; qqe_long: (number | null)[]; qqe_short: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { qqe: [], rsi_ma: [], qqe_long: [], qqe_short: [] };
    }
    length = Math.max(1, Math.floor(length)) || 14;
    smooth = Math.max(1, Math.floor(smooth)) || 5;
    factor = Math.max(0.1, factor) || 4.236;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const wildersLength = 2 * length - 1;
    const maxPeriod = Math.max(length, smooth, wildersLength);
    if (dataList.length < maxPeriod) {
      return { qqe: [], rsi_ma: [], qqe_long: [], qqe_short: [] };
    }
    const rsiValues = Formula.rsi(dataList, length);
    let rsiMA: (number | null)[];
    switch (mamode.toLowerCase()) {
      case 'sma':
        rsiMA = Formula.sma(rsiValues, smooth);
        break;
      case 'ema':
        rsiMA = Formula.ema(rsiValues, smooth);
        break;
      case 'hma':
        rsiMA = Formula.hma(rsiValues, smooth);
        break;
      case 'rma':
        rsiMA = Formula.rma(rsiValues, smooth);
        break;
      case 'wma':
        rsiMA = Formula.wma(rsiValues, smooth);
        break;
      default:
        rsiMA = Formula.ema(rsiValues, smooth);
    }
    const rsiMATR: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        rsiMATR.push(null);
        continue;
      }
      const currentRSI = rsiMA[i];
      const prevRSI = rsiMA[i - drift];

      if (currentRSI === null || prevRSI === null) {
        rsiMATR.push(null);
        continue;
      }
      rsiMATR.push(Math.abs(currentRSI - prevRSI));
    }
    const smoothedRSITRMA = Formula.ema(rsiMATR, wildersLength);
    const dar = Formula.ema(smoothedRSITRMA, wildersLength).map(value =>
      value !== null ? factor * value : null
    );
    const upperband: (number | null)[] = [];
    const lowerband: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const rsiMAValue = rsiMA[i];
      const darValue = dar[i];
      if (rsiMAValue === null || darValue === null) {
        upperband.push(null);
        lowerband.push(null);
        continue;
      }
      upperband.push(rsiMAValue + darValue);
      lowerband.push(rsiMAValue - darValue);
    }
    const long: (number | null)[] = new Array(dataList.length).fill(null);
    const short: (number | null)[] = new Array(dataList.length).fill(null);
    const trend: number[] = new Array(dataList.length).fill(1);
    const qqe: (number | null)[] = new Array(dataList.length).fill(null);
    const qqeLong: (number | null)[] = new Array(dataList.length).fill(null);
    const qqeShort: (number | null)[] = new Array(dataList.length).fill(null);
    qqe[0] = rsiMA[0];
    qqeLong[0] = rsiMA[0];
    qqeShort[0] = rsiMA[0];
    for (let i = 1; i < dataList.length; i++) {
      const currentRSI = rsiMA[i];
      const prevRSI = rsiMA[i - 1];
      const currentLong = long[i - 1];
      const prevLong = i > 1 ? long[i - 2] : currentLong;
      const currentShort = short[i - 1];
      const prevShort = i > 1 ? short[i - 2] : currentShort;
      if (currentRSI === null || prevRSI === null) {
        continue;
      }
      if (prevRSI > (currentLong || 0) && currentRSI > (currentLong || 0)) {
        long[i] = Math.max(currentLong || 0, lowerband[i] || 0);
      } else {
        long[i] = lowerband[i];
      }
      if (prevRSI < (currentShort || 100) && currentRSI < (currentShort || 100)) {
        short[i] = Math.min(currentShort || 100, upperband[i] || 100);
      } else {
        short[i] = upperband[i];
      }
      if ((currentRSI > (currentShort || 0) && prevRSI <= (prevShort || 0)) ||
        (currentRSI <= (currentShort || 0) && prevRSI >= (prevShort || 0))) {
        trend[i] = 1;
        qqe[i] = qqeLong[i] = long[i];
      }
      else if ((currentRSI > (currentLong || 0) && prevRSI <= (prevLong || 0)) ||
        (currentRSI <= (currentLong || 0) && prevRSI >= (prevLong || 0))) {
        trend[i] = -1;
        qqe[i] = qqeShort[i] = short[i];
      } else {
        trend[i] = trend[i - 1];
        if (trend[i] === 1) {
          qqe[i] = qqeLong[i] = long[i];
        } else {
          qqe[i] = qqeShort[i] = short[i];
        }
      }
    }
    return {
      qqe: qqe,
      rsi_ma: rsiMA,
      qqe_long: qqeLong,
      qqe_short: qqeShort
    };
  }
  /**
   * Relative Strength Xtra (RSX)
   * 相对强度增强版，基于Jurik Research算法
   * 增强版的RSI，减少噪音，提供更平滑、更可靠的信号
   */
  static rsx(
    dataList: KLineData[],
    length: number = 14,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < Math.max(length, drift)) {
      return [];
    }
    let vC = 0, v1C = 0;
    let v4 = 0, v8 = 0, v10 = 0, v14 = 0, v18 = 0, v20 = 0;
    let f0 = 0, f8 = 0, f10 = 0, f18 = 0, f20 = 0, f28 = 0, f30 = 0, f38 = 0;
    let f40 = 0, f48 = 0, f50 = 0, f58 = 0, f60 = 0, f68 = 0, f70 = 0, f78 = 0;
    let f80 = 0, f88 = 0, f90 = 0;
    const result: (number | null)[] = [];
    for (let i = 0; i < length - 1; i++) {
      result.push(null);
    }
    result.push(0);
    for (let i = length; i < dataList.length; i++) {
      if (f90 === 0) {
        f90 = 1.0;
        f0 = 0.0;
        if (length - 1.0 >= 5) {
          f88 = length - 1.0;
        } else {
          f88 = 5.0;
        }
        f8 = 100.0 * dataList[i].close;
        f18 = 3.0 / (length + 2.0);
        f20 = 1.0 - f18;
      } else {
        // 主计算阶段
        if (f88 <= f90) {
          f90 = f88 + 1;
        } else {
          f90 = f90 + 1;
        }
        f10 = f8;
        f8 = 100 * dataList[i].close;
        v8 = f8 - f10;
        f28 = f20 * f28 + f18 * v8;
        f30 = f18 * f28 + f20 * f30;
        vC = 1.5 * f28 - 0.5 * f30;
        f38 = f20 * f38 + f18 * vC;
        f40 = f18 * f38 + f20 * f40;
        v10 = 1.5 * f38 - 0.5 * f40;
        f48 = f20 * f48 + f18 * v10;
        f50 = f18 * f48 + f20 * f50;
        v14 = 1.5 * f48 - 0.5 * f50;
        f58 = f20 * f58 + f18 * Math.abs(v8);
        f60 = f18 * f58 + f20 * f60;
        v18 = 1.5 * f58 - 0.5 * f60;
        f68 = f20 * f68 + f18 * v18;
        f70 = f18 * f68 + f20 * f70;
        v1C = 1.5 * f68 - 0.5 * f70;

        f78 = f20 * f78 + f18 * v1C;
        f80 = f18 * f78 + f20 * f80;
        v20 = 1.5 * f78 - 0.5 * f80;
        if (f88 >= f90 && f8 !== f10) {
          f0 = 1.0;
        }
        if (f88 === f90 && f0 === 0.0) {
          f90 = 0.0;
        }
      }
      if (f88 < f90 && v20 > 0.0000000001) {
        v4 = (v14 / v20 + 1.0) * 50.0;
        if (v4 > 100.0) {
          v4 = 100.0;
        }
        if (v4 < 0.0) {
          v4 = 0.0;
        }
      } else {
        v4 = 50.0;
      }

      result.push(v4);
    }
    return result;
  }
  /**
   * Relative Vigor Index (RVGI)
   * 相对活力指数，测量趋势相对于其收盘价到交易范围的强度
   */
  static rvgi(
    dataList: KLineData[],
    length: number = 14,
    swma_length: number = 4,
  ): { rvgi: (number | null)[]; signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { rvgi: [], signal: [] };
    }
    length = Math.max(1, Math.floor(length)) || 14;
    swma_length = Math.max(1, Math.floor(swma_length)) || 4;
    const maxLength = Math.max(length, swma_length);
    if (dataList.length < maxLength) {
      return { rvgi: [], signal: [] };
    }
    const closeOpenRange: (number | null)[] = [];
    const highLowRange: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (!ScriptUtils.isValid(bar.close) || !ScriptUtils.isValid(bar.open) ||
        !ScriptUtils.isValid(bar.high) || !ScriptUtils.isValid(bar.low)) {
        closeOpenRange.push(null);
        highLowRange.push(null);
        continue;
      }
      closeOpenRange.push(bar.close - bar.open);
      highLowRange.push(bar.high - bar.low);
    }
    const swmaCloseOpen = Formula.swmaLegacy(closeOpenRange, swma_length);
    const swmaHighLow = Formula.swmaLegacy(highLowRange, swma_length);
    const rvgi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < maxLength - 1) {
        rvgi.push(null);
        continue;
      }
      let numerator = 0;
      let numeratorCount = 0;
      for (let j = 0; j < length; j++) {
        const index = i - j;
        const value = swmaCloseOpen[index];
        if (value !== null) {
          numerator += value;
          numeratorCount++;
        }
      }
      let denominator = 0;
      let denominatorCount = 0;
      for (let j = 0; j < length; j++) {
        const index = i - j;
        const value = swmaHighLow[index];
        if (value !== null) {
          denominator += value;
          denominatorCount++;
        }
      }
      if (numeratorCount === 0 || denominatorCount === 0 || denominator === 0) {
        rvgi.push(null);
        continue;
      }
      const rvgiValue = numerator / denominator;
      rvgi.push(rvgiValue);
    }
    const signal = Formula.swma(rvgi, swma_length);
    return {
      rvgi: rvgi,
      signal: signal
    };
  }
  /**
   * SMI Ergodic Indicator (SMI)
   * SMI遍历指标，基于TSI但增加了信号线
   */
  static smi(
    dataList: KLineData[],
    fast: number = 5,
    slow: number = 20,
    signal: number = 5,
    scalar: number = 1,
  ): { smi: (number | null)[]; signal: (number | null)[]; osc: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { smi: [], signal: [], osc: [] };
    }
    fast = Math.max(1, Math.floor(fast)) || 5;
    slow = Math.max(1, Math.floor(slow)) || 20;
    signal = Math.max(1, Math.floor(signal)) || 5;
    scalar = Number(scalar) || 1;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const maxLength = Math.max(fast, slow, signal);
    if (dataList.length < maxLength + 1) {
      return { smi: [], signal: [], osc: [] };
    }
    const tsi = Formula.tsi(dataList, fast, slow, scalar);
    const signalLine = Formula.ema(tsi, signal);
    const oscillator: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const tsiValue = tsi[i];
      const signalValue = signalLine[i];
      if (tsiValue === null || signalValue === null) {
        oscillator.push(null);
        continue;
      }
      oscillator.push(tsiValue - signalValue);
    }
    return {
      smi: tsi,
      signal: signalLine,
      osc: oscillator
    };
  }
  /**
     * Squeeze Momentum (SQZ)
     * 挤压动量指标，基于布林带和Keltner通道的关系
     */
  static squeeze(
    dataList: KLineData[],
    bb_length: number = 20,
    bb_std: number = 2.0,
    kc_length: number = 20,
    kc_scalar: number = 1.5,
    mom_length: number = 12,
    mom_smooth: number = 6,
    mamode: string = 'sma',
  ): { sqz: (number | null)[]; sqz_on: (number | null)[]; sqz_off: (number | null)[]; no_sqz: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { sqz: [], sqz_on: [], sqz_off: [], no_sqz: [] };
    }
    bb_length = Math.max(1, Math.floor(bb_length)) || 20;
    bb_std = Number(bb_std) || 2.0;
    kc_length = Math.max(1, Math.floor(kc_length)) || 20;
    kc_scalar = Number(kc_scalar) || 1.5;
    mom_length = Math.max(1, Math.floor(mom_length)) || 12;
    mom_smooth = Math.max(1, Math.floor(mom_smooth)) || 6;
    mamode = String(mamode).toLowerCase();
    const maxLength = Math.max(bb_length, kc_length, mom_length, mom_smooth);
    if (dataList.length < maxLength + 1) {
      return { sqz: [], sqz_on: [], sqz_off: [], no_sqz: [] };
    }
    // bbands 方法不存在，使用替代实现或注释掉
    // const bb = Formula.bbands(dataList, bb_length, bb_std);
    const bb = { upper: [], middle: [], lower: [] }; // 临时占位符
    const kc = Formula.kc(dataList, kc_length, kc_scalar, 'ema');
    const momentum = Formula.mom(dataList, mom_length);
    let squeeze: (number | null)[];
    if (mamode === 'ema') {
      squeeze = Formula.ema(momentum, mom_smooth);
    } else {
      squeeze = Formula.sma(momentum, mom_smooth);
    }
    const sqz_on: (number | null)[] = [];
    const sqz_off: (number | null)[] = [];
    const no_sqz: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bbLower = bb.lower[i];
      const bbUpper = bb.upper[i];
      const kcLower = kc.lower[i];
      const kcUpper = kc.upper[i];
      if (bbLower === null || bbUpper === null || kcLower === null || kcUpper === null) {
        sqz_on.push(null);
        sqz_off.push(null);
        no_sqz.push(null);
        continue;
      }
      const isSqzOn = bbLower > kcLower && bbUpper < kcUpper;
      const isSqzOff = bbLower < kcLower && bbUpper > kcUpper;
      const isNoSqz = !isSqzOn && !isSqzOff;
      sqz_on.push(isSqzOn ? 1 : 0);
      sqz_off.push(isSqzOff ? 1 : 0);
      no_sqz.push(isNoSqz ? 1 : 0);
    }
    return {
      sqz: squeeze,
      sqz_on: sqz_on,
      sqz_off: sqz_off,
      no_sqz: no_sqz
    };
  }
  /**
   * Stochastic RSI Oscillator (STOCHRSI)
   * 随机RSI振荡器，基于Tushar Chande和Stanley Kroll的理论
   */
  static stochrsi(
    dataList: KLineData[],
    length: number = 14,
    rsi_length: number = 14,
    k: number = 3,
    d: number = 3,
  ): { k: (number | null)[]; d: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { k: [], d: [] };
    }
    length = Math.max(1, Math.floor(length)) || 14;
    rsi_length = Math.max(1, Math.floor(rsi_length)) || 14;
    k = Math.max(1, Math.floor(k)) || 3;
    d = Math.max(1, Math.floor(d)) || 3;
    const maxLength = Math.max(length, rsi_length, k, d);
    if (dataList.length < maxLength) {
      return { k: [], d: [] };
    }
    const rsiValues = Formula.rsi(dataList, rsi_length);
    const lowestRsi: (number | null)[] = [];
    const highestRsi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        lowestRsi.push(null);
        highestRsi.push(null);
        continue;
      }
      let minRsi = rsiValues[i];
      let maxRsi = rsiValues[i];
      for (let j = 1; j < length; j++) {
        const index = i - j;
        if (index >= 0 && rsiValues[index] !== null) {
          if (minRsi === null || rsiValues[index]! < minRsi) {
            minRsi = rsiValues[index]!;
          }
          if (maxRsi === null || rsiValues[index]! > maxRsi) {
            maxRsi = rsiValues[index]!;
          }
        }
      }
      lowestRsi.push(minRsi);
      highestRsi.push(maxRsi);
    }
    const rawStoch: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const rsi = rsiValues[i];
      const lowest = lowestRsi[i];
      const highest = highestRsi[i];
      if (rsi === null || lowest === null || highest === null) {
        rawStoch.push(null);
        continue;
      }
      const range = highest - lowest;
      if (range === 0) {
        rawStoch.push(0);
      } else {
        const stochValue = 100 * (rsi - lowest) / range;
        rawStoch.push(stochValue);
      }
    }
    const kValues = Formula.sma(rawStoch, k);
    const dValues = Formula.sma(kValues, d);
    return {
      k: kValues,
      d: dValues
    };
  }
  /**
   * Tom Demark Sequential (TD_SEQ)
   * Tom DeMark的Sequential指标，基于价格序列分析的趋势反转指标
   */
  static td_seq(
    dataList: KLineData[],
    asint: boolean = false,
    show_all: boolean = true
  ): { up: (number | null)[]; down: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { up: [], down: [] };
    }
    asint = Boolean(asint);
    show_all = Boolean(show_all);
    if (dataList.length < 4) {
      return { up: [], down: [] };
    }
    const upDiff: boolean[] = [];
    const downDiff: boolean[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < 4) {
        upDiff.push(false);
        downDiff.push(false);
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - 4].close;
      if (currentClose > prevClose) {
        upDiff.push(true);
        downDiff.push(false);
      } else if (currentClose < prevClose) {
        upDiff.push(false);
        downDiff.push(true);
      } else {
        upDiff.push(false);
        downDiff.push(false);
      }
    }
    const trueSequenceCount = (series: boolean[]): number => {
      let count = 0;
      let lastFalseIndex = -1;
      for (let i = series.length - 1; i >= 0; i--) {
        if (!series[i]) {
          lastFalseIndex = i;
          break;
        }
      }
      if (lastFalseIndex === -1) {
        count = series.length;
      } else {
        count = series.length - lastFalseIndex - 1;
      }
      return count;
    };
    const calcTd = (series: boolean[], direction: string): (number | null)[] => {
      const result: (number | null)[] = [];
      for (let i = 0; i < series.length; i++) {
        if (i < 4) {
          result.push(null);
          continue;
        }
        const lookback = Math.min(13, i + 1);
        const window = series.slice(i - lookback + 1, i + 1);
        let tdNum = 0;
        if (series[i]) { // 当前值为true
          tdNum = trueSequenceCount(window);
        }
        if (show_all) {
          result.push(tdNum === 0 ? null : tdNum);
        } else {
          result.push((tdNum >= 6 && tdNum <= 9) ? tdNum : null);
        }
      }
      return result;
    };
    const upSeq = calcTd(upDiff, "up");
    const downSeq = calcTd(downDiff, "down");
    if (asint) {
      for (let i = 0; i < upSeq.length; i++) {
        upSeq[i] = upSeq[i] === null ? 0 : upSeq[i];
        downSeq[i] = downSeq[i] === null ? 0 : downSeq[i];
      }
    }
    return {
      up: upSeq,
      down: downSeq
    };
  }
  /**
   * True Strength Index (TSI)
   * 真实强度指数，基于双重移动平均线的动量指标
   */
  static tsi(
    dataList: KLineData[],
    fast: number = 13,
    slow: number = 25,
    scalar: number = 100,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    fast = Math.max(1, Math.floor(fast)) || 13;
    slow = Math.max(1, Math.floor(slow)) || 25;
    scalar = Number(scalar) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const maxLength = Math.max(fast, slow);
    if (dataList.length < maxLength + drift) {
      return [];
    }
    const priceChange: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        priceChange.push(null);
        continue;
      }
      const currentClose = dataList[i].close;
      const previousClose = dataList[i - drift].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(previousClose)) {
        priceChange.push(null);
        continue;
      }
      priceChange.push(currentClose - previousClose);
    }
    const slowEma = Formula.ema(priceChange, slow);
    const fastSlowEma = Formula.ema(slowEma, fast);
    const absPriceChange: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const change = priceChange[i];
      if (change === null) {
        absPriceChange.push(null);
        continue;
      }
      absPriceChange.push(Math.abs(change));
    }
    const absSlowEma = Formula.ema(absPriceChange, slow);
    const absFastSlowEma = Formula.ema(absSlowEma, fast);
    const tsi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < maxLength) {
        tsi.push(null);
        continue;
      }
      const numerator = fastSlowEma[i];
      const denominator = absFastSlowEma[i];
      if (numerator === null || denominator === null || denominator === 0) {
        tsi.push(null);
        continue;
      }
      const tsiValue = scalar * (numerator / denominator);
      tsi.push(tsiValue);
    }
    return tsi;
  }
  /**
   * Ultimate Oscillator (UO)
   * 终极振荡器，基于三个不同周期的动量指标
   */
  static uo(
    dataList: KLineData[],
    fast: number = 7,
    medium: number = 14,
    slow: number = 28,
    fast_w: number = 4.0,
    medium_w: number = 2.0,
    slow_w: number = 1.0,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    fast = Math.max(1, Math.floor(fast)) || 7;
    medium = Math.max(1, Math.floor(medium)) || 14;
    slow = Math.max(1, Math.floor(slow)) || 28;
    fast_w = Number(fast_w) || 4.0;
    medium_w = Number(medium_w) || 2.0;
    slow_w = Number(slow_w) || 1.0;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const maxLength = Math.max(fast, medium, slow);
    if (dataList.length < maxLength + drift) {
      return [];
    }
    const bp: (number | null)[] = [];  // buying pressure
    const tr: (number | null)[] = [];  // true range
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        bp.push(null);
        tr.push(null);
        continue;
      }
      const currentHigh = dataList[i].high;
      const currentLow = dataList[i].low;
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - drift].close;
      if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) ||
        !ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose)) {
        bp.push(null);
        tr.push(null);
        continue;
      }
      const minLowOrPc = Math.min(currentLow, prevClose);
      const maxHighOrPc = Math.max(currentHigh, prevClose);
      bp.push(currentClose - minLowOrPc);
      tr.push(maxHighOrPc - minLowOrPc);
    }
    const fastAvg: (number | null)[] = [];
    const mediumAvg: (number | null)[] = [];
    const slowAvg: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < fast - 1) {
        fastAvg.push(null);
        continue;
      }
      let bpSum = 0;
      let trSum = 0;
      let validCount = 0;
      for (let j = 0; j < fast; j++) {
        const bpValue = bp[i - j];
        const trValue = tr[i - j];
        if (bpValue !== null && trValue !== null) {
          bpSum += bpValue;
          trSum += trValue;
          validCount++;
        }
      }
      if (validCount === fast && trSum !== 0) {
        fastAvg.push(bpSum / trSum);
      } else {
        fastAvg.push(null);
      }
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < medium - 1) {
        mediumAvg.push(null);
        continue;
      }
      let bpSum = 0;
      let trSum = 0;
      let validCount = 0;
      for (let j = 0; j < medium; j++) {
        const bpValue = bp[i - j];
        const trValue = tr[i - j];
        if (bpValue !== null && trValue !== null) {
          bpSum += bpValue;
          trSum += trValue;
          validCount++;
        }
      }
      if (validCount === medium && trSum !== 0) {
        mediumAvg.push(bpSum / trSum);
      } else {
        mediumAvg.push(null);
      }
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < slow - 1) {
        slowAvg.push(null);
        continue;
      }
      let bpSum = 0;
      let trSum = 0;
      let validCount = 0;
      for (let j = 0; j < slow; j++) {
        const bpValue = bp[i - j];
        const trValue = tr[i - j];
        if (bpValue !== null && trValue !== null) {
          bpSum += bpValue;
          trSum += trValue;
          validCount++;
        }
      }
      if (validCount === slow && trSum !== 0) {
        slowAvg.push(bpSum / trSum);
      } else {
        slowAvg.push(null);
      }
    }
    const totalWeight = fast_w + medium_w + slow_w;
    const uo: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const fastValue = fastAvg[i];
      const mediumValue = mediumAvg[i];
      const slowValue = slowAvg[i];
      if (fastValue !== null && mediumValue !== null && slowValue !== null) {
        const weightedSum = (fast_w * fastValue) + (medium_w * mediumValue) + (slow_w * slowValue);
        const uoValue = 100 * weightedSum / totalWeight;
        uo.push(uoValue);
      } else {
        uo.push(null);
      }
    }
    return uo;
  }
  /**
   * William's Percent R (WILLR)
   * 威廉指标，动量振荡器，用于识别超买和超卖条件
   */
  static willr(
    dataList: KLineData[],
    length: number = 14,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    if (dataList.length < length) {
      return [];
    }
    const willr: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        willr.push(null);
        continue;
      }
      let highestHigh = dataList[i].high;
      let lowestLow = dataList[i].low;
      for (let j = 1; j < length; j++) {
        const prevIndex = i - j;
        if (prevIndex >= 0) {
          const prevHigh = dataList[prevIndex].high;
          const prevLow = dataList[prevIndex].low;

          if (ScriptUtils.isValid(prevHigh) && prevHigh > highestHigh) {
            highestHigh = prevHigh;
          }
          if (ScriptUtils.isValid(prevLow) && prevLow < lowestLow) {
            lowestLow = prevLow;
          }
        }
      }
      const currentClose = dataList[i].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(highestHigh) || !ScriptUtils.isValid(lowestLow)) {
        willr.push(null);
        continue;
      }
      if (highestHigh === lowestLow) {
        willr.push(0); // 避免除零错误
      } else {
        const willrValue = 100 * ((currentClose - lowestLow) / (highestHigh - lowestLow) - 1);
        willr.push(willrValue);
      }
    }
    return willr;
  }
  /**
   * Arnaud Legoux Moving Average (ALMA)
   * ALMA移动平均线，使用正态分布曲线，可调节平滑度和灵敏度
   */
  static alma(
    dataList: KLineData[],
    length: number = 10,
    sigma: number = 6.0,
    distribution_offset: number = 0.85,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    sigma = Number(sigma) || 6.0;
    distribution_offset = Math.max(0, Math.min(1, Number(distribution_offset))) || 0.85;
    if (dataList.length < length) {
      return [];
    }
    const m = distribution_offset * (length - 1);
    const s = length / sigma;
    const wtd: number[] = [];
    for (let i = 0; i < length; i++) {
      wtd[i] = Math.exp(-1 * ((i - m) * (i - m)) / (2 * s * s));
    }
    const result: (number | null)[] = [];
    for (let i = 0; i < length - 1; i++) {
      result.push(null);
    }
    result.push(0);
    for (let i = length; i < dataList.length; i++) {
      let windowSum = 0;
      let cumSum = 0;
      for (let j = 0; j < length; j++) {
        const closeValue = dataList[i - j].close;
        if (ScriptUtils.isValid(closeValue)) {
          windowSum += wtd[j] * closeValue;
          cumSum += wtd[j];
        }
      }
      if (cumSum === 0) {
        result.push(null);
      } else {
        const almean = windowSum / cumSum;
        result.push(almean);
      }
    }
    return result;
  }
  /**
   * Rate of Change (ROC)
   * 变动率指标，按照 pandas_ta 标准：ROC = 100 * MOM(close, length) / close.shift(length)
   */
  static roc(
    dataList: KLineData[],
    length: number = 10,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const momentum = Formula.mom(dataList, length, 'close');
    const roc: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        roc.push(null);
        continue;
      }
      const momValue = momentum[i];
      const pastClose = dataList[i - length].close;
      if (momValue === null || !ScriptUtils.isValid(pastClose) || pastClose === 0) {
        roc.push(null);
        continue;
      }
      roc.push(100 * momValue / pastClose);
    }
    return roc;
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
      const close = item.close
      return kijun + (close - kijun) * (factor - 1)
    })
  }
  /**  
   * TRIX 三重指数平滑移动平均指标  
   */
  static trix(
    dataList: KLineData[],
    length: number = 30,
    signal: number = 9,
    scalar: number = 100,
    drift: number = 1,
  ): { trix: (number | null)[]; signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { trix: [], signal: [] };
    }
    length = Math.max(1, Math.floor(length)) || 30;
    signal = Math.max(1, Math.floor(signal)) || 9;
    scalar = Number(scalar) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const maxLength = Math.max(length, signal);
    if (dataList.length < maxLength) {
      return { trix: [], signal: [] };
    }
    const ema1 = Formula.ema(dataList, length, 'close');
    const ema2 = Formula.ema(ema1, length);
    const ema3 = Formula.ema(ema2, length);
    const trix: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        trix.push(null);
        continue;
      }
      const currentEma3 = ema3[i];
      const prevEma3 = ema3[i - drift];
      if (currentEma3 !== null && prevEma3 !== null && prevEma3 !== 0) {
        const roc = (currentEma3 - prevEma3) / prevEma3;
        trix.push(scalar * roc);
      } else {
        trix.push(null);
      }
    }
    const signalLine = Formula.sma(trix, signal);
    return {
      trix: trix,
      signal: signalLine
    };
  }
  /**
   * BRAR指标 (人气意愿指标)
   * 包含两个子指标：AR(人气指标)和BR(意愿指标)
   */
  static brar(
    dataList: KLineData[],
    length: number = 26,
    scalar: number = 100,
    drift: number = 1,
  ): Array<{
    ar: number | null;
    br: number | null;
  } | null> {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 26;
    scalar = parseFloat(scalar.toString()) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length) {
      return [];
    }
    const result: Array<{
      ar: number | null;
      br: number | null;
    } | null> = [];
    const hoDiff: number[] = [];
    const olDiff: number[] = [];
    const hcy: number[] = [];
    const cyl: number[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (!bar ||
        !ScriptUtils.isValid(bar.open) ||
        !ScriptUtils.isValid(bar.high) ||
        !ScriptUtils.isValid(bar.low) ||
        !ScriptUtils.isValid(bar.close)) {
        hoDiff.push(NaN);
        olDiff.push(NaN);
        hcy.push(NaN);
        cyl.push(NaN);
        continue;
      }
      hoDiff.push(bar.high - bar.open);
      olDiff.push(bar.open - bar.low);
      if (i >= drift) {
        const prevClose = dataList[i - drift].close;
        if (ScriptUtils.isValid(prevClose)) {
          const hcyVal = bar.high - prevClose;
          const cylVal = prevClose - bar.low;
          hcy.push(hcyVal < 0 ? 0 : hcyVal);
          cyl.push(cylVal < 0 ? 0 : cylVal);
        } else {
          hcy.push(NaN);
          cyl.push(NaN);
        }
      } else {
        hcy.push(NaN);
        cyl.push(NaN);
      }
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      let hoSum = 0;
      let olSum = 0;
      let hcySum = 0;
      let cylSum = 0;
      let validCount = 0;
      for (let j = i - length + 1; j <= i; j++) {
        if (j >= 0 && !isNaN(hoDiff[j]) && !isNaN(olDiff[j]) &&
          !isNaN(hcy[j]) && !isNaN(cyl[j])) {
          hoSum += hoDiff[j];
          olSum += olDiff[j];
          hcySum += hcy[j];
          cylSum += cyl[j];
          validCount++;
        }
      }
      if (validCount === 0 || olSum === 0 || cylSum === 0) {
        result.push(null);
        continue;
      }
      const ar = scalar * hoSum / olSum;
      const br = scalar * hcySum / cylSum;
      result.push({
        ar: ar,
        br: br
      });
    }
    return result;
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
   * On Balance Volume (OBV) - pandas_ta 标准实现
   * 能量潮指标，累积指标，用于测量买卖压力
   */
  static obv(
    dataList: KLineData[] | any[],
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    const close = Formula.attr(dataList, 'close');
    const volume = Formula.attr(dataList, 'volume');
    if (!close || !volume || close.length === 0 || volume.length === 0) {
      return [];
    }
    const obv: (number | null)[] = [];
    let cumulativeObv = 0;
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        obv.push(0);
        continue;
      }
      const currentClose = close[i];
      const prevClose = close[i - 1];
      const currentVolume = volume[i];
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose) ||
        !ScriptUtils.isValid(currentVolume)) {
        obv.push(null);
        continue;
      }
      const priceDiff = currentClose - prevClose;
      let signedVolume = 0;
      if (priceDiff > 0) {
        signedVolume = currentVolume;
      } else if (priceDiff < 0) {
        signedVolume = -currentVolume;
      }
      cumulativeObv += signedVolume;

      if (isFinite(cumulativeObv)) {
        obv.push(cumulativeObv);
      } else {
        obv.push(null);
      }
    }
    return obv;
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
      const vol = item.volume ?? 0
      const a = (item.high + item.low) / 2
      const b = (pre.high + pre.low) / 2
      const c = item.high - item.low
      let em = 0
      if (vol !== 0) {
        em = ((a - b) * c) / vol
      }
      em = Number(em)
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
   * VO 量价指标  
   */
  static vo(list: KLineData[], num1: number = 5, num2: number = 10): VOResult[] {
    return list.map((item, i) => {
      const vo: VOResult = { up: 0, down: 0, val: 0 }
      if (i === 0) return vo
      if (!ScriptUtils.isValid(item.close) || !ScriptUtils.isValid(list[i - 1].close)) {
        return vo
      }
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
        for (let j = i - num1 + 1; j <= i; j++) {
          const data = list[j]
          const prevData = j > 0 ? list[j - 1] : data
          const vol = data.volume ?? 0
          if (!ScriptUtils.isValid(data.close) || !ScriptUtils.isValid(prevData.close)) {
            continue
          }
          if (data.close > prevData.close) {
            upSum1 += vol
          } else if (data.close < prevData.close) {
            downSum1 += vol
          } else {
            upSum1 += vol / 2
            downSum1 += vol / 2
          }
        }
        for (let j = i - num2 + 1; j <= i; j++) {
          const data = list[j]
          const prevData = j > 0 ? list[j - 1] : data
          const vol = data.volume ?? 0
          if (!ScriptUtils.isValid(data.close) || !ScriptUtils.isValid(prevData.close)) {
            continue
          }
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
   * 计算随机指标 (Stochastic) - 完整版本
   */
  static stochastic(
    dataList: KLineData[],
    k: number = 14,
    d: number = 3,
    smooth_k: number = 3,
  ): { k: (number | null)[]; d: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { k: [], d: [] };
    }
    k = Math.max(1, Math.floor(k)) || 14;
    d = Math.max(1, Math.floor(d)) || 3;
    smooth_k = Math.max(1, Math.floor(smooth_k)) || 3;
    const maxLength = Math.max(k, d, smooth_k);
    if (dataList.length < maxLength) {
      return { k: [], d: [] };
    }
    const rawStoch: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < k - 1) {
        rawStoch.push(null);
        continue;
      }
      let highestHigh = dataList[i].high;
      let lowestLow = dataList[i].low;
      for (let j = 1; j < k; j++) {
        const index = i - j;
        if (index >= 0) {
          highestHigh = Math.max(highestHigh, dataList[index].high);
          lowestLow = Math.min(lowestLow, dataList[index].low);
        }
      }
      const currentClose = dataList[i].close;
      const range = highestHigh - lowestLow;
      if (range === 0) {
        rawStoch.push(0);
      } else {
        const stochValue = 100 * (currentClose - lowestLow) / range;
        rawStoch.push(stochValue);
      }
    }
    const kValues = Formula.sma(rawStoch, smooth_k);
    const dValues = Formula.sma(kValues, d);
    return {
      k: kValues,
      d: dValues
    };
  }
  /**
   * 价格通道 (Donchian Channel)
   */

  static donchianChannel(
    dataList: KLineData[] | any[],
    lower_length: number = 20,
    upper_length: number = 20,
    lower_min_periods?: number,
    upper_min_periods?: number
  ): { lower: (number | null)[]; middle: (number | null)[]; upper: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { lower: [], middle: [], upper: [] };
    }
    lower_length = Math.max(1, Math.floor(lower_length)) || 20;
    upper_length = Math.max(1, Math.floor(upper_length)) || 20;
    const lower_min = lower_min_periods !== undefined ? Math.max(1, Math.floor(lower_min_periods)) : lower_length;
    const upper_min = upper_min_periods !== undefined ? Math.max(1, Math.floor(upper_min_periods)) : upper_length;
    const maxLength = Math.max(lower_length, lower_min, upper_length, upper_min);
    if (dataList.length < maxLength) {
      return { lower: [], middle: [], upper: [] };
    }
    const lower: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < lower_length - 1) {
        lower.push(null);
        continue;
      }
      let minLow = Number.MAX_VALUE;
      let validCount = 0;
      for (let j = 0; j < lower_length; j++) {
        const dataIndex = i - lower_length + 1 + j;
        if (dataIndex >= 0 && dataIndex < dataList.length) {
          const low = dataList[dataIndex].low;
          if (ScriptUtils.isValid(low)) {
            minLow = Math.min(minLow, low);
            validCount++;
          }
        }
      }
      if (validCount >= lower_min) {
        lower.push(minLow === Number.MAX_VALUE ? null : minLow);
      } else {
        lower.push(null);
      }
    }
    const upper: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < upper_length - 1) {
        upper.push(null);
        continue;
      }
      let maxHigh = Number.MIN_VALUE;
      let validCount = 0;
      for (let j = 0; j < upper_length; j++) {
        const dataIndex = i - upper_length + 1 + j;
        if (dataIndex >= 0 && dataIndex < dataList.length) {
          const high = dataList[dataIndex].high;
          if (ScriptUtils.isValid(high)) {
            maxHigh = Math.max(maxHigh, high);
            validCount++;
          }
        }
      }
      if (validCount >= upper_min) {
        upper.push(maxHigh === Number.MIN_VALUE ? null : maxHigh);
      } else {
        upper.push(null);
      }
    }
    const middle: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const lowerVal = lower[i];
      const upperVal = upper[i];
      if (lowerVal !== null && upperVal !== null) {
        middle.push(0.5 * (lowerVal + upperVal));
      } else {
        middle.push(null);
      }
    }
    return {
      lower: lower,
      middle: middle,
      upper: upper
    };
  }
  /**
   * HWC (Holt-Winter Channel) - pandas_ta 标准实现
   * 基于HWMA的三参数移动平均线，使用Holt-Winters方法计算
   */
  static hwc(
    dataList: KLineData[] | any[],
    na: number = 0.2,
    nb: number = 0.1,
    nc: number = 0.1,
    nd: number = 0.1,
    scalar: number = 1.0,
    key: string | null = null
  ): {
    hw_mid: (number | null)[];
    hw_upper: (number | null)[];
    hw_lower: (number | null)[];
    hw_width?: (number | null)[];
    hw_pctwidth?: (number | null)[]
  } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { hw_mid: [], hw_upper: [], hw_lower: [] };
    }
    na = Math.max(0, Math.min(1, na)) || 0.2;
    nb = Math.max(0, Math.min(1, nb)) || 0.1;
    nc = Math.max(0, Math.min(1, nc)) || 0.1;
    nd = Math.max(0, Math.min(1, nd)) || 0.1;
    scalar = Math.max(0, scalar) || 1.0;
    const close = Formula.attr(dataList, key);
    if (!close || close.length === 0) {
      return { hw_mid: [], hw_upper: [], hw_lower: [] };
    }
    const m = close.length;
    if (m === 0) {
      return { hw_mid: [], hw_upper: [], hw_lower: [] };
    }
    let last_a = 0;
    let last_v = 0;
    let last_var = 0;
    let last_f = close[0];
    let last_price = close[0];
    let last_result = close[0];
    const lower: (number | null)[] = [];
    const result: (number | null)[] = [];
    const upper: (number | null)[] = [];
    const chan_pct_width: (number | null)[] = [];
    const chan_width: (number | null)[] = [];
    for (let i = 0; i < m; i++) {
      const currentClose = close[i];
      if (!ScriptUtils.isValid(currentClose)) {
        result.push(null);
        upper.push(null);
        lower.push(null);
        chan_width.push(null);
        chan_pct_width.push(null);
        continue;
      }
      const F = (1.0 - na) * (last_f + last_v + 0.5 * last_a) + na * currentClose;
      const V = (1.0 - nb) * (last_v + last_a) + nb * (F - last_f);
      const A = (1.0 - nc) * last_a + nc * (V - last_v);
      const currentResult = F + V + 0.5 * A;
      result.push(currentResult);
      const var_val = (1.0 - nd) * last_var + nd * (last_price - last_result) * (last_price - last_result);
      const stddev = Math.sqrt(Math.max(0, var_val));
      const currentUpper = currentResult + scalar * stddev;
      const currentLower = currentResult - scalar * stddev;
      upper.push(currentUpper);
      lower.push(currentLower);
      const width = currentUpper - currentLower;
      chan_width.push(width);
      const pctWidth = width > 0 ? (currentClose - currentLower) / width : 0;
      chan_pct_width.push(pctWidth);
      last_price = currentClose;
      last_a = A;
      last_f = F;
      last_v = V;
      last_var = var_val;
      last_result = currentResult;
    }
    // 返回结果
    return {
      hw_mid: result,
      hw_upper: upper,
      hw_lower: lower,
      hw_width: chan_width,
      hw_pctwidth: chan_pct_width
    };
  }
  /**
   * Keltner Channels (KC) - pandas_ta 标准实现
   * 流行的波动性指标，类似于布林带和唐奇安通道
   */
  static kc(
    dataList: KLineData[] | any[],
    length: number = 20,
    scalar: number = 2.0,
    mamode: string = "ema",
    useTr: boolean = true,
  ): { lower: (number | null)[]; basis: (number | null)[]; upper: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { lower: [], basis: [], upper: [] };
    }
    length = Math.max(1, Math.floor(length)) || 20;
    scalar = Math.max(0, Number(scalar)) || 2.0;
    mamode = mamode || "ema";
    useTr = Boolean(useTr);
    if (dataList.length < length) {
      return { lower: [], basis: [], upper: [] };
    }
    const high = Formula.attr(dataList, 'high');
    const low = Formula.attr(dataList, 'low');
    const close = Formula.attr(dataList, 'close');
    if (!high || !low || !close || high.length === 0 || low.length === 0 || close.length === 0) {
      return { lower: [], basis: [], upper: [] };
    }
    const range: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        range.push(null);
        continue;
      }
      const currentHigh = high[i];
      const currentLow = low[i];
      const prevClose = close[i - 1];
      if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) || !ScriptUtils.isValid(prevClose)) {
        range.push(null);
        continue;
      }
      if (useTr) {
        const tr1 = currentHigh - currentLow;
        const tr2 = Math.abs(currentHigh - prevClose);
        const tr3 = Math.abs(currentLow - prevClose);
        range.push(Math.max(tr1, tr2, tr3));
      } else {
        range.push(currentHigh - currentLow);
      }
    }
    let basis: (number | null)[];
    if (mamode.toLowerCase() === "ema") {
      basis = Formula.ema(close, length);
    } else {
      basis = Formula.sma(close, length);
    }
    let band: (number | null)[];
    if (mamode.toLowerCase() === "ema") {
      band = Formula.ema(range, length);
    } else {
      band = Formula.sma(range, length);
    }
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const basisVal = basis[i];
      const bandVal = band[i];
      if (basisVal === null || bandVal === null) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      upper.push(basisVal + scalar * bandVal);
      lower.push(basisVal - scalar * bandVal);
    }
    return {
      lower: lower,
      basis: basis,
      upper: upper
    };
  }
  /**
   * Mass Index (MASSI) - pandas_ta 标准实现
   * 质量指数是一个非方向性波动性指标，利用高低范围来识别基于范围扩张的趋势反转
   */
  static massi(
    dataList: KLineData[] | any[],
    fast: number = 9,
    slow: number = 25,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    fast = Math.max(1, Math.floor(fast)) || 9;
    slow = Math.max(1, Math.floor(slow)) || 25;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const maxLength = Math.max(fast, slow);
    if (dataList.length < maxLength) {
      return [];
    }
    const highLowRange: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const currentHigh = dataList[i].high;
      const currentLow = dataList[i].low;
      if (ScriptUtils.isValid(currentHigh) && ScriptUtils.isValid(currentLow) && currentHigh > currentLow) {
        highLowRange.push(currentHigh - currentLow);
      } else {
        highLowRange.push(null);
      }
    }
    const hlEma1 = Formula.ema(highLowRange, fast);
    const hlEma2 = Formula.ema(hlEma1, fast);
    const hlRatio: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const ema1 = hlEma1[i];
      const ema2 = hlEma2[i];
      if (ema1 !== null && ema2 !== null && ema2 !== 0) {
        hlRatio.push(ema1 / ema2);
      } else {
        hlRatio.push(null);
      }
    }
    const massi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < slow - 1) {
        massi.push(null);
        continue;
      }
      let sum = 0;
      let validCount = 0;
      for (let j = 0; j < slow; j++) {
        const ratioIndex = i - slow + 1 + j;
        if (ratioIndex >= 0 && ratioIndex < hlRatio.length) {
          const ratio = hlRatio[ratioIndex];
          if (ratio !== null) {
            sum += ratio;
            validCount++;
          }
        }
      }
      if (validCount >= slow) {
        massi.push(sum);
      } else {
        massi.push(null);
      }
    }
    return massi;
  }
  /**
   * Normalized Average True Range (NATR) - pandas_ta 标准实现
   * 标准化平均真实范围，尝试标准化平均真实范围
   */
  static natr(
    dataList: KLineData[] | any[],
    length: number = 14,
    mamode: string = "ema",
    scalar: number = 100.0,
    drift: number = 1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = Math.max(0, Number(scalar)) || 100.0;
    drift = Math.max(1, Math.floor(drift)) || 1;
    mamode = mamode || "ema";
    if (dataList.length < length) {
      return [];
    }
    const atrValues = Formula.atr(dataList, length, mamode, drift, key);
    const natr: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const atrVal = atrValues[i];
      const closeVal = dataList[i].close;
      if (atrVal !== null && closeVal !== null && closeVal > 0) {
        natr.push((scalar / closeVal) * atrVal);
      } else {
        natr.push(null);
      }
    }
    return natr;
  }
  /**
   * Price Distance (PDIST) - pandas_ta 标准实现
   * 衡量价格运动所覆盖的"距离"
   */
  static pdist(
    dataList: KLineData[] | any[],
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < drift + 1) {
      return [];
    }
    const pdist: (number | null)[] = [];
    dataList.forEach((item, i) => {
      const driftIndex = i - drift;
      if (driftIndex < 0) {
        pdist.push(null);
      } else {
        const driftClose = dataList[driftIndex].close;
        const highLowRange = item.high - item.low;
        const closeOpenDiff = Math.abs(item.close - item.open);
        const openDriftCloseDiff = Math.abs(item.open - driftClose);
        const pdistValue = 2 * highLowRange - closeOpenDiff + openDriftCloseDiff;
        if (isFinite(pdistValue)) {
          pdist.push(pdistValue);
        } else {
          pdist.push(null);
        }
      }
    });
    return pdist;
  }
  /**
   * Relative Volatility Index (RVI) - pandas_ta 标准实现
   * 相对波动性指数，基于价格方向的标准差累加，而不是像RSI那样基于价格方向累加价格变化
   */
  static rvi(
    dataList: KLineData[] | any[],
    length: number = 14,
    scalar: number = 100.0,
    refined: boolean = false,
    thirds: boolean = false,
    mamode: string = "ema",
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = Math.max(0, Number(scalar)) || 100.0;
    refined = Boolean(refined);
    thirds = Boolean(thirds);
    mamode = mamode || "ema";
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length + drift) {
      return [];
    }
    const close = Formula.attr(dataList, 'close');
    const high = Formula.attr(dataList, 'high');
    const low = Formula.attr(dataList, 'low');
    if (!close || !high || !low || close.length === 0 || high.length === 0 || low.length === 0) {
      return [];
    }
    if ((refined || thirds) && (!high || !low || high.length === 0 || low.length === 0)) {
      return [];
    }
    const _rvi = (source: (number | null)[], length: number, scalar: number, mode: string, drift: number): (number | null)[] => {
      const std = Formula.stdev(source, length);
      const pos: (number | null)[] = [];
      const neg: (number | null)[] = [];
      for (let i = 0; i < source.length; i++) {
        if (i < drift) {
          pos.push(null);
          neg.push(null);
          continue;
        }
        const current = source[i];
        const previous = source[i - drift];
        if (current !== null && previous !== null) {
          const diff = current - previous;
          if (diff > 0) {
            pos.push(diff);
            neg.push(0);
          } else {
            pos.push(0);
            neg.push(Math.abs(diff));
          }
        } else {
          pos.push(null);
          neg.push(null);
        }
      }
      const pos_std: (number | null)[] = [];
      const neg_std: (number | null)[] = [];
      for (let i = 0; i < source.length; i++) {
        const posVal = pos[i];
        const negVal = neg[i];
        const stdVal = std[i];
        if (posVal !== null && stdVal !== null) {
          pos_std.push(posVal * stdVal);
        } else {
          pos_std.push(null);
        }
        if (negVal !== null && stdVal !== null) {
          neg_std.push(negVal * stdVal);
        } else {
          neg_std.push(null);
        }
      }
      let pos_avg: (number | null)[];
      let neg_avg: (number | null)[];
      if (mode.toLowerCase() === "ema") {
        pos_avg = Formula.ema(pos_std, length);
        neg_avg = Formula.ema(neg_std, length);
      } else {
        pos_avg = Formula.sma(pos_std, length);
        neg_avg = Formula.sma(neg_std, length);
      }
      const result: (number | null)[] = [];
      for (let i = 0; i < source.length; i++) {
        const posAvg = pos_avg[i];
        const negAvg = neg_avg[i];
        if (posAvg !== null && negAvg !== null && (posAvg + negAvg) > 0) {
          const rvi = scalar * posAvg / (posAvg + negAvg);
          result.push(isFinite(rvi) ? rvi : null);
        } else {
          result.push(null);
        }
      }
      return result;
    };
    let rvi: (number | null)[];
    let _mode = "";
    if (refined) {
      const high_rvi = _rvi(high, length, scalar, mamode, drift);
      const low_rvi = _rvi(low, length, scalar, mamode, drift);
      rvi = [];
      for (let i = 0; i < dataList.length; i++) {
        const highVal = high_rvi[i];
        const lowVal = low_rvi[i];
        if (highVal !== null && lowVal !== null) {
          rvi.push(0.5 * (highVal + lowVal));
        } else {
          rvi.push(null);
        }
      }
      _mode = "r";
    } else if (thirds) {
      const high_rvi = _rvi(high, length, scalar, mamode, drift);
      const low_rvi = _rvi(low, length, scalar, mamode, drift);
      const close_rvi = _rvi(close, length, scalar, mamode, drift);
      rvi = [];
      for (let i = 0; i < dataList.length; i++) {
        const highVal = high_rvi[i];
        const lowVal = low_rvi[i];
        const closeVal = close_rvi[i];
        if (highVal !== null && lowVal !== null && closeVal !== null) {
          rvi.push((highVal + lowVal + closeVal) / 3.0);
        } else {
          rvi.push(null);
        }
      }
      _mode = "t";
    } else {
      rvi = _rvi(close, length, scalar, mamode, drift);
    }
    return rvi;
  }
  /**
   * Elder's Thermometer (THERMO) - pandas_ta 标准实现
   * Elder的温度计指标，用于衡量价格波动性
   */
  static thermo(
    dataList: KLineData[] | any[],
    length: number = 20,
    long: number = 2.0,
    short: number = 0.5,
    mamode: string = "ema",
    drift: number = 1,
  ): { thermo: (number | null)[], thermo_ma: (number | null)[], thermo_long: (number | null)[], thermo_short: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { thermo: [], thermo_ma: [], thermo_short: [], thermo_long: [] };
    }
    length = Math.max(1, Math.floor(length)) || 20;
    long = Math.max(0, Number(long)) || 2.0;
    short = Math.max(0, Number(short)) || 0.5;
    mamode = mamode || "ema";
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length + drift) {
      return { thermo: [], thermo_ma: [], thermo_short: [], thermo_long: [] };
    }
    const thermo: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        thermo.push(null);
        continue;
      }
      const currentLow = dataList[i].low;
      const currentHigh = dataList[i].high;
      const prevLow = dataList[i - drift].low;
      const prevHigh = dataList[i - drift].high;
      if (!ScriptUtils.isValid(currentLow) || !ScriptUtils.isValid(currentHigh) ||
        !ScriptUtils.isValid(prevLow) || !ScriptUtils.isValid(prevHigh)) {
        thermo.push(null);
        continue;
      }
      const thermoL = Math.abs(prevLow - currentLow);
      const thermoH = Math.abs(currentHigh - prevHigh);
      const thermoValue = Math.max(thermoL, thermoH);
      thermo.push(thermoValue);
    }
    let thermo_ma: (number | null)[];
    if (mamode.toLowerCase() === "ema") {
      thermo_ma = Formula.ema(thermo, length);
    } else if (mamode.toLowerCase() === "sma") {
      thermo_ma = Formula.sma(thermo, length);
    } else if (mamode.toLowerCase() === "hma") {
      thermo_ma = Formula.hma(thermo, length);
    } else {
      thermo_ma = Formula.ema(thermo, length);
    }
    const thermo_long: (number | null)[] = [];
    const thermo_short: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const thermoValue = thermo[i];
      const thermoMaValue = thermo_ma[i];
      if (thermoValue !== null && thermoMaValue !== null) {
        const longThreshold = thermoMaValue * long;
        const longSignal = thermoValue < longThreshold;
        const shortThreshold = thermoMaValue * short;
        const shortSignal = thermoValue > shortThreshold;
        thermo_long.push(longSignal ? 1 : 0);
        thermo_short.push(shortSignal ? 1 : 0);
      } else {
        thermo_long.push(null);
        thermo_short.push(null);
      }
    }
    return { thermo, thermo_ma, thermo_long, thermo_short };
  }
  /**
   * True Range - pandas_ta 标准实现
   * 真实范围指标，扩展经典范围（最高价减去最低价）以包含可能的跳空情况
   */
  static trueRange(
    dataList: KLineData[] | any[],
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < drift + 1) {
      return [];
    }
    const trueRange: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        trueRange.push(null);
        continue;
      }
      const currentHigh = dataList[i].high;
      const currentLow = dataList[i].low;
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - drift].close;
      if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) ||
        !ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose)) {
        trueRange.push(null);
        continue;
      }
      const highLowRange = currentHigh - currentLow;           // high - low
      const highPrevCloseRange = currentHigh - prevClose;      // high - prev_close
      const prevCloseLowRange = prevClose - currentLow;        // prev_close - low
      const trueRangeValue = Math.max(
        Math.abs(highLowRange),
        Math.abs(highPrevCloseRange),
        Math.abs(prevCloseLowRange)
      );
      if (isFinite(trueRangeValue)) {
        trueRange.push(trueRangeValue);
      } else {
        trueRange.push(null);
      }
    }
    return trueRange;
  }
  /**
   * Ulcer Index (UI) - pandas_ta 标准实现
   * Peter Martin的溃疡指数，使用二次均值测量下行波动性，强调大幅回撤
   */
  static ui(
    dataList: KLineData[] | any[],
    length: number = 14,
    scalar: number = 100.0,
    everget: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = Math.max(0, Number(scalar)) || 100.0;
    everget = Boolean(everget);
    if (dataList.length < length) {
      return [];
    }
    const close = Formula.attr(dataList, 'close');
    if (!close || close.length === 0) {
      return [];
    }
    const ui: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        ui.push(null);
        continue;
      }
      let highestClose = -Infinity;
      for (let j = 0; j < length; j++) {
        const closeValue = close[i - j];
        if (ScriptUtils.isValid(closeValue) && closeValue > highestClose) {
          highestClose = closeValue;
        }
      }
      if (highestClose <= 0) {
        ui.push(null);
        continue;
      }
      const currentClose = close[i];
      if (!ScriptUtils.isValid(currentClose)) {
        ui.push(null);
        continue;
      }
      const d2Values: number[] = [];
      for (let j = 0; j < length; j++) {
        const closeValue = close[i - j];
        let prevHighestClose = -Infinity;
        for (let k = 0; k < length; k++) {
          const histClose = close[i - j - k];
          if (ScriptUtils.isValid(histClose) && histClose > prevHighestClose) {
            prevHighestClose = histClose;
          }
        }
        if (prevHighestClose > 0) {
          const histDownside = scalar * (closeValue - prevHighestClose) / prevHighestClose;
          d2Values.push(histDownside * histDownside);
        } else {
          d2Values.push(0);
        }
      }
      let uiValue: (number | null)[];
      if (everget) {
        const d2SMA = Formula.sma(d2Values, length);
        uiValue = d2SMA.map(val => val && isFinite(val) ? Math.sqrt(val / length) : null);
      } else {
        const d2Sum = d2Values.reduce((sum, val) => sum + val, 0);
        uiValue = [isFinite(d2Sum) ? Math.sqrt(d2Sum / length) : null];
      }
      ui.push(...uiValue);
    }
    return ui;
  }
  /**
   * Accumulation/Distribution (AD) - pandas_ta 标准实现
   * 累积/分布指标，利用收盘价相对于高低范围的位置与成交量，然后进行累积
   */
  static ad(
    dataList: KLineData[] | any[],
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    const ad: (number | null)[] = [];
    let cumulativeAd = 0;
    for (let i = 0; i < dataList.length; i++) {
      const currentHigh = dataList[i].high;
      const currentLow = dataList[i].low;
      const currentClose = dataList[i].close;
      const currentVolume = dataList[i].volume;
      const currentOpen = dataList[i].open;
      const highLowRange = currentHigh - currentLow;
      if (highLowRange <= 0) {
        ad.push(null);
        continue;
      }
      let adValue: number;
      if (currentOpen !== null && ScriptUtils.isValid(currentOpen)) {
        adValue = currentClose - currentOpen;
      } else {
        adValue = 2 * currentClose - currentHigh - currentLow;
      }
      const adWithVolume = adValue * currentVolume / highLowRange;
      cumulativeAd += adWithVolume;
      if (isFinite(cumulativeAd)) {
        ad.push(cumulativeAd);
      } else {
        ad.push(null);
      }
    }
    return ad;
  }
  /**
   * Accumulation/Distribution Oscillator (ADOSC) - pandas_ta 标准实现
   * 累积/分布震荡指标，利用AD指标并像MACD或APO一样处理
   */
  static adosc(
    dataList: KLineData[] | any[],
    fast: number = 3,
    slow: number = 10,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    fast = Math.floor(fast) || 3;
    slow = Math.floor(slow) || 10;
    if (fast <= 0 || slow <= 0) {
      return [];
    }
    const adValues = Formula.ad(dataList);
    if (!adValues || adValues.length === 0) {
      return [];
    }
    const fastAd = Formula.ema(adValues, fast);
    const slowAd = Formula.ema(adValues, slow);
    if (!fastAd || !slowAd || fastAd.length === 0 || slowAd.length === 0) {
      return [];
    }
    const adosc: (number | null)[] = [];
    const minLength = Math.min(fastAd.length, slowAd.length);
    for (let i = 0; i < minLength; i++) {
      const fastValue = fastAd[i];
      const slowValue = slowAd[i];
      if (fastValue !== null && slowValue !== null) {
        const adoscValue = fastValue - slowValue;
        if (isFinite(adoscValue)) {
          adosc.push(adoscValue);
        } else {
          adosc.push(null);
        }
      } else {
        adosc.push(null);
      }
    }
    return adosc;
  }
  /**
   * Archer On Balance Volume (AOBV) - pandas_ta 标准实现
   * Archer平衡成交量指标，结合OBV和移动平均线进行趋势分析
   */
  static aobv(
    dataList: KLineData[] | any[],
    fast: number = 4,
    slow: number = 12,
    mamode: string = 'ema',
    maxLookback: number = 2,
    minLookback: number = 2,
    runLength: number = 2,
  ): {
    obv: (number | null)[];
    obvMin: (number | null)[];
    obvMax: (number | null)[];
    obvFast: (number | null)[];
    obvSlow: (number | null)[];
    obvLong: (number | null)[];
    obvShort: (number | null)[];
  } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return {
        obv: [],
        obvMin: [],
        obvMax: [],
        obvFast: [],
        obvSlow: [],
        obvLong: [],
        obvShort: []
      };
    }
    fast = Math.floor(fast) || 4;
    slow = Math.floor(slow) || 12;
    maxLookback = Math.floor(maxLookback) || 2;
    minLookback = Math.floor(minLookback) || 2;
    runLength = Math.floor(runLength) || 2;
    if (fast <= 0 || slow <= 0 || maxLookback <= 0 || minLookback <= 0 || runLength <= 0) {
      return {
        obv: [],
        obvMin: [],
        obvMax: [],
        obvFast: [],
        obvSlow: [],
        obvLong: [],
        obvShort: []
      };
    }
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const obvValues = Formula.obv(dataList);
    if (!obvValues || obvValues.length === 0) {
      return {
        obv: [],
        obvMin: [],
        obvMax: [],
        obvFast: [],
        obvSlow: [],
        obvLong: [],
        obvShort: []
      };
    }
    let obvFast: (number | null)[];
    let obvSlow: (number | null)[];
    if (mamode.toLowerCase() === 'ema') {
      obvFast = Formula.ema(obvValues, fast);
      obvSlow = Formula.ema(obvValues, slow);
    } else if (mamode.toLowerCase() === 'sma') {
      obvFast = Formula.sma(obvValues, fast);
      obvSlow = Formula.sma(obvValues, slow);
    } else if (mamode.toLowerCase() === 'wma') {
      obvFast = Formula.wma(obvValues, fast);
      obvSlow = Formula.wma(obvValues, slow);
    } else {
      obvFast = Formula.ema(obvValues, fast);
      obvSlow = Formula.ema(obvValues, slow);
    }
    if (!obvFast || !obvSlow || obvFast.length === 0 || obvSlow.length === 0) {
      return {
        obv: [],
        obvMin: [],
        obvMax: [],
        obvFast: [],
        obvSlow: [],
        obvLong: [],
        obvShort: []
      };
    }
    const obvMin: (number | null)[] = [];
    const obvMax: (number | null)[] = [];
    for (let i = 0; i < obvValues.length; i++) {
      if (i < minLookback - 1) {
        obvMin.push(null);
        obvMax.push(null);
        continue;
      }
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let j = 0; j < minLookback; j++) {
        const val = obvValues[i - j];
        if (val !== null && ScriptUtils.isValid(val)) {
          minVal = Math.min(minVal, val);
          maxVal = Math.max(maxVal, val);
        }
      }
      if (isFinite(minVal) && isFinite(maxVal)) {
        obvMin.push(minVal);
        obvMax.push(maxVal);
      } else {
        obvMin.push(null);
        obvMax.push(null);
      }
    }
    const obvLong: (number | null)[] = [];
    const obvShort: (number | null)[] = [];
    for (let i = 0; i < obvFast.length; i++) {
      if (i < runLength - 1) {
        obvLong.push(null);
        obvShort.push(null);
        continue;
      }
      let longCount = 0;
      let shortCount = 0;
      for (let j = 0; j < runLength; j++) {
        const fastVal = obvFast[i - j];
        const slowVal = obvSlow[i - j];

        if (fastVal !== null && slowVal !== null) {
          if (fastVal > slowVal) {
            longCount++;
          } else if (fastVal < slowVal) {
            shortCount++;
          }
        }
      }
      obvLong.push(longCount);
      obvShort.push(shortCount);
    }
    return {
      obv: obvValues,
      obvMin: obvMin,
      obvMax: obvMax,
      obvFast: obvFast,
      obvSlow: obvSlow,
      obvLong: obvLong,
      obvShort: obvShort
    };
  }
  /**
   * Chaikin Money Flow (CMF) - pandas_ta 标准实现
   * Chaikin资金流量指标，测量特定时期内与累积/分布相结合的资金流量
   */
  static cmf(
    dataList: KLineData[] | any[],
    length: number = 20,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.floor(length) || 20;
    if (length <= 0) {
      return [];
    }
    const cmf: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        cmf.push(null);
        continue;
      }
      let adSum = 0;
      let volumeSum = 0;
      for (let j = 0; j < length; j++) {
        const currentIndex = i - j;
        const currentHigh = dataList[currentIndex].high;
        const currentLow = dataList[currentIndex].low;
        const currentClose = dataList[currentIndex].close;
        const currentVolume = dataList[currentIndex].volume;
        const currentOpen = dataList[currentIndex].open;
        if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) ||
          !ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(currentVolume)) {
          continue;
        }
        const highLowRange = currentHigh - currentLow;
        if (highLowRange <= 0) {
          continue;
        }
        let adValue: number;
        if (currentOpen !== null && ScriptUtils.isValid(currentOpen)) {
          adValue = currentClose - currentOpen;
        } else {
          adValue = 2 * currentClose - currentHigh - currentLow;
        }
        const adWithVolume = adValue * currentVolume / highLowRange;
        adSum += adWithVolume;
        volumeSum += currentVolume;
      }
      if (volumeSum > 0) {
        const cmfValue = adSum / volumeSum;
        if (isFinite(cmfValue)) {
          cmf.push(cmfValue);
        } else {
          cmf.push(null);
        }
      } else {
        cmf.push(null);
      }
    }
    return cmf;
  }
  /**
   * Elder's Force Index (EFI) - pandas_ta 标准实现
   * Elder力量指数，使用价格和成交量测量价格运动背后的力量
   */
  static efi(
    dataList: KLineData[] | any[],
    length: number = 13,
    drift: number = 1,
    mamode: string = 'ema',
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.floor(length) || 13;
    drift = Math.floor(drift) || 1;
    if (length <= 0 || drift <= 0) {
      return [];
    }
    const pvDiff: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        pvDiff.push(null);
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - drift].close;
      const currentVolume = dataList[i].volume;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose) ||
        !ScriptUtils.isValid(currentVolume)) {
        pvDiff.push(null);
        continue;
      }
      const priceDiff = currentClose - prevClose;
      const pvDiffValue = priceDiff * currentVolume;
      if (isFinite(pvDiffValue)) {
        pvDiff.push(pvDiffValue);
      } else {
        pvDiff.push(null);
      }
    }
    let efi: (number | null)[];
    if (mamode.toLowerCase() === 'sma') {
      efi = Formula.sma(pvDiff, length);
    } else {
      efi = Formula.ema(pvDiff, length);
    }
    if (!efi || efi.length === 0) {
      return [];
    }
    return efi;
  }
  /**
   * Ease of Movement (EOM) - pandas_ta 标准实现
   * 移动便利性指标，基于成交量的震荡指标，测量价格和成交量在零线附近波动的关系
   */
  static eom(
    dataList: KLineData[] | any[],
    length: number = 14,
    divisor: number = 100000000,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.floor(length) || 14;
    divisor = divisor || 100000000;
    drift = Math.floor(drift) || 1;
    if (length <= 0 || divisor <= 0 || drift <= 0) {
      return [];
    }
    const eom: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1 || i < drift) {
        eom.push(null);
        continue;
      }
      let eomSum = 0;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const currentIndex = i - j;
        const currentHigh = dataList[currentIndex].high;
        const currentLow = dataList[currentIndex].low;
        const currentVolume = dataList[currentIndex].volume;
        if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) ||
          !ScriptUtils.isValid(currentVolume)) {
          continue;
        }
        if (currentIndex < drift) {
          continue;
        }
        const prevHigh = dataList[currentIndex - drift].high;
        const prevLow = dataList[currentIndex - drift].low;
        if (!ScriptUtils.isValid(prevHigh) || !ScriptUtils.isValid(prevLow)) {
          continue;
        }
        const highLowRange = currentHigh - currentLow;
        if (highLowRange <= 0) {
          continue;
        }
        const highDiff = currentHigh - prevHigh;
        const lowDiff = currentLow - prevLow;
        const distance = 0.5 * (highDiff + lowDiff);
        const boxRatio = (currentVolume / divisor) / highLowRange;
        if (boxRatio === 0) {
          continue;
        }
        const eomValue = distance / boxRatio;
        if (isFinite(eomValue)) {
          eomSum += eomValue;
          validCount++;
        }
      }
      if (validCount > 0) {
        const avgEom = eomSum / validCount;
        if (isFinite(avgEom)) {
          eom.push(avgEom);
        } else {
          eom.push(null);
        }
      } else {
        eom.push(null);
      }
    }
    return eom;
  }
  /**
   * Negative Volume Index (NVI) - pandas_ta 标准实现
   * 负成交量指数，累积指标，使用成交量变化来识别聪明资金活跃的地方
   */
  static nvi(
    dataList: KLineData[] | any[],
    length: number = 1,
    initial: number = 1000,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.floor(length) || 1;
    initial = initial || 1000;
    if (length <= 0 || initial <= 0) {
      return [];
    }
    const nvi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        // 第一个值设置为初始值
        if (i === 0) {
          nvi.push(initial);
        } else {
          nvi.push(null);
        }
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - length].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose)) {
        nvi.push(null);
        continue;
      }
      const roc = (currentClose - prevClose) / prevClose;
      const currentVolume = dataList[i].volume;
      const prevVolume = dataList[i - 1].volume;
      if (!ScriptUtils.isValid(currentVolume) || !ScriptUtils.isValid(prevVolume)) {
        nvi.push(null);
        continue;
      }
      const volumeChange = (currentVolume - prevVolume) / prevVolume;
      let nviValue = 0;
      if (volumeChange < 0) {
        nviValue = Math.abs(volumeChange) * roc;
      }
      if (i > 0 && nvi[i - 1] !== null) {
        nviValue += nvi[i - 1];
      }
      if (isFinite(nviValue)) {
        nvi.push(nviValue);
      } else {
        nvi.push(null);
      }
    }
    return nvi;
  }
  /**
   * Archer On Balance Volume (AOBV) - pandas_ta 标准实现
   * Archer平衡成交量指标，结合OBV和移动平均线进行趋势分析
   */
  static pvi(
    dataList: KLineData[] | any[],
    length: number = 1,
    initial: number = 1000,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.floor(length) || 1;
    initial = initial || 1000;
    if (length <= 0 || initial <= 0) {
      return [];
    }
    const pvi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        if (i === 0) {
          pvi.push(initial);
        } else {
          pvi.push(null);
        }
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - length].close;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose)) {
        pvi.push(null);
        continue;
      }
      const roc = (currentClose - prevClose) / prevClose;
      const currentVolume = dataList[i].volume;
      const prevVolume = dataList[i - 1].volume;
      if (!ScriptUtils.isValid(currentVolume) || !ScriptUtils.isValid(prevVolume)) {
        pvi.push(null);
        continue;
      }
      const volumeChange = (currentVolume - prevVolume) / prevVolume;
      let pviValue = 0;
      if (volumeChange > 0) {
        pviValue = Math.abs(volumeChange) * roc;
      }
      if (i > 0 && pvi[i - 1] !== null) {
        pviValue += pvi[i - 1];
      }
      if (isFinite(pviValue)) {
        pvi.push(pviValue);
      } else {
        pvi.push(null);
      }
    }
    return pvi;
  }
  /**
   * Price-Volume (PVOL) - pandas_ta 标准实现
   * 价格成交量指标，返回价格和成交量的乘积
   */
  static pvol(
    dataList: KLineData[] | any[],
    signed: boolean = false,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    signed = Boolean(signed);
    const pvol: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const currentClose = dataList[i].close;
      const currentVolume = dataList[i].volume;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(currentVolume)) {
        pvol.push(null);
        continue;
      }
      let pvolValue: number;
      if (signed && i > 0) {
        const prevClose = close[i - 1];
        if (!ScriptUtils.isValid(prevClose)) {
          pvol.push(null);
          continue;
        }
        const priceDiff = currentClose - prevClose;
        const sign = priceDiff > 0 ? 1 : priceDiff < 0 ? -1 : 0;
        pvolValue = sign * currentClose * currentVolume;
      } else {
        pvolValue = currentClose * currentVolume;
      }
      if (isFinite(pvolValue)) {
        pvol.push(pvolValue);
      } else {
        pvol.push(null);
      }
    }
    return pvol;
  }
  /**
   * Price Volume Rank (PVR) - pandas_ta 标准实现
   * 价格成交量排名指标，由Anthony J. Macek开发，用于识别买卖时机
   */
  static pvr(
    dataList: KLineData[] | any[],
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    const pvr: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        pvr.push(null);
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - 1].close;
      const currentVolume = dataList[i].volume;
      const prevVolume = dataList[i - 1].volume;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose) ||
        !ScriptUtils.isValid(currentVolume) || !ScriptUtils.isValid(prevVolume)) {
        pvr.push(null);
        continue;
      }
      const closeDiff = currentClose - prevClose;
      const volumeDiff = currentVolume - prevVolume;
      let pvrValue: number;
      if (closeDiff >= 0 && volumeDiff >= 0) {
        pvrValue = 1;
      } else if (closeDiff >= 0 && volumeDiff < 0) {
        pvrValue = 2;
      } else if (closeDiff < 0 && volumeDiff >= 0) {
        pvrValue = 3;
      } else {
        pvrValue = 4;
      }
      pvr.push(pvrValue);
    }
    return pvr;
  }
  /**
   * Price-Volume Trend (PVT) - pandas_ta 标准实现
   * 价格成交量趋势指标，利用价格变化率与成交量的累积值来确定资金流向
   */
  static pvt(
    dataList: KLineData[] | any[],
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    drift = Math.max(1, Math.floor(drift)) || 1;
    const pvt: (number | null)[] = [];
    let cumulativePvt = 0;
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        pvt.push(null);
        continue;
      }
      const currentClose = dataList[i].close;
      const prevClose = dataList[i - drift].close;
      const currentVolume = dataList[i].volume;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(prevClose) ||
        !ScriptUtils.isValid(currentVolume)) {
        pvt.push(null);
        continue;
      }
      const roc = (currentClose - prevClose) / prevClose;
      const pv = roc * currentVolume;
      cumulativePvt += pv;
      if (isFinite(cumulativePvt)) {
        pvt.push(cumulativePvt);
      } else {
        pvt.push(null);
      }
    }
    return pvt;
  }
  /**
   * Volume Profile (VP) - pandas_ta 标准实现
   * 成交量分布图，通过将价格分割成范围来计算成交量分布
   */
  static vp(
    dataList: KLineData[] | any[],
    width: number = 10,
    sortClose: boolean = false,
  ): {
    low_price: number;
    mean_price: number;
    high_price: number;
    pos_volume: number;
    neg_volume: number;
    total_volume: number;
  }[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    width = Math.max(1, Math.floor(width)) || 10;
    sortClose = Boolean(sortClose);
    const vpData: Array<{
      close: number;
      pos_volume: number;
      neg_volume: number;
    }> = [];
    for (let i = 0; i < dataList.length; i++) {
      const currentClose = dataList[i].close;
      const currentVolume = dataList[i].volume;
      if (!ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(currentVolume)) {
        continue;
      }
      let posVolume = 0;
      let negVolume = 0;
      if (i > 0) {
        const prevClose = dataList[i - 1].close;
        if (ScriptUtils.isValid(prevClose)) {
          if (currentClose >= prevClose) {
            posVolume = currentVolume;
            negVolume = 0;
          } else {
            posVolume = 0;
            negVolume = currentVolume;
          }
        }
      } else {
        posVolume = currentVolume;
        negVolume = 0;
      }
      vpData.push({
        close: currentClose,
        pos_volume: posVolume,
        neg_volume: negVolume
      });
    }
    if (vpData.length === 0) {
      return [];
    }
    if (sortClose) {
      vpData.sort((a, b) => a.close - b.close);
    }
    const priceMin = Math.min(...vpData.map(item => item.close));
    const priceMax = Math.max(...vpData.map(item => item.close));
    const priceRange = priceMax - priceMin;
    if (priceRange <= 0) {
      const totalPosVolume = vpData.reduce((sum, item) => sum + item.pos_volume, 0);
      const totalNegVolume = vpData.reduce((sum, item) => sum + item.neg_volume, 0);
      return [{
        low_price: priceMin,
        mean_price: priceMin,
        high_price: priceMax,
        pos_volume: totalPosVolume,
        neg_volume: totalNegVolume,
        total_volume: totalPosVolume + totalNegVolume
      }];
    }
    const rangeSize = priceRange / width;
    const ranges: Array<{
      low: number;
      high: number;
      data: typeof vpData;
    }> = [];
    for (let i = 0; i < width; i++) {
      const low = priceMin + i * rangeSize;
      const high = i === width - 1 ? priceMax : priceMin + (i + 1) * rangeSize;
      const rangeData = vpData.filter(item =>
        item.close >= low && (i === width - 1 ? item.close <= high : item.close < high)
      );
      ranges.push({
        low,
        high,
        data: rangeData
      });
    }
    const result: Array<{
      low_price: number;
      mean_price: number;
      high_price: number;
      pos_volume: number;
      neg_volume: number;
      total_volume: number;
    }> = [];
    for (const range of ranges) {
      if (range.data.length === 0) {
        result.push({
          low_price: range.low,
          mean_price: (range.low + range.high) / 2,
          high_price: range.high,
          pos_volume: 0,
          neg_volume: 0,
          total_volume: 0
        });
        continue;
      }
      const rangeCloses = range.data.map(item => item.close);
      const totalPosVolume = range.data.reduce((sum, item) => sum + item.pos_volume, 0);
      const totalNegVolume = range.data.reduce((sum, item) => sum + item.neg_volume, 0);
      result.push({
        low_price: Math.min(...rangeCloses),
        mean_price: rangeCloses.reduce((sum, close) => sum + close, 0) / rangeCloses.length,
        high_price: Math.max(...rangeCloses),
        pos_volume: totalPosVolume,
        neg_volume: totalNegVolume,
        total_volume: totalPosVolume + totalNegVolume
      });
    }
    return result;
  }
  /**
   * Money Flow Index (MFI) - pandas_ta 标准实现
   * 资金流量指标，震荡指标，用于通过价格和成交量测量买卖压力
   */
  static mfi(
    dataList: KLineData[] | any[],
    length: number = 14,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.floor(length) || 14;
    drift = Math.floor(drift) || 1;
    if (length <= 0 || drift <= 0) {
      return [];
    }
    const mfi: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1 || i < drift) {
        mfi.push(null);
        continue;
      }
      let positiveMoneyFlow = 0;
      let negativeMoneyFlow = 0;
      for (let j = 0; j < length; j++) {
        const currentIndex = i - j;
        const currentHigh = dataList[currentIndex].high;
        const currentLow = dataList[currentIndex].low;
        const currentClose = dataList[currentIndex].close;
        const currentVolume = dataList[currentIndex].volume;
        if (!ScriptUtils.isValid(currentHigh) || !ScriptUtils.isValid(currentLow) ||
          !ScriptUtils.isValid(currentClose) || !ScriptUtils.isValid(currentVolume)) {
          continue;
        }
        if (currentIndex < drift) {
          continue;
        }
        const prevHigh = dataList[currentIndex - drift].high;
        const prevLow = dataList[currentIndex - drift].low;
        const prevClose = dataList[currentIndex - drift].close;
        if (!ScriptUtils.isValid(prevHigh) || !ScriptUtils.isValid(prevLow) ||
          !ScriptUtils.isValid(prevClose)) {
          continue;
        }
        const currentTypicalPrice = (currentHigh + currentLow + currentClose) / 3;
        const prevTypicalPrice = (prevHigh + prevLow + prevClose) / 3;
        const rawMoneyFlow = currentTypicalPrice * currentVolume;
        const priceDiff = currentTypicalPrice - prevTypicalPrice;
        if (priceDiff > 0) {
          positiveMoneyFlow += rawMoneyFlow;
        } else if (priceDiff < 0) {
          negativeMoneyFlow += rawMoneyFlow;
        }
      }
      if (negativeMoneyFlow === 0) {
        mfi.push(100);
      } else if (positiveMoneyFlow === 0) {
        mfi.push(0);
      } else {
        const moneyFlowRatio = positiveMoneyFlow / negativeMoneyFlow;
        const mfiValue = 100 * positiveMoneyFlow / (positiveMoneyFlow + negativeMoneyFlow);
        if (isFinite(mfiValue)) {
          mfi.push(mfiValue);
        } else {
          mfi.push(null);
        }
      }
    }
    return mfi;
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
   * 获取趋势方向
   */
  static getTrend(
    list: any[],
    shortPeriod: number = 10,
    longPeriod: number = 20,
    key: string | null = null
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
   * SAR 抛物线转向指标
   */
  static sar(list: KLineData[], num1: number = 2, num2: number = 20, num3: number = 20): number[] {
    const startAf = num1 / 100 // 加速因子  
    const step = num2 / 100   // 极限价格  
    const maxAf = num3 / 100   // 极限价格  
    let af = startAf
    let ep = -100
    let isIncreasing = false
    let sar = 0
    const res = list.map((kLineData, i) => {
      const preSar = sar
      const high = kLineData.high
      const low = kLineData.low
      if (isIncreasing) {
        if (ep === -100 || ep < high) {
          ep = high
          af = Math.min(af + step, maxAf)
        }
        sar = preSar + af * (ep - preSar)
        const lowMin = Math.min(list[Math.max(1, i) - 1].low, low)
        if (sar > kLineData.low) {
          sar = ep
          af = startAf
          ep = -100
          isIncreasing = !isIncreasing
        } else if (sar > lowMin) {
          sar = lowMin
        }
      } else {
        if (ep === -100 || ep > low) {
          ep = low
          af = Math.min(af + step, maxAf)
        }
        sar = preSar + af * (ep - preSar)
        const highMax = Math.max(list[Math.max(1, i) - 1].high, high)
        if (sar < kLineData.high) {
          sar = ep
          af = 0
          ep = -100
          isIncreasing = !isIncreasing
        } else if (sar < highMax) {
          sar = highMax
        }
      }
      return sar
    })
    return res
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
      const val = Formula.getNumVal(key, item)
      if (ScriptUtils.isValid(val)) {
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
      const val = Formula.getNumVal(key, item)
      if (ScriptUtils.isValid(val)) {
        if (result.val === null || val < result.val) {
          result.val = val
          result.index = index
        }
      }
    })
    return result
  }
  /**  
   * BIAS 乖离率指标  
   * 按照 pandas_ta 标准：BIAS = (close / MA(close, length)) - 1
   */
  static bias(
    dataList: KLineData[],
    length: number = 26,
    mamode: string = 'sma',
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 26;
    if (dataList.length < length) {
      return [];
    }
    const result: (number | null)[] = [];
    let maData: (number | null)[];
    switch (mamode.toLowerCase()) {
      case 'ema':
        maData = Formula.ema(dataList, length, 'close');
        break;
      case 'hma':
        maData = Formula.hma(dataList, length, 'close');
        break;
      case 'rma':
        maData = Formula.rma(dataList, length, 'close');
        break;
      case 'wma':
        maData = Formula.wma(dataList, length, 'close');
        break;
      default:
        maData = Formula.sma(dataList, length, 'close');
        break;
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      const close = dataList[i].close;
      const ma = maData[i];
      if (close !== null && ma !== null && ma !== 0) {
        result.push((close / ma) - 1);
      } else {
        result.push(null);
      }
    }
    return result;
  }
  /**
   * Doji蜡烛图识别
   * 识别Doji蜡烛图形态，当K线实体小于前N个K线高低范围平均值的指定百分比时，判定为Doji
   */
  static cdl_doji(
    dataList: KLineData[],
    length: number = 10,
    factor: number = 10,
    scalar: number = 100,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length));
    factor = parseFloat(factor.toString()) || 10;
    scalar = parseFloat(scalar.toString()) || 100;
    const result: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      const currentBar = dataList[i];
      if (!currentBar || !ScriptUtils.isValid(currentBar.open) || !ScriptUtils.isValid(currentBar.high) ||
        !ScriptUtils.isValid(currentBar.low) || !ScriptUtils.isValid(currentBar.close)) {
        result.push(null);
        continue;
      }
      const body = Math.abs(currentBar.close - currentBar.open);
      let hlRangeSum = 0;
      let validCount = 0;
      for (let j = i - length + 1; j <= i; j++) {
        const bar = dataList[j];
        if (bar && ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low)) {
          hlRangeSum += Math.abs(bar.high - bar.low);
          validCount++;
        }
      }
      if (validCount === 0) {
        result.push(null);
        continue;
      }
      const hlRangeAvg = hlRangeSum / validCount;
      const isDoji = body < 0.01 * factor * hlRangeAvg;
      const dojiValue = isDoji ? scalar : 0
      result.push(dojiValue);
    }
    return result;
  }
  /**
   * Inside Bar蜡烛图识别
   * 识别Inside Bar形态，当前K线的高点低于前一个K线的高点，且低点高于前一个K线的低点
   */
  static cdl_inside(
    dataList: KLineData[],
  ): (number | boolean | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    const result: (number | boolean | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i === 0) {
        result.push(null);
        continue;
      }
      const currentBar = dataList[i];
      const prevBar = dataList[i - 1];
      if (!currentBar || !prevBar ||
        !ScriptUtils.isValid(currentBar.high) || !ScriptUtils.isValid(currentBar.low) ||
        !ScriptUtils.isValid(prevBar.high) || !ScriptUtils.isValid(prevBar.low) ||
        !ScriptUtils.isValid(currentBar.open) || !ScriptUtils.isValid(currentBar.close)) {
        result.push(null);
        continue;
      }
      const highDiff = currentBar.high - prevBar.high;
      const lowDiff = currentBar.low - prevBar.low;
      const isInside = (highDiff < 0) && (lowDiff > 0);
      if (!isInside) {
        result.push(0);
      } else {
        const candleColor = currentBar.close > currentBar.open ? 1 : -1;
        result.push(candleColor);
      }
    }
    return result;
  }
  /**
   * Heikin Ashi蜡烛图
   * Heikin Ashi技术通过平均价格数据创建日本蜡烛图，过滤市场噪音
   */
  static ha(
    dataList: KLineData[],
  ): Array<{
    open: number;
    high: number;
    low: number;
    close: number;
  } | null> {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    const result: Array<{
      open: number;
      high: number;
      low: number;
      close: number;
    } | null> = [];

    for (let i = 0; i < dataList.length; i++) {
      const currentBar = dataList[i];
      if (!currentBar || !ScriptUtils.isValid(currentBar.open) || !ScriptUtils.isValid(currentBar.high) ||
        !ScriptUtils.isValid(currentBar.low) || !ScriptUtils.isValid(currentBar.close)) {
        result.push(null);
        continue;
      }
      let haOpen: number;
      let haClose: number;
      if (i === 0) {
        haOpen = 0.5 * (currentBar.open + currentBar.close);
        haClose = 0.25 * (currentBar.open + currentBar.high + currentBar.low + currentBar.close);
      } else {
        const prevResult = result[i - 1];
        if (!prevResult) {
          result.push(null);
          continue;
        }
        haOpen = 0.5 * (prevResult.open + prevResult.close);
        haClose = 0.25 * (currentBar.open + currentBar.high + currentBar.low + currentBar.close);
      }
      const haHigh = Math.max(haOpen, currentBar.high, haClose);
      const haLow = Math.min(haOpen, currentBar.low, haClose);
      result.push({
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose
      });
    }
    return result;
  }
  /**
   * Even Better SineWave (EBSW)
   * 测量市场周期并使用低通滤波器去除噪音，输出信号限制在-1到1之间
   */
  static ebsw(
    dataList: KLineData[],
    length: number = 40,
    bars: number = 10,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(39, Math.floor(length)) || 40;
    bars = Math.max(1, Math.floor(bars)) || 10;
    const result: (number | null)[] = [];
    let alpha1 = 0;
    let HP = 0;
    let a1 = 0, b1 = 0, c1 = 0, c2 = 0, c3 = 0;
    let Filt = 0, Pwr = 0, Wave = 0;
    let lastClose = 0;
    let lastHP = 0;
    const FilterHist: number[] = [0, 0]; // 滤波器历史
    for (let i = 0; i < length - 1; i++) {
      result.push(null);
    }
    if (dataList.length >= length) {
      const firstBar = dataList[length - 1];
      if (firstBar && ScriptUtils.isValid(firstBar.close)) {
        lastClose = firstBar.close;
        result.push(0);
      } else {
        result.push(null);
      }
    }
    for (let i = length; i < dataList.length; i++) {
      const currentBar = dataList[i];
      if (!currentBar || !ScriptUtils.isValid(currentBar.close)) {
        result.push(null);
        continue;
      }
      alpha1 = (1 - Math.sin(360 / length * Math.PI / 180)) / Math.cos(360 / length * Math.PI / 180);
      HP = 0.5 * (1 + alpha1) * (currentBar.close - lastClose) + alpha1 * lastHP;
      a1 = Math.exp(-Math.sqrt(2) * Math.PI / bars);
      b1 = 2 * a1 * Math.cos(Math.sqrt(2) * 180 / bars * Math.PI / 180);
      c2 = b1;
      c3 = -1 * a1 * a1;
      c1 = 1 - c2 - c3;
      Filt = c1 * (HP + lastHP) / 2 + c2 * FilterHist[1] + c3 * FilterHist[0];
      Wave = (Filt + FilterHist[1] + FilterHist[0]) / 3;
      Pwr = (Filt * Filt + FilterHist[1] * FilterHist[1] + FilterHist[0] * FilterHist[0]) / 3;
      if (Pwr > 0) {
        Wave = Wave / Math.sqrt(Pwr);
      } else {
        Wave = 0;
      }
      FilterHist.push(Filt);
      FilterHist.shift(); // 移除第一个元素
      lastHP = HP;
      lastClose = currentBar.close;
      result.push(Wave);
    }
    return result;
  }
  /**
   * Awesome Oscillator (AO)
   * 用于测量证券动量的指标，通过短期和长期移动平均线的差异来判断趋势强弱
   */
  static ao(
    dataList: KLineData[],
    fast: number = 5,
    slow: number = 34,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    fast = Math.max(1, Math.floor(fast)) || 5;
    slow = Math.max(1, Math.floor(slow)) || 34;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const _length = Math.max(fast, slow);
    if (dataList.length < _length) {
      return [];
    }
    const result: (number | null)[] = [];
    const medianPrices: number[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (bar && ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low)) {
        medianPrices.push(0.5 * (bar.high + bar.low));
      } else {
        medianPrices.push(NaN);
      }
    }
    const fastSMA = Formula.sma(medianPrices, fast);
    const slowSMA = Formula.sma(medianPrices, slow);
    for (let i = 0; i < dataList.length; i++) {
      if (i < _length - 1) {
        result.push(null);
        continue;
      }
      const fastValue = fastSMA[i];
      const slowValue = slowSMA[i];
      if (fastValue !== null && slowValue !== null) {
        result.push(fastValue - slowValue);
      } else {
        result.push(null);
      }
    }
    return result;
  }
  /**
   * Absolute Price Oscillator (APO)
   * 用于测量证券动量的指标，它是两个不同周期简单移动平均线的差值
   * 注意：APO和MACD线是等价的
   */
  static apo(
    dataList: KLineData[],
    fast: number = 12,
    slow: number = 26,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    fast = Math.max(1, Math.floor(fast)) || 12;
    slow = Math.max(1, Math.floor(slow)) || 26;
    if (slow < fast) {
      [fast, slow] = [slow, fast];
    }
    const _length = Math.max(fast, slow);
    if (dataList.length < _length) {
      return [];
    }
    const result: (number | null)[] = [];
    const closePrices: number[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (bar && ScriptUtils.isValid(bar.close)) {
        closePrices.push(bar.close);
      } else {
        closePrices.push(NaN);
      }
    }
    const fastSMA = Formula.sma(closePrices, fast);
    const slowSMA = Formula.sma(closePrices, slow);
    for (let i = 0; i < dataList.length; i++) {
      if (i < _length - 1) {
        result.push(null);
        continue;
      }
      const fastValue = fastSMA[i];
      const slowValue = slowSMA[i];

      if (fastValue !== null && slowValue !== null) {
        result.push(fastValue - slowValue);
      } else {
        result.push(null);
      }
    }
    return result;
  }
  /**
   * Balance of Power (BOP)
   * 衡量买方相对于卖方的市场强度
   */
  static bop(
    dataList: KLineData[],
    scalar: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    scalar = parseFloat(scalar.toString()) || 1;
    const result: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (!bar ||
        !ScriptUtils.isValid(bar.open) ||
        !ScriptUtils.isValid(bar.high) ||
        !ScriptUtils.isValid(bar.low) ||
        !ScriptUtils.isValid(bar.close)) {
        result.push(null);
        continue;
      }
      const highLowRange = bar.high - bar.low;
      const closeOpenRange = bar.close - bar.open;
      if (highLowRange === 0) {
        result.push(null);
        continue;
      }
      const bop = scalar * closeOpenRange / highLowRange;
      result.push(bop);
    }
    return result;
  }
  /**
   * Chande Forcast Oscillator (CFO)
   * 计算实际价格与时间序列预测之间的百分比差异
   */
  static cfo(
    dataList: KLineData[],
    length: number = 9,
    scalar: number = 100,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 9;
    scalar = parseFloat(scalar.toString()) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length) {
      return [];
    }
    const result: (number | null)[] = [];
    const linregForecast = Formula.linreg(dataList, length, false, false, false, false, false, true, 'close');
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      const bar = dataList[i];
      const forecast = linregForecast[i];
      if (!bar || !ScriptUtils.isValid(bar.close) || forecast === null || forecast === 0) {
        result.push(null);
        continue;
      }
      const cfo = scalar * (bar.close - forecast) / bar.close;
      result.push(cfo);
    }
    return result;
  }
  /**
   * Center of Gravity (CG)
   * 由John Ehlers开发，试图识别转折点，同时表现出零滞后和平滑特性
   */
  static cg(
    dataList: KLineData[],
    length: number = 10,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    if (dataList.length < length) {
      return [];
    }
    const result: (number | null)[] = [];
    const coefficients: number[] = [];
    for (let i = 0; i < length; i++) {
      coefficients.push(length - i);
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      let numerator = 0;
      let denominator = 0;
      for (let j = 0; j < length; j++) {
        const bar = dataList[i - j];
        if (!bar || !ScriptUtils.isValid(bar.close)) {
          result.push(null);
          continue;
        }
        const close = bar.close;
        const coefficient = coefficients[j];
        numerator += close * coefficient;
        denominator += close;
      }
      if (denominator === 0) {
        result.push(null);
        continue;
      }
      const cg = -numerator / denominator;
      result.push(cg);
    }
    return result;
  }
  /**
   * Chande Momentum Oscillator (CMO)
   * 试图捕捉资产的动量，超买水平为50，超卖水平为-50
   */
  static cmo(
    dataList: KLineData[],
    length: number = 14,
    scalar: number = 100,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 14;
    scalar = parseFloat(scalar.toString()) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length + drift) {
      return [];
    }
    const result: (number | null)[] = [];
    const momentum: number[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        momentum.push(NaN);
        continue;
      }
      const currentBar = dataList[i];
      const prevBar = dataList[i - drift];
      if (!currentBar || !prevBar ||
        !ScriptUtils.isValid(currentBar.close) ||
        !ScriptUtils.isValid(prevBar.close)) {
        momentum.push(NaN);
        continue;
      }
      momentum.push(currentBar.close - prevBar.close);
    }
    const positive: number[] = [];
    const negative: number[] = [];
    for (let i = 0; i < momentum.length; i++) {
      const mom = momentum[i];
      if (isNaN(mom)) {
        positive.push(NaN);
        negative.push(NaN);
        continue;
      }
      positive.push(mom > 0 ? mom : 0);
      negative.push(mom < 0 ? Math.abs(mom) : 0);
    }
    const posRma = Formula.rma(positive, length);
    const negRma = Formula.rma(negative, length);
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      const pos = posRma[i];
      const neg = negRma[i];
      if (pos === null || neg === null || (pos + neg) === 0) {
        result.push(null);
        continue;
      }
      const cmo = scalar * (pos - neg) / (pos + neg);
      result.push(cmo);
    }
    return result;
  }
  /**
   * Coppock Curve (COPC)
   * 原名"Trendex Model"，是一个动量指标，专为月度时间尺度设计
   */
  static coppock(
    dataList: KLineData[],
    length: number = 10,
    fast: number = 11,
    slow: number = 14,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    fast = Math.max(1, Math.floor(fast)) || 11;
    slow = Math.max(1, Math.floor(slow)) || 14;
    const maxPeriod = Math.max(length, fast, slow);
    if (dataList.length < maxPeriod) {
      return [];
    }
    const fastRoc = Formula.roc(dataList, fast);
    const slowRoc = Formula.roc(dataList, slow);
    const totalRoc: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const fastVal = fastRoc[i];
      const slowVal = slowRoc[i];
      if (fastVal === null || slowVal === null) {
        totalRoc.push(null);
        continue;
      }
      totalRoc.push(fastVal + slowVal);
    }
    const coppock = Formula.wma(totalRoc, length);
    return coppock;
  }
  /**
   * Efficiency Ratio (ER)
   * 效率比率由Perry J. Kaufman发明，旨在衡量市场噪音或波动性
   */
  static er(
    dataList: KLineData[],
    length: number = 10,
    drift: number = 1,
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 10;
    drift = Math.max(1, Math.floor(drift)) || 1;
    if (dataList.length < length + drift) {
      return [];
    }
    const result: (number | null)[] = [];
    const absDiff: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        absDiff.push(null);
        continue;
      }
      const currentBar = dataList[i];
      const prevBar = dataList[i - length];
      if (!currentBar || !prevBar ||
        !ScriptUtils.isValid(currentBar.close) ||
        !ScriptUtils.isValid(prevBar.close)) {
        absDiff.push(null);
        continue;
      }
      absDiff.push(Math.abs(currentBar.close - prevBar.close));
    }
    const volatility: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < drift) {
        volatility.push(null);
        continue;
      }
      const currentBar = dataList[i];
      const prevBar = dataList[i - drift];
      if (!currentBar || !prevBar ||
        !ScriptUtils.isValid(currentBar.close) ||
        !ScriptUtils.isValid(prevBar.close)) {
        volatility.push(null);
        continue;
      }
      volatility.push(Math.abs(currentBar.close - prevBar.close));
    }
    for (let i = 0; i < dataList.length; i++) {
      if (i < length) {
        result.push(null);
        continue;
      }
      const absDiffVal = absDiff[i];
      if (absDiffVal === null) {
        result.push(null);
        continue;
      }
      let volatilitySum = 0;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const volIndex = i - j;
        if (volIndex >= 0 && volatility[volIndex] !== null) {
          volatilitySum += volatility[volIndex]!;
          validCount++;
        }
      }
      if (validCount === 0 || volatilitySum === 0) {
        result.push(null);
        continue;
      }
      const er = absDiffVal / volatilitySum;
      result.push(er);
    }
    return result;
  }
  /**
   * Elder Ray Index (ERI)
   * 包含Bull Power（多头力量）和Bear Power（空头力量）
   */
  static eri(
    dataList: KLineData[],
    length: number = 13,
  ): { bull: (number | null)[], bear: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { bull: [], bear: [] };
    }
    length = Math.max(1, Math.floor(length)) || 13;
    if (dataList.length < length) {
      return { bull: [], bear: [] };
    }
    const emaValues = Formula.ema(dataList, length, 'close');
    const bull: (number | null)[] = [];
    const bear: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      const ema = emaValues[i];
      if (!bar || ema === null ||
        !ScriptUtils.isValid(bar.high) ||
        !ScriptUtils.isValid(bar.low)) {
        bull.push(null);
        bear.push(null);
        continue;
      }
      bull.push(bar.high - ema);
      bear.push(bar.low - ema);
    }
    return { bull, bear };
  }
  /**
   * Fisher Transform (FISHT)
   * 通过将价格标准化，识别重要的价格反转
   */
  static fisher(
    dataList: KLineData[],
    length: number = 9,
    signal: number = 1,
  ): { fisher: (number | null)[], signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { fisher: [], signal: [] };
    }
    length = Math.max(1, Math.floor(length)) || 9;
    signal = Math.max(1, Math.floor(signal)) || 1;
    const maxLength = Math.max(length, signal);
    if (dataList.length < maxLength) {
      return { fisher: [], signal: [] };
    }
    const hl2: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const bar = dataList[i];
      if (!bar || !ScriptUtils.isValid(bar.high) || !ScriptUtils.isValid(bar.low)) {
        hl2.push(null);
        continue;
      }
      hl2.push((bar.high + bar.low) / 2);
    }
    const highestHl2: (number | null)[] = [];
    const lowestHl2: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < length - 1) {
        highestHl2.push(null);
        lowestHl2.push(null);
        continue;
      }
      let maxHl2 = -Infinity;
      let minHl2 = Infinity;
      let validCount = 0;
      for (let j = 0; j < length; j++) {
        const hl2Index = i - j;
        if (hl2Index >= 0 && hl2[hl2Index] !== null) {
          maxHl2 = Math.max(maxHl2, hl2[hl2Index]!);
          minHl2 = Math.min(minHl2, hl2[hl2Index]!);
          validCount++;
        }
      }
      if (validCount === 0) {
        highestHl2.push(null);
        lowestHl2.push(null);
        continue;
      }
      highestHl2.push(maxHl2);
      lowestHl2.push(minHl2);
    }
    const fisher: (number | null)[] = [];
    let v = 0;
    for (let i = 0; i < length - 1; i++) {
      fisher.push(null);
    }
    fisher.push(0);
    for (let i = length; i < dataList.length; i++) {
      const hl2Val = hl2[i];
      const highest = highestHl2[i];
      const lowest = lowestHl2[i];
      if (hl2Val === null || highest === null || lowest === null) {
        fisher.push(null);
        continue;
      }
      let hlr = highest - lowest;
      hlr = Math.max(hlr, 0.001); // 防止除零
      const position = ((hl2Val - lowest) / hlr) - 0.5;
      v = 0.66 * position + 0.67 * v;
      v = Math.max(-0.999, Math.min(0.999, v)); // 限制在-0.999到0.999之间
      const fisherValue = 0.5 * (Math.log((1 + v) / (1 - v)) + fisher[i - 1]!);
      fisher.push(fisherValue);
    }
    const signalLine: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < signal) {
        signalLine.push(null);
        continue;
      }
      signalLine.push(fisher[i - signal]);
    }
    return { fisher, signal: signalLine };
  }
  /**
   * Gann HiLo Activator (HiLo)
   * Gann高低激活器指标，基于移动平均线的趋势指标
   */
  static hilo(
    dataList: KLineData[],
    high_length: number = 13,
    low_length: number = 21,
    mamode: string = 'sma',
  ): { hilo: (number | null)[], long: (number | null)[], short: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { hilo: [], long: [], short: [] };
    }
    high_length = Math.max(1, Math.floor(high_length)) || 13;
    low_length = Math.max(1, Math.floor(low_length)) || 21;
    mamode = mamode.toLowerCase();
    const maxLength = Math.max(high_length, low_length);
    if (dataList.length < maxLength) {
      return { hilo: [], long: [], short: [] };
    }
    let high_ma: (number | null)[];
    let low_ma: (number | null)[];
    switch (mamode) {
      case 'ema':
        high_ma = Formula.ema(dataList, high_length, 'close');
        low_ma = Formula.ema(dataList, low_length, 'close');
        break;
      case 'hma':
        high_ma = Formula.hma(dataList, high_length);
        low_ma = Formula.hma(dataList, low_length);
        break;
      case 'sma':
      default:
        high_ma = Formula.sma(dataList, high_length, 'close');
        low_ma = Formula.sma(dataList, low_length, 'close');
        break;
    }
    const hilo: (number | null)[] = [];
    const long: (number | null)[] = [];
    const short: (number | null)[] = [];
    hilo.push(null);
    long.push(null);
    short.push(null);
    for (let i = 1; i < dataList.length; i++) {
      const currentClose = dataList[i].close;
      const prevHighMa = high_ma[i - 1];
      const currentLowMa = low_ma[i];
      if (!ScriptUtils.isValid(currentClose) || prevHighMa === null || currentLowMa === null) {
        hilo.push(null);
        long.push(null);
        short.push(null);
        continue;
      }
      if (currentClose > prevHighMa) {
        hilo.push(currentLowMa);
        long.push(currentLowMa);
        short.push(null);
      } else if (currentClose < prevHighMa) {
        hilo.push(prevHighMa);
        long.push(null);
        short.push(prevHighMa);
      } else {
        const prevHilo = hilo[i - 1];
        hilo.push(prevHilo);
        long.push(prevHilo);
        short.push(prevHilo);
      }
    }
    return { hilo, long, short };
  }
  /**
   * Holt-Winter Moving Average (HWMA)
   * 霍尔特-温特移动平均线，三参数移动平均线，用于预测
   */
  static hwma(
    dataList: KLineData[] | any[],
    na: number = 0.2,
    nb: number = 0.1,
    nc: number = 0.1,
    key: string | null = null
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    na = Math.max(0, Math.min(1, parseFloat(na.toString()))) || 0.2;
    nb = Math.max(0, Math.min(1, parseFloat(nb.toString()))) || 0.1;
    nc = Math.max(0, Math.min(1, parseFloat(nc.toString()))) || 0.1;
    if (dataList.length < 1) {
      return [];
    }
    const result: (number | null)[] = [];
    let lastA = 0;
    let lastV = 0;
    let lastF: number | null = null;
    for (let i = 0; i < dataList.length; i++) {
      const price = Formula.getNumVal(key, dataList[i]);
      if (!ScriptUtils.isValid(price)) {
        result.push(null);
        continue;
      }
      if (lastF === null) {
        lastF = price;
        result.push(price);
        continue;
      }
      const F = (1.0 - na) * (lastF + lastV + 0.5 * lastA) + na * price;
      const V = (1.0 - nb) * (lastV + lastA) + nb * (F - lastF);
      const A = (1.0 - nc) * lastA + nc * (V - lastV);
      const hwmaValue = F + V + 0.5 * A;
      result.push(hwmaValue);
      lastA = A;
      lastF = F;
      lastV = V;
    }
    return result;
  }
  /**
   * Ichimoku Kinkō Hyō (Ichimoku)
   * 一目均衡表，二战前开发的金融市场预测模型
   */
  static ichimoku(
    dataList: KLineData[] | any[],
    tenkan: number = 9,
    kijun: number = 26,
    senkou: number = 52,
  ): {
    spanA: (number | null)[],
    spanB: (number | null)[],
    tenkanSen: (number | null)[],
    kijunSen: (number | null)[],
    chikouSpan: (number | null)[],
    spanAFuture: (number | null)[],
    spanBFuture: (number | null)[]
  } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return {
        spanA: [],
        spanB: [],
        tenkanSen: [],
        kijunSen: [],
        chikouSpan: [],
        spanAFuture: [],
        spanBFuture: []
      };
    }
    tenkan = Math.max(1, Math.floor(tenkan)) || 9;
    kijun = Math.max(1, Math.floor(kijun)) || 26;
    senkou = Math.max(1, Math.floor(senkou)) || 52;
    const maxLength = Math.max(tenkan, kijun, senkou);
    if (dataList.length < maxLength) {
      return {
        spanA: [],
        spanB: [],
        tenkanSen: [],
        kijunSen: [],
        chikouSpan: [],
        spanAFuture: [],
        spanBFuture: []
      };
    }
    const midprice = (high: number, low: number): number => {
      return (high + low) / 2;
    };
    const tenkanSen: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < tenkan - 1) {
        tenkanSen.push(null);
        continue;
      }
      let highest = -Infinity;
      let lowest = Infinity;
      let validCount = 0;
      for (let j = 0; j < tenkan; j++) {
        const index = i - j;
        if (index >= 0) {
          const bar = dataList[index];
          if (bar && ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low)) {
            highest = Math.max(highest, bar.high);
            lowest = Math.min(lowest, bar.low);
            validCount++;
          }
        }
      }
      if (validCount === 0) {
        tenkanSen.push(null);
      } else {
        tenkanSen.push(midprice(highest, lowest));
      }
    }
    const kijunSen: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < kijun - 1) {
        kijunSen.push(null);
        continue;
      }
      let highest = -Infinity;
      let lowest = Infinity;
      let validCount = 0;
      for (let j = 0; j < kijun; j++) {
        const index = i - j;
        if (index >= 0) {
          const bar = dataList[index];
          if (bar && ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low)) {
            highest = Math.max(highest, bar.high);
            lowest = Math.min(lowest, bar.low);
            validCount++;
          }
        }
      }
      if (validCount === 0) {
        kijunSen.push(null);
      } else {
        kijunSen.push(midprice(highest, lowest));
      }
    }
    const spanA: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const tenkanVal = tenkanSen[i];
      const kijunVal = kijunSen[i];
      if (tenkanVal === null || kijunVal === null) {
        spanA.push(null);
      } else {
        spanA.push(0.5 * (tenkanVal + kijunVal));
      }
    }
    const spanB: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < senkou - 1) {
        spanB.push(null);
        continue;
      }
      let highest = -Infinity;
      let lowest = Infinity;
      let validCount = 0;
      for (let j = 0; j < senkou; j++) {
        const index = i - j;
        if (index >= 0) {
          const bar = dataList[index];
          if (bar && ScriptUtils.isValid(bar.high) && ScriptUtils.isValid(bar.low)) {
            highest = Math.max(highest, bar.high);
            lowest = Math.min(lowest, bar.low);
            validCount++;
          }
        }
      }
      if (validCount === 0) {
        spanB.push(null);
      } else {
        spanB.push(midprice(highest, lowest));
      }
    }
    const chikouSpan: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      if (i < kijun) {
        chikouSpan.push(null);
        continue;
      }
      const bar = dataList[i - kijun];
      if (bar && ScriptUtils.isValid(bar.close)) {
        chikouSpan.push(bar.close);
      } else {
        chikouSpan.push(null);
      }
    }
    const spanAFuture: (number | null)[] = [];
    const spanBFuture: (number | null)[] = [];
    const lastSpanA = spanA.slice(-kijun);
    const lastSpanB = spanB.slice(-kijun);
    for (let i = 0; i < kijun; i++) {
      spanAFuture.push(lastSpanA[i] || null);
      spanBFuture.push(lastSpanB[i] || null);
    }
    return {
      spanA,
      spanB,
      tenkanSen,
      kijunSen,
      chikouSpan,
      spanAFuture,
      spanBFuture
    };
  }
  /**
   * Inertia (INERTIA)
   * 通过最小二乘移动平均线平滑的相对活力指数
   */
  static inertia(
    dataList: KLineData[],
    length: number = 20,
    rvi_length: number = 14,
    scalar: number = 100,
    refined: boolean = false,
    thirds: boolean = false,
    mamode: string = 'ema',
    drift: number = 1
  ): (number | null)[] {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return [];
    }
    length = Math.max(1, Math.floor(length)) || 20;
    rvi_length = Math.max(1, Math.floor(rvi_length)) || 14;
    scalar = parseFloat(scalar.toString()) || 100;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const maxLength = Math.max(length, rvi_length);
    if (dataList.length < maxLength) {
      return [];
    }
    const rviValues = Formula.rvi(dataList, rvi_length, scalar, refined, thirds, mamode);
    const inertia = Formula.linreg(rviValues, length);
    return inertia;
  }
  /**
   * Know Sure Thing (KST)
   * 基于动量的振荡器，结合四个不同周期的ROC移动平均
   */
  static kst(
    dataList: KLineData[],
    roc1: number = 10,
    roc2: number = 15,
    roc3: number = 20,
    roc4: number = 30,
    sma1: number = 10,
    sma2: number = 10,
    sma3: number = 10,
    sma4: number = 15,
    signal: number = 9,
    drift: number = 1
  ): { kst: (number | null)[], signal: (number | null)[] } {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return { kst: [], signal: [] };
    }
    roc1 = Math.max(1, Math.floor(roc1)) || 10;
    roc2 = Math.max(1, Math.floor(roc2)) || 15;
    roc3 = Math.max(1, Math.floor(roc3)) || 20;
    roc4 = Math.max(1, Math.floor(roc4)) || 30;
    sma1 = Math.max(1, Math.floor(sma1)) || 10;
    sma2 = Math.max(1, Math.floor(sma2)) || 10;
    sma3 = Math.max(1, Math.floor(sma3)) || 10;
    sma4 = Math.max(1, Math.floor(sma4)) || 15;
    signal = Math.max(1, Math.floor(signal)) || 9;
    drift = Math.max(1, Math.floor(drift)) || 1;
    const maxLength = Math.max(roc1, roc2, roc3, roc4, sma1, sma2, sma3, sma4, signal);
    if (dataList.length < maxLength) {
      return { kst: [], signal: [] };
    }
    const rocma1 = Formula.sma(Formula.roc(dataList, roc1), sma1);
    const rocma2 = Formula.sma(Formula.roc(dataList, roc2), sma2);
    const rocma3 = Formula.sma(Formula.roc(dataList, roc3), sma3);
    const rocma4 = Formula.sma(Formula.roc(dataList, roc4), sma4);
    const kst: (number | null)[] = [];
    for (let i = 0; i < dataList.length; i++) {
      const r1 = rocma1[i];
      const r2 = rocma2[i];
      const r3 = rocma3[i];
      const r4 = rocma4[i];

      if (r1 === null || r2 === null || r3 === null || r4 === null) {
        kst.push(null);
        continue;
      }
      const kstValue = 100 * (r1 + 2 * r2 + 3 * r3 + 4 * r4);
      kst.push(kstValue);
    }
    const kstSignal = Formula.sma(kst, signal);
    return { kst, signal: kstSignal };
  }
  /**
  * 生成斐波那契权重数组
  * @param length 权重数组长度
  * @param asc 是否升序（最近的值权重更大）
  * @returns 斐波那契权重数组
  */
  private static generateFibonacciWeights(length: number, asc: boolean = true): number[] {
    const weights: number[] = [];
    for (let i = 0; i < length; i++) {
      if (i === 0 || i === 1) {
        weights.push(1);
      } else {
        weights.push(weights[i - 1] + weights[i - 2]);
      }
    }
    if (asc) {
      return weights;
    } else {
      return weights.reverse();
    }
  }
  /**
   * 辅助方法：获取当前锚点标识
   */
  private static getCurrentAnchor(index: number, anchor: string): string {
    switch (anchor) {
      case 'D': return `D${Math.floor(index / 1)}`;
      case 'W': return `W${Math.floor(index / 7)}`;
      case 'M': return `M${Math.floor(index / 30)}`;
      case 'Q': return `Q${Math.floor(index / 90)}`;
      case 'Y': return `Y${Math.floor(index / 365)}`;
      default: return `D${Math.floor(index / 1)}`;
    }
  }
  /**
   * 辅助方法：检查是否应该重置锚点
   */
  private static shouldResetAnchor(index: number, anchor: string): boolean {
    // 这里实现一个简化的锚点重置逻辑
    // 在实际应用中，可能需要根据时间戳来判断
    switch (anchor) {
      case 'D': // 日
        return index === 0; // 每天重置（简化实现）
      case 'W': // 周
        return index % 7 === 0; // 每周重置（简化实现）
      case 'M': // 月
        return index % 30 === 0; // 每月重置（简化实现）
      case 'Q': // 季度
        return index % 90 === 0; // 每季度重置（简化实现）
      case 'Y': // 年
        return index % 365 === 0; // 每年重置（简化实现）
      default:
        return index === 0; // 默认每天重置
    }
  }
  /**
   * Symmetrically Weighted Moving Average (SWMA) - Legacy Version
   * 对称加权移动平均线 - 旧版本
   * 中心点权重最大，两端权重递减
   */
  private static swmaLegacy(data: (number | null)[], length: number): (number | null)[] {
    if (!Array.isArray(data) || data.length === 0 || length <= 0) {
      return [];
    }
    const result: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < length - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < length; j++) {
        const index = i - j;
        const value = data[index];

        if (value === null) {
          continue;
        }
        const weight = length - Math.abs(j - (length - 1) / 2);
        sum += value * weight;
        weightSum += weight;
      }
      if (weightSum === 0) {
        result.push(null);
      } else {
        result.push(sum / weightSum);
      }
    }
    return result;
  }
  /**
   * 百分位数线性插值
   */
  static percentileLinearInterpolation(
    source: any[],
    length: number,
    percentage: number
  ): (number | null)[] {
    // 参数验证
    if (!Array.isArray(source) || source.length === 0) {
      return []
    }
    const result: (number | null)[] = []
    for (let i = 0; i < source.length; i++) {
      if (i < length - 1) {
        result.push(null)
      } else {
        const window = source.slice(i - length + 1, i + 1)
        const validData = window.filter(val => val !== null && val !== undefined && !isNaN(val))
        if (validData.length === 0) {
          result.push(null)
          continue
        }
        validData.sort((a, b) => a - b)
        const percentile = Formula.calculatePercentile(validData, percentage)
        result.push(percentile)
      }
    }
    return result
  }
  /**
   * 计算百分位数
   */
  static calculatePercentile(sortedArray: number[], percentage: number): number | null {
    if (sortedArray.length === 0) return null
    if (sortedArray.length === 1) return sortedArray[0]
    const p = Math.max(0, Math.min(100, percentage)) / 100
    const index = p * (sortedArray.length - 1)
    if (Number.isInteger(index)) {
      return sortedArray[index]
    }
    const lowerIndex = Math.floor(index)
    const upperIndex = Math.ceil(index)
    const weight = index - lowerIndex
    const lowerValue = sortedArray[lowerIndex]
    const upperValue = sortedArray[upperIndex]
    return lowerValue + weight * (upperValue - lowerValue)
  }
  /**
   * 动态调用各种函数
   */
  static call(methodName: string, ...args: any[]): any {
    switch (methodName.toLowerCase()) {
      case 'attr':
        return Formula.attr(args[0], args[1])
      case 'ma':
        return Formula.ma(args[0], args[1], args[2]);
      case 'ema':
        return Formula.ema(args[0], args[1], args[2])
      case 'wma':
        return Formula.wma(args[0], args[1], args[2])
      case 'fwma':
        return Formula.fwma(args[0], args[1], args[2])
      case 'sma':
        return Formula.sma(args[0], args[1], args[2])
      case 'rma':
        return Formula.rma(args[0], args[1], args[2])
      case 'rmawithalpha':
        return Formula.rmaWithAlpha(args[0], args[1], args[2], args[3])
      case 'trima':
        return Formula.trima(args[0], args[1], args[2])
      case 'kama':
        return Formula.kama(args[0], args[1], args[2], args[3], args[4], args[5])
      case 't3':
        return Formula.t3(args[0], args[1], args[2], args[3])
      case 'dema':
        return Formula.dema(args[0], args[1], args[2])
      case 'tema':
        return Formula.tema(args[0], args[1], args[2])
      case 'vidya':
        return Formula.vidya(args[0], args[1], args[2], args[3])
      case 'vwap':
        return Formula.vwap(args[0], args[1])
      case 'wcp':
        return Formula.wcp(args[0])
      case 'vwma':
        return Formula.vwma(args[0], args[1])
      case 'zlma':
        return Formula.zlma(args[0], args[1], args[2], args[3])
      case 'drawdown':
        return Formula.drawdown(args[0])
      case 'log_return':
        return Formula.log_return(args[0], args[1], args[2])
      case 'percent_return':
        return Formula.percent_return(args[0], args[1], args[2])
      case 'trend_return':
        return Formula.trend_return(args[0], args[1], args[2], args[3], args[4], args[5])
      case 'entropy':
        return Formula.entropy(args[0], args[1], args[2])
      case 'kurtosis':
        return Formula.kurtosis(args[0], args[1], args[2])
      case 'mad':
        return Formula.mad(args[0], args[1], args[2])
      case 'median':
        return Formula.median(args[0], args[1], args[2])
      case 'quantile':
        return Formula.quantile(args[0], args[1], args[2], args[3])
      case 'skew':
        return Formula.skew(args[0], args[1], args[2])
      case 'hma':
        return Formula.hma(args[0], args[1], args[2])
      case 'lsma':
        return Formula.lsma(args[0], args[1], args[2])
      case 'jma':
        return Formula.jma(args[0], args[1], args[2], args[3])
      case 'mcginley':
        return Formula.mcginley(args[0], args[1], args[2])
      case 'mcgd':
        return Formula.mcgd(args[0], args[1], args[2], args[3])
      case 'edsma':
        return Formula.edsma(args[0], args[1], args[2])
      case 'vama':
        return Formula.vama(args[0], args[1])
      case 'stdev':
        return Formula.stdev(args[0], args[1], args[2], args[3])
      case 'variance':
        return Formula.variance(args[0], args[1], args[2], args[3])
      case 'zscore':
        return Formula.zscore(args[0], args[1], args[2])
      case 'adx':
        return Formula.adx(args[0], args[1], args[2], args[3], args[4])
      case 'amat':
        return Formula.amat(args[0], args[1], args[2], args[3], args[4])
      case 'aroon':
        return Formula.aroon(args[0], args[1], args[2])
      case 'chop':
        return Formula.chop(args[0], args[1], args[2], args[3], args[4])
      case 'cksp':
        return Formula.cksp(args[0], args[1], args[2], args[3], args[4])
      case 'decay':
        return Formula.decay(args[0], args[1], args[2])
      case 'decreasing':
        return Formula.decreasing(args[0], args[1], args[2])
      case 'dpo':
        return Formula.dpo(args[0], args[1], args[2])
      case 'increasing':
        return Formula.increasing(args[0], args[1], args[2])
      case 'longRun':
        return Formula.longRun(args[0], args[1], args[2])
      case 'psar':
        return Formula.psar(args[0], args[1], args[2])
      case 'qstick':
        return Formula.qstick(args[0], args[1], args[2])
      case 'short_run':
        return Formula.short_run(args[0], args[1], args[2])
      case 'ttm_trend':
        return Formula.ttm_trend(args[0], args[1])
      case 'vortex':
        return Formula.vortex(args[0], args[1], args[2])
      case 'aberration':
        return Formula.aberration(args[0], args[1], args[2])
      case 'accbands':
        return Formula.accbands(args[0], args[1], args[2], args[3], args[4])
      case 'slope':
        return Formula.slope(args[0], args[1], args[2], args[3])
      case 'linreg':
        return Formula.linreg(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8])
      case 'midpoint':
        return Formula.midpoint(args[0], args[1], args[2], args[3])
      case 'midprice':
        return Formula.midprice(args[0], args[1], args[2])
      case 'pwma':
        return Formula.pwma(args[0], args[1], args[2], args[3])
      case 'sinwma':
        return Formula.sinwma(args[0], args[1], args[2])
      case 'ssf':
        return Formula.ssf(args[0], args[1], args[2], args[3])
      case 'supertrend':
        return Formula.supertrend(args[0], args[1], args[2])
      case 'swma':
        return Formula.swma(args[0], args[1], args[2], args[3])
      case 'calcvolatility':
        return Formula.calcVolatility(args[0], args[1])
      case 'avg':
        return Formula.avg(args[0], args[1], args[2])
      case 'hhv':
        return Formula.hhv(args[0], args[1], args[2])
      case 'llv':
        return Formula.llv(args[0], args[1], args[2])
      case 'cross':
        return Formula.cross(args[0], args[1], args[2])
      case 'throughUp':
        return Formula.throughUp(args[0], args[1], args[2])
      case 'throughDown':
        return Formula.throughDown(args[0], args[1], args[2])
      case 'kdj':
        return Formula.kdj(args[0], args[1], args[2])
      case 'boll':
        return Formula.boll(args[0], args[1], args[2])
      case 'macd':
        return Formula.macd(args[0], args[1], args[2], args[3])
      case 'tr':
        return Formula.tr(args[0], args[1])
      case 'atr':
        return Formula.atr(args[0], args[1], args[2], args[3], args[4])
      case 'atrwithrma':
        return Formula.atrWithRMA(args[0], args[1])
      case 'adxwithrma':
        return Formula.adxWithRMA(args[0], args[1])
      case 'rsi':
        return Formula.rsi(args[0], args[1], args[2], args[3], args[4])
      case 'cci':
        return Formula.cci(args[0], args[1])
      case 'mom':
        return Formula.mom(args[0], args[1], args[2])
      case 'pgo':
        return Formula.pgo(args[0], args[1], args[2])
      case 'ppo':
        return Formula.ppo(args[0], args[1], args[2], args[3], args[4])
      case 'psl':
        return Formula.psl(args[0], args[1], args[2], args[3])
      case 'pvo':
        return Formula.pvo(args[0], args[1], args[2], args[3], args[4])
      case 'qqe':
        return Formula.qqe(args[0], args[1], args[2], args[3], args[4], args[5])
      case 'rsx':
        return Formula.rsx(args[0], args[1], args[2])
      case 'rvgi':
        return Formula.rvgi(args[0], args[1], args[2])
      case 'smi':
        return Formula.smi(args[0], args[1], args[2], args[3], args[4])
      case 'squeeze':
        return Formula.squeeze(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7])
      case 'stochrsi':
        return Formula.stochrsi(args[0], args[1], args[2], args[3], args[4])
      case 'td_seq':
        return Formula.td_seq(args[0], args[1], args[2])
      case 'tsi':
        return Formula.tsi(args[0], args[1], args[2], args[3], args[4])
      case 'uo':
        return Formula.uo(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7])
      case 'willr':
        return Formula.willr(args[0], args[1])
      case 'alma':
        return Formula.alma(args[0], args[1], args[2], args[3])
      case 'roc':
        return Formula.roc(args[0], args[1])
      case 'kijunV2':
        return Formula.kijunV2(args[0], args[1], args[2])
      case 'trix':
        return Formula.trix(args[0], args[1], args[2], args[3], args[4])
      case 'brar':
        return Formula.brar(args[0], args[1], args[2], args[3])
      case 'vr':
        return Formula.vr(args[0], args[1])
      case 'obv':
        return Formula.obv(args[0])
      case 'emv':
        return Formula.emv(args[0], args[1])
      case 'vo':
        return Formula.vo(args[0], args[1], args[2])
      case 'dmi':
        return Formula.dmi(args[0], args[1], args[2])
      case 'dma':
        return Formula.dma(args[0], args[1], args[2])
      case 'asi':
        return Formula.asi(args[0], args[1])
      case 'stochastic':
        return Formula.stochastic(args[0], args[1], args[2], args[3])
      case 'donchianchannel':
        return Formula.donchianChannel(args[0], args[1], args[2], args[3], args[4])
      case 'hwc':
        return Formula.hwc(args[0], args[1], args[2], args[3], args[4], args[5], args[6])
      case 'kc':
        return Formula.kc(args[0], args[1], args[2], args[3], args[4])
      case 'massi':
        return Formula.massi(args[0], args[1], args[2])
      case 'natr':
        return Formula.natr(args[0], args[1], args[2], args[3], args[4], args[5])
      case 'pdist':
        return Formula.pdist(args[0], args[1])
      case 'rvi':
        return Formula.rvi(args[0], args[1], args[2], args[3], args[4], args[5], args[6])
      case 'thermo':
        return Formula.thermo(args[0], args[1], args[2], args[3], args[4], args[5])
      case 'truerange':
        return Formula.trueRange(args[0], args[1])
      case 'ui':
        return Formula.ui(args[0], args[1], args[2], args[3])
      case 'ad':
        return Formula.ad(args[0])
      case 'adosc':
        return Formula.adosc(args[0], args[1], args[2])
      case 'aobv':
        return Formula.aobv(args[0], args[1], args[2], args[3], args[4], args[5], args[6])
      case 'cmf':
        return Formula.cmf(args[0], args[1])
      case 'efi':
        return Formula.efi(args[0], args[1], args[2], args[3])
      case 'eom':
        return Formula.eom(args[0], args[1], args[2], args[3])
      case 'nvi':
        return Formula.nvi(args[0], args[1], args[2])
      case 'pvi':
        return Formula.pvi(args[0], args[1], args[2])
      case 'pvol':
        return Formula.pvol(args[0], args[1])
      case 'pvr':
        return Formula.pvr(args[0])
      case 'pvt':
        return Formula.pvt(args[0], args[1])
      case 'vp':
        return Formula.vp(args[0], args[1], args[2])
      case 'mfi':
        return Formula.mfi(args[0], args[1], args[2])
      case 'moneyflow':
        return Formula.moneyFlow(args[0])
      case 'gettrend':
        return Formula.getTrend(args[0], args[1], args[2], args[3])
      case 'fibonacciretracement':
        return Formula.fibonacciRetracement(args[0], args[1])
      case 'sar':
        return Formula.sar(args[0], args[1], args[2], args[3])
      case 'high':
        return Formula.high(args[0], args[1])
      case 'low':
        return Formula.low(args[0], args[1])
      case 'bias':
        return Formula.bias(args[0], args[1], args[2])
      case 'cdl_doji':
        return Formula.cdl_doji(args[0], args[1], args[2], args[3])
      case 'cdl_inside':
        return Formula.cdl_inside(args[0])
      case 'ha':
        return Formula.ha(args[0])
      case 'ebsw':
        return Formula.ebsw(args[0], args[1], args[2])
      case 'ao':
        return Formula.ao(args[0], args[1], args[2])
      case 'apo':
        return Formula.apo(args[0], args[1], args[2])
      case 'bop':
        return Formula.bop(args[0], args[1])
      case 'cfo':
        return Formula.cfo(args[0], args[1], args[2], args[3])
      case 'cg':
        return Formula.cg(args[0], args[1])
      case 'cmo':
        return Formula.cmo(args[0], args[1], args[2], args[3])
      case 'coppock':
        return Formula.coppock(args[0], args[1], args[2], args[3])
      case 'er':
        return Formula.er(args[0], args[1], args[2])
      case 'eri':
        return Formula.eri(args[0], args[1])
      case 'fisher':
        return Formula.fisher(args[0], args[1], args[2])
      case 'hilo':
        return Formula.hilo(args[0], args[1], args[2], args[3])
      case 'hwma':
        return Formula.hwma(args[0], args[1], args[2], args[3], args[4])
      case 'ichimoku':
        return Formula.ichimoku(args[0], args[1], args[2], args[3])
      case 'inertia':
        return Formula.inertia(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7])
      case 'kst':
        return Formula.kst(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10])
      case 'percentilelinearinterpolation':
        return Formula.percentileLinearInterpolation(args[0], args[1], args[2])
      case 'calculatePercentile':
        return Formula.calculatePercentile(args[0], args[1])
      default:
        console.warn(`未知的方法: ${methodName}，请检查方法名是否正确`)
        return null
    }
  }



}
export default Formula