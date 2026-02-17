export interface McpMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface McpToolCall {
  id: string
  name: string // "gainlab_kline" | "gainlab_heatmap" | ...
  args: Record<string, unknown>
}

export interface McpStreamEvent {
  type: 'text_delta' | 'tool_call' | 'tool_result' | 'done' | 'error'
  text?: string
  toolCall?: McpToolCall
  result?: unknown
  error?: string
}
