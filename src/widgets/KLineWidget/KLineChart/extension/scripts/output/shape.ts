import { Shape } from '../../figure/polygon'
import { ScriptUtils } from '../versions/v1/ScriptUtils'

export interface ShapeStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  size?: number
  icon?: string
  type?: string
  position?: string | number
  x?: number
  y?: number
  full?: 'fill' | 'stroke'
  style?: 'fill' | 'stroke'
  borderColor?: string
  show?: boolean
}

export interface ShapeCallbackContext {
  value: any
  index: number
  prev?: any
}

export function outputShape(
  scriptContext: any, 
  dataArray: any, 
  styles: ShapeStyle | ((context: ShapeCallbackContext) => ShapeStyle)
) {
  const { ctx, bounding, yAxis, xAxis, script } = scriptContext;
  if (!ctx || !dataArray || !styles) {
    return;
  }

  // 获取样式
  const getStyles = (context: ShapeCallbackContext): ShapeStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  // 获取可见范围
  const visibleRange = getVisibleRange(xAxis);
  if (!visibleRange) {
    return;
  }
  // 绘制每个图形
  for (let i = visibleRange.from; i < visibleRange.to && i < dataArray.length; i++) {
    const value = dataArray[i];
    
    // 跳过无效数据
    if (!ScriptUtils.isValid(value)) {
      continue;
    }

    // 检查对象类型
    if (typeof value === 'object' && value !== null) {
      // 检查是否是信号对象（throughUp/throughDown返回的对象）
      if (value.val1 !== undefined || value.val2 !== undefined) {
        // 这是信号对象，需要特殊处理
        if (value.val1 === undefined && value.val2 === undefined) {
          // 对象但没有有效值，跳过
          continue;
        }
      } else {
        // 普通对象，检查是否有属性
        const keys = Object.keys(value);
        if (keys.length === 0) {
          // 空对象，跳过
          continue;
        }
        // 有属性的对象，继续处理
      }
    } else if (typeof value === 'number' && !ScriptUtils.isValid(value)) {
      // 只有数值类型才检查NaN
      continue;
    }
    
    // 创建回调上下文
    const callbackContext: ShapeCallbackContext = {
      value: value,
      index: i,
      prev: i > 0 ? dataArray[i - 1] : undefined
    }
    
    // 处理styles回调
    let finalStyles = getStyles(callbackContext);

    // 检查show属性（包括回调后的show）
    if (finalStyles?.show === false) {
      continue;
    }

    // 计算坐标
    const position = calculatePosition(value, i, finalStyles, scriptContext);
    
    // 确定图形类型
    const shapeType = finalStyles.icon || finalStyles.type || 'circle';
    const shapeFunction = Shape[shapeType];
    
    if (shapeFunction) {
      // 调用对应的图形绘制函数，传递full属性
      const curStyles: any = { ...finalStyles };
      // 如果没有style属性，才使用full作为默认值
      if (!curStyles.style) {
        curStyles.style = finalStyles.full || 'fill';
      }
      
      // 处理颜色数组渐变
      if (Array.isArray(curStyles.color)) {
        const colors = curStyles.color;
        if (colors.length >= 2) {
          // 创建径向渐变（从中心向外）
          const gradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, curStyles.size || 10);
          colors.forEach((c, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, c);
          });
          curStyles.color = gradient;
        } else {
          curStyles.color = colors[0] || '#000';
        }
      }
      
      if(curStyles.style === 'stroke'){
        curStyles.borderColor = curStyles.color
      }
      shapeFunction(ctx, position, curStyles);
    }
  }
}

// 计算位置
function calculatePosition(value: any, index: number, styles: any, scriptContext: any) {
  const { yAxis, xAxis, bounding, script } = scriptContext;
  // 基础X坐标
  let x = xAxis.convertToPixel(index);
  let y = 0;
  
  // 获取图形尺寸用于底部位置计算
  const shapeSize = styles.size || 5;
  
  // 处理信号对象（throughUp/throughDown返回的对象）
  let signalValue = value;
  if (typeof value === 'object' && value !== null && (value.val1 !== undefined || value.val2 !== undefined)) {
    // 使用val1作为信号值，如果没有val1则使用val2
    signalValue = value.val1 !== undefined ? value.val1 : value.val2;
  }
  
  // 根据position类型计算Y坐标
  switch(styles.position) {
      case 'value':
        // 直接使用数组值计算Y轴位置
        y = yAxis.convertToPixel(signalValue);
        break;
        
      case 'high':
      case 'low':
      case 'open':
      case 'close':
        // 获取K线数据 - 使用scriptContext.dataList
        const klineData = scriptContext.dataList;
        if (klineData && index < klineData.length && klineData[index]) {
          const kline = klineData[index];
          const price = kline[styles.position];
          y = yAxis.convertToPixel(price);
        }
        break;
        
      case 'highUp':
        // 最高价上方：high位置 - 字号*1.5
        const klineDataHigh = scriptContext.dataList;
        if (klineDataHigh && index < klineDataHigh.length && klineDataHigh[index]) {
          const kline = klineDataHigh[index];
          const highPrice = kline.high;
          const fontSize = styles.size || 12; // 默认字号12
          y = yAxis.convertToPixel(highPrice) - fontSize * 1.5;
        }
        break;
        
      case 'lowDown':
        // 最低价下方：low位置 + 字号*1.5
        const klineDataLow = scriptContext.dataList;
        if (klineDataLow && index < klineDataLow.length && klineDataLow[index]) {
          const kline = klineDataLow[index];
          const lowPrice = kline.low;
          const fontSize = styles.size || 12; // 默认字号12
          y = yAxis.convertToPixel(lowPrice) + fontSize * 1.5;
        }
        break;
        
      case 'top':
        // 顶部位置：图形中心点对齐到顶部
        y = bounding.top + shapeSize / 2;
        break;
        
      case 'bottom':
        // 底部位置：图形中心点对齐到底部
        y = bounding.height - shapeSize * 1.5;
        break;
        
      case 'center':
        // 中间位置：图形中心点对齐到图表中心
        y = (bounding.top + bounding.height) / 2;
        break;
        
      default:
        // 默认使用value
        y = yAxis.convertToPixel(signalValue);
  }
  
  // 应用x/y偏移
  x += (styles.x || 0);
  y += (styles.y || 0);
  
  return { x, y };
}

// 获取可见范围
function getVisibleRange(xAxis: any) {
  if (xAxis && xAxis._range) {
    return {
      from: xAxis._range.from,
      to: xAxis._range.to
    };
  }
  return null;
} 