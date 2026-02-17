import { drawRect } from '../../figure/rect'
import type Coordinate from '../../../common/Coordinate'
import { ScriptUtils } from '../versions/v1/ScriptUtils'

export interface BarStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  full?: 'fill' | 'stroke'
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
  show?: boolean
}

export interface BarCallbackContext {
  value: number
  index: number
  prev?: number
}

export function outputBar(
  scriptContext: any, 
  dataArray: any, 
  baseline: any, 
  styles: BarStyle | ((context: BarCallbackContext) => BarStyle)
) {
  const { ctx, bounding, yAxis, xAxis, script } = scriptContext;
  if (!ctx || !dataArray || !styles) {
    return;
  }

  // 获取样式
  const getStyles = (context: BarCallbackContext): BarStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  // 禁用抗锯齿以确保清晰边界
  const originalImageSmoothingEnabled = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  // 验证数据数组
  if (!Array.isArray(dataArray)) {
    console.warn('D.bar: 第一个参数必须是数组', dataArray);
    return;
  }

  // 获取可见范围
  const visibleRange = xAxis?._range;
  if (!visibleRange) {
    return;
  }

  // 计算每个bar的宽度
  const barWidth = Math.max(1, Math.floor((bounding.width / (visibleRange.to - visibleRange.from)) * 0.8));

  // 获取Y轴范围用于计算top/bottom/center
  const yAxisRange = yAxis?.getRange();
  if (!yAxisRange) {
    return;
  }

  // 绘制每个bar
  for (let i = visibleRange.from; i < visibleRange.to && i < dataArray.length; i++) {
    const value = dataArray[i];

    // 跳过无效数据
    if (!ScriptUtils.isValid(value)) {
      continue;
    }

    // 计算基线值
    let baselineValue: number;
    
    if (typeof baseline === 'number') {
      // 基线值：直接使用数字
      baselineValue = baseline;
    } else if (Array.isArray(baseline)) {
      // 基线数组：获取对应索引的值，使用取模确保不越界
      baselineValue = baseline[i % baseline.length] ?? 0;
    } else if (typeof baseline === 'string') {
      // 基线字符串：根据Y轴范围计算
      switch (baseline.toLowerCase()) {
        case 'top':
          baselineValue = yAxisRange.max;
          break;
        case 'bottom':
          baselineValue = yAxisRange.min;
          break;
        case 'center':
          baselineValue = (yAxisRange.max + yAxisRange.min) / 2;
          break;
        default:
          console.warn('D.bar: 无效的基线字符串，支持: top/bottom/center', baseline);
          baselineValue = 0;
      }
    } else {
      // 默认基线为0
      baselineValue = 0;
    }

    // 创建回调上下文
    const callbackContext: BarCallbackContext = {
      value: value,
      index: i,
      prev: i > 0 ? dataArray[i - 1] : undefined
    }

    // 获取样式
    const currentStyles = getStyles(callbackContext)

    if (!currentStyles) {
      continue;
    }

    // 检查show属性，如果为false则不绘制
    if (currentStyles.show === false) {
      continue;
    }
    


    // 计算坐标
    const x = xAxis.convertToPixel(i);
    const y1 = yAxis.convertToPixel(baselineValue);
    const y2 = yAxis.convertToPixel(value);

    // 确保y1和y2的顺序正确（y1在上，y2在下）
    const topY = Math.min(y1, y2);
    const bottomY = Math.max(y1, y2);

    // 像素对齐：确保坐标是整数
    const alignedX = Math.round(x);
    const alignedTopY = Math.round(topY);
    const alignedBottomY = Math.round(bottomY);
    const alignedBarWidth = Math.max(1, Math.round(barWidth));

    // 进一步优化：确保柱状图边界完全对齐到像素
    const barLeft = Math.floor(alignedX - alignedBarWidth / 2);
    const barRight = barLeft + alignedBarWidth;
    const barTop = Math.floor(alignedTopY);
    const barBottom = Math.floor(alignedBottomY);

    // 应用样式
    let color: any = '#000';
    let full = 'fill';
    let size = 1;
    let style = 'solid';

    if (currentStyles) {
      // 如果返回的是样式对象（如buyStyle, sellStyle）
      if (currentStyles.color !== undefined) {
        color = currentStyles.color;
      }
      if (currentStyles.full !== undefined) {
        full = currentStyles.full;
      }
      if (currentStyles.size !== undefined) {
        size = currentStyles.size;
      }
      if (currentStyles.style !== undefined) {
        style = currentStyles.style;
      }
    }

          // 绘制bar
      if (full === 'fill') {
        // 实心填充 - 使用精确的像素对齐
        if (Array.isArray(color)) {
          // 颜色数组，创建渐变
          const colors = color;
          if (colors.length >= 2) {
            const gradient = ctx.createLinearGradient(0, barTop, 0, barBottom);
            colors.forEach((c, index) => {
              const offset = index / (colors.length - 1);
              gradient.addColorStop(offset, c);
            });
            ctx.fillStyle = gradient;
          } else {
            ctx.fillStyle = colors[0] || '#000';
          }
        } else {
          ctx.fillStyle = color;
        }
        
        // 确保坐标完全对齐到像素边界
        const x1 = Math.floor(barLeft);
        const y1 = Math.floor(barTop);
        const x2 = Math.ceil(barRight);
        const y2 = Math.ceil(barBottom);
        
        // 使用整数坐标确保清晰
        const width = x2 - x1;
        const height = y2 - y1;
        
        if (width > 0 && height > 0) {
          ctx.fillRect(x1, y1, width, height);
        }
      } else if (full === 'stroke') {
        // 空心边框 - 使用0.5像素偏移确保清晰边界
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        
        // 设置线型
        if (style === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else if (style === 'dotted') {
          ctx.setLineDash([2, 2]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.strokeRect(
          barLeft + 0.5, 
          barTop + 0.5, 
          barRight - barLeft - 1, 
          barBottom - barTop - 1
        );
      }
  }

  // 重置线型设置
  ctx.setLineDash([]);
  // 恢复抗锯齿设置
  ctx.imageSmoothingEnabled = originalImageSmoothingEnabled;
} 