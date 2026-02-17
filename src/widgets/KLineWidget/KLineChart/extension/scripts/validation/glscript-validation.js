/**
 * GainLab Script 验证配置文件
 * 用于MonacoEditor的语法验证和代码补全
 * 可以独立维护，也可以随时关闭
 */

// ==================== 动态API方法获取器 ====================

/**
 * 获取API对象的所有方法
 * @param {string} apiName - API对象名 (F, D, O, S, I, U, H)
 * @returns {string[]} 方法名数组
 */
function getAPIMethods(apiName) {
    // 静态定义
    const STATIC_METHODS = {
        'F': [
            'attr', 'ma', 'ema', 'wma', 'fwma', 'sma', 'rma', 'rmaWithAlpha', 'trima', 'kama', 't3', 'dema',
            'tema', 'vidya', 'vwap', 'wcp', 'vwma', 'zlma', 'drawdown', 'log_return', 'percent_return',
            'trend_return', 'entropy', 'kurtosis', 'mad', 'median', 'quantile', 'skew', 'hma', 'lsma',
            'jma', 'mcginley', 'mcgd', 'edsma', 'vama', 'stdev', 'variance', 'zscore', 'adx', 'amat',
            'aroon', 'chop', 'cksp', 'decay', 'decreasing', 'dpo', 'increasing', 'longRun', 'psar',
            'qstick', 'short_run', 'ttm_trend', 'vortex', 'aberration', 'accbands', 'slope', 'linreg',
            'midpoint', 'midprice', 'pwma', 'sinwma', 'ssf', 'supertrend', 'swma', 'calcVolatility',
            'avg', 'hhv', 'llv', 'cross', 'throughUp', 'throughDown', 'kdj', 'boll', 'macd', 'tr', 'atr',
            'atrWithRMA', 'adxWithRMA', 'rsi', 'cci', 'mom', 'pgo', 'ppo', 'psl', 'pvo', 'qqe', 'rsx',
            'rvgi', 'smi', 'squeeze', 'stochrsi', 'td_seq', 'tsi', 'uo', 'willr', 'alma', 'roc', 'kijunV2',
            'trix', 'brar', 'vr', 'obv', 'emv', 'vo', 'dmi', 'dma', 'asi', 'stochastic', 'donchianChannel',
            'hwc', 'kc', 'massi', 'natr', 'pdist', 'rvi', 'thermo', 'trueRange', 'ui', 'ad', 'adosc',
            'aobv', 'cmf', 'efi', 'eom', 'nvi', 'pvi', 'pvol', 'pvr', 'pvt', 'vp', 'mfi', 'moneyFlow',
            'getTrend', 'fibonacciRetracement', 'sar', 'high', 'low', 'bias', 'cdl_doji', 'cdl_inside',
            'ha', 'ebsw', 'ao', 'apo', 'bop', 'cfo', 'cg', 'cmo', 'coppock', 'er', 'eri', 'fisher', 'hilo',
            'hwma', 'ichimoku', 'inertia', 'kst', 'percentileLinearInterpolation', 'calculatePercentile',
            'call'


        ],
        'D': [
            'line', 'bar', 'label', 'area', 'shape', 'candle', 'rect',
            'hline', 'vline', 'sline', 'sarea', 'srect', 'sshape', 'scircle', 'slabel'
        ],
        'O': [
            'tools', 'print', 'warn', 'error', 'signal',
            'orderOpen', 'orderClose', 'orderUpdate',
        ],
        'account': ['balance', 'equity', 'positions', 'orders', 'historyOrders'],
        'U': [
            'formatNumber', 'formatPercent', 'formatPrice', 'toNumber', 'mod',
            'average', 'sum', 'unique', 'sort', 'getValue', 'isValidNumber',
            'isEmpty', 'isValid', 'random', 'randomInt', 'clamp', 'lerp',
            'toRadians', 'toDegrees', 'distance', 'formatDate', 'now',
            'deepClone', 'merge', 'colorToRgb', 'colorToRgba'
        ],
        'H': [
            'get', 'post', 'loadHistory'
        ],
        'I': [
            'int', 'float', 'bool', 'select'
        ],
        'S': [
            'color', 'width', 'size', 'style', 'full', 'icon', 'line', 'bar', 'label', 'labelbg', 'shape', 'rect', 'area', 'candle', 'slabel', 'sarea', 'srect', 'scircle', 'sshape'
        ]
    };

    return STATIC_METHODS[apiName] || [];
}

