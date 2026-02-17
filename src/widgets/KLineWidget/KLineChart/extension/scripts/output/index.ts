import { outputLine } from './line';
import { outputBar } from './bar';
import { outputLabel } from './label';
import { outputArea } from './area';
import { outputShape } from './shape';
import { outputTools, setPrecision } from './tools';
import { outputCandle } from './candle';
import { outputRect } from './rect';
import { outputHLine, outputVLine, outputSLine } from './screenLine';
import { outputSArea } from './screenArea';
import { outputSRect } from './screenRect';
import { outputSShape } from './screenShape';
import { outputSCircle } from './screenCircle';
import { outputSLabel } from './screenLabel';
import { ScriptUtils } from '../versions/v1/ScriptUtils'
import { UpdateLevel } from '../../../common/Updater'

// 创建绘图API
export function createDrawAPI(scriptContext: any) {
  const { script, xAxis, dataList } = scriptContext;

  // 直接记录最大最小值
  let minValue = Infinity;
  let maxValue = -Infinity;

  // 在本次绘制周期里去重触发一次Y轴重建，避免反复layout
  let yAxisRebuildScheduled = false;
  const scheduleYAxisRebuild = () => {
    if (script.position !== 'vice') return;
    if (yAxisRebuildScheduled) return;
    yAxisRebuildScheduled = true;
    Promise.resolve().then(() => {
      yAxisRebuildScheduled = false;
      // 强制构建Y轴刻度并测量宽度，确保首次加载即生效
      scriptContext.chart.layout({
        measureWidth: true,
        update: true,
        buildYAxisTick: true,
        forceBuildYAxisTick: true
      });
    });
  };

  // 获取可见范围
  function getVisibleRange() {
    if (xAxis && xAxis._range) {
      return {
        from: xAxis._range.from,
        to: xAxis._range.to
      };
    }
    return null;
  }

  // 收集数据的函数
  function collectOutputData(data: any) {
    // 只有副图才需要计算Y轴范围
    if (script.position !== 'vice') {
      return;
    }

    const visibleRange = getVisibleRange();

    if (Array.isArray(data)) {
      data.forEach((value, index) => {
        // 只处理可见范围内的数据
        if (visibleRange && (index < visibleRange.from || index >= visibleRange.to)) {
          return;
        }
        if (ScriptUtils.isValid(value)) {
          minValue = Math.min(minValue, value);
          maxValue = Math.max(maxValue, value);
        }
      });
    } else if (ScriptUtils.isValid(data)) {
      minValue = Math.min(minValue, data as number);
      maxValue = Math.max(maxValue, data as number);
    } else if (data && typeof data === 'object') {
      Object.values(data).forEach(value => {
        if (ScriptUtils.isValid(value)) {
          minValue = Math.min(minValue, value as number);
          maxValue = Math.max(maxValue, value as number);
        }
      });
    }

    // Determine final min/max based on user override and auto-calculation
    let finalMin: number | null = null;
    let finalMax: number | null = null;

    if (script._default?.min !== undefined) {
      finalMin = script._default.min;
    } else if (minValue !== Infinity) {
      finalMin = minValue;
    }

    if (script._default?.max !== undefined) {
      finalMax = script._default.max;
    } else if (maxValue !== -Infinity) {
      finalMax = maxValue;
    }

    if (finalMin !== null) { script.minValue = finalMin; }
    if (finalMax !== null) { script.maxValue = finalMax; }

    // 一旦拿到min/max，安排一次Y轴重建
    scheduleYAxisRebuild();
  }



  // 清理当前脚本的所有MD数据
  function clearCurrentScriptMDData() {
    if (script.position === 'vice') {
      const currentPane = scriptContext.chart.getDrawPaneById(script.paneId);
      if (currentPane && (currentPane as any)._mdDrawData) {
        // 清理当前脚本的所有MD数据
        (currentPane as any)._mdDrawData = (currentPane as any)._mdDrawData.filter(
          (item: any) => item.scriptId !== script.id
        );
      }
    }
  }

  // 存储MD绘制数据的辅助函数
  function storeMDDrawData(type: string, data: any, styles: any, labelStyles?: any, backgroundStyles?: any, dataArray2?: any, baseline?: any) {
    if (script.position === 'vice') {
      const currentPane = scriptContext.chart.getDrawPaneById(script.paneId);
      if (currentPane) {
        if (!(currentPane as any)._mdDrawData) {
          (currentPane as any)._mdDrawData = [];
        }

        // 添加新数据
        const drawData: any = {
          type: type,
          data: data,
          styles: styles,
          dataList: scriptContext.dataList,
          scriptId: script.id
        };

        if (labelStyles) drawData.labelStyles = labelStyles;
        if (backgroundStyles) drawData.backgroundStyles = backgroundStyles;
        if (dataArray2) drawData.data2 = dataArray2;
        if (baseline) drawData.baseline = baseline;

        (currentPane as any)._mdDrawData.push(drawData);
      }
    }
  }

  // 触发主图overlay更新的辅助函数
  let overlayUpdateScheduled = false;
  function triggerMainPaneOverlayUpdate() {
    if (script.position === 'vice') {
      const mainPane = scriptContext.chart.getDrawPaneById('candle_pane');
      if (mainPane) {
        if (!overlayUpdateScheduled) {
          overlayUpdateScheduled = true;
          const raf = (window.requestAnimationFrame || ((cb: any) => setTimeout(cb, 16))) as any;
          raf(() => {
            overlayUpdateScheduled = false;
            // 触发主图overlay更新（合并同帧的多次调用）
            scriptContext.chart.requestOverlayUpdateOnce('candle_pane');
          });
        }
      }
    }
  }

  return {
    // 线条绘制
    line: (data: any, styles: any) => {
      collectOutputData(data);
      outputLine(scriptContext, data, styles);
    },

    // 主图绘制方法
    maindraw: {
      // 主图线条绘制
      line: (data: any, styles: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('line', data, styles);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      },

      // 主图形状绘制
      shape: (data: any, styles: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('shape', data, styles);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      },

      // 主图标签绘制
      label: (data: any, labelStyles: any, backgroundStyles?: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('label', data, labelStyles, backgroundStyles);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      },

      // 主图矩形绘制
      rect: (rectData: any[], styles?: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('rect', rectData, styles);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      },

      // 主图区域绘制
      area: (dataArray1: any, dataArray2: any, styles: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('area', dataArray1, styles, undefined, undefined, dataArray2);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      },

      // 主图柱状图绘制
      bar: (dataArray: any, baseline: any, styles: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('bar', dataArray, styles, undefined, undefined, undefined, baseline);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      },

      // 主图蜡烛图绘制
      candle: (dataList: any[], styles?: any) => {
        if (script.position === 'vice') {
          // 存储MD绘制数据
          storeMDDrawData('candle', dataList, styles);
          // 触发主图overlay更新
          triggerMainPaneOverlayUpdate();
        }
      }
    },

    // 柱状图绘制
    bar: (dataArray: any, baseline: any, styles: any) => {
      collectOutputData(dataArray);
      outputBar(scriptContext, dataArray, baseline, styles);
    },

    // 标签绘制
    label: (dataArray: any, labelStyles: any, backgroundStyles?: any) => {
      outputLabel(scriptContext, dataArray, labelStyles, backgroundStyles);
    },

    // 区域绘制
    area: (dataArray1: any, dataArray2: any, styles: any) => {
      collectOutputData(dataArray1);
      collectOutputData(dataArray2);
      outputArea(scriptContext, dataArray1, dataArray2, styles);
    },

    // 图形绘制
    shape: (dataArray: any, styles: any) => {
      outputShape(scriptContext, dataArray, styles);
    },

    // 蜡烛图绘制
    candle: (dataList: any[], styles?: any) => {
      outputCandle(scriptContext, dataList, styles);
    },

    // 矩形绘制
    rect: (rectData: any[], styles?: any) => {
      outputRect(scriptContext, rectData, styles);
    },

    // 屏幕水平线绘制
    hline: (y: any, styles?: any, x1?: any, x2?: any) => {
      outputHLine(scriptContext, y, styles || {}, x1, x2);
    },

    // 屏幕垂直线绘制
    vline: (x: any, styles?: any, y1?: any, y2?: any) => {
      outputVLine(scriptContext, x, styles || {}, y1, y2);
    },

    // 屏幕线段绘制
    sline: (data: any, styles?: any) => {
      outputSLine(scriptContext, data, styles || {});
    },

    // 屏幕区域绘制
    sarea: (dataInput: any, styles?: any) => {
      function toPoint(obj: any) { return { x: obj[0], y: obj[1] } }
      function isPointObject(o: any) { return o && typeof o === 'object' && 'x' in o && 'y' in o }

      let polygons: any[] = [] // 每个元素为 [{x,y},...]

      if (Array.isArray(dataInput)) {
        const arr = dataInput as any[]
        if (arr.length === 0) {
          polygons = []
        } else if (Array.isArray(arr[0])) {
          // [[x,y], [x,y]] 或 [ [{x,y}], [{x,y}] ]
          if (arr.length > 0 && Array.isArray(arr[0]) && arr[0].length > 0 && isPointObject(arr[0][0])) {
            // 多个多边形：[[{x,y},...], [{x,y},...]]
            polygons = arr as any[]
          } else {
            // 单个多边形：[[x,y], [x,y], ...]
            polygons = [arr.map(toPoint)]
          }
        } else if (isPointObject(arr[0])) {
          // 单个多边形：[{x,y}, {x,y}, ...]
          polygons = [arr]
        } else {
          // 扁平数组：[x1,y1,x2,y2,...]
          const pts: any[] = []
          for (let i = 0; i < arr.length; i += 2) {
            const x = arr[i]
            const y = arr[i + 1]
            if (x === undefined || y === undefined) break
            pts.push({ x, y })
          }
          polygons = pts.length ? [pts] : []
        }
      } else if (isPointObject(dataInput)) {
        // 单点不足以成形，忽略
        polygons = []
      } else {
        // 其它对象（如 {x1,y1,x2,y2}）不再兼容，直接忽略
        polygons = []
      }

      // 过滤掉点数少于3的多边形
      polygons = polygons.filter(p => Array.isArray(p) && p.length >= 3)

      if (polygons.length > 0) {
        outputSArea(scriptContext, polygons, styles || {})
      }
    },

    // 屏幕矩形绘制
    srect: (data: any, styles?: any) => {
      outputSRect(scriptContext, data, styles || {});
    },

    // 屏幕图形绘制
    sshape: (dataOrX: any, yOrStyles?: any, maybeStyles?: any) => {
      let data: any
      let styles: any

      function normalize(input: any): any[] {
        // 目标：返回 ScreenShapeData[]
        if (Array.isArray(input)) {
          const arr = input as any[]
          if (arr.length === 0) return []
          // [{x,y},...] 直接返回
          if (typeof arr[0] === 'object' && !Array.isArray(arr[0]) && ('x' in arr[0] || 'y' in arr[0])) {
            return arr as any[]
          }
          // [[x,y],[x,y],...]
          if (Array.isArray(arr[0])) {
            return (arr as any[]).map((p: any[]) => ({ x: p[0], y: p[1] }))
          }
          // 扁平数组 [x1,y1,x2,y2,...]
          const result: any[] = []
          for (let i = 0; i < arr.length; i += 2) {
            const x = arr[i]
            const y = arr[i + 1]
            if (x === undefined || y === undefined) break
            result.push({ x, y })
          }
          return result
        }
        // 单个对象 {x,y}
        if (input && typeof input === 'object' && ('x' in input || 'y' in input)) {
          return [input]
        }
        // 其他形式：当作 (x,y) 之一，由外层补齐
        return []
      }

      // 三种主要输入：数组/对象 或 (x, y, styles)
      if (Array.isArray(dataOrX)) {
        data = normalize(dataOrX)
        styles = yOrStyles || {}
      } else if (dataOrX && typeof dataOrX === 'object' && ('x' in dataOrX || 'y' in dataOrX)) {
        data = normalize(dataOrX)
        styles = yOrStyles || {}
      } else {
        // 兼容 D.sshape(x, y, styles)
        data = [{ x: dataOrX, y: yOrStyles }]
        styles = maybeStyles || {}
      }

      outputSShape(scriptContext, data, styles)
    },

    // 屏幕圆形绘制
    scircle: (data: any, styles?: any) => {
      outputSCircle(scriptContext, data, styles || {});
    },

    // 屏幕标签绘制
    slabel: (data: any, labelStyles?: any, backgroundStyles?: any) => {
      outputSLabel(scriptContext, data, labelStyles || {}, backgroundStyles);
    },

    // 主图绘制简写
    MD: (() => {
      const drawAPI = {
        line: (data: any, styles: any) => {
          if (script.position === 'vice') {
            // 存储MD绘制数据
            storeMDDrawData('line', data, styles);
            // 触发主图overlay更新
            triggerMainPaneOverlayUpdate();
          }
        },
        shape: (data: any, styles: any) => {
          if (script.position === 'vice') {
            // 存储MD绘制数据
            storeMDDrawData('shape', data, styles);
            // 触发主图overlay更新
            triggerMainPaneOverlayUpdate();
          }
        },
        label: (data: any, labelStyles: any, backgroundStyles?: any) => {
          if (script.position === 'vice') {
            // 存储MD绘制数据
            storeMDDrawData('label', data, labelStyles, backgroundStyles);
            // 触发主图overlay更新
            triggerMainPaneOverlayUpdate();
          }
        },
        candle: (dataList: any[], styles?: any) => {
          if (script.position === 'vice') {
            // 存储MD绘制数据
            storeMDDrawData('candle', dataList, styles);
            // 触发主图overlay更新
            triggerMainPaneOverlayUpdate();
          }
        }
      };
      return drawAPI;
    })()
  };
}

