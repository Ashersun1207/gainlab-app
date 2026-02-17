/**
 * V1 脚本引擎配置
 */
import { ScriptEngine } from '../VersionManager';
import { ScriptParser, ScriptInput, ScriptStyle } from './ScriptParser';
import { ScriptInputs } from './ScriptInputs';
import { ScriptStyles } from './ScriptStyles';
import ScriptFormula from './ScriptFormula';
import { ScriptUtils } from './ScriptUtils';
import { SOURCE, TIMEFRAME } from '../../ScriptConstants';
import { ScriptKeywordValidator } from '../../ScriptKeywords';

export const V1Engine: ScriptEngine = {
  version: 1,
  name: 'Script Engine v1',
  description: '基础脚本引擎，支持基本的技术指标和策略脚本',
  features: [
    '基础语法解析',
    '技术指标计算', 
    '图形绘制',
    '参数配置',
    '样式设置'
  ],
  
  // 核心组件
  Parser: ScriptParser,
  Inputs: ScriptInputs,
  Styles: ScriptStyles,
  Outputs: null, // ScriptOutputs 已删除，使用新的绘图架构
  Formula: ScriptFormula,
  Utils: ScriptUtils,
  Constants: { SOURCE, TIMEFRAME },
  Keywords: ScriptKeywordValidator,
  
  // 版本特定方法
  validateScript(script: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // 使用 v1 解析器验证
      const parsed = ScriptParser.parse(script);
      if (parsed.errors.length > 0) {
        errors.push(...parsed.errors);
      }
      
      // 关键字验证在 ScriptManager 中已经处理
      // 这里只做基础语法验证
      
    } catch (error) {
      errors.push(`脚本解析失败: ${error}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}; 