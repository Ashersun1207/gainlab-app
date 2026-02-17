/**
 * 脚本解析器
 * 负责解析编辑器传来的脚本代码，提取元数据、参数、样式等信息
 */

import { SOURCE } from '../../ScriptConstants';
import { ScriptKeywordValidator } from '../../ScriptKeywords';

export interface ScriptMetadata {
  name: string;        // 简称（用于工具栏显示）
  title?: string;      // 标题（全称 + 中文名，用于详细显示）
  desc?: string;
  position: 'main' | 'vice';
  version?: number;  // 脚本引擎版本（预留）
  author?: string;
}

export interface ScriptInput {
  key: string;
  title: string; // 显示标题，如果没有定义则使用key
  type: string; // 不限制具体类型，支持扩展
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  value?: any; // 新增value字段，初始为defaultValue
  tip?: string; // 新增tip字段
}

export interface ScriptStyle {
  key: string;
  title: string; // 显示标题，如果没有定义则使用key
  type: string; // 不限制具体类型，支持扩展
  defaultValue: any;
  value?: any; // 新增value字段，初始为defaultValue
  min?: number;  // 最小值（用于lineWidth、size等）
  max?: number;  // 最大值（用于lineWidth、size等）
  tip?: string; // 新增tip字段
  show?: boolean; // 是否显示在设置面板中，默认为true
}

export interface ScriptHttpCall {
  key: string; // 变量名
  type: 'loadHistory' | 'get' | 'post';
  url?: string;
  params?: any;
  data?: any;
  symbol?: string;
  startTime?: number;
  endTime?: number;
  value?: any; // 请求结果
  args: string[]; // 保存完整的参数信息
}

export interface ParsedScript {
  info: ScriptMetadata;  // 脚本信息
  inputs: ScriptInput[]; // 参数集
  styles: ScriptStyle[]; // 样式集
  httpCalls: ScriptHttpCall[]; // HTTP方法调用
  script: string;        // 脚本原内容
  main: string;          // 脚本运行体
  errors: string[];
}

export class ScriptParser {
  /**
   * 解析脚本
   */
  static parse(scriptCode: string, presetInputs?: Array<{key: string, value: any}>, presetStyles?: Array<{key: string, value: any}>): ParsedScript {
    const result: ParsedScript = {
      info: { name: '', position: 'main' },
      inputs: [],
      styles: [],
      httpCalls: [],
      script: scriptCode,
      main: '',
      errors: []
    };

    try {
      // 1. 解析元数据
      result.info = this.parseMetadata(scriptCode);

      // 2. 解析输入参数（即使元数据有错误也要继续）
      result.inputs = this.parseInputs(scriptCode, result.errors);

      // 3. 解析样式参数（即使元数据有错误也要继续）
      result.styles = this.parseStyles(scriptCode, result.errors);

      // 4. 应用预设值（如果有的话）
      if (presetInputs) {
        this.applyPresetValues(result.inputs, presetInputs);
      }
      if (presetStyles) {
        this.applyPresetValues(result.styles, presetStyles);
      }

      // 4. 解析HTTP方法调用（即使元数据有错误也要继续）
      result.httpCalls = this.parseHttpCalls(scriptCode);

      // 5. 生成可执行代码（即使元数据有错误也要继续）
      result.main = this.generateExecutableCode(scriptCode, result, result.httpCalls);

    } catch (error) {
      result.errors.push(`解析错误: ${error.message}`);
    }

    return result;
  }

  /**
   * 解析元数据 (@name, @desc, @position 等)
   */
  private static parseMetadata(scriptCode: string): ScriptMetadata {
    const metadata: ScriptMetadata = { name: '', position: 'vice', version: 1 }; // 默认副图

    // 解析 @name（简称，用于工具栏显示）
    const nameMatch = scriptCode.match(/\/\/\s*@name\s*=\s*(.+?)(?:\r?\n|$)/);
    if (nameMatch) {
      metadata.name = nameMatch[1].trim();
    }

    // 解析 @title（标题，全称 + 中文名，用于详细显示）
    const titleMatch = scriptCode.match(/\/\/\s*@title\s*=\s*(.+?)(?:\r?\n|$)/);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // 自动补充逻辑：如果只提供了其中一个字段，用另一个字段来补充
    if (!metadata.name && metadata.title) {
      metadata.name = metadata.title;
    } else if (!metadata.title && metadata.name) {
      metadata.title = metadata.name;
    }

    // 验证至少有一个名称字段
    if (!metadata.name && !metadata.title) {
      throw new Error('脚本元数据 @name 或 @title 必须至少填写一个且不能为空');
    }

    // 解析 @desc（支持多行注释格式）
    const lines = scriptCode.split('\n');
    let descContent = '';
    let inDesc = false;
    let descStarted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检查是否是 @desc 开始（不需要引号）
      const descStartMatch = line.match(/^\/\/\s*@desc\s*=\s*(.*)$/);
      if (descStartMatch) {
        inDesc = true;
        descStarted = true;
        const firstLineContent = descStartMatch[1];

        // 如果首行有内容，开始收集
        if (firstLineContent) {
          descContent = firstLineContent + '\n';
        }
        continue;
      }

      // 如果在desc中，继续处理
      if (inDesc) {
        // 检查是否是注释行
        if (line.startsWith('//')) {
          // 检查是否是其他元数据（结束desc）
          if (line.match(/^\/\/\s*@\w+/)) {
            inDesc = false;
            break;
          }
          // 提取注释内容（不需要处理引号）
          const commentContent = line.replace(/^\/\/\s*/, '');
          descContent += commentContent + '\n';
        } else {
          // 非注释行，desc结束
          inDesc = false;
          break;
        }
      }
    }

    if (descStarted && descContent) {
      metadata.desc = descContent.trim();
    }
    metadata.desc = (metadata.desc || '').trim();
    
    // 确保换行符被保留，将连续的换行符标准化
    if (metadata.desc) {
      metadata.desc = metadata.desc.replace(/\n+/g, '\n');
    }

    // 解析 @position（不需要引号）
    const positionMatch = scriptCode.match(/\/\/\s*@position\s*=\s*(.+)$/m);
    if (positionMatch) {
      const pos = positionMatch[1].trim();
      metadata.position = (pos === 'main' || pos === 'vice') ? pos : 'vice';
    }
    // 保证类型安全
    if (metadata.position !== 'main' && metadata.position !== 'vice') {
      metadata.position = 'vice';
    }

    // 解析 @version（脚本引擎版本，预留）
    const versionMatch = scriptCode.match(/\/\/\s*@version\s*=\s*(\d+)/);
    if (versionMatch) {
      metadata.version = parseInt(versionMatch[1].trim());
    }

    // 解析 @author（不需要引号）
    const authorMatch = scriptCode.match(/\/\/\s*@author\s*=\s*(.+)$/m);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    metadata.author = (metadata.author || '').trim();

