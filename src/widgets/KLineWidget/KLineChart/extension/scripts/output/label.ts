import { ScriptUtils } from '../versions/v1/ScriptUtils'

export interface LabelStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  size?: number
  text?: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  italic?: boolean
  position?: string | number
  x?: number
  y?: number
  angle?: number
  show?: boolean
}

export interface LabelBackgroundStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  full?: 'fill' | 'stroke'
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
  padding?: number
  radius?: number
  show?: boolean
}

export interface LabelCallbackContext {
  value: any
  index: number
  prev?: any
}

export function outputLabel(
  scriptContext: any,
  dataArray: any,
  labelStyles: LabelStyle | ((context: LabelCallbackContext) => LabelStyle),
  backgroundStyles?: LabelBackgroundStyle | ((context: LabelCallbackContext) => LabelBackgroundStyle)
) {
  const { ctx, bounding, yAxis, xAxis, script } = scriptContext;
  if (!ctx || !dataArray || !labelStyles) {
    return;
  }

  // 获取标签样式
  const getLabelStyles = (context: LabelCallbackContext): LabelStyle => {
    if (typeof labelStyles === 'function') {
      return labelStyles(context) || {}
    }
    return labelStyles || {}
  }

  // 获取背景样式
  const getBackgroundStyles = (context: LabelCallbackContext): LabelBackgroundStyle | undefined => {
    if (!backgroundStyles) return undefined
    if (typeof backgroundStyles === 'function') {
      return backgroundStyles(context) || {}
    }
    return backgroundStyles || {}
  }

  // 获取可见范围
  const visibleRange = getVisibleRange(xAxis);
  if (!visibleRange) {
    return;
  }

  // 绘制每个标签
  for (let i = visibleRange.from; i < visibleRange.to && i < dataArray.length; i++) {
    const value = dataArray[i];
    
    // 跳过无效数据
    if (!ScriptUtils.isValid(value)) {
      continue;
    }

    // 检查是否是信号对象（throughUp/throughDown返回的对象）
    if (typeof value === 'object' && value !== null && (value.val1 !== undefined || value.val2 !== undefined)) {
      // 这是信号对象，需要特殊处理
      if (value.val1 === undefined && value.val2 === undefined) {
        // 对象但没有有效值，跳过
        continue;
      }
    }
    
    // 创建回调上下文
    const callbackContext: LabelCallbackContext = {
      value: value,
      index: i,
      prev: i > 0 ? dataArray[i - 1] : undefined
    }
    
    // 处理标签样式回调
    let finalLabelStyles = getLabelStyles(callbackContext);

    // 检查show属性（包括回调后的show）
    if (finalLabelStyles?.show === false) {
      continue;
    }

    // 处理背景样式回调
    let finalBackgroundStyles = getBackgroundStyles(callbackContext);

    // 计算坐标
    const position = calculatePosition(value, i, finalLabelStyles, scriptContext);
    
    // 绘制标签
    drawLabel(ctx, position, finalLabelStyles, finalBackgroundStyles, scriptContext, value);
  }
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  position: { x: number, y: number },
  labelStyles: LabelStyle,
  backgroundStyles: LabelBackgroundStyle | undefined,
  scriptContext: any,
  value: any
) {
  const { bounding } = scriptContext;
  
  // 获取标签文本 - 优先样式中的 text，其次数据中的 text，最后回退为 value 字符串
  let text = '';
  if (labelStyles.text && String(labelStyles.text).length > 0) {
    text = String(labelStyles.text);
  } else if (typeof value === 'object' && value !== null && (value.text !== undefined && value.text !== null && String(value.text).length > 0)) {
    text = String(value.text);
  }
  
  if (!text) return;

  // 设置文字样式
  const color = labelStyles.color || '#333333';
  const size = labelStyles.size || 12;
  const fontFamily = 'Arial, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"'; // 固定字体
  const fontWeight = labelStyles.bold ? 'bold' : 'normal';
  const fontStyle = labelStyles.italic ? 'italic' : 'normal';
  const align = labelStyles.align || 'left';
  const angle = labelStyles.angle || 0; // 旋转角度，默认为0

  ctx.save();

  // 应用旋转
  if (angle !== 0) {
    ctx.translate(position.x, position.y);
    ctx.rotate(angle * Math.PI / 180); // 转换为弧度
    ctx.translate(-position.x, -position.y);
  }

  // 设置字体
  ctx.font = `${fontStyle} ${fontWeight} ${size}px ${fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle'; // 强制使用中间对齐，让文字在背景中居中

  // 计算文字尺寸
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = size; // 近似文字高度

  // 绘制背景
  if (backgroundStyles && backgroundStyles.show !== false) {
    drawBackground(ctx, position, textWidth, textHeight, backgroundStyles, labelStyles);
  }

  // 绘制文字
  if (Array.isArray(color)) {
    // 文本颜色数组，创建渐变
    const colors = color;
    if (colors.length >= 2) {
      const gradient = ctx.createLinearGradient(position.x - textWidth/2, position.y - textHeight/2, position.x + textWidth/2, position.y + textHeight/2);
      colors.forEach((c, index) => {
        const offset = index / (colors.length - 1);
        gradient.addColorStop(offset, c);
      });
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = colors[0];
    }
  } else {
    ctx.fillStyle = color;  // 重新设置文字颜色
  }
  ctx.fillText(text, position.x, position.y);

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  position: { x: number, y: number },
  textWidth: number,
  textHeight: number,
  backgroundStyles: LabelBackgroundStyle,
  labelStyles: LabelStyle
) {
  // 计算背景尺寸
  const padding = backgroundStyles.padding || 6;
  const width = textWidth + padding;
  const height = textHeight + padding;
  
  // 计算背景位置
  let bgX: number;
  let bgY = position.y - height / 2 - 1;
  
  // 根据文字对齐方式计算背景位置
  if (labelStyles.align === 'center') {
    bgX = position.x - width / 2;
  } else if (labelStyles.align === 'right') {
    bgX = position.x - width;
  } else {
    // left 对齐
    bgX = position.x;
  }
  // 设置背景样式
  const color = backgroundStyles.color || '#FFFFFF';
  const full = backgroundStyles.full || 'fill';
  const size = backgroundStyles.size || 1;
  const lineStyle = backgroundStyles.style || 'solid';
  const radius = backgroundStyles.radius || 0;

  // 设置线型
  if (lineStyle === 'dashed') {
    ctx.setLineDash([5, 5]);
  } else if (lineStyle === 'dotted') {
    ctx.setLineDash([2, 2]);
  } else {
    ctx.setLineDash([]);
  }

  // 绘制背景
  if (full === 'fill') {
    if (Array.isArray(color)) {
      // 背景颜色数组，创建渐变
      const colors = color;
      if (colors.length >= 2) {
        const gradient = ctx.createLinearGradient(bgX, bgY, bgX, bgY + height);
        colors.forEach((c, index) => {
          const offset = index / (colors.length - 1);
          gradient.addColorStop(offset, c);
        });
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = colors[0];
      }
    } else {
      ctx.fillStyle = color;
    }
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, width, height, radius);
      ctx.fill();
    } else {
      ctx.fillRect(bgX, bgY, width, height);
    }
  } else {
    if (Array.isArray(color)) {
      // 背景颜色数组，创建渐变
      const colors = color;
      if (colors.length >= 2) {
        const gradient = ctx.createLinearGradient(bgX, bgY, bgX, bgY + height);
        colors.forEach((c, index) => {
          const offset = index / (colors.length - 1);
          gradient.addColorStop(offset, c);
        });
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = colors[0];
      }
    } else {
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = size;
    if (radius > 0) {
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, width, height, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(bgX, bgY, width, height);
    }
  }
}

// 计算位置 - 与 shape.ts 相同的逻辑
function calculatePosition(value: any, index: number, styles: any, scriptContext: any) {
  const { yAxis, xAxis, bounding, script } = scriptContext;
  // 基础X坐标
  let x = xAxis.convertToPixel(index);
  let y = 0;
  
  // 获取文字尺寸用于底部位置计算
  const textSize = styles.size || 12;
  
  // 处理信号对象（throughUp/throughDown返回的对象）
  let signalValue = value;
  if (typeof value === 'object' && value !== null) {
    if (value.val1 !== undefined || value.val2 !== undefined) {
      // 使用val1作为信号值，如果没有val1则使用val2
      signalValue = value.val1 !== undefined ? value.val1 : value.val2;
    } else if (value.value !== undefined) {
      // 对于label对象，使用value属性作为信号值
      signalValue = value.value;
    }
  }
  
  // 根据position类型计算Y坐标
  if (typeof styles.position === 'number') {
    // 数值类型：相对Y轴位置
    if (styles.position >= 0) {
      // 正值：从上到下
      y = bounding.top + styles.position;
    } else {
      // 负值：从下到上（包括-0），需要减去自身高度
      y = bounding.height + styles.position - textSize * 1.5;
    }
  } else {
    // 字符串类型
    switch(styles.position) {
      case 'value':
        // 直接使用数组值计算Y轴位置，并调整到K线中间
        y = yAxis.convertToPixel(signalValue); // 向上偏移8像素，让标签在K线中间
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
        // 最高价上方：high位置 - 文字size * 1.5
        const klineDataHigh = scriptContext.dataList;
        if (klineDataHigh && index < klineDataHigh.length && klineDataHigh[index]) {
          const kline = klineDataHigh[index];
          const highPrice = kline.high;
          y = yAxis.convertToPixel(highPrice) - textSize * 1.5;
        }
        break;
        
      case 'lowDown':
        // 最低价下方：low位置 + 文字size * 1.5
        const klineDataLow = scriptContext.dataList;
        if (klineDataLow && index < klineDataLow.length && klineDataLow[index]) {
          const kline = klineDataLow[index];
          const lowPrice = kline.low;
          y = yAxis.convertToPixel(lowPrice) + textSize * 1.5;
        }
        break;
        
      case 'top':
        // 顶部位置：文字中心点对齐到顶部
        y = bounding.top + textSize / 2;
        break;
        
      case 'bottom':
        // 底部位置：文字中心点对齐到底部
        y = bounding.height - textSize * 1.5;
        break;
        
      case 'center':
        // 中间位置：文字中心点对齐到图表中心
        y = (bounding.top + bounding.height) / 2;
        break;
        
      default:
        // 如果没有指定position，默认使用value
        y = yAxis.convertToPixel(signalValue);
    }
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