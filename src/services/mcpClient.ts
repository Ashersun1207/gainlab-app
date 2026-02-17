import type { McpMessage, McpStreamEvent, McpToolCall } from '../types/mcp'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string

/** 过滤掉 <think>...</think> 推理标签 */
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

/** 最多保留最新 N 条消息 */
const MAX_MESSAGES = 20

/**
 * 向 Cloudflare Worker 发送对话请求，以 SSE 流的形式逐步 yield 事件。
 *
 * SSE 格式参考：
 *   data: {"type":"text_delta","text":"..."}
 *   data: {"type":"tool_call","tool":{"id":"...","name":"...","arguments":{...}}}
 *   data: {"type":"tool_result","id":"...","result":{...}}
 *   data: [DONE]
 */
export async function* streamChat(
  messages: McpMessage[],
): AsyncGenerator<McpStreamEvent> {
  // 截断早期消息，最多保留 MAX_MESSAGES 条
  const trimmed =
    messages.length > MAX_MESSAGES
      ? messages.slice(messages.length - MAX_MESSAGES)
      : messages

  let response: Response
  try {
    response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: trimmed }),
    })
  } catch (err) {
    yield { type: 'error', error: `网络请求失败: ${String(err)}` }
    return
  }

  if (!response.ok) {
    yield { type: 'error', error: `服务器错误: ${response.status} ${response.statusText}` }
    return
  }

  const body = response.body
  if (!body) {
    yield { type: 'error', error: '响应体为空' }
    return
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按换行拆分，处理完整的 SSE 行
      const lines = buffer.split('\n')
      // 最后一段可能不完整，留到下次
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const payload = trimmed.slice('data: '.length)

        if (payload === '[DONE]') {
          yield { type: 'done' }
          return
        }

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(payload) as Record<string, unknown>
        } catch {
          // 跳过无法解析的行
          continue
        }

        const eventType = parsed['type'] as string | undefined

        if (eventType === 'text_delta') {
          const raw = (parsed['text'] as string | undefined) ?? ''
          const text = stripThinkTags(raw)
          if (text) {
            yield { type: 'text_delta', text }
          }
        } else if (eventType === 'tool_call') {
          const tool = parsed['tool'] as Record<string, unknown> | undefined
          if (tool) {
            const toolCall: McpToolCall = {
              id: (tool['id'] as string) ?? '',
              name: (tool['name'] as string) ?? '',
              args: (tool['arguments'] as Record<string, unknown>) ?? {},
            }
            yield { type: 'tool_call', toolCall }
          }
        } else if (eventType === 'tool_result') {
          yield {
            type: 'tool_result',
            result: parsed['result'],
          }
        } else if (eventType === 'error') {
          yield { type: 'error', error: (parsed['message'] as string) ?? '未知错误' }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield { type: 'done' }
}
