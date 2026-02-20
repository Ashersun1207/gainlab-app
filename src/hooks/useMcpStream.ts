import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/mcpClient';
import type { McpMessage, McpToolCall } from '../types/mcp';
import type { WidgetState } from '../types/widget-state';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: McpToolCall[];
}

interface UseMcpStreamResult {
  messages: ChatMessage[];
  streaming: boolean;
  activeToolCall: McpToolCall | null;
  sendMessage: (
    text: string,
    onToolResult?: (toolName: string, result: unknown, widgetState?: WidgetState) => void,
  ) => Promise<void>;
  clearMessages: () => void;
}

export function useMcpStream(): UseMcpStreamResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [activeToolCall, setActiveToolCall] = useState<McpToolCall | null>(null);

  // (#7) useRef 替代模块级 counter，HMR 安全
  const msgCounterRef = useRef(0);
  const nextId = useCallback(() => `msg_${++msgCounterRef.current}_${Date.now()}`, []);

  // 用 ref 保存对话历史，避免 stale closure
  const historyRef = useRef<McpMessage[]>([]);
  // 用 ref 追踪当前 tool call，避免 setState 异步导致 stale closure
  const activeToolCallRef = useRef<McpToolCall | null>(null);
  // (#8) 用 ref 追踪 streaming 状态，避免 useCallback 依赖 streaming 导致频繁重建
  const streamingRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string, onToolResult?: (toolName: string, result: unknown, widgetState?: WidgetState) => void) => {
      if (streamingRef.current || !text.trim()) return;

      // 追加用户消息到 UI
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // 更新历史（供下次发送时使用）
      historyRef.current = [...historyRef.current, { role: 'user', content: text.trim() }];

      // 占位 assistant 消息
      const assistantId = nextId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolCalls: [],
      };
      setMessages((prev) => [...prev, assistantMsg]);

      streamingRef.current = true;
      setStreaming(true);
      setActiveToolCall(null);
      activeToolCallRef.current = null;

      // (#9) 追踪 assistant 最终内容，在 finally 里而非 setState updater 里更新 ref
      let assistantContent = '';

      try {
        for await (const event of streamChat(historyRef.current)) {
          if (event.type === 'text_delta' && event.text) {
            assistantContent += event.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + (event.text ?? '') } : m,
              ),
            );
          } else if (event.type === 'tool_call' && event.toolCall) {
            const tc = event.toolCall;
            activeToolCallRef.current = tc;
            setActiveToolCall(tc);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, toolCalls: [...(m.toolCalls ?? []), tc] } : m,
              ),
            );
          } else if (event.type === 'tool_result' && event.result !== undefined) {
            // 通知 App 更新 Widget（用 ref 取最新 tool call，避免 stale closure）
            if (activeToolCallRef.current && onToolResult) {
              onToolResult(activeToolCallRef.current.name, event.result, event.widgetState);
            }
            activeToolCallRef.current = null;
            setActiveToolCall(null);
          } else if (event.type === 'done') {
            break;
          } else if (event.type === 'error') {
            const errText = `❌ ${event.error ?? '请求失败'}`;
            assistantContent += (assistantContent ? '\n' : '') + errText;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        m.content + (m.content ? '\n' : '') + errText,
                    }
                  : m,
              ),
            );
            break;
          }
        }
      } finally {
        // (#9) 在 finally 里更新历史 ref，不在 setState updater 里做副作用
        if (assistantContent) {
          historyRef.current = [
            ...historyRef.current,
            { role: 'assistant', content: assistantContent },
          ];
        }

        streamingRef.current = false;
        setStreaming(false);
        setActiveToolCall(null);
        activeToolCallRef.current = null;
      }
    },
    [nextId], // (#8) 不再依赖 streaming state，用 streamingRef 代替
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  return { messages, streaming, activeToolCall, sendMessage, clearMessages };
}