/**
 * 验证API方法是否有效
 * @param {string} api - API对象名 (F, D, O, S, I, U, H)
 * @param {string} method - 方法名
 * @returns {boolean} 是否有效
 */
function isValidAPIMethod(api, method) {
    const methods = getAPIMethods(api);
    return methods.includes(method);
}

// 常量定义
const CONSTANTS = [
    'SOURCE'
];

// 关键字定义
const KEYWORDS = [
    'F', 'D', 'O', 'S', 'I', 'U', 'H', 'Math', 'dataList', 'visibleList',
    'open', 'high', 'low', 'close', 'volume', 'time',
    'Open', 'High', 'Low', 'Close', 'Volume', 'Time',
    'rev',
    'var', 'let', 'const', 'function', 'if', 'else', 'for', 'while',
    'return', 'true', 'false', 'null', 'undefined'
];

// 保留字定义（不能重新定义的变量）
const RESERVED_WORDS = [
    // GLScript特有的保留字（不能重新定义）
    'output', 'draw', 'formula', 'util', 'MD', 'maindraw', 'extendData',
    'http', 'ChartInfo', 'F', 'D', 'O', 'S', 'I', 'U', 'H', 'dataList', 'visibleList',
    'open', 'high', 'low', 'close', 'volume', 'time',
    'Open', 'High', 'Low', 'Close', 'Volume', 'Time', 'rev'
];

// ==================== 验证配置 ====================

// 是否启用验证功能
let VALIDATION_ENABLED = true;

// 是否启用代码补全
let COMPLETION_ENABLED = true;

// 是否启用语法高亮
let SYNTAX_HIGHLIGHT_ENABLED = true; // 重新启用语法高亮

// ==================== 验证函数 ====================



/**
 * 验证常量是否有效
 * @param {string} constant - 常量名
 * @returns {boolean} 是否有效
 */
function isValidConstant(constant) {
    if (!VALIDATION_ENABLED) return true;
    return CONSTANTS.includes(constant);
}

/**
 * 验证关键字是否有效
 * @param {string} keyword - 关键字
 * @returns {boolean} 是否有效
 */
function isValidKeyword(keyword) {
    if (!VALIDATION_ENABLED) return true;
    return KEYWORDS.includes(keyword);
}

/**
 * 验证脚本代码
 * @param {string} code - 脚本代码
 * @returns {Array} 错误列表
 */
