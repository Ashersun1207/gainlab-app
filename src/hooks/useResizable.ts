import { useCallback, useRef } from 'react';

export function useResizable(
  targetSelector: string,
  minHeight = 150,
  maxHeight = 500,
) {
  const dragging = useRef(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = (e.currentTarget as HTMLElement).parentElement;
      if (!container) return;
      const target = container.querySelector(targetSelector) as HTMLElement;
      if (!target) return;

      dragging.current = true;
      const startY = e.clientY;
      const startH = target.clientHeight;

      const onMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const dy = me.clientY - startY;
        const newH = Math.min(maxHeight, Math.max(minHeight, startH - dy));
        target.style.height = `${newH}px`;
      };
      const onUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [targetSelector, minHeight, maxHeight],
  );

  return { handleResizeStart };
}
