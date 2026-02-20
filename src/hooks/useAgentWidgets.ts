/**
 * useAgentWidgets — Agent Widget 生命周期管理
 *
 * (#4) 从 App.tsx 抽出：agentWidgets 状态 + handleToolResult + handleNewRound
 */

import { useState, useCallback, useRef } from 'react';
import { validateWidgetState, isKlineWidget } from '../catalog';
import { mcpToKLine } from '../services/dataAdapter';
import type { AgentWidgetItem } from '../scenes/AgentView';
import type { WidgetState } from '../types/widget-state';

interface UseAgentWidgetsResult {
  agentWidgets: AgentWidgetItem[];
  handleToolResult: (toolName: string, result: unknown, widgetState?: WidgetState) => void;
  handleNewRound: () => void;
  clearAgentWidgets: () => void;
  removeAgentWidget: (id: string) => void;
}

export function useAgentWidgets(
  switchScene: (sceneId: string) => void,
): UseAgentWidgetsResult {
  const [agentWidgets, setAgentWidgets] = useState<AgentWidgetItem[]>([]);
  const counterRef = useRef(0);
  const currentRoundWidgetsRef = useRef(0);

  const handleNewRound = useCallback(() => {
    currentRoundWidgetsRef.current = 0;
  }, []);

  const handleToolResult = useCallback(
    (toolName: string, result: unknown, widgetState?: WidgetState) => {
      const validated = widgetState ? validateWidgetState(widgetState) : null;
      if (!validated) return;

      const item: AgentWidgetItem = {
        id: `aw_${++counterRef.current}_${Date.now()}`,
        widgetState: validated,
        klineData: undefined,
      };

      if (isKlineWidget(validated.type)) {
        item.klineData = mcpToKLine(result);
      }

      currentRoundWidgetsRef.current++;
      if (currentRoundWidgetsRef.current === 1) {
        setAgentWidgets([item]);
      } else {
        setAgentWidgets((prev) => [...prev, item]);
      }
      switchScene('ai');
    },
    [switchScene],
  );

  const clearAgentWidgets = useCallback(() => setAgentWidgets([]), []);

  const removeAgentWidget = useCallback(
    (id: string) => setAgentWidgets((prev) => prev.filter((w) => w.id !== id)),
    [],
  );

  return {
    agentWidgets,
    handleToolResult,
    handleNewRound,
    clearAgentWidgets,
    removeAgentWidget,
  };
}