function validateScript(code) {
    if (!VALIDATION_ENABLED) return [];

    const errors = [];
    const lines = code.split('\n');

    // 暂时简化变量收集逻辑，等后面系统性地完善
    const definedVariables = new Set();
    const variableDefinitions = [];

    // 添加全局变量和内置变量
    const globalVariables = [
        'dataList', 'visibleList', 'source', 'close', 'open', 'high', 'low', 'volume', 'time',
        'Close', 'Open', 'High', 'Low', 'Volume', 'Time', 'rev',
        'title', 'min', 'max', 'default', 'precision', 'price'
    ];

    // 添加全局函数
    const globalFunctions = [
        'setPrecision', 'setMax', 'setMin'
    ];

    // 添加JavaScript内置方法
    const builtinMethods = [
        // 数组方法
        'forEach', 'map', 'filter', 'reduce', 'find', 'findIndex', 'some', 'every',
        'includes', 'indexOf', 'lastIndexOf', 'slice', 'splice', 'concat', 'join',
        'push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'toString', 'toLocaleString',
        // 字符串方法
        'charAt', 'charCodeAt', 'concat', 'endsWith', 'includes', 'indexOf', 'lastIndexOf',
        'match', 'replace', 'search', 'slice', 'split', 'startsWith', 'substr', 'substring',
        'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight',
        // 数字方法
        'toFixed', 'toExponential', 'toPrecision', 'toString', 'valueOf',
        // 对象方法
        'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'valueOf'
    ];

    globalVariables.forEach(varName => definedVariables.add(varName));
    globalFunctions.forEach(funcName => definedVariables.add(funcName));
    builtinMethods.forEach(methodName => definedVariables.add(methodName));

    // 第二遍：验证每行代码
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        // 跳过注释行
        if (trimmedLine.startsWith('//')) return;

        // 1. 检查API调用（简写形式：F., D., O., S., I., U., H.）
        const apiCallMatches = line.matchAll(/([FDSOIUH])\.(\w+)/g);
        for (const match of apiCallMatches) {
            const [fullMatch, api, method] = match;
            const startColumn = line.indexOf(fullMatch) + 1;
            const endColumn = startColumn + fullMatch.length;

            // 检查是否是对象属性赋值（如 _style.color = xxx），如果是则跳过验证
            const beforeMatch = line.substring(0, line.indexOf(fullMatch)).trim();
            const afterMatch = line.substring(line.indexOf(fullMatch) + fullMatch.length);
            
            // 检测对象属性赋值的模式：变量.属性 = 值
            // 检查前面是否有变量名，后面有等号，且没有括号（不是函数调用）
            const hasAssignment = line.includes('=');
            const hasFunctionCall = beforeMatch.includes('(') || afterMatch.includes('(');
            const isPropertyAssignment = hasAssignment && !hasFunctionCall && 
                                      beforeMatch.match(/^\s*\w+\s*$/) && 
                                      afterMatch.match(/^\s*=\s*/);

            if (isPropertyAssignment) {
                // 这是对象属性赋值，跳过API验证
                continue;
            }

            // 检查I和S方法是否在赋值语句中使用
            if ((api === 'I' || api === 'S') && !isValidAPIMethod(api, method)) {
                errors.push({
                    line: lineNumber,
                    column: startColumn,
                    message: `无效的API调用: ${api}.${method}`,
                    severity: 'error',
                    endColumn: endColumn
                });
            } else if ((api === 'I' || api === 'S') && isValidAPIMethod(api, method)) {
                // 检查I和S方法的使用限制
                const beforeMatch = line.substring(0, line.indexOf(fullMatch)).trim();
                const hasAssignment = beforeMatch.includes('=');

                // 检查是否在函数参数中使用（即使整行有赋值）
                const beforeApiCall = line.substring(0, line.indexOf(fullMatch));
                const hasFunctionCall = beforeApiCall.includes('(');

                if (!hasAssignment || hasFunctionCall) {
                    // 检查是否在函数参数中使用
                    errors.push({
                        line: lineNumber,
                        column: startColumn,
                        message: `${api}.${method} 只能在赋值语句中使用`,
                        severity: 'error',
                        endColumn: endColumn
                    });
                } else {
                    // 检查是否在赋值语句中使用了变量
                    const afterMatch = line.substring(line.indexOf(fullMatch) + fullMatch.length);
                    const firstParam = afterMatch.match(/\(([^,)]+)/);

                    if (firstParam) {
                        const param = firstParam[1].trim();
                        // 检查参数是否是变量名（不是字符串、数字、颜色值、布尔字面量或常量）
                        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param) &&
                            !param.startsWith("'") &&
                            !param.startsWith('"') &&
                            !param.startsWith('#') &&  // 排除颜色值
                            !/^\d+$/.test(param) &&
                            param !== 'true' && param !== 'false' &&  // 排除布尔字面量
                            !CONSTANTS.includes(param) &&
                            !globalVariables.includes(param) &&
                            !globalFunctions.includes(param) &&
                            !builtinMethods.includes(param) &&
                            !definedVariables.has(param)) {
                            errors.push({
                                line: lineNumber,
                                column: startColumn,
                                message: `${api}.${method} 不能使用变量作为参数，请直接写值`,
                                severity: 'error',
                                endColumn: endColumn
                            });
                        }
                    }
                }
            } else if (!isValidAPIMethod(api, method)) {
                // 其他API的常规检查
                errors.push({
                    line: lineNumber,
                    column: startColumn,
                    message: `无效的API调用: ${api}.${method}`,
                    severity: 'error',
                    endColumn: endColumn
                });
            } else {
                // 暂时禁用API调用参数中的变量未定义检查
                // 等后面系统性地完善
            }
        }

        // 1.5. 检查API调用（完整形式：formula., draw., output., input., style., util., http., maindraw., MD.）
        const fullApiCallMatches = line.matchAll(/(formula|draw|output|input|style|util|http|maindraw|MD)\.(\w+)/g);
        for (const match of fullApiCallMatches) {
            const [fullMatch, api, method] = match;
            const startColumn = line.indexOf(fullMatch) + 1;
            const endColumn = startColumn + fullMatch.length;

            // 映射完整形式到简写形式
            const apiMapping = {
                'formula': 'F',
                'draw': 'D',
                'output': 'O',
                'input': 'I',
                'style': 'S',
                'util': 'U',
                'http': 'H',
                'maindraw': 'D',
                'MD': 'D'
            };

            const shortApi = apiMapping[api];
            if (!shortApi) continue;

            // 检查是否是对象属性赋值（如 _style.color = xxx），如果是则跳过验证
            const beforeMatch = line.substring(0, line.indexOf(fullMatch)).trim();
            const afterMatch = line.substring(line.indexOf(fullMatch) + fullMatch.length);
            
            // 检测对象属性赋值的模式：变量.属性 = 值
            // 检查前面是否有变量名，后面有等号，且没有括号（不是函数调用）
            const hasAssignment = line.includes('=');
            const hasFunctionCall = beforeMatch.includes('(') || afterMatch.includes('(');
            const isPropertyAssignment = hasAssignment && !hasFunctionCall && 
                                      beforeMatch.match(/^\s*\w+\s*$/) && 
                                      afterMatch.match(/^\s*=\s*/);

            if (isPropertyAssignment) {
                // 这是对象属性赋值，跳过API验证
                continue;
            }

            // 使用相同的验证逻辑
            if ((shortApi === 'I' || shortApi === 'S') && !isValidAPIMethod(shortApi, method)) {
                errors.push({
                    line: lineNumber,
                    column: startColumn,
                    message: `无效的API调用: ${api}.${method}`,
                    severity: 'error',
                    endColumn: endColumn
                });
            } else if ((shortApi === 'I' || shortApi === 'S') && isValidAPIMethod(shortApi, method)) {
                // 检查I和S方法的使用限制
                const beforeMatch = line.substring(0, line.indexOf(fullMatch)).trim();
                const hasAssignment = beforeMatch.includes('=');

                // 检查是否在函数参数中使用（即使整行有赋值）
                const beforeApiCall = line.substring(0, line.indexOf(fullMatch));
                const hasFunctionCall = beforeApiCall.includes('(');

                if (!hasAssignment || hasFunctionCall) {
                    // 检查是否在函数参数中使用
                    errors.push({
                        line: lineNumber,
                        column: startColumn,
                        message: `${api}.${method} 只能在赋值语句中使用`,
                        severity: 'error',
                        endColumn: endColumn
                    });
                } else {
                    // 检查是否在赋值语句中使用了变量
                    const afterMatch = line.substring(line.indexOf(fullMatch) + fullMatch.length);
                    const firstParam = afterMatch.match(/\(([^,)]+)/);

                    if (firstParam) {
                        const param = firstParam[1].trim();
                        // 检查参数是否是变量名（不是字符串、数字、颜色值、布尔字面量或常量）
                        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param) &&
                            !param.startsWith("'") &&
                            !param.startsWith('"') &&
                            !param.startsWith('#') &&  // 排除颜色值
                            !/^\d+$/.test(param) &&
                            param !== 'true' && param !== 'false' &&  // 排除布尔字面量
                            !CONSTANTS.includes(param) &&
                            !globalVariables.includes(param) &&
                            !globalFunctions.includes(param) &&
                            !builtinMethods.includes(param) &&
                            !definedVariables.has(param)) {
                            errors.push({
                                line: lineNumber,
                                column: startColumn,
                                message: `${api}.${method} 不能使用变量作为参数，请直接写值`,
                                severity: 'error',
                                endColumn: endColumn
                            });
                        }
                    }
                }
            } else if (!isValidAPIMethod(shortApi, method)) {
                // 其他API的常规检查
                errors.push({
                    line: lineNumber,
                    column: startColumn,
                    message: `无效的API调用: ${api}.${method}`,
                    severity: 'error',
                    endColumn: endColumn
                });
            } else {
                // 暂时禁用API调用参数中的变量未定义检查
                // 等后面系统性地完善
            }
        }

        // 1.5. 检查无效的API对象使用（如 "D D"）
        const invalidApiUsage = line.match(/\b([FDSOIUH])\s+([FDSOIUH])\b/);
        if (invalidApiUsage) {
            const [, api1, api2] = invalidApiUsage;
            const startColumn = line.indexOf(invalidApiUsage[0]) + 1;
            const endColumn = startColumn + invalidApiUsage[0].length;

            errors.push({
                line: lineNumber,
                column: startColumn,
                message: `无效的语法: ${api1} ${api2}，应该是 ${api1}.方法名() 或 ${api2}.方法名()`,
                severity: 'error',
                endColumn: endColumn
            });
        }

        // 2. 检查未闭合的括号（暂时禁用，等以后实现更复杂的语法检查）
        // 只在单行内检查，避免误判多行的情况
        /*
        if (!line.includes('=>') && !line.includes('function')) {
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;
            if (openParens > closeParens) {
                const lastOpenParenIndex = line.lastIndexOf('(');
                errors.push({
                    line: lineNumber,
                    column: lastOpenParenIndex + 1,
                    message: '缺少闭合括号 )',
                    severity: 'error',
                    endColumn: lastOpenParenIndex + 2 // 覆盖整个括号
                });
            }
        }
        */

        // 3. 检查未闭合的引号
        const singleQuotes = (line.match(/'/g) || []).length;
        const doubleQuotes = (line.match(/"/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            const lastSingleQuoteIndex = line.lastIndexOf("'");
            errors.push({
                line: lineNumber,
                column: lastSingleQuoteIndex + 1,
                message: "缺少闭合单引号 '",
                severity: 'error',
                endColumn: lastSingleQuoteIndex + 2 // 覆盖整个引号
            });
        }
        if (doubleQuotes % 2 !== 0) {
            const lastDoubleQuoteIndex = line.lastIndexOf('"');
            errors.push({
                line: lineNumber,
                column: lastDoubleQuoteIndex + 1,
                message: '缺少闭合双引号 "',
                severity: 'error',
                endColumn: lastDoubleQuoteIndex + 2 // 覆盖整个引号
            });
        }

        // 4. 检查常见的语法错误（暂时禁用分号检查）
        // 检查是否以分号结尾（可选）
        /*
        if (trimmedLine && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{') && !trimmedLine.endsWith('}')) {
          // 检查是否是赋值语句但没有分号
          if (trimmedLine.includes('=') && !trimmedLine.includes('==') && !trimmedLine.includes('===')) {
            errors.push({
              line: lineNumber,
              column: line.length + 1,
              message: '建议在语句末尾添加分号 ;',
              severity: 'warning'
            });
          }
        }
        */

        // 5. 检查变量名规范
        // 检查赋值语句中的变量名
        const varAssignments = line.matchAll(/(^|[^\.\w])([A-Za-z_]\w*)\s*=+/g)
        for (const match of varAssignments) {
            const [, , varName] = match
            const varNameIndex = line.indexOf(varName)

            // 检查变量名是否是保留字
            if (RESERVED_WORDS.includes(varName)) {
                errors.push({
                    line: lineNumber,
                    column: varNameIndex + 1,
                    message: `不能重新定义保留字: ${varName}`,
                    severity: 'error',
                    endColumn: varNameIndex + varName.length + 1 // 覆盖整个变量名
                })
            }
            // 检查变量名是否以数字开头
            else if (/^\d/.test(varName)) {
                errors.push({
                    line: lineNumber,
                    column: varNameIndex + 1,
                    message: `变量名不能以数字开头: ${varName}`,
                    severity: 'error',
                    endColumn: varNameIndex + varName.length + 1 // 覆盖整个变量名
                })
            }
            // 检查变量名是否包含特殊字符
            else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
                errors.push({
                    line: lineNumber,
                    column: varNameIndex + 1,
                    message: `变量名包含非法字符: ${varName}`,
                    severity: 'error',
                    endColumn: varNameIndex + varName.length + 1 // 覆盖整个变量名
                })
            }
        }

        // 5.5. 检查变量未定义（基础语法错误检查）
        // 暂时禁用，等后面系统性地完善
        /*
        // 只检查真正的变量使用，不检查函数调用
        
        // 检查独立的变量名（不在函数调用中的变量）
        // 匹配变量名但不匹配函数调用
        const variableMatches = line.matchAll(/\b(\w+)\b/g);
        for (const match of variableMatches) {
            const [fullMatch, varName] = match;
            const varNameIndex = line.indexOf(fullMatch);
            
            // 检查这个变量名是否在函数调用中
            const beforeMatch = line.substring(0, varNameIndex);
            const afterMatch = line.substring(varNameIndex + fullMatch.length);
            
            // 如果后面紧跟着括号，说明是函数调用，跳过
            if (afterMatch.trim().startsWith('(')) {
                continue;
            }
            
            // 如果前面有function关键字，说明是函数声明，跳过
            if (beforeMatch.trim().endsWith('function')) {
                continue;
            }
            
            // 排除已知的API对象、关键字、常量等
            if (!['F', 'D', 'O', 'S', 'I', 'U', 'H', 'Math', 'dataList', 'visibleList'].includes(varName) &&
                !globalFunctions.includes(varName) &&
                !globalVariables.includes(varName) &&
                !builtinMethods.includes(varName) &&
                !KEYWORDS.includes(varName) &&
                !CONSTANTS.includes(varName) &&
                !definedVariables.has(varName)) {
                
                // 检查是否在字符串字面量中
                const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
                const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
                const isInStringLiteral = (singleQuotesBefore % 2 === 1) || (doubleQuotesBefore % 2 === 1);
                
                if (!isInStringLiteral) {
                    errors.push({
                        line: lineNumber,
                        column: varNameIndex + 1,
                        message: `变量未定义: ${varName}`,
                        severity: 'error',
                        endColumn: varNameIndex + varName.length + 1
                    });
                }
            }
        }
        */

        // 检查独立的变量名（没有赋值的）
        // 只匹配以数字开头，后面跟着字母的变量名（排除纯数字和字符串字面量）
        // 排除赋值语句中的变量名
        if (!line.includes('=')) {
            const standaloneVars = line.matchAll(/\b(\d+[a-zA-Z_]\w*)\b/g);
            for (const match of standaloneVars) {
                const [fullMatch, varName] = match;
                const varNameIndex = line.indexOf(fullMatch);

                // 检查是否在字符串字面量中
                const beforeMatch = line.substring(0, varNameIndex);
                const afterMatch = line.substring(varNameIndex + fullMatch.length);

                // 计算引号数量来判断是否在字符串中
                const singleQuotesBefore = (beforeMatch.match(/'/g) || []).length;
                const singleQuotesAfter = (afterMatch.match(/'/g) || []).length;
                const doubleQuotesBefore = (beforeMatch.match(/"/g) || []).length;
                const doubleQuotesAfter = (afterMatch.match(/"/g) || []).length;

                // 如果单引号或双引号数量是奇数，说明在字符串字面量中
                const isInStringLiteral = (singleQuotesBefore % 2 === 1) || (doubleQuotesBefore % 2 === 1);

                if (!isInStringLiteral) {
                    errors.push({
                        line: lineNumber,
                        column: varNameIndex + 1,
                        message: `变量名不能以数字开头: ${varName}`,
                        severity: 'error',
                        endColumn: varNameIndex + fullMatch.length + 1 // 覆盖整个变量名
                    });
                }
            }
        }

        // 6. 检查保留字的重新定义（如 dataList = xxx, F = xxx 等）
        // 只检查赋值语句中的保留字重新定义
        if (line.includes('=')) {
            const assignmentMatch = line.match(/^\s*(\w+)\s*=/);
            if (assignmentMatch) {
                const varName = assignmentMatch[1];
                if (RESERVED_WORDS.includes(varName)) {
                    const varNameIndex = line.indexOf(varName);
                    errors.push({
                        line: lineNumber,
                        column: varNameIndex + 1,
                        message: `保留字 ${varName} 不能被重新定义`,
                        severity: 'error',
                        endColumn: varNameIndex + varName.length + 1
                    });
                }
            }
        }

        // 7. 检查常量使用
        CONSTANTS.forEach(constant => {
            const regex = new RegExp(`\\b${constant}\\b`, 'g');
            const matches = line.match(regex);
            if (matches) {
                // 常量使用是合法的，这里可以添加其他验证逻辑
            }
        });

        // 7. 检查空行后的代码（可选）
        if (index > 0 && lines[index - 1].trim() === '' && trimmedLine && !trimmedLine.startsWith('//')) {
            // 空行后的代码，可以添加特殊检查
        }
    });

    return errors;
}

// ==================== 代码补全配置 ====================

/**
 * 获取代码补全建议
 * @param {string} context - 当前上下文（如 "F.", "D." 等）
 * @returns {Array} 补全建议列表
 */
function getCompletionSuggestions(context = '') {
    if (!COMPLETION_ENABLED) return [];

    const suggestions = [];

    // 根据上下文提供不同的建议
    if (context.includes('F.')) {
        getAPIMethods('F').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `F.${method} - 公式方法`
            });
        });
    } else if (context.includes('D.')) {
        getAPIMethods('D').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `D.${method} - 绘制方法`
            });
        });
    } else if (context.includes('O.')) {
        getAPIMethods('O').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `O.${method} - 输出方法`
            });
        });
    } else if (context.includes('U.')) {
        getAPIMethods('U').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `U.${method} - 工具方法`
            });
        });
    } else if (context.includes('H.')) {
        getAPIMethods('H').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `H.${method} - HTTP方法`
            });
        });
    } else if (context.includes('I.')) {
        getAPIMethods('I').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `I.${method} - 输入方法`
            });
        });
    } else if (context.includes('S.')) {
        getAPIMethods('S').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `S.${method} - 样式方法`
            });
        });
    } else if (context.includes('formula.')) {
        getAPIMethods('F').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `formula.${method} - 公式方法`
            });
        });
    } else if (context.includes('draw.')) {
        getAPIMethods('D').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `draw.${method} - 绘制方法`
            });
        });
    } else if (context.includes('output.')) {
        getAPIMethods('O').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `output.${method} - 输出方法`
            });
        });
    } else if (context.includes('input.')) {
        getAPIMethods('I').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `input.${method} - 输入方法`
            });
        });
    } else if (context.includes('style.')) {
        getAPIMethods('S').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `style.${method} - 样式方法`
            });
        });
    } else if (context.includes('util.')) {
        getAPIMethods('U').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `util.${method} - 工具方法`
            });
        });
    } else if (context.includes('http.')) {
        getAPIMethods('H').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `http.${method} - HTTP方法`
            });
        });
    } else if (context.includes('maindraw.')) {
        getAPIMethods('D').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `maindraw.${method} - 绘制方法`
            });
        });
    } else if (context.includes('MD.')) {
        getAPIMethods('D').forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `MD.${method} - 绘制方法`
            });
        });
    } else if (context.includes('Math.')) {
        // 当输入 Math. 时，显示Math对象的常用方法
        const mathMethods = ['abs', 'ceil', 'floor', 'max', 'min', 'pow', 'random', 'round', 'sqrt', 'sin', 'cos', 'tan', 'PI', 'E'];
        mathMethods.forEach(method => {
            suggestions.push({
                label: method,
                kind: 'function',
                insertText: `${method}($1)`,
                documentation: `Math.${method} - 数学方法`
            });
        });
    } else {
        // 默认提供所有API对象（简写和完整形式）
        suggestions.push(
            { label: 'F', kind: 'class', insertText: 'F', documentation: '公式对象' },
            { label: 'D', kind: 'class', insertText: 'D', documentation: '绘制对象' },
            { label: 'O', kind: 'class', insertText: 'O', documentation: '输出对象' },
            { label: 'U', kind: 'class', insertText: 'U', documentation: '工具对象' },
            { label: 'H', kind: 'class', insertText: 'H', documentation: 'HTTP对象' },
            { label: 'I', kind: 'class', insertText: 'I', documentation: '输入对象' },
            { label: 'S', kind: 'class', insertText: 'S', documentation: '样式对象' },
            { label: 'formula', kind: 'class', insertText: 'formula', documentation: '公式对象（完整形式）' },
            { label: 'draw', kind: 'class', insertText: 'draw', documentation: '绘制对象（完整形式）' },
            { label: 'maindraw', kind: 'class', insertText: 'maindraw', documentation: '绘制对象（完整形式）' },
            { label: 'MD', kind: 'class', insertText: 'MD', documentation: '绘制对象（完整形式）' },
            { label: 'output', kind: 'class', insertText: 'output', documentation: '输出对象（完整形式）' },
            { label: 'input', kind: 'class', insertText: 'input', documentation: '输入对象（完整形式）' },
            { label: 'style', kind: 'class', insertText: 'style', documentation: '样式对象（完整形式）' },
            { label: 'util', kind: 'class', insertText: 'util', documentation: '工具对象（完整形式）' },
            { label: 'http', kind: 'class', insertText: 'http', documentation: 'HTTP对象（完整形式）' }
        );

        // 添加常量
        CONSTANTS.forEach(constant => {
            suggestions.push({
                label: constant,
                kind: 'constant',
                insertText: constant,
                documentation: `常量: ${constant}`
            });
        });

        // 添加保留字（如 dataList, visibleList 等）
        RESERVED_WORDS.forEach(reserved => {
            // 过滤掉API对象名，避免重复
            if (!['F', 'D', 'O', 'S', 'I', 'U', 'H', 'formula', 'draw', 'output', 'input', 'style', 'util', 'http', 'maindraw', 'MD'].includes(reserved)) {
                suggestions.push({
                    label: reserved,
                    kind: 'variable',
                    insertText: reserved,
                    documentation: `保留字: ${reserved}`
                });
            }
        });

        // 添加关键字（如 var, let, const, function 等）
        KEYWORDS.forEach(keyword => {
            // 过滤掉API对象名，避免重复
            if (!['F', 'D', 'O', 'S', 'I', 'U', 'H', 'Math', 'dataList', 'visibleList'].includes(keyword)) {
                suggestions.push({
                    label: keyword,
                    kind: 'keyword',
                    insertText: keyword,
                    documentation: `关键字: ${keyword}`
                });
            }
        });

        // 添加Math对象本身
        suggestions.push({
            label: 'Math',
            kind: 'class',
            insertText: 'Math',
            documentation: 'Math - 数学对象'
        });

        // 添加全局函数
        const globalFunctions = ['setPrecision', 'setMax', 'setMin'];
        globalFunctions.forEach(func => {
            suggestions.push({
                label: func,
                kind: 'function',
                insertText: `${func}($1)`,
                documentation: `${func} - 全局函数`
            });
        });

        // 添加常用内置方法
        const commonBuiltinMethods = ['forEach', 'map', 'filter', 'reduce', 'find', 'some', 'every', 'includes', 'indexOf', 'slice', 'concat', 'join', 'push', 'pop', 'toString', 'toLowerCase', 'toUpperCase', 'trim', 'split', 'replace'];
        commonBuiltinMethods.forEach(method => {
            suggestions.push({
                label: method,
                kind: 'method',
                insertText: `${method}($1)`,
                documentation: `${method} - JavaScript内置方法`
            });
        });
    }

    return suggestions;
}

