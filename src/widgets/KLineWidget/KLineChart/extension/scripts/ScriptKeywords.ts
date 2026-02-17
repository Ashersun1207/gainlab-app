/**
 * 脚本关键字验证器
 * 定义不能用作变量名的关键字集合，防止变量名冲突
 */

/**
 * JavaScript 原生关键字
 * 这些是 JavaScript 语言的保留字，不能用作变量名
 */
const JS_KEYWORDS = new Set([
  // 基础关键字
  'var', 'let', 'const', 'function', 'class', 'if', 'else', 'for', 'while', 
  'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'try', 
  'catch', 'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof', 
  'this', 'super', 'extends', 'import', 'export', 'from', 'as', 'default',
  
  // 严格模式关键字
  'with', 'arguments', 'eval',
  
  // 未来保留字
  'implements', 'interface', 'package', 'private', 'protected', 'public', 
  'static', 'yield', 'async', 'await',
  
  // 布尔值和空值
  'true', 'false', 'null', 'undefined',
  
  // 全局对象
  'window', 'global', 'globalThis', 'self'
]);

/**
 * 脚本系统专用关键字
 * 这些是我们脚本系统中使用的特殊对象和函数名
 */
const SCRIPT_KEYWORDS = new Set([
  // 核心对象
  'F', 'Formula', 'I', 'S', 'O', 'input', 'style', 'output',
  
  // 常量对象
  'SOURCE', 'POSITION', 'LINESTYLE', 'SHAPE', 'CHART_TYPE', 
  'SIGNAL_TYPE', 'TIMEFRAME', 'MATH', 'COLORS',
  
  // 系统变量
  'dataList', 'params', 'styles', 'console', 'i',
  
  // 公式函数别名
  'SMA', 'EMA', 'RSI', 'MA', 'MACD', 'BOLL', 'KDJ', 'plot',
  
  // 脚本元数据关键字
  'name', 'desc', 'version', 'author', 'position'
]);

/**
 * 常用编程概念关键字
 * 避免与常见编程概念冲突
 */
const PROGRAMMING_KEYWORDS = new Set([
  // 数据类型
  'number', 'string', 'boolean', 'object', 'array', 'date', 'regexp',
  
  // 数学对象
  'Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'RegExp',
  
  // 错误对象
  'Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'RangeError',
  
  // JSON 和 Promise
  'JSON', 'Promise', 'Symbol', 'Proxy', 'Reflect',
  
  // 常用变量名（建议避免）
  'data', 'result', 'value', 'index', 'length', 'size', 'count',
  'item', 'element', 'node', 'event', 'target', 'source'
]);

/**
 * 技术分析相关关键字
 * 避免与技术分析概念冲突
 */
const TECHNICAL_KEYWORDS = new Set([
  // 价格类型
  'open', 'high', 'low', 'close', 'volume', 'price',
  
  // 技术指标名称
  'sma', 'ema', 'rsi', 'macd', 'boll', 'kdj', 'stoch', 'williams',
  'cci', 'momentum', 'roc', 'atr', 'adx', 'obv', 'sar',
  
  // 交易概念
  'buy', 'sell', 'long', 'short', 'signal', 'trend', 'support', 
  'resistance', 'breakout', 'crossover', 'crossunder',
  
  // 图表相关
  'chart', 'candle', 'bar', 'line', 'area', 'histogram'
]);

/**
 * 所有关键字的合集
 */
const ALL_KEYWORDS = new Set([
  ...JS_KEYWORDS,
  ...SCRIPT_KEYWORDS,
  ...PROGRAMMING_KEYWORDS,
  ...TECHNICAL_KEYWORDS
]);

/**
 * 关键字验证器类
 */
export class ScriptKeywordValidator {
  /**
   * 检查变量名是否为关键字
   * @param name 变量名
   * @returns 是否为关键字
   */
  static isKeyword(name: string): boolean {
    return ALL_KEYWORDS.has(name.toLowerCase());
  }
  
