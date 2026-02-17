/**
 * 脚本样式类
 * 提供样式设置功能
 */
export class ScriptStyles {
  constructor(private styles?: any) {}

  /**
   * 颜色样式
   */
  color(defaultValue: string, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }

  /**
   * 线宽样式
   */
  lineWidth(defaultValue: number, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }

  /**
   * 线型样式
   */
  lineStyle(defaultValue: string, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }

  /**
   * 形状样式
   */
  shape(defaultValue: string, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }

  /**
   * 尺寸样式
   */
  size(defaultValue: number, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }

  /**
   * 完整样式对象
   */
  full(defaultValue: any, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }

  /**
   * 线条样式（组合）
   */
  line(defaultValue: any, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    
    // 如果 options 是字符串，可能是样式值，转换为对象格式
    if (typeof options === 'string') {
      // 根据字符串内容创建样式对象
      const styleObj = {
        color: defaultValue,
        lineStyle: options,
        lineWidth: 1
      };
      return styleObj;
    }

    // 如果 options 是对象，直接使用
    if (typeof options === 'object' && options !== null) {
      return {
        color: defaultValue,
        lineStyle: options.lineStyle || 'solid',
        lineWidth: options.lineWidth || 1
      };
    }

    // 默认情况
    return {
      color: defaultValue,
      lineStyle: 'solid',
      lineWidth: 1
    };
  }

  /**
   * 通用样式方法
   */
  style(defaultValue: any, options: any = {}): any {
    const styleName = options.name || options.title || options.label || 'style';
    if (this.styles && this.styles[styleName] !== undefined) {
      return this.styles[styleName];
    }
    return defaultValue;
  }
} 