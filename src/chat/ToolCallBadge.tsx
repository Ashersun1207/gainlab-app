import { useState } from 'react';
import type { McpToolCall } from '../types/mcp';

interface ToolCallBadgeProps {
  toolCall: McpToolCall;
}

export function ToolCallBadge({ toolCall }: ToolCallBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  // 提取关键参数显示（symbol、interval 等）
  const keyArgs = Object.entries(toolCall.args)
    .slice(0, 2)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');

  return (
    <div style={{ marginTop: 4, marginBottom: 2 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 12,
          border: '1px solid #7c3aed',
          background: 'rgba(124,58,237,0.15)',
          color: '#c4b5fd',
          fontSize: 11,
          cursor: 'pointer',
          lineHeight: '1.4',
          fontFamily: 'inherit',
        }}
      >
        <span>🔧</span>
        <span style={{ fontWeight: 600 }}>{toolCall.name}</span>
        {keyArgs && <span style={{ color: '#a78bfa', opacity: 0.85 }}>({keyArgs})</span>}
        <span style={{ opacity: 0.6, fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <pre
          style={{
            margin: '4px 0 0 4px',
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.25)',
            color: '#c4b5fd',
            fontSize: 11,
            lineHeight: 1.5,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(toolCall.args, null, 2)}
        </pre>
      )}
    </div>
  );
}
