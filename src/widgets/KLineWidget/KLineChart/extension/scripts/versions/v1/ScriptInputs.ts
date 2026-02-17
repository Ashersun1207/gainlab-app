/**
 * 脚本输入参数类
 * 提供参数定义功能
 */
export class ScriptInputs {
  constructor(private inputs?: any) {}

  /**
   * 整数参数
   */
  int(defaultValue: number, options: any = {}): any {
    const paramName = options.name || options.title || options.label || 'param';
    return this.inputs && this.inputs[paramName] !== undefined ? this.inputs[paramName] : defaultValue;
  }

/**
   * 浮点数参数
   */
  float(defaultValue: number, options: any = {}): any {
    const paramName = options.name || options.title || options.label || 'param';
    return this.inputs && this.inputs[paramName] !== undefined ? this.inputs[paramName] : defaultValue;
  }

  /**
   * 布尔参数
   */
  bool(defaultValue: boolean, options: any = {}): any {
    const paramName = options.name || options.title || options.label || 'param';
    return this.inputs && this.inputs[paramName] !== undefined ? this.inputs[paramName] : defaultValue;
  }

  /**
   * 字符串参数
   */
  str(defaultValue: string, options: any = {}): any {
    const paramName = options.name || options.title || options.label || 'param';
    return this.inputs && this.inputs[paramName] !== undefined ? this.inputs[paramName] : defaultValue;
  }

  /**
   * 字符串参数（别名）
   */
  string(defaultValue: string, options: any = {}): any {
    return this.str(defaultValue, options);
  }

  /**
   * 选择参数
   */
  select(defaultValue: any, options: any): any {
    const paramName = options.name || options.title || options.label || 'param';
    return this.inputs && this.inputs[paramName] !== undefined ? this.inputs[paramName] : defaultValue;
  }

  /**
   * 通用参数方法
 */
  param(defaultValue: any, options: any = {}): any {
    const paramName = options.name || options.title || options.label || 'param';
    return this.inputs && this.inputs[paramName] !== undefined ? this.inputs[paramName] : defaultValue;
  }
} 