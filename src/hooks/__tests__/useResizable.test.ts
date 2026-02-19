import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResizable } from '../useResizable';

describe('useResizable', () => {
  it('returns object with handleResizeStart', () => {
    const { result } = renderHook(() => useResizable('.target'));
    expect(result.current).toHaveProperty('handleResizeStart');
  });

  it('handleResizeStart is a function', () => {
    const { result } = renderHook(() => useResizable('.target'));
    expect(typeof result.current.handleResizeStart).toBe('function');
  });

  it('returns stable reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useResizable('.target', 100, 400));
    const first = result.current.handleResizeStart;
    rerender();
    expect(result.current.handleResizeStart).toBe(first);
  });
});
