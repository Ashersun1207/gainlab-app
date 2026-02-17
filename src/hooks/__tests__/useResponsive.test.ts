import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive } from '../useResponsive';

function createMockMql(matches: boolean) {
  return {
    matches,
    media: '(max-width: 767px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('useResponsive', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('returns isMobile=false on desktop width (jsdom default 1024px)', () => {
    const mockMql = createMockMql(false);
    window.matchMedia = vi.fn().mockReturnValue(mockMql);

    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(false);
  });

  it('responds to matchMedia change events (desktop → mobile → desktop)', () => {
    let handler: ((e: MediaQueryListEvent) => void) | null = null;

    const mockMql = createMockMql(false);
    mockMql.addEventListener = vi.fn((_: string, h: (e: MediaQueryListEvent) => void) => {
      handler = h;
    });

    window.matchMedia = vi.fn().mockReturnValue(mockMql);

    const { result } = renderHook(() => useResponsive());
    expect(result.current.isMobile).toBe(false);

    // Simulate resize to mobile
    act(() => {
      handler?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current.isMobile).toBe(true);

    // Simulate resize back to desktop
    act(() => {
      handler?.({ matches: false } as MediaQueryListEvent);
    });
    expect(result.current.isMobile).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const mockMql = createMockMql(false);
    window.matchMedia = vi.fn().mockReturnValue(mockMql);

    const { unmount } = renderHook(() => useResponsive());
    unmount();

    expect(mockMql.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