// ==================== 语法高亮配置 ====================

/**
 * 获取语法高亮规则
 * @returns {Object} MonacoEditor语法规则
 */
function getSyntaxRules() {
    if (!SYNTAX_HIGHLIGHT_ENABLED) return {};

    return {
        keywords: KEYWORDS,
        operators: ['+', '-', '*', '/', '=', '==', '===', '!=', '!=='],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,

        tokenizer: {
            root: [
                // 注释
                [/\/\/.*$/, 'comment'],
                // 字符串
                [/"/, 'string', '@string'],
                // 数字
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/\d+/, 'number'],
                // API调用：F.xxx, D.xxx, O.xxx 等 - 简化版本
                [/([FDSOIUH])\.(\w+)/, 'keyword.api'],
                // API调用：formula.xxx, draw.xxx, input.xxx 等 - 完整版本
                [/(formula|draw|output|input|style|util|http|maindraw|MD)\.(\w+)/, 'keyword.api'],
                // 常量
                [new RegExp(`\\b(${CONSTANTS.join('|')})\\b`), 'constant'],
                // 操作符
                [/@symbols/, 'operator'],
                // 其他关键字
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }]
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/"/, 'string', '@pop']
            ]
        }
    };
}

// ==================== 导出配置 ====================

// 创建验证对象
const GLScriptValidation = {
    // 配置开关
    VALIDATION_ENABLED,
    COMPLETION_ENABLED,
    SYNTAX_HIGHLIGHT_ENABLED,

    // 常量
    CONSTANTS,
    KEYWORDS,

    // 验证函数
    isValidAPIMethod,
    isValidConstant,
    isValidKeyword,
    validateScript,

    // 补全函数
    getCompletionSuggestions,

    // 语法高亮
    getSyntaxRules,

    // 工具函数
    enableValidation: () => { VALIDATION_ENABLED = true; },
    disableValidation: () => { VALIDATION_ENABLED = false; },
    enableCompletion: () => { COMPLETION_ENABLED = true; },
    disableCompletion: () => { COMPLETION_ENABLED = false; },
    enableSyntaxHighlight: () => { SYNTAX_HIGHLIGHT_ENABLED = true; },
    disableSyntaxHighlight: () => { SYNTAX_HIGHLIGHT_ENABLED = false; }
};

// 导出到全局对象（兼容浏览器环境）
if (typeof window !== 'undefined') {
    window.GLScriptValidation = GLScriptValidation;
}

// 导出为ES6模块（兼容模块环境）
export default GLScriptValidation;

// 单独导出主要函数
export { validateScript, getCompletionSuggestions, getSyntaxRules }; 