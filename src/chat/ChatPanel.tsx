import { useState, useCallback, useRef } from 'react';
import { MessageList } from './MessageList';
import { useMcpStream } from '../hooks/useMcpStream';

interface ChatPanelProps {
  onToolResult?: (toolName: string, result: unknown) => void;
}

export function ChatPanel({ onToolResult }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, streaming, activeToolCall, sendMessage, clearMessages } = useMcpStream();

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    await sendMessage(text, onToolResult);
    // 发送后聚焦输入框
    inputRef.current?.focus();
  }, [input, streaming, sendMessage, onToolResult]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d20',
        borderLeft: '1px solid #1e1e3a',
        overflow: 'hidden',
      }}
    >
      {/* 顶栏 */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #1e1e3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#8888cc', fontSize: 13, fontWeight: 600 }}>✨ GainLab AI</span>
        <button
          onClick={clearMessages}
          style={{
            background: 'none',
            border: 'none',
            color: '#4a4a7a',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
          }}
          title="清空对话"
        >
          清空
        </button>
      </div>

      {/* 消息列表 */}
      <MessageList messages={messages} streaming={streaming} />

      {/* 活跃 tool call 提示 */}
      {activeToolCall && (
        <div
          style={{
            padding: '4px 12px',
            background: 'rgba(124,58,237,0.1)',
            borderTop: '1px solid rgba(124,58,237,0.2)',
            color: '#a78bfa',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          🔧 正在调用 {activeToolCall.name}...
        </div>
      )}

      {/* 输入区 */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #1e1e3a',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
          placeholder={streaming ? '正在回复中...' : '发消息（Enter 发送，Shift+Enter 换行）'}
          rows={1}
          style={{
            flex: 1,
            background: '#13132a',
            border: '1px solid #2a2a4a',
            borderRadius: 8,
            color: '#d0d0f0',
            fontSize: 13,
            padding: '8px 10px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: 'auto',
            transition: 'border-color 0.15s',
            opacity: streaming ? 0.6 : 1,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#4a4a8a';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#2a2a4a';
          }}
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            background:
              streaming || !input.trim() ? '#1e1e3a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: streaming || !input.trim() ? '#3a3a6a' : '#fff',
            fontSize: 13,
            cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}