    return metadata;
  }

  /**
   * 解析输入参数 - 完全支持文档中的input格式
   */
  private static parseInputs(scriptCode: string, errors: string[]): ScriptInput[] {
    const inputs: ScriptInput[] = [];

    // 匹配 input.xxx 和 I.xxx
    const inputRegex = /(\w+)\s*=\s*(input|I)\.(\w+)\s*\(\s*([^)]+)\s*\)/g;
    let match;

    while ((match = inputRegex.exec(scriptCode)) !== null) {
      const [, key, , type, params] = match;
      
      // 验证变量名
      const validation = ScriptKeywordValidator.validateVariableName(key);
      if (!validation.isValid) {
        errors.push(`Input 变量名错误: ${validation.error}`);
        continue;
      }
      
      const input = this.parseDocumentInputParams(key, type, params);
      if (input) {
        inputs.push(input);
      }
    }

    return inputs;
  }

  /**
   * 解析文档格式的input参数
   */
  private static parseDocumentInputParams(key: string, type: string, params: string): ScriptInput | null {
    try {
      const paramList = this.splitParams(params);
      if (paramList.length === 0) return null;

      // 统一类型名称
      const normalizedType = type === 'str' ? 'string' : type;
      const defaultVal = this.parseInputValueByType(paramList[0], normalizedType);
      // 创建基础输入对象，只包含必要属性
      const input: any = {
        key,
        type: normalizedType as any,
        defaultValue: defaultVal,
        value: defaultVal,
        title: key // 默认使用key作为标题
      };

      // 解析额外参数: 直接用逗号分割，再用等号分割
      for (let i = 1; i < paramList.length; i++) {
        const param = paramList[i].trim();
        const equalIndex = param.indexOf('=');
        if (equalIndex > 0) {
          const key = param.substring(0, equalIndex).trim();
          const value = param.substring(equalIndex + 1).trim();
          
          // 特殊处理 options 参数
          if (key === 'options') {
            input[key] = this.parseOptionsValue(value);
          } else {
            input[key] = this.parseStringValue(value);
          }
        }
      }
      return input;
    } catch (error) {
      return null;
    }
  }

  /**
   * 根据类型解析input值
   */
  private static parseInputValueByType(valueStr: string, type: string): any {
    valueStr = valueStr.trim();

    switch (type) {
      case 'int':
        return parseInt(valueStr) || 0;
      case 'float':
        return parseFloat(valueStr) || 0.0;
      case 'string':
        return this.parseStringValue(valueStr);
      case 'bool':
        return valueStr.toLowerCase() === 'true';
      case 'select':
        return this.parseStringValue(valueStr);
      default:
        return valueStr;
    }
  }

  /**
   * 解析选项值 - 支持SOURCE常量和数组格式
   */
  private static parseOptionsValue(optionsStr: string): string[] {
    optionsStr = optionsStr.trim();

    // 支持文档中的SOURCE常量
    if (optionsStr === 'SOURCE') {
      // 直接使用ScriptConstants中定义的SOURCE值
      return Object.values(SOURCE);
    }

    // 解析数组格式: ['open','close','high','low']
    if (optionsStr.startsWith('[') && optionsStr.endsWith(']')) {
      const content = optionsStr.slice(1, -1);
      return content.split(',').map(item => this.parseStringValue(item.trim()));
    }

    // 如果只是单个值，返回包含该值的数组
    if (optionsStr) {
      return [this.parseStringValue(optionsStr)];
    }

    return [];
  }



  /**
   * 解析HTTP方法调用
   */
  private static parseHttpCalls(scriptCode: string): ScriptHttpCall[] {
    const httpCalls: ScriptHttpCall[] = [];
    
    // 解析所有 HTTP 调用，包括 H. 和 http.
    // 例如: res = H.loadHistory(), const res = http.get(), H.loadHistory() 等
    const httpCallRegex = /(?:const|var|let)?\s*(\w+)?\s*=\s*(H|http)\.(loadHistory|get|post)\s*\(\s*([^)]*)\s*\)/g;
    let match;
    
    while ((match = httpCallRegex.exec(scriptCode)) !== null) {
      const [, variableName, httpObject, method, args] = match;

      const httpCall: ScriptHttpCall = {
        key: variableName,
        type: method as 'loadHistory' | 'get' | 'post',
        value: { data: [], count: 0 }, // 默认值
        args: args ? args.split(',').map(p => this.parseParamValue(p.trim())) : [] // 保存完整的参数信息
      };
      
      httpCalls.push(httpCall);
    }
    
    return httpCalls;
  }

  /**
   * 将脚本代码转换为引用形式
   */
  static convertToReferenceForm(scriptCode: string, inputs: ScriptInput[], styles: ScriptStyle[], httpCalls: ScriptHttpCall[]): string {
    let convertedCode = scriptCode;
    
    // 转换 inputs 为引用形式
    inputs.forEach(input => {
      const inputRegex = new RegExp(`(\\b${input.key}\\s*=\\s*)I\\.\\w+\\([^)]*\\)`, 'g');
      convertedCode = convertedCode.replace(inputRegex, `$1ctx.inputVal.${input.key}`);
    });
    
    // 转换 styles 为引用形式
    styles.forEach(style => {
      const styleRegex = new RegExp(`(\\b${style.key}\\s*=\\s*)(S|style)\\.\\w+\\([^)]*\\)`, 'g');
      convertedCode = convertedCode.replace(styleRegex, `$1ctx.styleVal.${style.key}`);
    });
    
    // 转换 HTTP 调用为引用形式
    httpCalls.forEach(httpCall => {
      const httpRegex = new RegExp(`(\\b${httpCall.key}\\s*=\\s*)(H|http)\\.\\w+\\([^)]*\\)`, 'g');
      convertedCode = convertedCode.replace(httpRegex, `$1ctx.httpVal.${httpCall.key}`);
    });
    
    return convertedCode;
  }

  /**
   * 解析样式参数 - 完全支持文档中的style格式
   */
  private static parseStyles(scriptCode: string, errors: string[]): ScriptStyle[] {
    const styles: ScriptStyle[] = [];

    // 匹配 style.xxx 和 S.xxx
    const styleRegex = /(\w+)\s*=\s*(style|S)\.(\w+)\s*\(/g;
    let match;

    while ((match = styleRegex.exec(scriptCode)) !== null) {
      const [, key, , type] = match;
      
      // 验证变量名
      const validation = ScriptKeywordValidator.validateVariableName(key);
      if (!validation.isValid) {
        errors.push(`Style 变量名错误: ${validation.error}`);
        continue;
      }

      const startIndex = match.index + match[0].length;
      const endIndex = this.findClosingParenthesis(scriptCode, startIndex);
      const params = scriptCode.substring(startIndex, endIndex);
      
      const paramList = this.splitParams(params);
      const style: ScriptStyle = {
        key,
        title: key,
        type,
        defaultValue: {},
        value: {},
        show: true
      };

      // 处理参数
      for (const param of paramList) {
        if (param.includes('=')) {
          const [paramKey, paramValue] = param.split('=', 2);
          const cleanKey = paramKey.trim();
          const cleanValue = paramValue.trim();
          
          if (cleanKey === 'title') {
            style.title = this.parseStringValue(cleanValue);
          } else if (cleanKey === 'tip') {
            style.tip = this.parseStringValue(cleanValue);
          } else if (cleanKey === 'show') {
            // show属性应该在value对象内部
            const showValue = cleanValue === 'true';
            if (typeof style.defaultValue === 'object' && style.defaultValue !== null) {
              style.defaultValue.show = showValue;
            } else {
              style.defaultValue = { show: showValue };
            }
            if (typeof style.value === 'object' && style.value !== null) {
              style.value.show = showValue;
            } else {
              style.value = { show: showValue };
            }
          } else if (cleanKey === 'min') {
            style.min = parseFloat(cleanValue);
          } else if (cleanKey === 'max') {
            style.max = parseFloat(cleanValue);
          } else {
            // 处理样式特定的命名参数
            // 先解析完整的参数字符串，然后提取特定参数
            const styleValue = this.parseStyleValueByType(params, type);
            if (typeof styleValue === 'object' && styleValue !== null) {
              const showValue = styleValue.show !== undefined ? styleValue.show : (style.value?.show !== undefined ? style.value.show : true);
              style.defaultValue = { ...styleValue, show: showValue };
              style.value = { ...styleValue, show: showValue };
            } else {
              const showValue = style.value?.show !== undefined ? style.value.show : true;
              style.defaultValue = { value: styleValue, show: showValue };
              style.value = { value: styleValue, show: showValue };
            }
          }
        } else {
          
          // 处理不同类型的样式
          switch (type) {
            case 'line':
              // 解析线条样式 - 传递完整的参数字符串
              const lineValue = this.parseStyleValueByType(params, type)
              if (typeof lineValue === 'object' && lineValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = lineValue.show !== undefined ? lineValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...lineValue, show: showValue }
                style.value = { ...lineValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: lineValue, show: showValue }
                style.value = { value: lineValue, show: showValue }
              }
              break
            case 'color':
              // 解析颜色样式 - 直接返回颜色值
              const colorValue = this.parseStyleValueByType(params, type)
              style.defaultValue = colorValue
              style.value = colorValue
              break
            case 'width':
              // 解析宽度样式 - 直接返回数值
              const widthValue = this.parseStyleValueByType(params, type)
              style.defaultValue = widthValue
              style.value = widthValue
              break
            case 'size':
              // 解析尺寸样式 - 直接返回数值
              const sizeValue = this.parseStyleValueByType(params, type)
              style.defaultValue = sizeValue
              style.value = sizeValue
              break
            case 'style':
              // 解析样式类型 - 直接返回字符串
              const styleValue = this.parseStyleValueByType(params, type)
              style.defaultValue = styleValue
              style.value = styleValue
              break
            case 'full':
              // 解析填充样式 - 直接返回字符串
              const fullValue = this.parseStyleValueByType(params, type)
              style.defaultValue = fullValue
              style.value = fullValue
              break
            case 'icon':
              // 解析图标样式 - 直接返回字符串
              const iconValue = this.parseStyleValueByType(params, type)
              style.defaultValue = iconValue
              style.value = iconValue
              break

            case 'candle':
              // 解析蜡烛图样式 - 传递完整的参数字符串
              const candleValue = this.parseStyleValueByType(params, type)
              if (typeof candleValue === 'object' && candleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = candleValue.show !== undefined ? candleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...candleValue, show: showValue }
                style.value = { ...candleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: candleValue, show: showValue }
                style.value = { value: candleValue, show: showValue }
              }
              break
                        case 'label': {
              // 解析标签样式 - 传递完整的参数字符串
              const labelStyleValue = this.parseStyleValueByType(params, type)
              if (typeof labelStyleValue === 'object' && labelStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = labelStyleValue.show !== undefined ? labelStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...labelStyleValue, show: showValue }
                style.value = { ...labelStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: labelStyleValue, show: showValue }
                style.value = { value: labelStyleValue, show: showValue }
              }
              break }
              case 'labelbg':
              // 解析标签背景样式 - 传递完整的参数字符串
              const labelbgValue = this.parseStyleValueByType(params, type)
              if (typeof labelbgValue === 'object' && labelbgValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = labelbgValue.show !== undefined ? labelbgValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...labelbgValue, show: showValue }
                style.value = { ...labelbgValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: labelbgValue, show: showValue }
                style.value = { value: labelbgValue, show: showValue }
              }
              break



            case 'shape':
              // 解析图形样式 - 传递完整的参数字符串
              const shapeValue = this.parseStyleValueByType(params, type)
              if (typeof shapeValue === 'object' && shapeValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = shapeValue.show !== undefined ? shapeValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...shapeValue, show: showValue }
                style.value = { ...shapeValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: shapeValue, show: showValue }
                style.value = { value: shapeValue, show: showValue }
              }
              break
            case 'bar':
              // 解析柱状图样式 - 传递完整的参数字符串
              const barStyleValue = this.parseStyleValueByType(params, type)
              if (typeof barStyleValue === 'object' && barStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = barStyleValue.show !== undefined ? barStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...barStyleValue, show: showValue }
                style.value = { ...barStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: barStyleValue, show: showValue }
                style.value = { value: barStyleValue, show: showValue }
              }
              break
            case 'area':
              // 解析区域样式 - 传递完整的参数字符串
              const areaStyleValue = this.parseStyleValueByType(params, type)
              if (typeof areaStyleValue === 'object' && areaStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = areaStyleValue.show !== undefined ? areaStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...areaStyleValue, show: showValue }
                style.value = { ...areaStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: areaStyleValue, show: showValue }
                style.value = { value: areaStyleValue, show: showValue }
              }
              break

            case 'circle':
              // 解析圆形样式 - 传递完整的参数字符串
              const circleStyleValue = this.parseStyleValueByType(params, type)
              if (typeof circleStyleValue === 'object' && circleStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = circleStyleValue.show !== undefined ? circleStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...circleStyleValue, show: showValue }
                style.value = { ...circleStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: circleStyleValue, show: showValue }
                style.value = { value: circleStyleValue, show: showValue }
              }
              break
            case 'rect':
              // 解析矩形样式 - 传递完整的参数字符串
              const rectStyleValue = this.parseStyleValueByType(params, type)
              if (typeof rectStyleValue === 'object' && rectStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = rectStyleValue.show !== undefined ? rectStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...rectStyleValue, show: showValue }
                style.value = { ...rectStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: rectStyleValue, show: showValue }
                style.value = { value: rectStyleValue, show: showValue }
              }
              break
            case 'srect':
              // 解析屏幕相对矩形样式 - 传递完整的参数字符串
              const srectStyleValue = this.parseStyleValueByType(params, type)
              if (typeof srectStyleValue === 'object' && srectStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = srectStyleValue.show !== undefined ? srectStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...srectStyleValue, show: showValue }
                style.value = { ...srectStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: srectStyleValue, show: showValue }
                style.value = { value: srectStyleValue, show: showValue }
              }
              break
            case 'sarea':
              // 解析屏幕相对区域样式 - 传递完整的参数字符串
              const sareaStyleValue = this.parseStyleValueByType(params, type)
              if (typeof sareaStyleValue === 'object' && sareaStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = sareaStyleValue.show !== undefined ? sareaStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...sareaStyleValue, show: showValue }
                style.value = { ...sareaStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: sareaStyleValue, show: showValue }
                style.value = { value: sareaStyleValue, show: showValue }
              }
              break
            case 'scircle':
              // 解析屏幕相对圆形样式 - 传递完整的参数字符串
              const scircleStyleValue = this.parseStyleValueByType(params, type)
              if (typeof scircleStyleValue === 'object' && scircleStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = scircleStyleValue.show !== undefined ? scircleStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...scircleStyleValue, show: showValue }
                style.value = { ...scircleStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: scircleStyleValue, show: showValue }
                style.value = { value: scircleStyleValue, show: showValue }
              }
              break
            case 'sshape':
              // 解析屏幕相对图形样式 - 传递完整的参数字符串
              const sshapeStyleValue = this.parseStyleValueByType(params, type)
              if (typeof sshapeStyleValue === 'object' && sshapeStyleValue !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = sshapeStyleValue.show !== undefined ? sshapeStyleValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...sshapeStyleValue, show: showValue }
                style.value = { ...sshapeStyleValue, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: sshapeStyleValue, show: showValue }
                style.value = { value: sshapeStyleValue, show: showValue }
              }
              break
            case 'slabel':
              // 解析屏幕标签样式（不包含position）
              const slabelValue = this.parseStyleValueByType(params, type)
              if (typeof slabelValue === 'object' && slabelValue !== null) {
                const showValue = slabelValue.show !== undefined ? slabelValue.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...slabelValue, show: showValue }
                style.value = { ...slabelValue, show: showValue }
              } else {
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value: slabelValue, show: showValue }
                style.value = { value: slabelValue, show: showValue }
              }
              break
            default:
              // 默认处理
              const value = this.parseStyleValueByType(param.trim(), type)
              if (typeof value === 'object' && value !== null) {
                // 如果parseStyleValueByType返回的结果中有show值，使用它；否则使用用户设置的show值
                const showValue = value.show !== undefined ? value.show : (style.value?.show !== undefined ? style.value.show : true)
                style.defaultValue = { ...value, show: showValue }
                style.value = { value, show: showValue }
              } else {
                // 保留用户设置的show值，如果没有设置则默认为true
                const showValue = style.value?.show !== undefined ? style.value.show : true
                style.defaultValue = { value, show: showValue }
                style.value = { value, show: showValue }
              }
          }
        }
      }

      styles.push(style);
    }

    // 如果有错误，抛出异常
    if (errors.length > 0) {
      throw new Error(`样式解析错误:\n${errors.join('\n')}`);
    }

    return styles;
  }

  /**
   * 根据类型解析style值
   */
  private static parseStyleValueByType(valueStr: string, type: string): any {
    valueStr = valueStr.trim();

    switch (type) {
      case 'color':
        // 提取第一个参数作为颜色值
        const colorParams = this.splitParams(valueStr);
        if (colorParams.length >= 1) {
          return colorParams[0].replace(/['"]/g, '');
        }
        return valueStr.replace(/['"]/g, '');
      case 'width':
        // 提取第一个参数作为宽度值
        const widthParams = this.splitParams(valueStr);
        if (widthParams.length >= 1) {
          const width = parseInt(widthParams[0]) || 1;
          return Math.max(1, Math.min(width, 10));
        }
        const width = parseInt(valueStr) || 1;
        return Math.max(1, Math.min(width, 10));
      case 'size':
        // 提取第一个参数作为尺寸值
        const sizeParams = this.splitParams(valueStr);
        if (sizeParams.length >= 1) {
          const size = parseInt(sizeParams[0]) || 5;
          return Math.max(1, Math.min(size, 20));
        }
        const size = parseInt(valueStr) || 5;
        return Math.max(1, Math.min(size, 20));
      case 'style':
        // 提取第一个参数作为样式值
        const styleParams = this.splitParams(valueStr);
        if (styleParams.length >= 1) {
          const styleStyle = styleParams[0].replace(/['"]/g, '').toLowerCase();
          return ['solid', 'dashed', 'dotted'].includes(styleStyle) ? styleStyle : 'solid';
        }
        const styleStyle = valueStr.replace(/['"]/g, '').toLowerCase();
        return ['solid', 'dashed', 'dotted'].includes(styleStyle) ? styleStyle : 'solid';
      case 'full':
        // 提取第一个参数作为填充值
        const fullParams = this.splitParams(valueStr);
        if (fullParams.length >= 1) {
          const fullStyle = fullParams[0].replace(/['"]/g, '').toLowerCase();
          return ['fill', 'stroke'].includes(fullStyle) ? fullStyle : 'fill';
        }
        const fullStyle = valueStr.replace(/['"]/g, '').toLowerCase();
        return ['fill', 'stroke'].includes(fullStyle) ? fullStyle : 'fill';

      case 'sarea':
      case 'srect':
      case 'scircle':
        // 智能解析屏幕相对区域样式参数
        const screenParams = this.splitParams(valueStr);
        if (screenParams.length >= 1) {
          const result: any = {
            color: null,  // 默认透明
            border: null,  // 边框颜色（可选）
            size: 1,      // 边框宽度（默认1）
            style: 'solid' // 边框样式（默认实线）
          };

          const errors: string[] = [];

          for (const param of screenParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色（第一个颜色参数作为填充颜色）
            if (this.isColor(originalParam) && !result.colorSet) {
              result.color = originalParam;
              result.colorSet = true; // 标记已设置填充颜色
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam) && !result.sizeSet) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 50, '大小');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
                result.sizeSet = true;
              }
            }
            // 识别边框颜色
            else if (param.startsWith('border=')) {
              const borderValue = param.substring(7).replace(/['"]/g, '');
              if (this.isColor(borderValue)) {
                result.border = borderValue;
              } else {
                errors.push(`无效的边框颜色: ${borderValue}`);
              }
            }
            // 识别边框颜色（borcolor作为兼容别名）
            else if (param.startsWith('borcolor=')) {
              const borcolorValue = param.substring(9).replace(/['"]/g, '');
              if (this.isColor(borcolorValue)) {
                result.border = borcolorValue;
              } else {
                errors.push(`无效的边框颜色: ${borcolorValue}`);
              }
            }
            // 识别边框颜色（horcolor作为borcolor的别名）
            else if (param.startsWith('horcolor=')) {
              const borcolorValue = param.substring(9).replace(/['"]/g, '');
              if (this.isColor(borcolorValue)) {
                result.border = borcolorValue;
              } else {
                errors.push(`无效的边框颜色: ${borcolorValue}`);
              }
            }
            // 识别边框样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 ${type} 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`${type} 样式解析错误:\n${errors.join('\n')}`);
          }

          // 清理临时标记字段
          delete result.colorSet;
          delete result.sizeSet;

          return result;
        }
        return { color: null, border: null, size: 1, style: 'solid', show: true };

      case 'sshape':
        // 智能解析屏幕相对图形参数
        const sshapeParams = this.splitParams(valueStr);
        if (sshapeParams.length >= 1) {
          const result: any = {
            icon: 'circle', // 默认圆形
            color: '',      // 无默认颜色
            size: 5,        // 默认大小5
            full: 'fill'    // 默认填充
          };

          const errors: string[] = [];

          for (const param of sshapeParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别图形类型
            if (['circle', 'square', 'triangle', 'diamond', 'star', 'cross', 'x', 'check', 'flag', 'heart', 
                 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
                 'triangleup', 'triangledown', 'triangleleft', 'triangleright',
                 'drawarrowup', 'drawarrowdown', 'drawarrowleft', 'drawarrowright'].includes(cleanParam)) {
              // 将小写转换回原始大小写格式
              const shapeMap: { [key: string]: string } = {
                'arrowup': 'arrowUp',
                'arrowdown': 'arrowDown',
                'arrowleft': 'arrowLeft',
                'arrowright': 'arrowRight',
                'triangleup': 'triangleUp',
                'triangledown': 'triangleDown',
                'triangleleft': 'triangleLeft',
                'triangleright': 'triangleRight',
                'drawarrowup': 'drawArrowUp',
                'drawarrowdown': 'drawArrowDown',
                'drawarrowleft': 'drawArrowLeft',
                'drawarrowright': 'drawArrowRight'
              };
              result.icon = shapeMap[cleanParam] || cleanParam;
            }
            // 识别颜色 - 使用原始参数进行颜色判断
            else if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 20, '图形大小');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别填充样式
            else if (['fill', 'stroke'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 sshape 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`sshape 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { icon: 'circle', color: '', size: 5, full: 'fill', show: true };

      case 'shape':
        // 智能解析 shape 参数，支持位置参数和命名参数
        const shapeParams = this.splitParams(valueStr);
        if (shapeParams.length >= 1) {
          const result: any = {
            icon: 'circle', // 默认圆形
            color: '',      // 无默认颜色
            size: 5,        // 默认大小5
            full: 'fill',   // 默认填充
            position: 'value', // 默认使用值
            show: true // 默认显示
          };

          const errors: string[] = [];

          for (let i = 0; i < shapeParams.length; i++) {
            const param = shapeParams[i];
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别图形类型
            if (['circle', 'square', 'triangle', 'diamond', 'star', 'cross', 'x', 'check', 'flag', 'heart', 
                 'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
                 'triangleup', 'triangledown', 'triangleleft', 'triangleright',
                 'drawarrowup', 'drawarrowdown', 'drawarrowleft', 'drawarrowright'].includes(cleanParam)) {
              // 将小写转换回原始大小写格式
              const shapeMap: { [key: string]: string } = {
                'arrowup': 'arrowUp',
                'arrowdown': 'arrowDown',
                'arrowleft': 'arrowLeft',
                'arrowright': 'arrowRight',
                'triangleup': 'triangleUp',
                'triangledown': 'triangleDown',
                'triangleleft': 'triangleLeft',
                'triangleright': 'triangleRight',
                'drawarrowup': 'drawArrowUp',
                'drawarrowdown': 'drawArrowDown',
                'drawarrowleft': 'drawArrowLeft',
                'drawarrowright': 'drawArrowRight'
              };
              result.icon = shapeMap[cleanParam] || cleanParam;
            }
            // 识别颜色 - 使用原始参数进行颜色判断
            else if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 20, '图形大小');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别样式
            else if (['fill', 'stroke', 'stroke_fill'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别位置类型
            else if (['value', 'high', 'low', 'open', 'close', 'top', 'bottom', 'center', 'highup', 'lowdown'].includes(cleanParam)) {
              // 将小写转换回原始大小写格式
              const positionMap: { [key: string]: string } = {
                'highup': 'highUp',
                'lowdown': 'lowDown'
              };
              result.position = positionMap[cleanParam] || cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, options等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('options=') || 
                     param.startsWith('min=') || param.startsWith('max=') || param.startsWith('border=')) {
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 shape 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`shape 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { icon: 'circle', color: '', size: 5, full: 'fill', position: 'value', show: true };

      case 'icon':
        // 基础图形类型选择
        // 提取第一个参数作为图标值
        const iconParams = this.splitParams(valueStr);
        let iconType;
        if (iconParams.length >= 1) {
          iconType = iconParams[0].replace(/['"]/g, '').toLowerCase();
        } else {
          iconType = valueStr.replace(/['"]/g, '').toLowerCase();
        }
        
        const supportedIcons = [
          'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
          'triangleup', 'triangledown', 'triangleleft', 'triangleright',
          'square', 'diamond', 'star', 'cross', 'circle',
          'x', 'check', 'flag', 'heart'
        ];
        if (supportedIcons.includes(iconType)) {
          // 将小写转换回原始大小写格式
          const iconMap: { [key: string]: string } = {
            'arrowup': 'arrowUp',
            'arrowdown': 'arrowDown',
            'arrowleft': 'arrowLeft',
            'arrowright': 'arrowRight',
            'triangleup': 'triangleUp',
            'triangledown': 'triangleDown',
            'triangleleft': 'triangleLeft',
            'triangleright': 'triangleRight'
          };
          return iconMap[iconType] || iconType;
        }
        return 'circle';

      // 组合样式类型
      case 'line':
        // 智能解析 line 参数
        const lineParams = this.splitParams(valueStr);
        if (lineParams.length >= 1) {
          const result: any = {
            color: '',     // 无默认颜色
            size: 1,       // 默认线宽1
            style: 'solid' // 默认实线
          };

          const errors: string[] = [];

          for (const param of lineParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色 - 使用原始参数进行颜色判断
            if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 10, '线宽');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别线型样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (cleanParam === 'true' || cleanParam === 'false') {
              result.show = cleanParam === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 line 参数: ${param}`);
            }
          }
          if (errors.length > 0) {
            throw new Error(`line 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 1, style: 'solid', show: true };



      case 'area':
        // 解析区域参数，支持位置参数和命名参数
        const areaParams = this.splitParams(valueStr);
        let color = '';
        let show = true; // 默认显示
        
        for (let i = 0; i < areaParams.length; i++) {
          const param = areaParams[i];
          const originalParam = param.replace(/['"]/g, '');
          
          if (originalParam === '') {
            // 空字符串表示无颜色
            color = '';
          } else           if (this.isColor(this.parseStringValue(originalParam))) {
            color = this.parseStringValue(originalParam);
          } else if (param.startsWith('show=')) {
            // 命名参数：show=false
            const showValue = param.substring(5).replace(/['"]/g, '').toLowerCase();
            show = showValue === 'true';
          } else if (param === 'true' || param === 'false') {
            // 位置参数：第二个参数是布尔值
            show = param === 'true';
          } else if (param.startsWith('title=') || param.startsWith('tip=')) {
            // 跳过其他命名参数
            continue;
          }
        }
        
        return { color: color, show: show };

      case 'circle':
        // 智能解析 circle 参数
        const circleParams = this.splitParams(valueStr);
        if (circleParams.length >= 1) {
          const result: any = {
            color: '',
            size: 5,
            style: 'solid',
            full: 'fill'
          };

          const errors: string[] = [];

          for (const param of circleParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色 - 使用原始参数进行颜色判断
            if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 20, '圆形尺寸');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别边框样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别填充样式
            else if (['fill', 'stroke'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 circle 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`circle 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 5, style: 'solid', full: 'fill', show: true };

      case 'bar':
        // 智能解析 bar 参数，支持位置参数和命名参数
        const barParams = this.splitParams(valueStr);
        if (barParams.length >= 1) {
          const result: any = {
            color: '',
            size: 1,
            style: 'solid',
            full: 'fill',
            show: true // 默认显示
          };

          const errors: string[] = [];

          for (const param of barParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色 - 使用原始参数进行颜色判断
            if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 10, '柱状图宽度');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别边框样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别填充样式
            else if (['fill', 'stroke'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 bar 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`bar 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 1, style: 'solid', full: 'fill', show: true };





      case 'candle':
        // 智能解析 candle 参数
        const candleParams = this.splitParams(valueStr);
        if (candleParams.length >= 1) {
          const result: any = {
            color: '',
            size: 1,
            style: 'solid',
            full: 'fill'
          };

          const errors: string[] = [];

          for (const param of candleParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色 - 使用原始参数进行颜色判断
            if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 10, '蜡烛图宽度');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别边框样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别填充样式
            else if (['fill', 'stroke'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 candle 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`candle 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 1, style: 'solid', full: 'fill', show: true };

      case 'label':
        // 智能解析 label 参数
        const labelParams = this.splitParams(valueStr);
        if (labelParams.length >= 1) {
          const result: any = {
            color: '',
            size: 12,
            align: 'left',
            bold: false,
            italic: false,
            position: 'value'
          };

          const errors: string[] = [];

          for (const param of labelParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别命名文本 text=...
            if (param.startsWith('text=')) {
              result.text = this.parseStringValue(param.substring(5));
            }
            // 识别颜色 - 使用原始参数进行颜色判断
            else if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 8, 32, '文字大小');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别水平对齐
            else if (['left', 'center', 'right'].includes(cleanParam)) {
              result.align = cleanParam;
            }
            // 识别位置类型
            else if (['value', 'high', 'low', 'open', 'close', 'top', 'bottom', 'center', 'highup', 'lowdown'].includes(cleanParam)) {
              // 将小写转换回原始大小写格式
              const positionMap: { [key: string]: string } = {
                'highup': 'highUp',
                'lowdown': 'lowDown'
              };
              result.position = positionMap[cleanParam] || cleanParam;
            }
            // 识别字体 - 直接忽略，使用默认值
            else if (['arial', 'helvetica', 'sans-serif', 'times', 'serif', 'monospace'].includes(cleanParam)) {
              // 忽略字体设置，使用默认值
            }
            // 识别粗体
            else if (cleanParam === 'bold') {
              result.bold = true;
            }
            // 识别斜体
            else if (cleanParam === 'italic') {
              result.italic = true;
            }
            // 识别布尔值（show参数）
            else if (cleanParam === 'true' || cleanParam === 'false') {
              result.show = cleanParam === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 label 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`label 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 12, align: 'left', bold: false, italic: false, position: 'value', show: true };

      case 'slabel':
        // 智能解析 slabel 参数（不含 position）
        const slabelParams = this.splitParams(valueStr);
        if (slabelParams.length >= 1) {
          const result: any = {
            color: '',
            size: 12,
            align: 'left',
            bold: false,
            italic: false,
          };

          const errors: string[] = [];

          for (const param of slabelParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, '');

            // 识别命名文本 text=...
            if (param.startsWith('text=')) {
              result.text = this.parseStringValue(param.substring(5));
            } else if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            } else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 8, 32, '文字大小');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            } else if (['left', 'center', 'right'].includes(cleanParam)) {
              result.align = cleanParam;
            } else if (cleanParam === 'bold') {
              result.bold = true;
            } else if (cleanParam === 'italic') {
              result.italic = true;
            } else if (cleanParam === 'true' || cleanParam === 'false') {
              result.show = cleanParam === 'true';
            } else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                       param.startsWith('min=') || param.startsWith('max=')) {
              continue;
            } else {
              errors.push(`无效的 slabel 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`slabel 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 12, align: 'left', bold: false, italic: false, show: true };

      case 'labelbg':
        // 智能解析 labelbg 参数
        const labelbgParams = this.splitParams(valueStr);
        if (labelbgParams.length >= 1) {
          const result: any = {
            color: '',
            full: 'fill',
            size: 1,
            style: 'solid',
            padding: 4,
            radius: 0
          };

          const errors: string[] = [];

          for (const param of labelbgParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色 - 使用原始参数进行颜色判断
            if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 10, '边框宽度');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别填充样式
            else if (['fill', 'stroke'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别边框样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别内边距
            else if (cleanParam.startsWith('padding=')) {
              const paddingValue = cleanParam.split('=')[1];
              if (this.isNumber(paddingValue)) {
                const padding = parseInt(paddingValue);
                const validation = this.validateNumberRange(padding, 0, 20, '内边距');
                if (!validation.valid) {
                  errors.push(validation.error!);
                } else {
                  result.padding = padding;
                }
              }
            }
            // 识别圆角
            else if (cleanParam.startsWith('radius=')) {
              const radiusValue = cleanParam.split('=')[1];
              if (this.isNumber(radiusValue)) {
                const radius = parseInt(radiusValue);
                const validation = this.validateNumberRange(radius, 0, 20, '圆角');
                if (!validation.valid) {
                  errors.push(validation.error!);
                } else {
                  result.radius = radius;
                }
              }
            }
            // 识别布尔值（show参数）
            else if (cleanParam === 'true' || cleanParam === 'false') {
              result.show = cleanParam === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 labelbg 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`labelbg 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', full: 'fill', size: 1, style: 'solid', padding: 4, radius: 0, show: true };

      case 'rect':
        // 智能解析矩形样式参数
        const rectParams = this.splitParams(valueStr);
        if (rectParams.length >= 1) {
          const result: any = {
            color: '',
            size: 1,
            style: 'solid',
            full: 'fill'
          };

          const errors: string[] = [];

          for (const param of rectParams) {
            const cleanParam = param.replace(/['"]/g, '').toLowerCase();
            const originalParam = param.replace(/['"]/g, ''); // 保留原始大小写

            // 识别颜色 - 使用原始参数进行颜色判断
            if (originalParam === '') {
              // 空字符串表示无颜色
              result.color = '';
            } else if (this.isColor(this.parseStringValue(originalParam))) {
              result.color = this.parseStringValue(originalParam);
            }
            // 识别数字（size）
            else if (this.isNumber(cleanParam)) {
              const size = parseInt(cleanParam);
              const validation = this.validateNumberRange(size, 1, 10, '边框宽度');
              if (!validation.valid) {
                errors.push(validation.error!);
              } else {
                result.size = size;
              }
            }
            // 识别边框样式
            else if (['solid', 'dashed', 'dotted'].includes(cleanParam)) {
              result.style = cleanParam;
            }
            // 识别填充样式
            else if (['fill', 'stroke'].includes(cleanParam)) {
              result.full = cleanParam;
            }
            // 识别布尔值（show参数）
            else if (param === 'true' || param === 'false') {
              result.show = param === 'true';
            }
            // 跳过额外参数（title, tip, show等）
            else if (param.startsWith('title=') || param.startsWith('tip=') || param.startsWith('show=') || 
                     param.startsWith('min=') || param.startsWith('max=')) {
              // 这些参数在 parseDocumentStyleParams 中处理，这里跳过
              continue;
            }
            // 无效参数
            else {
              errors.push(`无效的 rect 参数: ${param}`);
            }
          }

          if (errors.length > 0) {
            throw new Error(`rect 样式解析错误:\n${errors.join('\n')}`);
          }

          return result;
        }
        return { color: '', size: 1, style: 'solid', full: 'fill', show: true };

      default:
        return valueStr.replace(/['"]/g, '');
    }
  }



  /**
   * 生成可执行代码
   */
  private static generateExecutableCode(scriptCode: string, parsed: any, httpCalls: ScriptHttpCall[]): string {
    let executableCode = scriptCode;

    // 移除注释行
    executableCode = executableCode.replace(/\/\/[^\n\r]*/g, '');

    // 移除 setMin 和 setMax 调用
    executableCode = executableCode.replace(/setMin\s*\(\s*[^)]+\s*\)/g, '');
    executableCode = executableCode.replace(/setMax\s*\(\s*[^)]+\s*\)/g, '');

    // 移除 setPrecision 调用
    executableCode = executableCode.replace(/setPrecision\s*\(\s*[^)]+\s*\)/g, '');

    // 移除 HTTP 方法调用行，因为变量已经在模板中声明了
    // 例如: res = H.loadHistory(), const res = http.get() 等 -> 完全移除这一行
    httpCalls.forEach(httpCall => {
      const regex = new RegExp(`(?:const|var|let)?\\s*(\\w+)?\\s*=\\s*(H|http)\\.${httpCall.type}\\s*\\(\\s*[^)]*\\s*\\)[^\\n]*`, 'g');
      executableCode = executableCode.replace(regex, '');
    });

    // 移除 I.xxx、S.xxx、input.xxx、style.xxx 的调用
    // 使用更可靠的方法：先移除所有包含这些调用的整行
    const lines = executableCode.split('\n');
    const cleanedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 跳过空行
      if (!trimmedLine) {
        cleanedLines.push(line);
        continue;
      }
      
      // 检查是否包含 I.xxx 或 S.xxx 调用（包括赋值形式）
      if (trimmedLine.match(/(\w+)\s*=\s*(I|S|input|style)\.\w+\(/)) {
        // 跳过这一行
        continue;
      }
      
      // 检查是否包含独立的 I.xxx 或 S.xxx 调用
      if (trimmedLine.match(/(I|S|input|style)\.\w+\(/)) {
        // 跳过这一行
        continue;
      }
      
      cleanedLines.push(line);
    }
    
    executableCode = cleanedLines.join('\n');

    // 替换 options=SOURCE 为数组字面量，确保脚本执行时 select 收到数组
    executableCode = executableCode.replace(/options\s*=\s*SOURCE/g, "options=['open','high','low','close','volume','hl2','hlc3','ohlc4']");

    // 处理常量引用 - 保持正确的函数调用语法
    // SOURCE等常量会在执行环境中提供，这里不需要替换，保持原样即可

    // 直接返回处理后的代码，不包装成函数（ScriptExecutor会处理）
    return executableCode.trim();
  }

  /**
   * 分割参数字符串，考虑嵌套情况
   */
  private static splitParams(params: string): string[] {
    // 第一步：标准化引号字符，将非标准引号转换为标准引号
    let normalizedParams = params
      .replace(/['′‵]/g, "'")  // 将各种单引号统一为标准单引号
      .replace(/["″‶]/g, '"')  // 将各种双引号统一为标准双引号
    
    // 第二步：使用智能括号匹配算法处理嵌套括号
    const brackets: string[] = [];
    let bracketIndex = 0;
    let i = 0;
    
    while (i < normalizedParams.length) {
      const char = normalizedParams[i];
      
      if (char === '(' || char === '[') {
        const startChar = char;
        const endChar = char === '(' ? ')' : ']';
        let depth = 1;
        let startPos = i;
        i++;
        
        while (i < normalizedParams.length && depth > 0) {
          if (normalizedParams[i] === startChar) {
            depth++;
          } else if (normalizedParams[i] === endChar) {
            depth--;
          }
          i++;
        }
        
        if (depth === 0) {
          const fullBracket = normalizedParams.substring(startPos, i);
          const placeholder = `__BRACKET${bracketIndex}__`;
          brackets[bracketIndex] = fullBracket;
          normalizedParams = normalizedParams.substring(0, startPos) + placeholder + normalizedParams.substring(i);
          i = startPos + placeholder.length;
          bracketIndex++;
        }
      } else {
        i++;
      }
    }
    
    // 第三步：提取所有字符串，用占位符替换
    const strings: string[] = [];
    let processedParams = normalizedParams;
    let stringIndex = 0;
    
    // 匹配单引号或双引号字符串
    const stringRegex = /(['"])((?:(?!\1).)*)\1/g;
    let match;
    
    while ((match = stringRegex.exec(normalizedParams)) !== null) {
      const fullString = match[0]; // 完整的字符串，包括引号
      const placeholder = `__STR${stringIndex}__`;
      strings[stringIndex] = fullString;
      processedParams = processedParams.replace(fullString, placeholder);
      stringIndex++;
    }
    
    // 第四步：用逗号分割处理后的参数
    const parts = processedParams.split(',').map(part => part.trim());
    
    // 第五步：还原字符串和括号
    const result = parts.map(part => {
      let restoredPart = part;
      
      // 先还原字符串
      for (let i = 0; i < strings.length; i++) {
        const placeholder = `__STR${i}__`;
        if (restoredPart.includes(placeholder)) {
          restoredPart = restoredPart.replace(placeholder, strings[i]);
        }
      }
      
      // 再还原括号
      for (let i = 0; i < brackets.length; i++) {
        const placeholder = `__BRACKET${i}__`;
        if (restoredPart.includes(placeholder)) {
          restoredPart = restoredPart.replace(placeholder, brackets[i]);
        }
      }
      
      return restoredPart.trim();
    }).filter(part => part !== '');
    
    return result;
  }

  /**
   * 解析值
   */
  private static parseValue(value: string, type: string): any {
    value = value.trim();

    switch (type) {
      case 'int':
        return parseInt(value);
      case 'float':
        return parseFloat(value);
      case 'bool':
        return value === 'true';
      case 'string':
      case 'select':
        return this.parseStringValue(value);
      case 'color':
      case 'style':
        return this.parseStringValue(value);
      case 'width':
        return parseInt(value);
      default:
        return value;
    }
  }

  /**
   * 解析参数值（去除引号，支持字符串和数字）
   */
  private static parseParamValue(value: string): string {
    value = value.trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  }

  /**
   * 解析字符串值（去除引号）
   */
  private static parseStringValue(value: string): string {
    value = value.trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    return value;
  }

  /**
   * 解析数组值
   */
  private static parseArrayValue(value: string): string[] {
    value = value.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const content = value.slice(1, -1);
      return content.split(',').map(item => this.parseStringValue(item.trim()));
    }
    return [];
  }

  /**
   * 判断是否为颜色值
   */
  private static isColor(value: string): boolean {
    // CSS 颜色关键字
    const cssColorKeywords = [
      'transparent', 'currentcolor', 'inherit', 'initial', 'unset',
      'black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia',
      'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua',
      'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige',
      'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
      'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
      'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
      'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
      'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
      'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
      'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
      'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
      'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
      'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
      'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki',
      'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
      'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
      'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
      'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
      'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
      'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
      'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
      'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
      'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive',
      'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
      'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip',
      'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'red',
      'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
      'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
      'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan',
      'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
      'whitesmoke', 'yellow', 'yellowgreen'
    ];
    
    const normalizedValue = value.toLowerCase();
    
    // 检查 CSS 颜色关键字
    if (cssColorKeywords.includes(normalizedValue)) {
      return true;
    }
    
    // 检查 CSS 颜色格式
    return /^#[0-9a-f]{3,6}$/i.test(value) ||
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value) ||
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(value) ||
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(value) ||
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/i.test(value) ||
      /^hwb\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/i.test(value) ||
      /^hwba\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/i.test(value) ||
      /^lab\(\s*[\d.]+\s*,\s*[\d.-]+\s*,\s*[\d.-]+\s*\)$/i.test(value) ||
      /^lch\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)$/i.test(value) ||
      /^oklab\(\s*[\d.]+\s*,\s*[\d.-]+\s*,\s*[\d.-]+\s*\)$/i.test(value) ||
      /^oklch\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)$/i.test(value);
  }

  /**
   * 判断是否为数字
   */
  private static isNumber(value: string): boolean {
    return !isNaN(Number(value)) && value.trim() !== '';
  }

  /**
   * 验证图形类型是否支持
   */
  private static validateShape(shape: string): { valid: boolean; error?: string } {
    const supportedShapes = [
      'arrowUp', 'arrowDown', 'arrowLeft', 'arrowRight',
      'triangleUp', 'triangleDown', 'triangleLeft', 'triangleRight',
      'square', 'diamond', 'star', 'cross', 'circle',
      'x', 'check', 'flag', 'heart'
    ];
    if (!supportedShapes.includes(shape)) {
      return {
        valid: false,
        error: `不支持的图形类型: ${shape}。支持的图形类型: ${supportedShapes.join(', ')}`
      };
    }
    return { valid: true };
  }

  /**
   * 验证颜色格式
   */
  private static validateColor(color: string): { valid: boolean; error?: string } {
    if (!this.isColor(color)) {
      return {
        valid: false,
        error: `无效的颜色格式: ${color}。支持格式: #RGB, #RRGGBB, rgb(r,g,b), rgba(r,g,b,a)`
      };
    }
    return { valid: true };
  }

  /**
   * 验证数字范围
   */
  private static validateNumberRange(value: number, min: number, max: number, fieldName: string): { valid: boolean; error?: string } {
    if (value < min || value > max) {
      return {
        valid: false,
        error: `${fieldName} 值 ${value} 超出范围 [${min}, ${max}]`
      };
    }
    return { valid: true };
  }

  /**
   * 查找匹配的闭合括号
   */
  private static findClosingParenthesis(code: string, startIndex: number): number {
    let depth = 1; // 初始化为1，因为我们已经在一个括号内
    let inString = false;
    let stringChar = '';
    
    for (let i = startIndex; i < code.length; i++) {
      const char = code[i];
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
      } else if (!inString && char === '(') {
        depth++;
      } else if (!inString && char === ')') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
    throw new Error(`未找到匹配的闭合括号，从索引 ${startIndex} 开始`);
  }

  /**
   * 应用预设值到inputs或styles
   */
  private static applyPresetValues(items: ScriptInput[] | ScriptStyle[], presetValues: Array<{key: string, value: any}>): void {
    // 创建预设值的映射表，方便查找
    const presetMap = new Map<string, any>();
    presetValues.forEach(item => {
      presetMap.set(item.key, item.value);
    });

    // 遍历items，如果找到匹配的预设值，则设置value
    items.forEach(item => {
      if (presetMap.has(item.key)) {
        item.value = presetMap.get(item.key);
      } else {
        // 如果没有预设值，则使用defaultValue作为初始value
        item.value = item.defaultValue;
      }
    });
  }
} 