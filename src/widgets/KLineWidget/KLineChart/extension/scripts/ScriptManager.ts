import { VersionManager } from './versions/VersionManager';
import { ScriptParser } from './versions/v1/ScriptParser';
import './versions/init'; // 初始化版本管理器
import { createOutputAPI, createDrawAPI } from './output';
import { ScriptUtils } from '../../../klines/scriptUtils';
import { requestAnimationFrame as raf } from '../../common/utils/compatible';

// K线数据类型定�?
interface KLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  index?: number;
}

// 从版本管理器获取类型定义
type ScriptInput = any;
type ScriptStyle = any;
// 脚本事件定义
interface ScriptEvent {
  type: string;
  handler: Function;
}

// 脚本对象
// 消息输出回调接口
type MsgCallback = (scriptId: string, type: 'print' | 'sys' | 'error' | 'warn' | 'signal' | 'tools' | 'orderOpen' | 'orderClose' | 'orderUpdate', msg: string) => void;

interface Script {
  id: string | number; // 支持string和number类型
  name: string;
  script: string;
  code?: string; // 原始加密源码
  inputs: ScriptInput[];
  styles: ScriptStyle[];
  visible: boolean;
  key: string; // 唯一标识
  position: 'main' | 'vice'; // 位置：主图或副图
  paneId?: string; // 脚本所在的paneId
  user_id?: number; // 用户ID，默认为0
  info?: { name: string; title?: string; desc?: string; position: 'main' | 'vice'; version?: number; author?: string;[key: string]: any }; // 脚本信息，支持自定义字段
  createTooltipDataSource?: (params: { script: Script }) => { features: any[] };
  msgCallback?: MsgCallback; // 消息回调
  http?: any; // HTTP 方法
  httpCalls?: any[]; // HTTP调用列表
  lastState?: any; // 上次请求状�?
  tooltipTools?: Array<{ label: string; dataSource: any; style: any; labelColor: string; valueColor: string }>; // 工具定义数组
  // 新增：标准化�?tools 收集（用于条件面�?服务端选择），不影响渲�?
  tools?: Array<{ name: string; data: any; style: any; precision?: 'price' | 'volume' | number; latest?: any; lastIndex?: number | null }>;
  precision?: 'price' | 'volume' | number | null; // 脚本精度设置，默认为null
  extendData?: unknown | (() => unknown); // 自定义数据，脚本内部可以访问，支持函数形�?
  // 新增：账�?仓位/订单引用对象（与 extendData 同风格，可能为对象或函数返回对象�?
  account?: unknown | (() => unknown) | null;

  _executableCode?: any; // 用于缓存解析后的可执行代?
  _compiledFunction?: any; // 缓存编译后的函数
  // 添加缺失的属?
  minValue?: number | null;
  maxValue?: number | null;
  outputs?: Array<{ data: any[] }>;
  toolData?: any;
  calc?: (dataList: any[], indicator: any, prevResult?: any[], type?: string) => any;
  events?: ScriptEvent[];
  _default?: { // 用户设置的默认�?
    min?: number | null;
    max?: number | null;
  };
}

class ScriptManager {
  private chart: any;
  private scripts: Map<string, Script> = new Map();
  private scriptCounters: Map<string, number> = new Map(); // 记录每个脚本ID的实例数�?
  private versionManager: any;
  private registeredVicePanes: Set<string> = new Set(); // 记录已注册的副图面板
  // 新增：统一脏标志与离屏缓存
  public markAllScriptsDirty(): void {
    this.scripts.forEach((s: any) => { (s as any)._dirty = true; });
  }

  constructor(chartInstance: any) {
    this.chart = chartInstance;
    this.versionManager = VersionManager;
  }
  private _httpRedrawScheduled = false;
  private _scheduleOverlayRedraw(): void {
    if (this._httpRedrawScheduled) return;
    this._httpRedrawScheduled = true;
    raf(() => {
      this._httpRedrawScheduled = false;
      try {
        // 仅重绘叠加层，使用同帧合并入�?
        this.chart.requestOverlayUpdateOnce();
      } catch (_) {
        // ignore
      }
    });
  }
  // 执行HTTP请求
  private async executeHttpCalls(httpCalls: any[], script: any, ctx?: any): Promise<void> {
    // 检查是否正在执行HTTP请求，防止重复执�?
    if (script._httpExecuting) {
      return;
    }

    // 标记开始执行HTTP请求
    script._httpExecuting = true;

    try {
      for (const httpCall of httpCalls) {
        try {
          if (script.http) {
            let result;

            // 直接传递参数，不做任何处理
            const resolvedArgs = httpCall.args;

            switch (httpCall.type) {
              case 'loadHistory':
                result = await script.http.loadHistory(...resolvedArgs);
                break;
              case 'get':
                result = await script.http.get(...resolvedArgs);
                break;
              case 'post':
                result = await script.http.post(...resolvedArgs);
                break;
            }
            // 仅在返回有效数据时更�?
            if (result !== null && result !== undefined) {
              httpCall.value = result;

              // 更新引用对象中的HTTP数据
              if ((script as any)._httpVal && (script as any)._httpVal[httpCall.key] !== undefined) {
                (script as any)._httpVal[httpCall.key] = result;
              }
            }
          } else {
            console.warn('script.http不存在，无法执行HTTP请求');
          }
        } catch (error) {
          console.error('HTTP请求失败:', error);
          // httpCall.value = { data: [], count: 0, error: error.message };
          httpCall.value = null;
        }
      }
    } finally {
      // 标记HTTP请求执行完成
      script._httpExecuting = false;
      // 安排下一帧统一触发一次重绘，避免多次HTTP回调引发重复刷新
      this._scheduleOverlayRedraw();
    }
  }