// 创建输出API
export function createOutputAPI(scriptContext: any) {
  const { msgCallback, scriptId, script } = scriptContext;

  // 去重辅助：稳定序列化，用于对象/数组生成稳定 tag
  function stableStringify(x: any): string {
    if (x === null || typeof x !== 'object') return String(x)
    const keys = Object.keys(x).sort()
    const o: any = {}
    for (const k of keys) o[k] = stableStringify(x[k])
    return JSON.stringify(o)
  }
  // 从消息生成 tag（字符串优先；对象优先 type/name；否则稳定JSON）
  function makeTagFromMsg(msg: any): string {
    if (typeof msg === 'string') return msg
    if (msg && typeof msg === 'object') {
      if ((msg as any).type) return String((msg as any).type)
      if ((msg as any).name) return String((msg as any).name)
      if ((msg as any).action) return String((msg as any).action)
      if ((msg as any).reason) return String((msg as any).reason)
      return stableStringify(msg)
    }
    return String(msg)
  }
  // 在脚本实例上保存最近触发的 tag -> barTs，仅保留最多10条
  function getSignalMap(): Map<string, number> {
    const key = '__signalLastBarByTag__'
    if (!script[key]) {
      script[key] = new Map<string, number>()
    }
    return script[key]
  }
  // 统一获取“最后值”：支持数组/TypedArray/标量/对象/布尔
  function getLast<T = any>(value: any): T | null {
    if (value == null) return null
    if (Array.isArray(value) || (ArrayBuffer.isView(value) && typeof (value as any).length === 'number')) {
      const arr = value as any[]
      for (let i = arr.length - 1; i >= 0; i--) {
        const v = arr[i]
        if (v !== undefined && v !== null) return v as T
      }
      return null
    }
    return value as T
  }

  // 添加严格检查最后一个元素的函数
  function getLastStrict<T = any>(value: any): T | null {
    if (value == null) return null
    if (Array.isArray(value)) {
      const lastIndex = value.length - 1
      if (lastIndex >= 0) {
        const lastElement = value[lastIndex]
        return (lastElement !== null && lastElement !== undefined) ? lastElement as T : null
      }
      return null
    }
    return value as T
  }

  return {
    // 工具数据
    tools: (label: string, dataSource: any, style: any) => {
      outputTools(script, label, dataSource, style);
      // 同步收集到 script.tools，供条件选择面板/服务端使用
      try {
        if (script) {
          if (!Array.isArray(script.tools)) script.tools = [];
          const precision = script.precision ?? (style?.precision);
          const latest = Array.isArray(dataSource) ? dataSource[dataSource.length - 1] : dataSource;
          const lastIndex = Array.isArray(dataSource) ? dataSource.length - 1 : null;
          script.tools.push({ name: label, data: dataSource, style, precision, latest, lastIndex });
        }
      } catch { }
    },

    // 消息回调方法
    print: (msg: string) => {
      if (msgCallback) {
        msgCallback(scriptId, 'print', msg);
      }
    },

    sys: (msg: string) => {
      if (msgCallback) {
        msgCallback(scriptId, 'sys', msg);
      }
    },

    error: (msg: string) => {
      if (msgCallback) {
        msgCallback(scriptId, 'error', msg);
      }
    },

    warn: (msg: string) => {
      if (msgCallback) {
        msgCallback(scriptId, 'warn', msg);
      }
    },

    signal: (dataArray: any, signalTypeOrCallback?: string | Function, callback?: Function) => {
      // 使用严格检查：只处理最后一个元素
      const lastValue = getLastStrict(dataArray)
      if (lastValue !== null && lastValue !== undefined) {
        // 生成消息：原样透传
        let message: any = ''
        if (typeof signalTypeOrCallback === 'function') {
          message = (signalTypeOrCallback as Function)(lastValue)
        } else if (typeof signalTypeOrCallback === 'string' && typeof callback === 'function') {
          message = (callback as Function)(lastValue)
        } else if (signalTypeOrCallback !== undefined) {
          message = signalTypeOrCallback
        } else {
          message = lastValue
        }

        const barTs = script.chart._chartStore._dataList[script.chart._chartStore._dataList.length - 1].timestamp
        const tag = `signal:${makeTagFromMsg(message)}`  // 使用 signal: 前缀
        const map = getSignalMap()
        const lastBar = map.get(tag)
        if (lastBar === barTs) {
          return
        }
        map.set(tag, barTs)
        if (map.size > 100) {
          const firstKey = map.keys().next().value
          map.delete(firstKey)
        }

        const signalData = {
          name: script?.name,
          id: script.id,
          symbol: script.chart._chartStore._symbol.symbol,
          period: script.chart._chartStore._period.name,
          timestamp: barTs,
          msg: message
        }
        if (msgCallback) {
          msgCallback(scriptId, 'signal', signalData)
        }
      }
    },

    // orderOpen: 第一个参数是触发条件，第二个参数是对象
    orderOpen: (dataArray: any, options: {
      type: 'buy' | 'sell',  // 必须
      num: number,                // 必须，手数
      price?: number,             // 非必须，不写就是当前价
      stoploss?: number,          // 非必须
      takeprofit?: number,        // 非必须
      msg?: string               // 非必须
    }) => {
      // 判断触发条件
      let shouldExecute = false
      if (Array.isArray(dataArray)) {
        // 数组：判断最后一项是否为有效值
        const lastValue = getLastStrict(dataArray)
        shouldExecute = lastValue !== null && lastValue !== undefined
      } else if (typeof dataArray === 'object' && dataArray !== null) {
        // 对象：判断对象是否为有效值
        shouldExecute = true
      } else if (typeof dataArray === 'boolean') {
        // 布尔值：直接判断
        shouldExecute = dataArray === true
      }

      if (!shouldExecute) return

      if (!options || !options.type || !options.num) return
      if (options.type !== 'buy' && options.type !== 'sell') return
      if (typeof options.num !== 'number' || options.num <= 0) return

      const barTs = script.chart._chartStore._dataList[script.chart._chartStore._dataList.length - 1].timestamp
      const tag = `orderOpen:${makeTagFromMsg(options.msg || '')}`
      const map = getSignalMap()
      const lastBar = map.get(tag)
      if (lastBar === barTs) return
      map.set(tag, barTs)
      if (map.size > 100) { const firstKey = map.keys().next().value; map.delete(firstKey) }

      const data = {
        name: script?.name,
        id: script.id,
        symbol: script.chart._chartStore._symbol.symbol,
        period: script.chart._chartStore._period.name,
        timestamp: barTs,
        type: options.type,
        num: options.num,
        price: options.price || (Array.isArray(dataArray) ? getLastStrict(dataArray) : null),
        stoploss: options.stoploss,
        takeprofit: options.takeprofit,
        msg: options.msg
      }
      if (msgCallback) msgCallback(scriptId, 'orderOpen', data)
    },

    // orderClose: 只有一个对象参数
    orderClose: (options: {
      id: string,        // 必须，订单ID
      num?: number,      // 非必须，默认全部
      price?: number,    // 可选，平仓价格，不写就是市价
      msg?: string       // 可选，消息
    }) => {
      if (!options || !options.id) return

      const currentTime = Date.now()
      const orderIdTag = `orderClose:${makeTagFromMsg(options.id)}_`
      const map = getSignalMap()

      // 查找该订单ID的现有记录
      let existingTag: string | null = null
      let existingTime: number | null = null

      for (const [key, value] of map.entries()) {
        if (key.startsWith(orderIdTag)) {
          existingTag = key
          existingTime = value
          break
        }
      }

      // 检查是否需要发送信号
      if (!existingTag) {
        // 没有记录，直接添加并执行
        const newTag = `${orderIdTag}${currentTime}`
        map.set(newTag, currentTime)
        if (map.size > 100) { const firstKey = map.keys().next().value; map.delete(firstKey) }

        const data = {
          name: script?.name,
          id: script.id,
          symbol: script.chart._chartStore._symbol.symbol,
          period: script.chart._chartStore._period.name,
          timestamp: currentTime,
          orderId: options.id,
          num: options.num,
          price: options.price,
          msg: options.msg
        }
        if (msgCallback) msgCallback(scriptId, 'orderClose', data)
      } else if (existingTime && (currentTime - existingTime) >= 1000) {
        // 有记录且超过1秒，更新记录并执行
        map.delete(existingTag)
        const newTag = `${orderIdTag}${currentTime}`
        map.set(newTag, currentTime)
        if (map.size > 100) { const firstKey = map.keys().next().value; map.delete(firstKey) }

        const data = {
          name: script?.name,
          id: script.id,
          symbol: script.chart._chartStore._symbol.symbol,
          period: script.chart._chartStore._period.name,
          timestamp: currentTime,
          orderId: options.id,
          num: options.num,
          price: options.price,
          msg: options.msg
        }
        if (msgCallback) msgCallback(scriptId, 'orderClose', data)
      }
      // 如果没超过1秒，直接跳过
    },

    // orderUpdate: 只有一个对象参数
    orderUpdate: (options: {
      id: string,              // 必须，订单ID
      price?: number,          // 非必须，挂单时使用
      stoploss?: number,       // 非必须
      takeprofit?: number,     // 非必须
      msg?: string            // 非必须，消息
    }) => {
      if (!options || !options.id) return
      
      // 至少要有价格、止损、止盈中的一个
      if (options.price === undefined && options.stoploss === undefined && options.takeprofit === undefined) {
        return
      }

      // 生成唯一key：订单id + 所有更新参数
      const updateKey = `${options.id}_${options.price || ''}_${options.stoploss || ''}_${options.takeprofit || ''}`
      const tag = `orderUpdate:${makeTagFromMsg(updateKey)}`
      const map = getSignalMap()
      const lastBar = map.get(tag)
      const barTs = script.chart._chartStore._dataList[script.chart._chartStore._dataList.length - 1].timestamp

      // 检查是否需要发送信号（避免同一根K线重复发送）
      if (lastBar !== barTs) {
        map.set(tag, barTs)
        if (map.size > 100) { const firstKey = map.keys().next().value; map.delete(firstKey) }

        const data = {
          name: script?.name,
          id: script.id,
          symbol: script.chart._chartStore._symbol.symbol,
          period: script.chart._chartStore._period.name,
          timestamp: barTs,
          orderId: options.id,
          price: options.price,
          stoploss: options.stoploss,
          takeprofit: options.takeprofit,
          msg: options.msg
        }
        if (msgCallback) msgCallback(scriptId, 'orderUpdate', data)
      }
    }
  }
}

