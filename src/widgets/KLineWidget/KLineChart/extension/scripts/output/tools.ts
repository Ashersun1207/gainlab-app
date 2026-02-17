export function outputTools(script: any, label: string, dataSource: any, style: any) {
  if (!label || dataSource === null || dataSource === undefined) {
    return;
  }

  // 安全检查：确保 script 对象存在
  if (!script) {
    return;
  }

  // 检查样式的show属性，如果为false则不显示工具提示
  if (style && typeof style === 'object') {
    // 检查style对象中的show属性
    if (style.show === false) {
      return; // 不显示工具提示
    }
    
    // 检查style.value中的show属性（如果存在）
    if (style.value && style.value.show === false) {
      return; // 不显示工具提示
    }
    
    // 检查style.defaultValue中的show属性（如果存在）
    if (style.defaultValue && style.defaultValue.show === false) {
      return; // 不显示工具提示
    }
  }

  // 处理非数组类型的数据源（字符串或数值）
  if (!Array.isArray(dataSource)) {
    // 检查是否为有效值
    let displayValue: string;
    
    if (dataSource === null || dataSource === undefined) {
      displayValue = 'N/A';
    } else if (typeof dataSource === 'number' && (isNaN(dataSource) || !isFinite(dataSource))) {
      displayValue = 'N/A';
    } else {
      displayValue = String(dataSource);
    }
    
    // 获取脚本的精度设置
    let precision: number | null = null;
    try {
      if (script.precision !== undefined && script.precision !== null) {
        if (typeof script.precision === 'number') {
          precision = script.precision;
        } else if (script.precision === 'price') {
          // 获取价格精度
          const chart = script.chart;
          if (chart && chart._chartStore && chart._chartStore._symbol) {
            precision = chart._chartStore._symbol.pricePrecision ?? 2;
          } else {
            precision = 2;
          }
        } else if (script.precision === 'volume') {
          // 获取成交量精度
          const chart = script.chart;
          if (chart && chart._chartStore && chart._chartStore._symbol) {
            precision = chart._chartStore._symbol.volumePrecision ?? 2;
          } else {
            precision = 2;
          }
        }
      }
    } catch (error) {
      // 静默处理错误
    }
    
    // 如果是字符串或数值，直接显示
    const toolDefinition = {
      label,
      dataSource: displayValue, // 使用处理后的显示值
      style,
      precision // 使用脚本的精度设置
    };
    
    // 确保tooltip工具定义数组存在
    if (!script.tooltipTools) {
      script.tooltipTools = [];
    }
    
    script.tooltipTools.push(toolDefinition);
    return;
  }

  // 获取脚本的精度
  let precision: number | null = null; // 默认不设置精度
  try {
    // 从脚本对象获取精度
    if (script.precision !== undefined && script.precision !== null) {
      if (typeof script.precision === 'number') {
      precision = script.precision;
      } else if (script.precision === 'price') {
        // 获取价格精度
        const chart = script.chart;
        if (chart && chart._chartStore && chart._chartStore._symbol) {
          precision = chart._chartStore._symbol.pricePrecision ?? 2;
        } else {
          precision = 2;
        }
      } else if (script.precision === 'volume') {
        // 获取成交量精度 - 使用正确的路径
        const chart = script.chart;
        if (chart && chart._chartStore && chart._chartStore._symbol) {
          precision = chart._chartStore._symbol.volumePrecision ?? 2;
        } else {
          precision = 2;
        }
      }
    }
  } catch (error) {
    // 静默处理错误
  }

  // 确保tooltip工具定义数组存在
  if (!script.tooltipTools) {
    script.tooltipTools = [];
  }

  // 原有的静态方式
  const toolDefinition = {
    label,
    dataSource, // 数据源（如ma数组）
    style,      // 样式信息
    precision   // 使用脚本的精度，如果为null则不设置精度
  };
  script.tooltipTools.push(toolDefinition);
}

// 添加setPrecision方法
export function setPrecision(script: any, precision: 'price' | 'volume' | number): void {
  if (!script) {
    return;
  }

  try {
    // 获取当前商品的精度
    let targetPrecision = 2; // 默认精度
    
    if (precision === 'price') {
      // 使用价格精度
      const chart = script.chart;
      if (chart && chart._chartStore && chart._chartStore._symbol) {
        targetPrecision = chart._chartStore._symbol.pricePrecision ?? 2;
      } else {
        targetPrecision = 2;
      }
    } else if (precision === 'volume') {
      // 使用成交量精度 - 使用正确的路径
      const chart = script.chart;
      if (chart && chart._chartStore && chart._chartStore._symbol) {
        targetPrecision = chart._chartStore._symbol.volumePrecision ?? 2;
      } else {
        targetPrecision = 2;
      }
      
      // 调试信息
      console.log('setPrecision volume:', {
        hasChart: !!chart,
        hasChartStore: !!chart?._chartStore,
        hasSymbol: !!chart?._chartStore?._symbol,
        symbolVolumePrecision: chart?._chartStore?._symbol?.volumePrecision,
        finalPrecision: targetPrecision
      });
    } else if (typeof precision === 'number') {
      // 使用指定的数值精度
      targetPrecision = precision;
    }

    // 设置脚本精度
    script.precision = targetPrecision;
  } catch (error) {
    console.error('setPrecision error:', error);
  }
} 