  // 检查状态是否发生变�?
  private hasStateChanged(script: any, currentState: any): boolean {
    if (!script.lastState) {
      return true; // 首次执行
    }

    const lastState = script.lastState;

    // 只检查品种、周期、数据长度、输入参数变化，样式变化不触发HTTP请求
    return lastState.symbol !== currentState.symbol ||
      lastState.period !== currentState.period ||
      lastState.dataLength !== currentState.dataLength ||
      JSON.stringify(lastState.inputs) !== JSON.stringify(currentState.inputs);
  }

  // 重新编译脚本（当状态变化时�?
  public async recompileScript(scriptKey: string, currentState: any): Promise<void> {
    const script = this.scripts.get(scriptKey);
    if (!script) {
      return;
    }

    // 检查是否正在编译，防止重复编译
    if ((script as any)._compiling) {
      return;
    }

    // 检查状态是否发生变�?
    if (!this.hasStateChanged(script, currentState)) {
      return;
    }

    // 标记开始编�?
    (script as any)._compiling = true;
    // 更新状�?
    script.lastState = { ...currentState };

    try {
      // 使用原始脚本代码重新解析
      if (!script.script) {
        console.error('脚本代码为空，无法重新编�?', scriptKey);
        return;
      }

      const parsedScript = ScriptParser.parse(script.script, script.inputs, script.styles);
      const executableCode = parsedScript.main;

      // 更新 script.httpCalls 为新解析�?httpCalls
      script.httpCalls = parsedScript.httpCalls || [];

      // 执行HTTP请求（只有在需要时才执行）
      if (script.httpCalls && script.httpCalls.length > 0) {
        const needsHttpRequest = script.httpCalls.some(httpCall =>
          !httpCall.value ||
          (httpCall.value && httpCall.value.data && httpCall.value.data.length === 0)
        );

        if (needsHttpRequest) {
          await this.executeHttpCalls(script.httpCalls, script);
        }
      }
      // 使用更新后的 script.httpCalls
      const compileScript = {
        main: executableCode,
        inputs: script.inputs || [],
        styles: script.styles || [],
        httpCalls: script.httpCalls // 使用更新后的 httpCalls
      };

      const compiledResult = this.compileScript(compileScript, script.key, script.msgCallback);
      // 更新脚本的执行函�?
      script._compiledFunction = compiledResult.draw; // 修复：应该是 draw 函数
      script._executableCode = executableCode; // 修复：应该是可执行代�?
      // 更新 ChartStore 中的脚本对象
      const chartStore = this.chart.getChartStore();
      const existingScripts = chartStore.getScriptsByPaneId(script.paneId);
      const existingScript = existingScripts.find(s => s.key === script.key);

      if (existingScript) {
        // 更新现有的脚本对�?
        existingScript._compiledFunction = script._compiledFunction;
        existingScript._executableCode = script._executableCode;
        existingScript.httpCalls = script.httpCalls; // 确保 httpCalls 也被更新
      }
    } catch (error) {
      console.error('重新编译脚本失败:', error);
    } finally {
      (script as any)._compiling = false;
    }
  }

  // 检查所有脚本的状态变�?
  public async checkAllScriptsState(currentState: any): Promise<void> {
    for (const [scriptKey, script] of this.scripts) {
      if (script.httpCalls && script.httpCalls.length > 0) {
        // 为每个脚本构建包含其 inputs �?styles �?currentState
        const scriptCurrentState = {
          ...currentState,
          inputs: script.inputs || [],
          styles: script.styles || []
        };
        await this.recompileScript(scriptKey, scriptCurrentState);
      }
    }
  }

  // 当脚本的 inputs �?styles 发生变化时调�?
  public async onScriptConfigChanged(scriptKey: string): Promise<void> {
    const script = this.scripts.get(scriptKey);
    if (!script) {
      return;
    }
    // 构建当前状�?
    const currentState = {
      symbol: this.chart.getSymbol()?.symbol || '',
      period: this.chart.getPeriod() ? `${this.chart.getPeriod().type}${this.chart.getPeriod().span}` : '',
      dataLength: this.chart.getDataList().length,
      inputs: script.inputs || [],
      styles: script.styles || []
    };
  }
  // 触发脚本刷新（但不重新编译）
  private triggerScriptRefresh(scriptKey: string): void {
    // 强制触发图表重新渲染，让脚本重新执行
    if (this.chart && this.chart.layout) {
      this.chart.layout({ update: true });
    }
  }
  // 注册脚本对象�?ScriptManager
  public registerScriptObject(scriptId: string, scriptObj: any): void {
    this.scripts.set(scriptId, scriptObj);
  }


