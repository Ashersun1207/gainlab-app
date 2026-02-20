/**
 * Widget Catalog — 端到端集成测试
 *
 * 验证完整链路：
 * 1. validateWidgetState 拦截非法数据
 * 2. validateWidgetState 通过合法数据
 * 3. isKlineWidget 正确路由 kline vs panel
 * 4. buildWidgetPrompt 覆盖所有已注册 Widget
 * 5. 新增 Widget 只需 catalog 一处改动（结构验证）
 * 6. 恶意/边界输入不崩溃
 */

import { describe, it, expect } from 'vitest';
import { validateWidgetState } from '../validate';
import { buildWidgetPrompt } from '../build-prompt';
import { isKlineWidget, getWidget, registerWidget } from '../widget-registry';
import { WIDGET_CATALOG, WIDGET_TYPES } from '../widget-catalog';
import { lazy } from 'react';

// ── 注册所有 Widget（模拟 AgentView 的注册行为）──
function setupRegistry() {
  // kline 类
  for (const type of ['kline', 'volume_profile', 'overlay'] as const) {
    registerWidget(type, {
      component: lazy(() => Promise.resolve({ default: () => null })) as ReturnType<typeof lazy>,
      wrapper: 'kline',
      title: type,
      propsMapper: (ws) => ws as Record<string, unknown>,
    });
  }
  // panel 类
  for (const type of ['heatmap', 'fundamentals', 'quote_table', 'sentiment'] as const) {
    registerWidget(type, {
      component: lazy(() => Promise.resolve({ default: () => null })) as ReturnType<typeof lazy>,
      wrapper: 'panel',
      title: type,
      propsMapper: (ws) => ws as Record<string, unknown>,
    });
  }
}

setupRegistry();

