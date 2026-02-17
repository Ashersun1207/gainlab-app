import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * 响应式断点 hook — 768px 分界，用 matchMedia 监听
 * 移动端 (<768px): isMobile = true
 * 桌面端 (≥768px): isMobile = false
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  const handleChange = useCallback((e: MediaQueryListEvent) => {
    setIsMobile(e.matches);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [handleChange]);

  return { isMobile };
}