export const O = {
  // 绘制柱状图
  bar: (dataArray: number[], baseLine: number = 0, styles?: any) => {
    return { type: 'bar', dataArray, baseLine, styles }
  },

  // 绘制图形
  shape: (dataArray: number[], shapeType: string, position: string = 'center', styles?: any) => {
    return { type: 'shape', dataArray, shapeType, position, styles }
  },

  // 绘制区域
  area: (dataArray1: number[], dataArray2: number[], styles?: any) => {
    return { type: 'area', dataArray1, dataArray2, styles }
  },

  // 绘制蜡烛图
  candle: (dataList: any[], styles?: any) => {
    return { type: 'candle', dataList, styles }
  },

  // 绘制矩形
  rect: (rectData: any[], styles?: any) => {
    return { type: 'rect', rectData, styles }
  },

  // 绘制标签
  label: (dataArray: any[], labelStyles?: any, backgroundStyles?: any) => {
    return { type: 'label', dataArray, labelStyles, backgroundStyles }
  },

  // 工具提示
  tools: (name: string, dataArray: number[], styles?: any) => {
    return { type: 'tools', name, dataArray, styles }
  },

  // 屏幕水平线
  hline: (y: any, styles?: any, x1?: any, x2?: any) => {
    return { type: 'hline', y, styles, x1, x2 }
  },

  // 屏幕垂直线
  vline: (x: any, styles?: any, y1?: any, y2?: any) => {
    return { type: 'vline', x, styles, y1, y2 }
  },

  // 屏幕线段
  sline: (data: any, styles?: any) => {
    return { type: 'sline', data, styles }
  }
}

// 导出绘制函数供外部使用
export { outputLine, outputShape, outputLabel, outputRect, outputArea, outputBar, outputCandle }