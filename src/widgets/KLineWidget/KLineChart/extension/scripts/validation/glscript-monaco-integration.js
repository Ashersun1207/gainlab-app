/**
 * MonacoEditor 集成示例
 * 展示如何使用 glscript-validation.js 配置文件
 */

// 确保验证配置文件已加载
if (typeof window.GLScriptValidation === 'undefined') {
  console.error('GLScriptValidation 配置文件未加载！');
}

/**
 * 初始化MonacoEditor的GLScript支持
 * @param {Object} monaco - MonacoEditor实例
 */
function initGLScriptSupport(monaco) {
  const validation = window.GLScriptValidation;
  if (!validation) {
    console.error('验证配置未找到');
    return;
  }
  
  // 确保monaco对象可用
  if (!monaco) {
    console.error('MonacoEditor实例未找到');
    return;
  }

  // 1. 注册自定义语言
  monaco.languages.register({ id: 'glscript' });

  // 2. 设置语法高亮（如果启用）
  if (validation.SYNTAX_HIGHLIGHT_ENABLED) {
    const syntaxRules = validation.getSyntaxRules();
    monaco.languages.setMonarchTokensProvider('glscript', syntaxRules);
  }

  // 3. 注册代码补全提供者（如果启用）
  if (validation.COMPLETION_ENABLED) {
    monaco.languages.registerCompletionItemProvider('glscript', {
      triggerCharacters: ['.'], // 设置触发字符为点号
      provideCompletionItems: (model, position, context) => {
        try {
          // 获取当前行的内容
          const lineContent = model.getLineContent(position.lineNumber);
          
          // 获取光标位置之前的文本作为上下文
          const textUntilPosition = lineContent.substring(0, position.column - 1);
          
          // 获取当前单词（用于过滤建议）
          const wordUntilPosition = model.getWordUntilPosition(position);
          const currentWord = wordUntilPosition.word;
          
          // 获取补全建议
          let suggestions = validation.getCompletionSuggestions(textUntilPosition);
          
          // 如果没有建议，返回空数组
          if (!suggestions || suggestions.length === 0) {
            return { suggestions: [] };
          }
          
          // 如果用户正在输入（不是通过触发字符），过滤建议以匹配当前单词
          if (context.triggerKind === monaco.languages.CompletionTriggerKind.Invoke || 
              (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter && currentWord)) {
            // 如果当前有输入，过滤建议
            if (currentWord && currentWord.length > 0) {
              suggestions = suggestions.filter(suggestion => {
                const label = suggestion.label || suggestion.insertText || '';
                return label.toLowerCase().startsWith(currentWord.toLowerCase());
              });
            }
          }
          
          // 转换为MonacoEditor格式
          return {
            suggestions: suggestions.map(suggestion => {
              const label = suggestion.label || suggestion.insertText || '';
              const insertText = suggestion.insertText || suggestion.label || '';
              
              return {
                label: label,
                kind: getMonacoCompletionItemKind(monaco, suggestion.kind),
                insertText: insertText,
                insertTextRules: insertText.includes('$1') 
                  ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet 
                  : undefined,
                documentation: suggestion.documentation || suggestion.detail || '',
                detail: suggestion.detail || suggestion.documentation || '',
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: wordUntilPosition.startColumn,
                  endLineNumber: position.lineNumber,
                  endColumn: wordUntilPosition.endColumn
                }
              };
            })
          };
        } catch (error) {
          console.warn('代码补全提供失败:', error);
          return { suggestions: [] };
        }
      }
    });
  }

  // 4. 注册诊断提供者（如果启用）
  if (validation.VALIDATION_ENABLED) {
    // 诊断功能已经在scriptEditor.vue中通过编辑器实例处理
    // 这里不需要额外的注册
  }
}

/**
 * 将内部类型转换为MonacoEditor类型
 * @param {Object} monaco - MonacoEditor实例
 * @param {string} kind - 内部类型
 * @returns {number} MonacoEditor类型
 */
function getMonacoCompletionItemKind(monaco, kind) {
  const kinds = {
    'function': monaco.languages.CompletionItemKind.Function,
    'class': monaco.languages.CompletionItemKind.Class,
    'constant': monaco.languages.CompletionItemKind.Constant,
    'keyword': monaco.languages.CompletionItemKind.Keyword,
    'variable': monaco.languages.CompletionItemKind.Variable
  };
  return kinds[kind] || monaco.languages.CompletionItemKind.Text;
}

