import { ScriptUtils } from '../versions/v1/ScriptUtils'

export interface AreaStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  alpha?: number
  show?: boolean
}

export interface AreaCallbackContext {
  value: number
  value2: number
  index: number
  prev?: number
  prev2?: number
}

export function outputArea(
  scriptContext: any, 
  dataArray1: any, 
  dataArray2: any, 
  styles: AreaStyle | ((context: AreaCallbackContext) => AreaStyle)
) {
  const { ctx, xAxis, yAxis, bounding, dataList } = scriptContext;
  
  if (!ctx || !dataArray1 || !dataArray2 || !Array.isArray(dataArray1) || !Array.isArray(dataArray2)) return;
  
  // 获取样式
  const getStyles = (context: AreaCallbackContext): AreaStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  // 获取可见范围
  const visibleRange = getVisibleRange(xAxis);
  if (!visibleRange) return;

  try {
    // 保存当前的 canvas 状态
    ctx.save();
    
    // 确保不影响其他绘制
    // ctx.globalCompositeOperation = 'source-over';

  // 逐段绘制区域
  for (let i = visibleRange.from; i < visibleRange.to - 1 && i < dataArray1.length - 1; i++) {
    const value1_1 = dataArray1[i];
    const value1_2 = dataArray1[i + 1];
    const value2_1 = dataArray2[i];
    const value2_2 = dataArray2[i + 1];
    
    // 检查值是否为null，如果是null就不画
    if (value1_1 === null || value1_2 === null || value2_1 === null || value2_2 === null) {
      continue;
    }
    
    // 检查其他值是否有效
    if (!(ScriptUtils.isValid(value1_1) && ScriptUtils.isValid(value1_2) && ScriptUtils.isValid(value2_1) && ScriptUtils.isValid(value2_2))) {
      continue;
    }

    // 创建回调上下文
    const callbackContext: AreaCallbackContext = {
      value: value1_1,  // 第一个数组的值
      value2: value2_1, // 第二个数组的值
      index: i + 1,  // 调整为与 D.line() 一致的索引
      prev: i > 0 ? dataArray1[i - 1] : undefined,
      prev2: i > 0 ? dataArray2[i - 1] : undefined
    }

    // 获取样式
    const currentStyles = getStyles(callbackContext)
    
    // 检查show属性
    if (currentStyles.show === false) continue;

    // 计算4个点的坐标
    // x轴保持不变，按原来的index去获取
    const x1 = xAxis.convertToPixel(i);
    const x2 = xAxis.convertToPixel(i + 1);
    // y轴：数值使用yAxis，字符串直接计算
    let y1_1, y1_2, y2_1, y2_2;
    
    // 对于字符串，先转换为数值，然后通过yAxis处理
    const getYValue = (value: any) => {
      if (typeof value === 'string') {
        const pixelValue = convertStringToY(value, bounding);
        // 将像素值转换为yAxis能理解的数值
        const percent = pixelValue / bounding.height;
        // 假设yAxis的范围是0-1，我们传入百分比值
        return percent;
      }
      return value;
    };
    
    y1_1 = yAxis.convertToPixel(getYValue(value1_1));
    y1_2 = yAxis.convertToPixel(getYValue(value1_2));
    y2_1 = yAxis.convertToPixel(getYValue(value2_1));
    y2_2 = yAxis.convertToPixel(getYValue(value2_2));
    
    // 应用样式
    if (currentStyles.color) {
      if (Array.isArray(currentStyles.color)) {
        // 颜色数组，创建渐变
        const colors = currentStyles.color;
        if (colors.length >= 2) {
          // 默认垂直渐变
          const gradient = ctx.createLinearGradient(0, y1_1, 0, y2_1);
          
          // 添加颜色停止点
          colors.forEach((color, index) => {
            const offset = index / (colors.length - 1);
            gradient.addColorStop(offset, color);
          });
          
          ctx.fillStyle = gradient;
        } else {
          // 只有一个颜色，使用第一个
          ctx.fillStyle = colors[0];
        }
      } else {
        // 单个颜色字符串
        ctx.fillStyle = currentStyles.color;
      }
    } else {
      ctx.fillStyle = 'rgba(255, 150, 0, 0.3)';
    }
    
    if (currentStyles.alpha) {
      ctx.globalAlpha = currentStyles.alpha;
    }
    
    // 检查坐标是否有效
    if (x1 === null || x2 === null || y1_1 === null || y1_2 === null || 
        y2_1 === null || y2_2 === null || 
        isNaN(x1) || isNaN(x2) || isNaN(y1_1) || isNaN(y1_2) || 
        isNaN(y2_1) || isNaN(y2_2)) {
      continue;
    }
    
    // 绘制这个小区域
    ctx.beginPath();
    ctx.moveTo(x1, y1_1);  // 左上
    ctx.lineTo(x2, y1_2);  // 右上
    ctx.lineTo(x2, y2_2);  // 右下
    ctx.lineTo(x1, y2_1);  // 左下
    ctx.closePath();
    ctx.fill();
    

  }
  
  } catch (error) {
    console.error('outputArea error:', error);
  } finally {
    // 确保恢复 canvas 状态
    if (ctx) {
      ctx.restore();
    }
  }
}



// 转换字符串到Y坐标的辅助函数
function convertStringToY(value: string, bounding: any): number {
  const str = String(value);
  
  // 相对位置
  if (str === 'top') return 0;
  if (str === 'center') return bounding.height / 2;
  if (str === 'bottom') return bounding.height;
  
  // 绝对像素
  if (str.endsWith('px')) {
    const num = parseFloat(str.slice(0, -2));
    if (num >= 0) return num;
    return bounding.height + num; // 负数从下边算
  }
  
  // 百分比
  if (str.endsWith('%')) {
    const percent = parseFloat(str.slice(0, -1)) / 100;
    const result = bounding.height * percent;
    return result;
  }
  
  // 默认返回0
  return 0;
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