  // 简化的脚本注册
  registerScript(scriptData: {
    id: string | number
    name: string
    script: string
    encryptedScript?: string // 加密的源�?
    code?: string
    user_id?: number
    paneId?: string
    createTooltipDataSource?: any
    msgCallback?: MsgCallback
    [key: string]: any
  }): void {
    // 检�?key 是否重复，如果重复则删除旧的
    if (this.scripts.has(scriptData.key)) {
      const existingScript = this.scripts.get(scriptData.key);
      if (existingScript) {
        // 删除旧的脚本
        this.removeScript(existingScript.key);
      }
    }

    // 使用ScriptParser解析脚本，支持预设�?
    const parsedScript = ScriptParser.parse(
      scriptData.script,
      scriptData.inputs, // 预设的inputs�?
      scriptData.styles  // 预设的styles�?
    );

    // 使用ScriptUtils提取完整的元数据
    const metadata = ScriptUtils.extractMetadata(scriptData.script);

    // 从解析结果中获取参数和样�?
    const params = parsedScript.inputs;
    const styles = parsedScript.styles;
    const paneId = metadata.position === 'main' ? 'main' : 'vice';

    // 使用解析后的可执行代�?
    const executableCode = parsedScript.main;

    // 创建脚本对象
    const script: Script = {
      ...scriptData, // 先复制所有传入的属�?
      id: scriptData.id, // 保持原始id类型，不强制转换
      name: metadata.name || scriptData.name,
      code: scriptData.encryptedScript || scriptData.script, // 优先使用加密源码，如果没有则使用解密后的内容
      script: scriptData.script, // 保存原始脚本代码用于重新编译
      inputs: params,
      styles: styles,
      visible: true,
      key: scriptData.key,
      position: paneId === 'main' ? 'main' : 'vice',
      paneId: scriptData.paneId || (paneId === 'main' ? 'candle_pane' : 'vice'), // 使用传递过来的实际paneId
      user_id: scriptData.user_id || 0, // 用户ID，默认为0
      info: {
        ...metadata, // 保留所有元数据字段
        ...scriptData.info // 保留用户添加的自定义字段
      },
      createTooltipDataSource: scriptData.createTooltipDataSource,
      msgCallback: scriptData.msgCallback,
      http: scriptData.http, // 保存 http 方法
      httpCalls: parsedScript.httpCalls, // 保存HTTP调用列表
      tooltipTools: [],
      tools: [],
      precision: null,
      account: scriptData.account || null,
      extendData: scriptData.extendData || null, // 使用传入�?extendData 或默认为 null
      _executableCode: executableCode, // 保存解析后的可执行代�?
      _compiledFunction: undefined // 将在编译后设�?
    };

    // 调试信息
    // 从原始脚本中提取setMin和setMax
    const setMinMatch = scriptData.script.match(/setMin\s*\(\s*([^)]+)\s*\)/);
    if (setMinMatch) {
      const value = setMinMatch[1].trim();
      script._default = { ...script._default, min: parseFloat(value) };
    }

