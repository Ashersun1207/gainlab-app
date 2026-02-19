import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScene } from '../useScene';

// Mock window.history
const pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation(() => {});
const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

beforeEach(() => {
  pushStateSpy.mockClear();
  replaceStateSpy.mockClear();
  // Reset URL
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      search: '',
      href: 'http://localhost/',
    },
    writable: true,
  });
});

describe('useScene', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useScene());
    expect(result.current.activeScene).toBe('stock_analysis');
    expect(result.current.sceneParams.symbol).toBe('BTCUSDT');
    expect(result.current.sceneParams.market).toBe('crypto');
    expect(result.current.sceneParams.period).toBe('1D');
    expect(result.current.isImplemented).toBe(true);
  });

  it('switchScene changes active scene', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.switchScene('snapshot');
    });
    expect(result.current.activeScene).toBe('snapshot');
  });

  it('switchScene with params updates sceneParams', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.switchScene('stock_analysis', {
        symbol: 'AAPL',
        market: 'us',
      });
    });
    expect(result.current.sceneParams.symbol).toBe('AAPL');
    expect(result.current.sceneParams.market).toBe('us');
  });

  it('switchScene ignores unknown scene id', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.switchScene('nonexistent');
    });
    expect(result.current.activeScene).toBe('stock_analysis');
  });

  it('drillDown switches to stock_analysis with symbol', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.switchScene('snapshot');
    });
    expect(result.current.activeScene).toBe('snapshot');
    act(() => {
      result.current.drillDown('AAPL', 'us');
    });
    expect(result.current.activeScene).toBe('stock_analysis');
    expect(result.current.sceneParams.symbol).toBe('AAPL');
    expect(result.current.sceneParams.market).toBe('us');
  });

  it('drillDown infers market from SYMBOL_MARKET', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.drillDown('ETH');
    });
    expect(result.current.sceneParams.symbol).toBe('ETH');
    expect(result.current.sceneParams.market).toBe('crypto');
  });

  it('drillDown defaults to crypto for unknown symbols', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.drillDown('UNKNOWN_SYMBOL');
    });
    expect(result.current.sceneParams.symbol).toBe('UNKNOWN_SYMBOL');
    expect(result.current.sceneParams.market).toBe('crypto');
  });

  it('isImplemented returns false for unimplemented scenes', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.switchScene('fundamentals');
    });
    expect(result.current.activeScene).toBe('fundamentals');
    expect(result.current.isImplemented).toBe(false);
  });

  it('replaceState is called on mount', () => {
    renderHook(() => useScene());
    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it('pushState is called on switchScene', () => {
    const { result } = renderHook(() => useScene());
    act(() => {
      result.current.switchScene('snapshot');
    });
    expect(pushStateSpy).toHaveBeenCalled();
    const lastCall = pushStateSpy.mock.calls.at(-1);
    expect(lastCall?.[0]).toHaveProperty('scene', 'snapshot');
  });
});
