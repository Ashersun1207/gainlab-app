export interface McpMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface McpToolCall {
  id: string;
  name: string; // "gainlab_kline" | "gainlab_heatmap" | ...
  args: Record<string, unknown>;
}

import type { WidgetState } from './widget-state';

export interface McpStreamEvent {
  type: 'text_delta' | 'tool_call' | 'tool_result' | 'done' | 'error';
  text?: string;
  toolCall?: McpToolCall;
  result?: unknown;
  widgetState?: WidgetState;
  error?: string;
}
