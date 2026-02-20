/**
 * useHiddenWidgets — Widget 可见性管理（场景隔离）
 *
 * (#4) 从 App.tsx 抽出：hiddenWidgets Set + wkey/isHidden/closeHandler
 */

import { useState, useCallback } from 'react';

interface UseHiddenWidgetsResult {
  /** 隐藏一个 Widget */
  hideWidget: (key: string) => void;
  /** 当前场景下某 Widget 是否隐藏 */
  isHidden: (title: string) => boolean;
  /** 返回一个 onClose handler */
  closeHandler: (title: string) => () => void;
}

export function useHiddenWidgets(activeScene: string): UseHiddenWidgetsResult {
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  const hideWidget = useCallback((key: string) => {
    setHiddenWidgets((prev) => new Set(prev).add(key));
  }, []);

  const wkey = useCallback(
    (title: string) => `${activeScene}:${title}`,
    [activeScene],
  );

  const isHidden = useCallback(
    (title: string) => hiddenWidgets.has(wkey(title)),
    [hiddenWidgets, wkey],
  );

  const closeHandler = useCallback(
    (title: string) => () => hideWidget(wkey(title)),
    [hideWidget, wkey],
  );

  return { hideWidget, isHidden, closeHandler };
}
