# GainLab Script 验证系统

## 概述

这是一个独立的脚本验证系统，为MonacoEditor提供语法验证、代码补全和语法高亮功能。系统采用模块化设计，可以独立维护，也可以随时关闭。

## 文件结构

```
validation/
├── glscript-validation.js          # 核心验证配置文件
├── glscript-monaco-integration.js  # MonacoEditor集成文件
└── README.md                       # 使用说明
```

## 功能特性

### ✅ 语法验证
- API方法调用验证
- 常量使用验证
- 关键字验证
- 实时错误提示

### ✅ 代码补全
- 智能API方法补全
- 上下文相关建议
- 参数模板提示
- 常量补全

### ✅ 语法高亮
- API调用高亮
- 常量高亮
- 关键字高亮
- 注释和字符串高亮

### ✅ 灵活配置
- 独立开关控制
- 动态配置更新
- 易于维护和扩展

## 使用方法

### 1. 引入文件

```html
<!-- 先引入验证配置文件 -->
<script src="glscript-validation.js"></script>
<!-- 再引入MonacoEditor集成文件 -->
<script src="glscript-monaco-integration.js"></script>
```

### 2. 初始化MonacoEditor

```javascript
// 等待MonacoEditor加载完成
require(['vs/editor/editor.main'], function() {
  // 初始化GLScript支持
  GLScriptMonacoIntegration.initGLScriptSupport(monaco);
  
  // 创建编辑器
  const editor = GLScriptMonacoIntegration.createGLScriptEditor(
    document.getElementById('editor-container')
  );
});
```

### 3. 配置控制

```javascript
// 获取当前配置
const config = GLScriptMonacoIntegration.getValidationConfig();
console.log('当前配置:', config);

// 更新配置
GLScriptMonacoIntegration.updateValidationConfig({
  VALIDATION_ENABLED: false,    // 关闭验证
  COMPLETION_ENABLED: true,     // 开启补全
  SYNTAX_HIGHLIGHT_ENABLED: true // 开启语法高亮
});

// 或者直接使用验证配置对象
window.GLScriptValidation.disableValidation();
window.GLScriptValidation.enableCompletion();
```

## API方法列表

### F对象（Formula）- 公式方法
```javascript
['sma', 'ma', 'ema', 'wma', 'std', 'slope', 'hhv', 'llv', 'kdj', 'boll', 
 'roc', 'cci', 'macd', 'high', 'low', 'avg', 'sar', 'dmi', 'dma', 'trix',
 'brar', 'vr', 'obv', 'emv', 'rsi', 'wr', 'mtm', 'psy', 'vo', 'bias', 
 'asi', 'trima', 'kama', 't3', 'atr', 'stochastic', 'donchianChannel',
 'mfi', 'getTrend', 'fibonacciRetracement', 'moneyFlow', 'rma', 
 'rmaWithAlpha', 'atrWithRMA', 'adxWithRMA', 'dema', 'tema', 'lsma',
 'mf', 'vama', 'tma', 'hma', 'jma', 'kijunV2', 'edsma', 'mcginley',
 'linreg', 'percentileLinearInterpolation', 'calculatePercentile',
 'call', 'attr', 'cross', 'throughUp', 'throughDown']
```

### D对象（Draw）- 绘制方法
```javascript
['line', 'bar', 'label', 'area', 'shape', 'candle', 'rect',
 'hline', 'vline', 'sline', 'sarea', 'srect', 'sshape', 'scircle', 'slabel',
 'maindraw', 'MD']
```

### O对象（Output）- 输出方法
```javascript
['bar', 'shape', 'area', 'candle', 'rect', 'label', 'tools',
 'hline', 'vline', 'sline']
```

### U对象（Utils）- 工具方法
```javascript
['formatNumber', 'formatPercent', 'formatPrice', 'toNumber', 'mod',
 'average', 'sum', 'unique', 'sort', 'getValue', 'isValidNumber',
 'isEmpty', 'isValid', 'random', 'randomInt', 'clamp', 'lerp',
 'toRadians', 'toDegrees', 'distance', 'formatDate', 'now',
 'deepClone', 'merge', 'colorToRgb', 'colorToRgba']
```

### H对象（HTTP）- HTTP方法
```javascript
['get', 'post', 'loadHistory']
```

### I对象（Input）- 输入方法
```javascript
['number', 'select', 'switch', 'color', 'text']
```

### S对象（Style）- 样式方法
```javascript
['line', 'bar', 'label', 'area', 'shape', 'candle', 'rect']
```

## 维护指南

### 添加新的API方法

1. 在 `glscript-validation.js` 中找到对应的API方法数组
2. 添加新方法名到数组中
3. 保存文件即可生效

```javascript
// 例如：添加新的F对象方法
const F_METHODS = [
  'sma', 'ma', 'ema', 
  'newMethod',  // 新添加的方法
  // ... 其他方法
];
```

### 关闭特定功能

```javascript
// 关闭所有验证功能
window.GLScriptValidation.disableValidation();

// 关闭代码补全
window.GLScriptValidation.disableCompletion();

// 关闭语法高亮
window.GLScriptValidation.disableSyntaxHighlight();
```

### 动态更新配置

```javascript
// 更新API方法列表
GLScriptMonacoIntegration.updateValidationConfig({
  F_METHODS: ['sma', 'ma', 'newMethod'],  // 自定义F方法列表
  D_METHODS: ['line', 'bar', 'newDraw']   // 自定义D方法列表
});
```

## 注意事项

1. **加载顺序**：必须先加载 `glscript-validation.js`，再加载 `glscript-monaco-integration.js`
2. **MonacoEditor依赖**：需要先加载MonacoEditor
3. **浏览器兼容性**：支持现代浏览器，需要ES6支持
4. **性能考虑**：验证功能会消耗一些性能，如果不需要可以关闭

## 故障排除

### 验证不工作
- 检查 `VALIDATION_ENABLED` 是否为 `true`
- 确认文件加载顺序正确
- 查看浏览器控制台是否有错误

### 补全不显示
- 检查 `COMPLETION_ENABLED` 是否为 `true`
- 确认MonacoEditor语言设置为 `'glscript'`
- 检查API方法列表是否正确

### 语法高亮异常
- 检查 `SYNTAX_HIGHLIGHT_ENABLED` 是否为 `true`
- 确认语法规则配置正确
- 检查关键字列表是否完整

## 扩展开发

如果需要添加新的验证规则或功能，可以：

1. 在 `glscript-validation.js` 中添加新的验证函数
2. 在 `glscript-monaco-integration.js` 中集成新功能
3. 更新配置开关和API接口

```javascript
// 添加新的验证函数
function validateCustomRule(code) {
  // 自定义验证逻辑
  return [];
}

// 在导出对象中添加
window.GLScriptValidation.validateCustomRule = validateCustomRule;
``` 