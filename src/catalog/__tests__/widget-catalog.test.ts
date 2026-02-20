import { describe, it, expect } from 'vitest';
import { WIDGET_CATALOG, WIDGET_TYPES } from '../widget-catalog';

describe('WIDGET_CATALOG', () => {
  it('should contain exactly 7 widget types', () => {
    expect(WIDGET_TYPES).toHaveLength(7);
    expect(WIDGET_TYPES).toContain('kline');
    expect(WIDGET_TYPES).toContain('heatmap');
    expect(WIDGET_TYPES).toContain('fundamentals');
    expect(WIDGET_TYPES).toContain('volume_profile');
    expect(WIDGET_TYPES).toContain('overlay');
    expect(WIDGET_TYPES).toContain('quote_table');
    expect(WIDGET_TYPES).toContain('sentiment');
  });

  it('every entry should have schema, wrapper, description, examples', () => {
    for (const type of WIDGET_TYPES) {
      const entry = WIDGET_CATALOG[type];
      expect(entry.schema).toBeDefined();
      expect(['kline', 'panel']).toContain(entry.wrapper);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.examples)).toBe(true);
      expect(entry.examples.length).toBeGreaterThan(0);
    }
  });

  it('market enum should include all 10 values', () => {
    // Test via kline schema which uses marketEnum
    const validMarkets = ['crypto', 'us', 'cn', 'hk', 'eu', 'uk', 'jp', 'fx', 'comm', 'metal'];
    for (const m of validMarkets) {
      const result = WIDGET_CATALOG.kline.schema.safeParse({
        type: 'kline',
        symbol: 'TEST',
        market: m,
      });
      expect(result.success, `market "${m}" should be valid`).toBe(true);
    }
  });

  it('kline schema should parse valid data', () => {
    const result = WIDGET_CATALOG.kline.schema.safeParse({
      type: 'kline',
      symbol: 'BTCUSDT',
      market: 'crypto',
      period: '1D',
      indicators: ['MA', 'RSI'],
      showWRB: true,
    });
    expect(result.success).toBe(true);
  });

  it('kline schema should accept optional fields missing', () => {
    const result = WIDGET_CATALOG.kline.schema.safeParse({
      type: 'kline',
      symbol: 'AAPL',
      market: 'us',
    });
    expect(result.success).toBe(true);
  });

  it('kline schema should reject missing required field', () => {
    const result = WIDGET_CATALOG.kline.schema.safeParse({
      type: 'kline',
      market: 'crypto',
      // missing symbol
    });
    expect(result.success).toBe(false);
  });

  it('heatmap schema should parse valid data', () => {
    const result = WIDGET_CATALOG.heatmap.schema.safeParse({
      type: 'heatmap',
      market: 'crypto',
    });
    expect(result.success).toBe(true);
  });

  it('overlay schema should require period', () => {
    const result = WIDGET_CATALOG.overlay.schema.safeParse({
      type: 'overlay',
      symbols: ['BTC', 'ETH'],
      markets: ['crypto', 'crypto'],
      // missing period
    });
    expect(result.success).toBe(false);
  });

  it('sentiment schema should parse with no fields', () => {
    const result = WIDGET_CATALOG.sentiment.schema.safeParse({
      type: 'sentiment',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid market value', () => {
    const result = WIDGET_CATALOG.kline.schema.safeParse({
      type: 'kline',
      symbol: 'TEST',
      market: 'mars',
    });
    expect(result.success).toBe(false);
  });
});
