import { describe, it, expect, vi } from 'vitest';
import { validateWidgetState } from '../validate';

describe('validateWidgetState', () => {
  it('should return validated data for valid kline', () => {
    const result = validateWidgetState({
      type: 'kline',
      symbol: 'BTCUSDT',
      market: 'crypto',
      period: '4h',
    });
    expect(result).not.toBeNull();
    expect(result?.type).toBe('kline');
    expect(result?.symbol).toBe('BTCUSDT');
    expect(result?.market).toBe('crypto');
    expect(result?.period).toBe('4h');
  });

  it('should return validated data for valid heatmap', () => {
    const result = validateWidgetState({
      type: 'heatmap',
      market: 'us',
    });
    expect(result).not.toBeNull();
    expect(result?.type).toBe('heatmap');
    expect(result?.market).toBe('us');
  });

  it('should return validated data for valid sentiment (no extra fields)', () => {
    const result = validateWidgetState({ type: 'sentiment' });
    expect(result).not.toBeNull();
    expect(result?.type).toBe('sentiment');
  });

  it('should return null for null input', () => {
    expect(validateWidgetState(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(validateWidgetState(undefined)).toBeNull();
  });

  it('should return null for non-object input', () => {
    expect(validateWidgetState(42)).toBeNull();
    expect(validateWidgetState('string')).toBeNull();
  });

  it('should return null for missing type field', () => {
    expect(validateWidgetState({ symbol: 'BTC' })).toBeNull();
  });

  it('should return null for unknown type and warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateWidgetState({ type: 'unknown_widget' });
    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Unknown widget type'));
    spy.mockRestore();
  });

  it('should return null for kline missing required symbol', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateWidgetState({
      type: 'kline',
      market: 'crypto',
      // missing symbol
    });
    expect(result).toBeNull();
    spy.mockRestore();
  });

  it('should return null for invalid market value', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateWidgetState({
      type: 'kline',
      symbol: 'BTC',
      market: 'mars',
    });
    expect(result).toBeNull();
    spy.mockRestore();
  });

  it('should keep optional fields as undefined when not provided', () => {
    const result = validateWidgetState({
      type: 'kline',
      symbol: 'AAPL',
      market: 'us',
    });
    expect(result).not.toBeNull();
    expect(result?.period).toBeUndefined();
    expect(result?.indicators).toBeUndefined();
    expect(result?.showWRB).toBeUndefined();
  });
});