  /**
   * 检查变量名是否为 JavaScript 关键字
   * @param name 变量名
   * @returns 是否为 JS 关键字
   */
  static isJSKeyword(name: string): boolean {
    return JS_KEYWORDS.has(name.toLowerCase());
  }
  
  /**
   * 检查变量名是否为脚本系统关键字
   * @param name 变量名
   * @returns 是否为脚本关键字
   */
  static isScriptKeyword(name: string): boolean {
    return SCRIPT_KEYWORDS.has(name);
  }
  
  /**
   * 检查变量名是否为技术分析关键字
   * @param name 变量名
   * @returns 是否为技术分析关键字
   */
  static isTechnicalKeyword(name: string): boolean {
    return TECHNICAL_KEYWORDS.has(name.toLowerCase());
  }
  
  /**
   * 验证变量名是否有效
   * @param name 变量名
   * @returns 验证结果对象
   */
  static validateVariableName(name: string): {
    isValid: boolean;
    error?: string;
    suggestion?: string;
  } {
    // 检查是否为空
    if (!name || name.trim() === '') {
      return {
        isValid: false,
        error: '变量名不能为空'
      };
    }
    
    name = name.trim();
    
    // 检查是否符合变量名规则（字母、数字、下划线，不能以数字开头）
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      return {
        isValid: false,
        error: '变量名只能包含字母、数字和下划线，且不能以数字开头'
      };
    }
    
    // 检查是否为 JavaScript 关键字
    if (this.isJSKeyword(name)) {
      return {
        isValid: false,
        error: `"${name}" 是 JavaScript 保留字，不能用作变量名`,
        suggestion: `建议使用: ${name}Value, my${name.charAt(0).toUpperCase() + name.slice(1)}, ${name}_`
      };
    }
    
    // 检查是否为脚本系统关键字
    if (this.isScriptKeyword(name)) {
      return {
        isValid: false,
        error: `"${name}" 是脚本系统保留字，不能用作变量名`,
        suggestion: `建议使用: ${name}Value, user${name.charAt(0).toUpperCase() + name.slice(1)}, ${name}_`
      };
    }
    
    // 检查是否为技术分析关键字（允许使用，但给出建议）
    if (this.isTechnicalKeyword(name)) {
      return {
        isValid: true,
        error: `提示: "${name}" 是技术分析常用术语，建议使用更具体的名称`,
        suggestion: `建议使用: ${name}Period, ${name}Value, custom${name.charAt(0).toUpperCase() + name.slice(1)}`
      };
    }
    
    return {
      isValid: true
    };
  }
  
  /**
   * 获取所有关键字列表
   * @returns 关键字数组
   */
  static getAllKeywords(): string[] {
    return Array.from(ALL_KEYWORDS);
  }
  
  /**
   * 获取建议的变量名
   * @param baseName 基础名称
   * @returns 建议的变量名数组
   */
  static getSuggestions(baseName: string): string[] {
    const suggestions: string[] = [];
    
    if (baseName) {
      const base = baseName.trim();
      const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
      
      suggestions.push(
        `${base}Value`,
        `${base}Param`,
        `${base}_`,
        `my${capitalized}`,
        `user${capitalized}`,
        `custom${capitalized}`,
        `${base}Setting`,
        `${base}Config`
      );
    }
    
    return suggestions.filter(name => this.validateVariableName(name).isValid);
  }
}

/**
 * 导出关键字集合（只读）
 */
export const KEYWORDS = {
  JS: Array.from(JS_KEYWORDS),
  SCRIPT: Array.from(SCRIPT_KEYWORDS),
  PROGRAMMING: Array.from(PROGRAMMING_KEYWORDS),
  TECHNICAL: Array.from(TECHNICAL_KEYWORDS),
  ALL: Array.from(ALL_KEYWORDS)
} as const; 