describe('Widget Catalog — 端到端集成', () => {
  // ── 1. 合法数据通过验证 ──
  describe('合法 widgetState 验证通过', () => {
    const validCases = [
      { type: 'kline', symbol: 'BTCUSDT', market: 'crypto', period: '1D' },
      { type: 'kline', symbol: 'AAPL', market: 'us' }, // period optional
      { type: 'kline', symbol: 'BTCUSDT', market: 'crypto', indicators: ['MA', 'BOLL'], showWRB: true },
      { type: 'heatmap', market: 'crypto' },
      { type: 'heatmap', market: 'us', sector: 'tech', metric: 'market_cap' },
      { type: 'fundamentals', symbol: 'NVDA', market: 'us' },
      { type: 'volume_profile', symbol: 'ETHUSDT', market: 'crypto' },
      { type: 'overlay', symbols: ['BTC', 'ETH'], markets: ['crypto', 'crypto'], period: '1D' },
      { type: 'quote_table', symbols: ['AAPL', 'MSFT', 'GOOG'], market: 'us' },
      { type: 'sentiment' },
    ];

    for (const ws of validCases) {
      it(`${ws.type}${ws.type === 'kline' ? ` (${(ws as { symbol?: string }).symbol})` : ''} 应通过`, () => {
        const result = validateWidgetState(ws);
        expect(result).not.toBeNull();
        expect(result?.type).toBe(ws.type);
      });
    }
  });

  // ── 2. 非法数据被拦截（不崩溃） ──
  describe('非法 widgetState 被拦截', () => {
    const invalidCases: [string, unknown][] = [
      ['null', null],
      ['undefined', undefined],
      ['空对象', {}],
      ['无 type', { symbol: 'BTC', market: 'crypto' }],
      ['type 不是字符串', { type: 123 }],
      ['未知 type', { type: 'unknown_widget' }],
      ['market 越界', { type: 'kline', symbol: 'BTC', market: 'mars' }],
      ['缺必填 symbol', { type: 'kline', market: 'crypto' }],
      ['symbol 类型错', { type: 'kline', symbol: 123, market: 'crypto' }],
      ['overlay 缺 period', { type: 'overlay', symbols: ['BTC'], markets: ['crypto'] }],
      ['quote_table symbols 不是数组', { type: 'quote_table', symbols: 'AAPL', market: 'us' }],
      ['fundamentals 缺 market', { type: 'fundamentals', symbol: 'AAPL' }],
      ['数组', [{ type: 'kline' }]],
      ['字符串', 'kline'],
      ['数字', 42],
    ];

    for (const [label, input] of invalidCases) {
      it(`${label} → null`, () => {
        const result = validateWidgetState(input);
        expect(result).toBeNull();
      });
    }
  });

  // ── 3. 所有 10 个 market 枚举值通过 ──
  describe('market 枚举完整覆盖', () => {
    const markets = ['crypto', 'us', 'cn', 'hk', 'eu', 'uk', 'jp', 'fx', 'comm', 'metal'];
    for (const m of markets) {
      it(`market="${m}" 通过`, () => {
        const result = validateWidgetState({ type: 'kline', symbol: 'TEST', market: m });
        expect(result).not.toBeNull();
      });
    }
  });

  // ── 4. isKlineWidget 路由正确 ──
  describe('kline vs panel 路由', () => {
    it('kline → true', () => expect(isKlineWidget('kline')).toBe(true));
    it('volume_profile → true', () => expect(isKlineWidget('volume_profile')).toBe(true));
    it('overlay → true', () => expect(isKlineWidget('overlay')).toBe(true));
    it('heatmap → false', () => expect(isKlineWidget('heatmap')).toBe(false));
    it('fundamentals → false', () => expect(isKlineWidget('fundamentals')).toBe(false));
    it('quote_table → false', () => expect(isKlineWidget('quote_table')).toBe(false));
    it('sentiment → false', () => expect(isKlineWidget('sentiment')).toBe(false));
    it('unknown → false', () => expect(isKlineWidget('nonexistent')).toBe(false));
  });

  // ── 5. buildWidgetPrompt 覆盖所有 Widget ──
  describe('buildWidgetPrompt 完整性', () => {
    const prompt = buildWidgetPrompt();

    it('包含所有 7 个 widget type', () => {
      for (const type of WIDGET_TYPES) {
        expect(prompt).toContain(`### ${type}`);
      }
    });

    it('包含所有 10 个 market 枚举值', () => {
      for (const m of ['crypto', 'us', 'cn', 'hk', 'eu', 'uk', 'jp', 'fx', 'comm', 'metal']) {
        expect(prompt).toContain(m);
      }
    });

    it('包含 Output Format 说明', () => {
      expect(prompt).toContain('Output Format');
      expect(prompt).toContain('widgetState');
    });

    it('每个 widget 有 description', () => {
      for (const type of WIDGET_TYPES) {
        expect(prompt).toContain(WIDGET_CATALOG[type].description);
      }
    });

    it('每个 widget 有 example', () => {
      for (const type of WIDGET_TYPES) {
        for (const ex of WIDGET_CATALOG[type].examples) {
          expect(prompt).toContain(ex);
        }
      }
    });
  });

  // ── 6. Catalog 与 Registry 一致性 ──
  describe('Catalog ↔ Registry 一致性', () => {
    it('所有 catalog type 在 registry 中有注册', () => {
      for (const type of WIDGET_TYPES) {
        expect(getWidget(type)).toBeDefined();
      }
    });

    it('catalog wrapper 与 registry wrapper 一致', () => {
      for (const type of WIDGET_TYPES) {
        const catalogWrapper = WIDGET_CATALOG[type].wrapper;
        const registryEntry = getWidget(type);
        expect(registryEntry?.wrapper).toBe(catalogWrapper);
      }
    });
  });

  // ── 7. 验证通过的数据保持原值（不丢字段） ──
  describe('验证后数据完整性', () => {
    it('kline 所有字段保留', () => {
      const input = {
        type: 'kline' as const,
        symbol: 'BTCUSDT',
        market: 'crypto' as const,
        period: '4H',
        indicators: ['MA', 'RSI'],
        chartType: 'candle_solid',
        showWRB: true,
      };
      const result = validateWidgetState(input);
      expect(result).toEqual(input);
    });

    it('overlay 所有字段保留', () => {
      const input = {
        type: 'overlay' as const,
        symbols: ['BTC', 'ETH', 'SOL'],
        markets: ['crypto' as const, 'crypto' as const, 'crypto' as const],
        period: '1W',
      };
      const result = validateWidgetState(input);
      expect(result).toEqual(input);
    });
  });

  // ── 8. 额外字段被 Zod strip 或 passthrough ──
  describe('额外字段处理', () => {
    it('额外字段不导致验证失败', () => {
      const input = { type: 'sentiment', extraField: 'should not crash' };
      const result = validateWidgetState(input);
      // Zod strict 默认 strip extra，所以 result 有值但不含 extraField
      expect(result).not.toBeNull();
      expect(result?.type).toBe('sentiment');
    });
  });
});
