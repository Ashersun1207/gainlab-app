import { describe, it, expect } from 'vitest';
import { BUILTIN_SCRIPTS, OVERLAY_INDICATORS } from '../index';

describe('Builtin Scripts — T17 指标脚本注册表', () => {
  const EXPECTED_KEYS = ['MA', 'EMA', 'BOLL', 'VWAP', 'RSI', 'MACD', 'KDJ', 'ATR'];

  it('导出完整的 8 个内置指标', () => {
    expect(Object.keys(BUILTIN_SCRIPTS)).toHaveLength(8);
    for (const key of EXPECTED_KEYS) {
      expect(BUILTIN_SCRIPTS[key]).toBeDefined();
    }
  });

  it('每个脚本有 script 和 position 字段', () => {
    for (const key of EXPECTED_KEYS) {
      const def = BUILTIN_SCRIPTS[key];
      expect(def.script).toBeTypeOf('string');
      expect(def.script.length).toBeGreaterThan(0);
      expect(def.position).toMatch(/^(main|vice)$/);
    }
  });

  it('主图指标 position = main', () => {
    for (const key of ['MA', 'EMA', 'BOLL', 'VWAP']) {
      expect(BUILTIN_SCRIPTS[key].position).toBe('main');
    }
  });

  it('副图指标 position = vice', () => {
    for (const key of ['RSI', 'MACD', 'KDJ', 'ATR']) {
      expect(BUILTIN_SCRIPTS[key].position).toBe('vice');
    }
  });

  it('VP/WRB 不在 BUILTIN_SCRIPTS 中（走 overlay）', () => {
    expect(BUILTIN_SCRIPTS['VP']).toBeUndefined();
    expect(BUILTIN_SCRIPTS['WRB']).toBeUndefined();
  });

  it('OVERLAY_INDICATORS 包含 VP 和 WRB', () => {
    expect(OVERLAY_INDICATORS.has('VP')).toBe(true);
    expect(OVERLAY_INDICATORS.has('WRB')).toBe(true);
    expect(OVERLAY_INDICATORS.size).toBe(2);
  });

  it('脚本包含正确的 @name 元数据注释', () => {
    for (const key of EXPECTED_KEYS) {
      const { script } = BUILTIN_SCRIPTS[key];
      expect(script).toContain(`// @name = ${key}`);
    }
  });

  it('脚本包含正确的 @position 元数据注释', () => {
    for (const key of EXPECTED_KEYS) {
      const { script, position } = BUILTIN_SCRIPTS[key];
      expect(script).toContain(`// @position = ${position}`);
    }
  });

  it('主图脚本使用 D.line 绘图 API', () => {
    for (const key of ['MA', 'EMA', 'BOLL', 'VWAP']) {
      expect(BUILTIN_SCRIPTS[key].script).toContain('D.line(');
    }
  });

  it('副图脚本使用 D.line 或 D.bar 绘图 API', () => {
    for (const key of ['RSI', 'KDJ', 'ATR']) {
      expect(BUILTIN_SCRIPTS[key].script).toContain('D.line(');
    }
    // MACD 用 D.line + D.bar
    expect(BUILTIN_SCRIPTS['MACD'].script).toContain('D.line(');
    expect(BUILTIN_SCRIPTS['MACD'].script).toContain('D.bar(');
  });

  it('RSI 脚本有超买/超卖参考线', () => {
    const { script } = BUILTIN_SCRIPTS['RSI'];
    expect(script).toContain('D.hline(70');
    expect(script).toContain('D.hline(30');
  });

  it('KDJ 变量名不与 D(DrawAPI) 冲突', () => {
    const { script } = BUILTIN_SCRIPTS['KDJ'];
    // KDJ 的 D 值变量应叫 dLine 不叫 d
    expect(script).toContain('dLine');
    // 不应有 `var d =` 这种会遮蔽 DrawAPI 的声明
    expect(script).not.toMatch(/var d\s*=/);
  });

  it('BOLL 脚本有填充区域', () => {
    expect(BUILTIN_SCRIPTS['BOLL'].script).toContain('D.area(');
  });

  it('MACD 柱状图使用回调函数区分红绿', () => {
    const { script } = BUILTIN_SCRIPTS['MACD'];
    expect(script).toContain('function(ctx)');
    expect(script).toContain('#26A69A'); // 涨色
    expect(script).toContain('#EF5350'); // 跌色
  });
});