    const setMaxMatch = scriptData.script.match(/setMax\s*\(\s*([^)]+)\s*\)/);
    if (setMaxMatch) {
      const value = setMaxMatch[1].trim();
      script._default = { ...script._default, max: parseFloat(value) };
    }

    // 从原始脚本中提取setPrecision
    const setPrecisionMatch = scriptData.script.match(/setPrecision\s*\(\s*([^)]+)\s*\)/);
    if (setPrecisionMatch) {
      const value = setPrecisionMatch[1].trim();

      // 解析precision�?
      let parsedValue: 'price' | 'volume' | number | null = null;

      if (value === "'price'" || value === '"price"') {
        parsedValue = 'price';
      } else if (value === "'volume'" || value === '"volume"') {
        parsedValue = 'volume';
      } else {
        // 尝试解析为数�?
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
          parsedValue = numValue;
        }
      }

      if (parsedValue !== null) {
        // 直接设置script.precision，不需要_default.precision
        script.precision = parsedValue;
      }
    }

    // 编译脚本
    try {
      // 注册时使用默认值，不执行HTTP请求
      const compileScript = {
        main: executableCode,
        inputs: params,
        styles: styles,
        httpCalls: script.httpCalls || [] // 使用默认�?
      };


      const { execute, draw } = this.compileScript(compileScript, script.key, script.msgCallback);

      script._compiledFunction = draw; // 保存编译后的函数
      script._executableCode = executableCode; // 保存可执行代�?

      // 注册脚本对象，使用script.key作为标识�?
      this.registerScriptObject(script.key, script);

      // 根据position确定正确的paneId
      const actualPaneId = paneId === 'main' ? 'candle_pane' : (paneId || 'vice');

      // 注册到图表存�?
      this.registerScriptsToChartStore([script], actualPaneId);

      // 系统输出：脚本注册成�?
      if (script.msgCallback) {
        script.msgCallback(script.key, 'sys', `脚本 "${script.name}" 注册成功`);
      }

    } catch (error) {
      if (script.msgCallback) {
        script.msgCallback(script.key, 'error', `脚本编译失败: ${error.message}`);
      }
    }
  }




  // 编译脚本
  public compileScript(parsedScript: any, scriptId?: string, msgCallback?: MsgCallback): {
    execute: (data: KLineData[], indicator: any, prevResult?: any, type?: 'init' | 'append' | 'tick') => any;
    draw?: (params: { ctx: CanvasRenderingContext2D, chart: any, indicator: any, bounding: any, xAxis: any, yAxis: any }) => boolean;
  } {
    try {
      // 直接使用传入的可执行代码和参数，不再进行第二次解�?
      const executableCode = parsedScript.main;
      const inputs = parsedScript.inputs || [];
      const styles = parsedScript.styles || [];

      // 包装脚本模板
      const wrappedScript = this.wrapWithTemplate(executableCode, inputs, styles, parsedScript.httpCalls);

      // 使用原生 eval 编译脚本
      const compiled = new Function(
        'ctx',
        wrappedScript,
      )


      return {
        execute: (data: KLineData[], indicator: any, prevResult?: any, type?: string) => {
          // 脚本系统：calc阶段只返回空数组，实际执行在draw阶段
          return [];
        },
        draw: (params: { ctx: CanvasRenderingContext2D, chart: any, indicator: any, bounding: any, xAxis: any, yAxis: any }) => {
          // 创建渲染上下�?
          const renderContext = {
            ctx: params.ctx, // 使用传入�?ctx
            bounding: params.bounding,
            yAxis: params.yAxis,
            xAxis: params.xAxis,
            chart: params.chart,
            indicator: params.indicator
          };

          const script = this.scripts.get(scriptId || '');
          if (!script) {
            return true;
          }

          // 在脚本执行前清理当前脚本的所有MD数据
          if (script.position === 'vice') {
            const currentPane = params.chart.getDrawPaneById(script.paneId);
            if (currentPane && (currentPane as any)._mdDrawData) {
              // 清理当前脚本的所有MD数据
              (currentPane as any)._mdDrawData = (currentPane as any)._mdDrawData.filter(
                (item: any) => item.scriptId !== script.id
              );
            }
          }

          // 检查是否需要执行HTTP请求
          if (script.httpCalls && script.httpCalls.length > 0) {
            const needsHttp = script.httpCalls.some((call: any) =>
              !call.value ||
              (call.value && call.value.data && call.value.data.length === 0)
            );
            if (needsHttp) {
              // 异步执行HTTP请求，不阻塞脚本执行
              this.executeHttpCalls(script.httpCalls, script).catch(error => {
                console.error('HTTP请求执行失败:', error);
              });
            }
          }

          const ctx = this.createContext(this.chart.getDataList(), scriptId, msgCallback, renderContext, script);

          // 清理之前�?tooltipTools 数据
          if (script) {
            script.tooltipTools = [];
            script.tools = [];
          }

          // 执行编译后的脚本
          try {
            const result = compiled(ctx);
            // 不输出返回值，避免undefined
          } catch (error) {
            console.error('脚本执行异常:', error);
          }

          return true;
        }
      };
    } catch (error) {
      console.error('compileScript 方法内部异常:', error);
      throw error;
    }
  }



  // 包装脚本模板（使用引用方式）
  private wrapWithTemplate(userScript: string, inputs: any[], styles: any[], httpCalls: any[] = []): string {
    // 1. 生成input变量声明（使用引用方式）
    const inputAssignments = inputs.map(input => {
      return `var ${input.key} = ctx.inputVal.${input.key};`;
    }).join('\n    ');

    // 2. 生成style变量声明（使用引用方式）
    const styleAssignments = styles.map(style => {
      return `var ${style.key} = ctx.styleVal.${style.key};`;
    }).join('\n    ');

    // 3. 生成HTTP变量声明（使用引用方式）
    const httpVarDeclarations = httpCalls.map(httpCall => {
      return `var ${httpCall.key} = ctx.httpVal.${httpCall.key};`;
    }).join('\n    ');

    // 4. 解析脚本中的其他变量赋值语�?
    const otherVars = new Set<string>();
    const lines = userScript.split('\n');

    lines.forEach(line => {
      const match = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const varName = match[1];

        // 排除已经声明�?input �?style 变量
        const isInputVar = inputs.some(input => input.key === varName);
        const isStyleVar = styles.some(style => style.key === varName);
        // 排除 HTTP 变量
        const isHttpVar = httpCalls.some(httpCall => httpCall.key === varName);

        if (!isInputVar && !isStyleVar && !isHttpVar) {
          otherVars.add(varName);
        }
      }
    });

    // 5. 生成其他变量声明
    const otherVarDeclarations = Array.from(otherVars).map(varName => `var ${varName};`).join('\n    ');

    // 6. 生成完整的脚本模�?
    const fullScript = "" +
      "    var ChartInfo = ctx.ChartInfo;\n" +
      "    var dataList = ctx.dataList;\n" +
      "    var visibleList = ctx.visibleList;\n" +
      "    var O = ctx.O;\n" +
      "    var output = ctx.O;\n" +
      "    var D = ctx.D;\n" +
      "    var draw = ctx.D;\n" +
      "    var F = ctx.F;\n" +
      "    var formula = ctx.formula;\n" +
      "    var U = ctx.U;\n" +
      "    var util = ctx.util;\n" +
      "    var Math = ctx.Math;\n" +
      "    var MD = ctx.MD;\n" +
      "    var maindraw = ctx.MD;\n" +
      // 注入序列与视�?
      "    var open = ctx.open;\n" +
      "    var high = ctx.high;\n" +
      "    var low = ctx.low;\n" +
      "    var close = ctx.close;\n" +
      "    var volume = ctx.volume;\n" +
      "    var time = ctx.time;\n" +
      "    var Open = ctx.Open;\n" +
      "    var High = ctx.High;\n" +
      "    var Low = ctx.Low;\n" +
      "    var Close = ctx.Close;\n" +
      "    var Volume = ctx.Volume;\n" +
      "    var Time = ctx.Time;\n" +
      "    var rev = ctx.rev;\n" +
      "    var balance = ctx.balance;\n" +
      "    var equity = ctx.equity;\n" +
      "    var orders = ctx.orders;\n" +
      "    var positions = ctx.positions;\n" +
      "    var accountId = ctx.accountId;\n" +
      "    var extendData = ctx.extendData;\n" +
      "    \n" +
      (inputAssignments ? `    ${inputAssignments}\n` : '') +
      (styleAssignments ? `    ${styleAssignments}\n` : '') +
      "    \n" +
      "    // HTTP变量声明\n" +
      (httpVarDeclarations ? `    ${httpVarDeclarations}\n` : '') +
      (otherVarDeclarations ? `    ${otherVarDeclarations}\n` : '') +
      "    \n" +
      "    // 执行用户脚本\n" +
      "    " + userScript + "\n" +
      "    \n" +
      "    return { result: true };\n";

    // 检查语法错�?
    try {
      new Function('ctx', fullScript);
    } catch (error) {
      console.error('脚本语法错误:', error);
      console.error('错误位置附近的代�?');
      const lines = fullScript.split('\n');
      const errorLine = error.message.match(/line (\d+)/);
      if (errorLine) {
        const lineNum = parseInt(errorLine[1]);
        for (let i = Math.max(0, lineNum - 2); i < Math.min(lines.length, lineNum + 2); i++) {
          console.error(`${i + 1}: ${lines[i]}`);
        }
      }
    }



    return fullScript;
  }

  public createContext(dataList: KLineData[], scriptId?: string, msgCallback?: MsgCallback, renderContext?: any, script?: any) {
    if (script && script._executing) { return null; } if (script) { script._executing = true; }
    // 获取默认版本的引擎组�?
    const engine = this.versionManager.getDefaultEngine();
    // 创建包装的公式对象，自动传递数�?
    const wrappedFormula = engine.Formula;
    let startIndex = -1
    let endIndex = -1
    const visibleList: any[] = []
    const gapBarSpace2 = renderContext?.chart._chartStore._gapBarSpace / 2 || 0
    renderContext.chart._chartStore._visibleRangeDataList.forEach((item) => {
      if (item && item.dataIndex >= 0 && item.x >= -gapBarSpace2) {
        if (item.data?.current?.close) {
          visibleList.push({
            ...item.data.current,
            index: item.dataIndex,
          })
        }
      }
    })
    if (visibleList.length > 0) {
      startIndex = visibleList[0].index
      endIndex = visibleList[visibleList.length - 1].index
    }
    const ChartInfo = {
      width: renderContext.bounding.width,
      height: renderContext.bounding.height,
      symbol: renderContext?.chart?._chartStore?._symbol?.symbol,
      period: renderContext?.chart?._chartStore?._period?.key,
      gapBarSpace: renderContext?.chart?._chartStore?._gapBarSpace,
      barSpace: renderContext?.chart?._chartStore?._barSpace,
      startIndex: startIndex,
      endIndex: endIndex,
      toIndex: renderContext?.chart._chartStore._visibleRange.realTo - 1,
      pricePrecision: renderContext?.chart._chartStore._symbol?.pricePrecision,
      volumePrecision: renderContext?.chart._chartStore._symbol?.volumePrecision,
    }

    const O = createOutputAPI({
      ctx: renderContext?.ctx,
      bounding: renderContext?.bounding,
      yAxis: renderContext?.yAxis,
      xAxis: renderContext?.xAxis,
      chart: renderContext?.chart,
      msgCallback,
      scriptId,
      script: script
    });
    const D = createDrawAPI({
      ctx: renderContext?.ctx,
      bounding: renderContext?.bounding,
      yAxis: renderContext?.yAxis,
      xAxis: renderContext?.xAxis,
      chart: renderContext?.chart,
      script: script,
      dataList: dataList,  // 添加dataList
      visibleList: visibleList  // 添加可视区域数据
    });

    // 为script对象添加chart属�?
    if (script && renderContext?.chart) {
      script.chart = renderContext.chart;
    }

    // 创建引用对象，用于动态更�?
    const inputVal: any = {};
    const styleVal: any = {};
    const httpVal: any = {};

    // 初始�?inputs 引用
    if (script.inputs) {
      script.inputs.forEach(input => {
        inputVal[input.key] = input.value;
      });
    }

    // 初始�?styles 引用
    if (script.styles) {
      script.styles.forEach(style => {
        styleVal[style.key] = style.value;
      });
    }

    // 初始�?HTTP 引用
    if (script.httpCalls) {
      script.httpCalls.forEach(httpCall => {
        httpVal[httpCall.key] = httpCall.value || null;
      });
    }

    // 将引用对象保存到 script 中，以便外部更新
    script._inputVal = inputVal;
    script._styleVal = styleVal;
    script._httpVal = httpVal;

    // 创建脚本执行环境
    const scriptContext = {
      F: wrappedFormula,
      formula: wrappedFormula,
      U: engine.Utils,
      Math: Math, // 添加 Math 对象
      dataList: dataList, // 添加 dataList 以兼容脚本模�?
      visibleList: visibleList, // 添加可视区域数据
      ctx: renderContext?.ctx, // 添加 ctx
      bounding: renderContext?.bounding,
      yAxis: renderContext?.yAxis,
      xAxis: renderContext?.xAxis,
      chart: renderContext?.chart,
      O: O,
      output: O,
      D: D,
      draw: D,
      MD: D.maindraw, // 添加MD简�?
      script: script,
      // 脚本参数
      inputs: script.inputs || [],
      styles: script.styles || [],
      // 引用对象，用于动态更�?
      inputVal: inputVal,
      styleVal: styleVal,
      httpVal: httpVal,
      extendData: (() => {
        if (typeof script.extendData === 'function') {
          return script.extendData();
        }
        return script.extendData;
      })(),

      // 账户相关变量 - 每次执行时获取最新值
      balance: (() => {
        if (typeof script.getBalance === 'function') {
          try { return script.getBalance(); } catch (e) { return 0; }
        }
        return 0;
      })(),
      equity: (() => {
        if (typeof script.getEquity === 'function') {
          try { return script.getEquity(); } catch (e) { return 0; }
        }
        return 0;
      })(),
      orders: (() => {
        if (typeof script.getOrders === 'function') {
          try { return script.getOrders(); } catch (e) { return []; }
        }
        return [];
      })(),
      positions: (() => {
        if (typeof script.getPositions === 'function') {
          try { return script.getPositions(); } catch (e) { return []; }
        }
        return [];
      })(),
      accountId: (() => {
        if (typeof script.getAccount === 'function') {
          try { return script.getAccount(); } catch (e) { return ''; }
        }
        return '';
      })(),

      ChartInfo,
      // 添加主图访问能力
      mainChart: script.position === 'vice' ? {
        // 获取主图的绘制API
        getDrawAPI: () => {
          const mainPane = renderContext?.chart?.getDrawPaneById('candle_pane');
          if (mainPane) {
            const mainRenderContext = {
              ctx: (mainPane as any)._mainWidget._mainCanvas._ctx,
              bounding: mainPane.getBounding(),
              yAxis: mainPane.getAxisComponent(),
              xAxis: renderContext?.chart?.getXAxisPane()?.getAxisComponent(),
              chart: renderContext?.chart,
              script: { position: 'main' },
              dataList: renderContext?.dataList || []
            };
            return createDrawAPI(mainRenderContext);
          }
          return null;
        },
        // 获取主图的ctx
        getCtx: () => {
          const mainPane = renderContext?.chart?.getDrawPaneById('candle_pane');
          return (mainPane as any)?._mainWidget?._mainCanvas?._ctx;
        },
        // 获取主图的坐标轴
        getYAxis: () => {
          const mainPane = renderContext?.chart?.getDrawPaneById('candle_pane');
          return mainPane?.getAxisComponent();
        },
        getXAxis: () => {
          const mainPane = renderContext?.chart?.getDrawPaneById('candle_pane');
          return renderContext?.chart?.getXAxisPane()?.getAxisComponent();
        }
      } : null
    };

    // 注入序列数组（小写）
    const openArr = dataList.map(d => (d as any).open);
    const highArr = dataList.map(d => (d as any).high);
    const lowArr = dataList.map(d => (d as any).low);
    const closeArr = dataList.map(d => (d as any).close);
    const volumeArr = dataList.map(d => (d as any).volume);
    const timeArr = dataList.map(d => (d as any).timestamp ?? (d as any).time ?? null);

    // 安全取值（支持负索引）
    const safeAt = (arr: any[], index: number) => {
      const len = arr.length;
      const idx = index >= 0 ? index : len + index;
      return idx >= 0 && idx < len ? arr[idx] : null;
    };

    // 创建反向视图（Close[0] 为最后一根）
    const createReverseView = (arr: any[]) => new Proxy(arr, {
      get(target, prop: any) {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const n = Number(prop);
          const idx = target.length - 1 - n;
          return idx >= 0 && idx < target.length ? (target as any)[idx] : null;
        }
        if (prop === 'at') {
          return (n: number) => safeAt(target as any[], n);
        }
        return (target as any)[prop];
      }
    });

    (scriptContext as any).open = openArr;
    (scriptContext as any).high = highArr;
    (scriptContext as any).low = lowArr;
    (scriptContext as any).close = closeArr;
    (scriptContext as any).volume = volumeArr;
    (scriptContext as any).time = timeArr;

    (scriptContext as any).Open = createReverseView(openArr);
    (scriptContext as any).High = createReverseView(highArr);
    (scriptContext as any).Low = createReverseView(lowArr);
    (scriptContext as any).Close = createReverseView(closeArr);
    (scriptContext as any).Volume = createReverseView(volumeArr);
    (scriptContext as any).Time = createReverseView(timeArr);

    (scriptContext as any).rev = (series: any[], n: number = 0) => {
      // 倒数�?n 个（n=0 为最后一个）
      return series && typeof n === 'number'
        ? (series as any).at ? (series as any).at(-(n + 1)) : series[series.length - 1 - n]
        : null;
    };

    if (script) { script._executing = false; } return scriptContext;
  }



  // 将脚本注册到图表存储中，像指标一�?
  private registerScriptsToChartStore(scripts: Script[], paneId: string): void {
    const chartStore = this.chart.getChartStore();

    // 只清理当前要注册的脚本（如果已存在），而不是清理所有脚�?
    scripts.forEach(script => {
      const existingScript = chartStore.getScriptsByFilter({ key: script.key, paneId: paneId })[0];
      if (existingScript) {
        chartStore.removeScript({ key: script.key, paneId: paneId });
      }
    });

    scripts.forEach(script => {
      try {
        // 创建脚本对象，包含calcImp方法
        const scriptObj = {
          id: script.id, // 使用原始id，不强制转换
          name: script.name,
          code: script.code, // 保存原始加密源码
          info: script.info, // 保存完整的info信息，包括自定义字段
          paneId: paneId,
          key: script.key,
          visible: script.visible,
          position: script.position, // 添加position属�?
          figures: [], // 不依�?figures，脚本通过 O 方法直接绘图
          minValue: script.minValue || null, // 只使用脚本自己设置的�?
          maxValue: script.maxValue || null, // 只使用脚本自己设置的�?
          styles: null,
          shouldUpdate: null,
          // 缓存与脏标志
          _dirty: true,
          _offscreen: null as HTMLCanvasElement | null,
          _offctx: null as CanvasRenderingContext2D | null,
          _cacheSize: { w: 0, h: 0 },
          _lastChartSize: { w: 0, h: 0 },
          calc: () => script.outputs?.[0]?.data || [],
          regenerateFigures: null,
          createTooltipDataSource: script.createTooltipDataSource || null, // 只使用脚本自己定义的方法
          draw: (params: { ctx: CanvasRenderingContext2D, chart: any, indicator: any, bounding: any, xAxis: any, yAxis: any }) => {
            // 离屏缓存复用：仅在脏时重�?
            const b = params.bounding
            const w = Math.max(1, Math.floor(b.width))
            const h = Math.max(1, Math.floor(b.height))
            const needResize = (scriptObj._cacheSize.w !== w || scriptObj._cacheSize.h !== h)
            const ensureOffscreen = () => {
              if (!scriptObj._offscreen || needResize) {
                scriptObj._offscreen = document.createElement('canvas')
                scriptObj._offscreen.width = w
                scriptObj._offscreen.height = h
                scriptObj._offctx = scriptObj._offscreen.getContext('2d')!
                scriptObj._cacheSize = { w, h }
                scriptObj._dirty = true
              }
            }
            ensureOffscreen()

            // 数据/状态变更时外部应已置脏；此处兜底：尺寸改变、不可见直接贴图或清�?
            if (needResize) scriptObj._dirty = true

            if (scriptObj._dirty) {
              // 重画离屏
              const offctx = scriptObj._offctx!
              offctx.clearRect(0, 0, w, h)
              try {
                const renderContext = {
                  ctx: offctx,
                  bounding: { ...b, left: 0, top: 0 },
                  yAxis: params.yAxis,
                  xAxis: params.xAxis,
                  chart: params.chart,
                  indicator: params.indicator
                }
                const ctx2 = this.createContext(this.chart.getDataList(), script.key, script.msgCallback, renderContext, script)
                if (script._compiledFunction) {
                  script._compiledFunction(ctx2)
                }
              } catch (error) {
                // eslint-disable-next-line no-console -- debug only
                console.error('脚本离屏重画错误:', error)
              }
              scriptObj._dirty = false
            }

            // 主图贴图
            const ctx = params.ctx
            ctx.drawImage(scriptObj._offscreen as HTMLCanvasElement, 0, 0)
          },
          onDataStateChange: null,
          result: script.outputs?.[0]?.data || [],
          toolData: script.toolData,
          extendData: script.extendData, // 传递自定义数据
          // 实现calcImp方法
          calcImp: async (dataList: any[], prevResult?: any[], type: 'init' | 'append' | 'tick' = 'init') => {
            try {
              // 调用脚本的calc方法（同步）
              const result = script.calc ? script.calc(dataList, null, prevResult, type) : [];
              scriptObj._dirty = true; // 数据变更，置�?
              if (Array.isArray(result)) {
                scriptObj.result = result.map(item => {
                  if (typeof item === 'number') {
                    return { value: item };
                  } else if (item && typeof item === 'object' && 'value' in item) {
                    return item;
                  } else {
                    return { value: item };
                  }
                });
              } else {
                scriptObj.result = script.outputs?.[0]?.data || [];
              }
              return true;
            } catch (e) {
              console.error('ScriptManager.calcImp 错误:', e);
              return false;
            }
          },
          setSeriesPrecision: (precision: number) => {
            (scriptObj as any).precision = precision;
          },
          override: (override: any) => {
            Object.assign(scriptObj, override);
            scriptObj._dirty = true;
          },
          shouldUpdateImp: () => {
            // 任何可见区变化也视作需要重绘，但由 draw 内部缓存兜底
            return { calc: false, draw: true, sort: false };
          }
        };



        // 不再在这里注册到chartStore，由Chart.ts统一处理
        // chartStore.addScript(scriptObj, paneId, false);

      } catch (error) {
      }
    });
  }

  // 获取所有脚�?
  getScripts(): Script[] {
    return Array.from(this.scripts.values());
  }

  // 获取指定脚本
  getScript(key: string): Script | undefined {
    // 内部只使用key查找，key是脚本的唯一标识�?
    return this.scripts.get(key);
  }

  // 移除脚本
  removeScript(key: string): boolean {
    // 内部只使用key查找，key是脚本的唯一标识�?
    const script = this.scripts.get(key);
    const instanceId = key;

    if (script) {
      // 系统输出：脚本删�?
      if (script.msgCallback) {
        script.msgCallback(instanceId, 'sys', `脚本 "${script.name}" 已删除`);
      }

      // 注销事件（如果有的话�?
      if (script.events) {
        script.events.forEach(event => {
          this.chart.unsubscribeAction(event.type as any, event.handler);
        });
      }

      // 如果是副图脚本，先从 chartStore 中移除脚�?
      if (script.position === 'vice') {
        // 使用脚本对象中存储的实际paneId，而不是重新构�?
        const chartStore = this.chart.getChartStore();

        // �?chartStore 中移除脚�?
        const removed = chartStore.removeScript({ key: script.key, paneId: script.paneId });

        // 调试信息
        if (script.msgCallback) {
          script.msgCallback(script.key, 'sys', `删除脚本: ${script.name}, paneId: ${script.paneId}`);
        }

        // 检查该面板是否还有其他脚本
        const remainingScripts = chartStore.getScriptsByPaneId(script.paneId);
        const hasScripts = chartStore.hasScripts(script.paneId);

        // 调试信息
        if (script.msgCallback) {
          script.msgCallback(script.key, 'sys', `面板剩余脚本数量: ${remainingScripts.length}, hasScripts: ${hasScripts}`);
        }

        if (!hasScripts) {
          // 调试信息
          if (script.msgCallback) {
            script.msgCallback(script.key, 'sys', `准备删除面板: ${script.paneId || 'unknown'}`);
          }

          // 从已注册面板列表中移�?
          if (script.paneId) {
            this.registeredVicePanes.delete(script.paneId);
          }

          // 删除面板（按照脚本系统的方式�?
          const pane = this.chart.getDrawPaneById(script.paneId);
          if (pane) {
            const index = this.chart._drawPanes.findIndex(p => p.getId() === script.paneId);
            if (index > -1) {
              this.chart._drawPanes.splice(index, 1);
              pane.destroy();

              // 调试信息
              if (script.msgCallback) {
                script.msgCallback(script.key, 'sys', `面板已删�? ${script.paneId}`);
              }
            } else {
              // 调试信息
              if (script.msgCallback) {
                script.msgCallback(script.key, 'sys', `面板在_drawPanes中未找到: ${script.paneId}`);
              }
            }
          } else {
            // 调试信息
            if (script.msgCallback) {
              script.msgCallback(script.key, 'sys', `面板对象未找�? ${script.paneId}`);
            }
          }
        } else {
          // 调试信息
          if (script.msgCallback) {
            script.msgCallback(script.key, 'sys', `面板中还有其他脚本，保留面板: ${script.paneId}`);
          }
        }
      } else {
        // 主图脚本，从 chartStore 中移除脚�?
        const chartStore = this.chart.getChartStore();
        const removed = chartStore.removeScript({ key: script.key, paneId: 'candle_pane' });

        // 调试信息
        if (script.msgCallback) {
          script.msgCallback(script.key, 'sys', `删除主图脚本: ${script.name}, paneId: candle_pane`);
        }
      }

      this.scripts.delete(instanceId);

      // 清理计数�?- 如果是数据库脚本，减少计数器
      const originalScriptId = instanceId.split('_')[0]; // 获取原始脚本ID
      if (originalScriptId !== '0') {
        const currentCount = this.scriptCounters.get(originalScriptId) || 0;
        if (currentCount > 0) {
          this.scriptCounters.set(originalScriptId, currentCount - 1);
        }
      }

      // 触发图表重新布局（按照指标系统的方式�?
      this.chart.layout({
        sort: true,
        measureHeight: true,
        measureWidth: true,
        update: true,
        buildYAxisTick: true,
        forceBuildYAxisTick: true
      });

      return true;
    }
    return false;
  }

  // 设置脚本可见�?
  setScriptVisible(key: string, visible: boolean): void {
    // 通过 key 查找脚本
    let script: Script | undefined;
    for (const [instanceId, scriptObj] of this.scripts) {
      if (scriptObj.key === key) {
        script = scriptObj;
        break;
      }
    }

    if (script) {
      const oldVisible = script.visible;
      script.visible = visible;

      // 系统输出：脚本可见性变�?
      if (script.msgCallback && oldVisible !== visible) {
        const action = visible ? '显示' : '隐藏';
        script.msgCallback(script.key, 'sys', `脚本 "${script.name}" ?{action}`);
      }

      // 触发图表重新渲染
      this.chart.layout({ update: true });
    }
  }

  // 设置脚本配置
  async setScriptConfig(key: string, config: { inputs?: any, styles?: any }): Promise<void> {
    const script = this.scripts.get(key);
    if (script) {
      // 更新脚本配置
      if (config.inputs) {
        script.inputs = config.inputs;
      }
      if (config.styles) {
        // 只更新styles的value，保持defaultValue不变
        if (Array.isArray(config.styles) && Array.isArray(script.styles)) {
          config.styles.forEach((newStyle, index) => {
            if (script.styles[index]) {
              // 只更新value，保持defaultValue不变
              if (newStyle.value !== undefined) {
                script.styles[index].value = JSON.parse(JSON.stringify(newStyle.value));
              }
              // 更新其他属性（除了defaultValue�?
              Object.keys(newStyle).forEach(key => {
                if (key !== 'defaultValue' && key !== 'value') {
                  script.styles[index][key] = JSON.parse(JSON.stringify(newStyle[key]));
                }
              });
            }
          });
        } else {
          // 如果不是数组格式，深拷贝替换
          script.styles = JSON.parse(JSON.stringify(config.styles));
        }
      }

      // 使用引用方式，直接更新引用对象，无需重新编译
      try {
        // 更新引用对象
        if (config.inputs && (script as any)._inputVal) {
          config.inputs.forEach((newInput: any) => {
            if ((script as any)._inputVal[newInput.key] !== undefined) {
              (script as any)._inputVal[newInput.key] = newInput.value;
            }
          });
        }

        if (config.styles && (script as any)._styleVal) {
          config.styles.forEach((newStyle: any) => {
            if ((script as any)._styleVal[newStyle.key] !== undefined) {
              (script as any)._styleVal[newStyle.key] = newStyle.value;
            }
          });
        }

        if (config.inputs && script.httpCalls && script.httpCalls.length > 0) {
          await this.executeHttpCalls(script.httpCalls, script);
        }



        // 触发脚本刷新（但不重新编译）
        this.triggerScriptRefresh(script.key);

        // 系统输出：脚本配置更?
        if (script.msgCallback) {
          if (config.inputs) {
            // 处理 inputs 数组格式
            let inputInfo = '';
            if (Array.isArray(config.inputs)) {
              inputInfo = config.inputs
                .map((input, index) => `${input.name || `param${index}`}=${input.value}`)
                .join(', ');
            } else {
              inputInfo = Object.entries(config.inputs)
                .map(([key, value]) => `${key}=${value}`)
                .join(', ');
            }
            script.msgCallback(script.key, 'sys', `修改参数成功: ${inputInfo}`);
          }
          if (config.styles) {
            // 处理 styles 数组格式
            let styleInfo = '';
            if (Array.isArray(config.styles)) {
              styleInfo = config.styles
                .map((style, index) => `${style.name || `style${index}`}=${style.value}`)
                .join(', ');
            } else {
              styleInfo = Object.entries(config.styles)
                .map(([key, value]) => `${key}=${value}`)
                .join(', ');
            }
            script.msgCallback(script.key, 'sys', `修改样式成功: ${styleInfo}`);
          }
        }
      } catch (error) {
        console.error('脚本重新编译失败:', error);
      }
    } else {
      console.warn('ScriptManager.setScriptConfig: 未找到脚本', { key });
    }
  }
}

export default ScriptManager;