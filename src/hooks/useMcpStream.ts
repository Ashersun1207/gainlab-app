import { useState, useCallback, useRef } from 'react'
import { streamChat } from '../services/mcpClient'
import type { McpMessage, McpToolCall } from '../types/mcp'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: McpToolCall[]
}

interface UseMcpStreamResult {
  messages: ChatMessage[]
  streaming: boolean
  activeToolCall: McpToolCall | null
  sendMessage: (
    text: string,
    onToolResult?: (toolName: string, result: unknown) => void,
  ) => Promise<void>
  clearMessages: () => void
}

let msgCounter = 0
function nextId() {
  return `msg_${++msgCounter}_${Date.now()}`
}

export function useMcpStream(): UseMcpStreamResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [activeToolCall, setActiveToolCall] = useState<McpToolCall | null>(null)

  // 用 ref 保存对话历史，避免 stale closure
  const historyRef = useRef<McpMessage[]>([])
  // 用 ref 追踪当前 tool call，避免 setState 异步导致 stale closure
  const activeToolCallRef = useRef<McpToolCall | null>(null)

  const sendMessage = useCallback(
    async (
      text: string,
      onToolResult?: (toolName: string, result: unknown) => void,
    ) => {
      if (streaming || !text.trim()) return

      // 追加用户消息到 UI
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text.trim(),
      }
      setMessages((prev) => [...prev, userMsg])

      // 更新历史（供下次发送时使用）
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text.trim() },
      ]

      // 占位 assistant 消息
      const assistantId = nextId()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolCalls: [],
      }
      setMessages((prev) => [...prev, assistantMsg])

      setStreaming(true)
      setActiveToolCall(null)
      activeToolCallRef.current = null

      try {
        for await (const event of streamChat(historyRef.current)) {
          if (event.type === 'text_delta' && event.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.text! }
                  : m,
              ),
            )
          } else if (event.type === 'tool_call' && event.toolCall) {
            const tc = event.toolCall
            activeToolCallRef.current = tc
            setActiveToolCall(tc)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, toolCalls: [...(m.toolCalls ?? []), tc] }
                  : m,
              ),
            )
          } else if (event.type === 'tool_result' && event.result !== undefined) {
            // 通知 App 更新 Widget（用 ref 取最新 tool call，避免 stale closure）
            if (activeToolCallRef.current && onToolResult) {
              onToolResult(activeToolCallRef.current.name, event.result)
            }
            activeToolCallRef.current = null
            setActiveToolCall(null)
          } else if (event.type === 'done') {
            break
          } else if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        m.content +
                        (m.content ? '\n' : '') +
                        `❌ ${event.error ?? '请求失败'}`,
                    }
                  : m,
              ),
            )
            break
          }
        }

        // 把 assistant 最终回答追加到历史
        setMessages((prev) => {
          const final = prev.find((m) => m.id === assistantId)
          if (final?.content) {
            historyRef.current = [
              ...historyRef.current,
              { role: 'assistant', content: final.content },
            ]
          }
          return prev
        })
      } finally {
        setStreaming(false)
        setActiveToolCall(null)
        activeToolCallRef.current = null
      }
    },
    [streaming],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    historyRef.current = []
  }, [])

  return { messages, streaming, activeToolCall, sendMessage, clearMessages }
}