/**
 * 将内部严重性转换为MonacoEditor严重性
 * @param {Object} monaco - MonacoEditor实例
 * @param {string} severity - 内部严重性
 * @returns {number} MonacoEditor严重性
 */
function getMonacoMarkerSeverity(monaco, severity) {
  const severities = {
    'error': monaco.MarkerSeverity.Error,
    'warning': monaco.MarkerSeverity.Warning,
    'info': monaco.MarkerSeverity.Info,
    'hint': monaco.MarkerSeverity.Hint
  };
  return severities[severity] || monaco.MarkerSeverity.Error;
}

/**
 * 创建GLScript编辑器
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 编辑器选项
 * @returns {Object} MonacoEditor实例
 */
function createGLScriptEditor(container, options = {}) {
  // 默认配置
  const defaultOptions = {
    language: 'glscript',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible'
    },
    ...options
  };

  // 创建编辑器
  const editor = monaco.editor.create(container, defaultOptions);
  
  return editor;
}

/**
 * 动态更新验证配置
 * @param {Object} newConfig - 新配置
 */
function updateValidationConfig(newConfig) {
  const validation = window.GLScriptValidation;
  if (!validation) return;

  // 更新开关
  if (newConfig.VALIDATION_ENABLED !== undefined) {
    validation.VALIDATION_ENABLED = newConfig.VALIDATION_ENABLED;
  }
  if (newConfig.COMPLETION_ENABLED !== undefined) {
    validation.COMPLETION_ENABLED = newConfig.COMPLETION_ENABLED;
  }
  if (newConfig.SYNTAX_HIGHLIGHT_ENABLED !== undefined) {
    validation.SYNTAX_HIGHLIGHT_ENABLED = newConfig.SYNTAX_HIGHLIGHT_ENABLED;
  }

  // 更新API方法列表
  if (newConfig.F_METHODS) validation.F_METHODS = newConfig.F_METHODS;
  if (newConfig.D_METHODS) validation.D_METHODS = newConfig.D_METHODS;
  if (newConfig.O_METHODS) validation.O_METHODS = newConfig.O_METHODS;
  if (newConfig.U_METHODS) validation.U_METHODS = newConfig.U_METHODS;
  if (newConfig.H_METHODS) validation.H_METHODS = newConfig.H_METHODS;
  if (newConfig.I_METHODS) validation.I_METHODS = newConfig.I_METHODS;
  if (newConfig.S_METHODS) validation.S_METHODS = newConfig.S_METHODS;
  if (newConfig.CONSTANTS) validation.CONSTANTS = newConfig.CONSTANTS;
  if (newConfig.KEYWORDS) validation.KEYWORDS = newConfig.KEYWORDS;
}

/**
 * 获取当前验证配置
 * @returns {Object} 当前配置
 */
function getValidationConfig() {
  const validation = window.GLScriptValidation;
  if (!validation) return null;

  return {
    VALIDATION_ENABLED: validation.VALIDATION_ENABLED,
    COMPLETION_ENABLED: validation.COMPLETION_ENABLED,
    SYNTAX_HIGHLIGHT_ENABLED: validation.SYNTAX_HIGHLIGHT_ENABLED,
    F_METHODS: validation.F_METHODS,
    D_METHODS: validation.D_METHODS,
    O_METHODS: validation.O_METHODS,
    U_METHODS: validation.U_METHODS,
    H_METHODS: validation.H_METHODS,
    I_METHODS: validation.I_METHODS,
    S_METHODS: validation.S_METHODS,
    CONSTANTS: validation.CONSTANTS,
    KEYWORDS: validation.KEYWORDS
  };
}

// 创建集成对象
const GLScriptMonacoIntegration = {
  initGLScriptSupport,
  createGLScriptEditor,
  updateValidationConfig,
  getValidationConfig
};

// 导出到全局对象（兼容浏览器环境）
if (typeof window !== 'undefined') {
  window.GLScriptMonacoIntegration = GLScriptMonacoIntegration;
}

// 导出为ES6模块（兼容模块环境）
export default GLScriptMonacoIntegration; 