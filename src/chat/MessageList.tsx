import { useEffect, useRef } from 'react';
import { ToolCallBadge } from './ToolCallBadge';
import type { ChatMessage } from '../hooks/useMcpStream';

interface MessageListProps {
  messages: ChatMessage[];
  streaming: boolean;
}

export function MessageList({ messages, streaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3a3a6a',
          fontSize: 14,
          padding: 24,
          textAlign: 'center',
          lineHeight: 1.7,
        }}
      >
        <span>
          💡 你好！我是 GainLab AI
          <br />
          向我提问关于加密货币市场的问题
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          {/* tool call badges（只有 assistant 消息可能有） */}
          {msg.toolCalls && msg.toolCalls.length > 0 && (
            <div style={{ marginBottom: 4, maxWidth: '90%' }}>
              {msg.toolCalls.map((tc) => (
                <ToolCallBadge key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {/* 消息气泡 */}
          {msg.content && (
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background:
                  msg.role === 'user' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#1a1a35',
                color: msg.role === 'user' ? '#fff' : '#c8c8e8',
                fontSize: 13,
                lineHeight: 1.6,
                border: msg.role === 'user' ? 'none' : '1px solid #2a2a4a',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          )}
        </div>
      ))}

      {/* streaming 指示器 */}
      {streaming && (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '16px 16px 16px 4px',
              background: '#1a1a35',
              border: '1px solid #2a2a4a',
              color: '#6a6aaa',
              fontSize: 13,
            }}
          >
            <span style={{ animation: 'pulse 1s infinite' }}>●●●</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
