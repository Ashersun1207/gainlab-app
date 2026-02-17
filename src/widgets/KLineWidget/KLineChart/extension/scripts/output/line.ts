import { drawLine } from '../../figure/line'
import { ScriptUtils } from '../versions/v1/ScriptUtils'

export interface LineStyle {
  color?: string | string[]  // 支持单个颜色或颜色数组（渐变）
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
  show?: boolean
  continuous?: boolean
}

export interface LineCallbackContext {
  value: number
  index: number
  prev?: number
  prevValid?: number  // 上一个有效值
}

export function outputLine(
  scriptContext: any, 
  data: any, 
  styles: LineStyle | ((context: LineCallbackContext) => LineStyle)
) {
  const { ctx, bounding, yAxis, xAxis, script } = scriptContext;
  if (!ctx || !data || !styles) {
    return;
  }

  // 获取样式
  const getStyles = (context: LineCallbackContext): LineStyle => {
    if (typeof styles === 'function') {
      return styles(context) || {}
    }
    return styles || {}
  }

  let lastValidIndex = -1;
  let lastValidValue = null;
  data.forEach((value: any, index: number) => {
    if(index > 0){
      let pre = data[index - 1]
      
      // 创建回调上下文
      const callbackContext: LineCallbackContext = {
        value,
        index,
        prev: pre,
        prevValid: lastValidValue !== null ? lastValidValue : undefined
      }
      
      // 处理样式回调
      let currentStyles: any = getStyles(callbackContext);
      // 检查样式是否显示
      if (!currentStyles || currentStyles.show === false) {
        return;
      }
      
      // 检查连续性设置
      const isContinuous = currentStyles.continuous === true;
      
      // 正常情况：两个点都有效
      if (ScriptUtils.isValid(pre) && ScriptUtils.isValid(value)) {
        const x1 = xAxis.convertToPixel(index - 1);
        const y1 = yAxis.convertToPixel(pre);
        const x2 = xAxis.convertToPixel(index);
        const y2 = yAxis.convertToPixel(value);
        
        // 自己绘制线条，支持渐变
        if (Array.isArray(currentStyles.color)) {
          // 颜色数组，创建渐变
          const colors = currentStyles.color;
          if (colors.length >= 2) {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            colors.forEach((c, idx) => {
              const offset = idx / (colors.length - 1);
              gradient.addColorStop(offset, c);
            });
            ctx.strokeStyle = gradient;
          } else {
            ctx.strokeStyle = colors[0] || '#000';
          }
        } else {
          ctx.strokeStyle = currentStyles.color || '#000';
        }
        
        ctx.lineWidth = currentStyles.size || 1;
        ctx.setLineDash([]); // 默认实线
        
        if (currentStyles.style === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else if (currentStyles.style === 'dotted') {
          ctx.setLineDash([2, 2]);
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        lastValidIndex = index;
        lastValidValue = value;
      } 
      // 连续模式：当前点有效，但前一个点无效，且存在上一个有效点
      else if (isContinuous && ScriptUtils.isValid(value) && lastValidIndex >= 0) {
        // 从最后一个有效点连接到当前点
        const x1 = xAxis.convertToPixel(lastValidIndex);
        const y1 = yAxis.convertToPixel(lastValidValue);
        const x2 = xAxis.convertToPixel(index);
        const y2 = yAxis.convertToPixel(value);
        
        // 自己绘制线条，支持渐变
        if (Array.isArray(currentStyles.color)) {
          // 颜色数组，创建渐变
          const colors = currentStyles.color;
          if (colors.length >= 2) {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            colors.forEach((c, idx) => {
              const offset = idx / (colors.length - 1);
              gradient.addColorStop(offset, c);
            });
            ctx.strokeStyle = gradient;
          } else {
            ctx.strokeStyle = colors[0] || '#000';
          }
        } else {
          ctx.strokeStyle = currentStyles.color || '#000';
        }
        
        ctx.lineWidth = currentStyles.size || 1;
        ctx.setLineDash([]); // 默认实线
        
        if (currentStyles.style === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else if (currentStyles.style === 'dotted') {
          ctx.setLineDash([2, 2]);
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        lastValidIndex = index;
        lastValidValue = value;
      }
      // 更新最后一个有效点（即使不画线）
      else if (ScriptUtils.isValid(value)) {
        lastValidIndex = index;
        lastValidValue = value;
      }
      // 默认模式：数据无效就跳过，不画线
    }
  });
} 