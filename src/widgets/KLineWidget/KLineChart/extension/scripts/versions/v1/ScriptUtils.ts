/**
 * 脚本工具类
 * 提供各种辅助函数
 */
export class ScriptUtils {
  /**
   * 格式化数字
   */
  static formatNumber(value: number, precision: number = 2, useThousandSeparator: boolean = false): string {
    if (isNaN(value)) return '0'

    const fixed = value.toFixed(precision)

    if (!useThousandSeparator) return fixed

    const parts = fixed.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return parts.join('.')
  }

  /**
   * 格式化百分比
   */
  static formatPercent(value: number, precision: number = 2): string {
    return `${(value * 100).toFixed(precision)}%`;
  }

  /**
   * 格式化价格
   */
  static formatPrice(value: number, precision: number = 2): string {
    return value.toFixed(precision);
  }
  /**
   * 格式化浮点数
   */
  static toFloat(value: number, precision: number = 2): number {
    return parseFloat(value.toFixed(precision));
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
   * 计算数组平均值
   */
  static average(array: number[]): number {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  /**
   * 计算数组总和
   */
  static sum(array: number[]): number {
    return array.reduce((sum, val) => sum + val, 0);
  }

  /**
   * 数组去重
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * 数组排序
   */
  static sort(array: number[], ascending: boolean = true): number[] {
    return ascending ? [...array].sort((a, b) => a - b) : [...array].sort((a, b) => b - a);
  }

  /**
   * 获取数组指定位置的元素
   */
  static getValue(array: any[], index: number, defaultValue: any = null): any {
    return array[index] !== undefined ? array[index] : defaultValue;
  }

  /**
   * 检查值是否为有效数字
   */
  static isValidNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * 检查值是否为空
   */
  static isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * 检查值是否为有效值
   * 用于判断数据是否可用于计算
   */
  static isValid(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'number' && isNaN(value)) {
      return false;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return false;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return false;
    }
    return true;
  }

  /**
   * 生成随机数
   */
  static random(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生成随机整数
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 限制数值范围
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 线性插值
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * 将角度转换为弧度
   */
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 将弧度转换为角度
   */
  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * 计算两点之间的距离
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * 日期格式化
   */
  static formatDate(timestamp: number, format: string = 'YYYY-MM-DD'): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 获取当前时间戳
   */
  static now(): number {
    return Date.now();
  }

  /**
   * 深拷贝对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as any;
    }
    if (typeof obj === 'object') {
      const cloned = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }

  /**
   * 合并对象
   */
  static merge(target: any, source: any): any {
    const result = { ...target };
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.merge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  /**
   * 颜色字符串转RGB对象
   * 支持多种颜色格式：hex、rgb、rgba、hsl、hsla、颜色关键字等
   */
  static colorToRgb(color: string): { r: number, g: number, b: number } | null {
    if (!color || typeof color !== 'string') {
      return null;
    }

    // 首先尝试直接解析hex颜色
    const hexMatch = color.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      const r = hex.length === 3 ?
        parseInt(hex[0] + hex[0], 16) :
        parseInt(hex.substring(0, 2), 16);
      const g = hex.length === 3 ?
        parseInt(hex[1] + hex[1], 16) :
        parseInt(hex.substring(2, 4), 16);
      const b = hex.length === 3 ?
        parseInt(hex[2] + hex[2], 16) :
        parseInt(hex.substring(4, 6), 16);
      return { r, g, b };
    }

    // 解析rgb/rgba格式
    const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    // 创建临时canvas来解析其他颜色格式
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      // 设置颜色
      ctx.fillStyle = color;

      // 获取计算后的颜色值
      const computedColor = ctx.fillStyle;

      // 再次尝试解析RGB值
      const computedRgbMatch = computedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
      if (computedRgbMatch) {
        return {
          r: parseInt(computedRgbMatch[1]),
          g: parseInt(computedRgbMatch[2]),
          b: parseInt(computedRgbMatch[3])
        };
      }
    } catch (error) {
      console.warn('Failed to parse color:', color, error);
    }

    // 如果无法解析，返回null
    return null;
  }
  /**
   * 颜色字符串转RGBA字符串
   * 传入颜色值和透明度，返回rgba(r,g,b,a)格式字符串
   */
  static colorToRgba(color: string, alpha: number = 1): string | null {
    if (!color || typeof color !== 'string') {
      return 'rgba(0,0,0,0)';
    }

    // 限制透明度范围在0~1之间
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    // 调用colorToRgb获取RGB值
    const rgb = this.colorToRgb(color);
    if (!rgb) {
      return null;
    }

    // 返回rgba格式字符串
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${clampedAlpha})`;
  }

} 