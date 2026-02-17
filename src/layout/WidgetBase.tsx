interface WidgetBaseProps {
  title: string
  children: React.ReactNode
}

export function WidgetBase({ title, children }: WidgetBaseProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#12122a',
        border: '1px solid #2a2a4a',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          background: '#1a1a3e',
          borderBottom: '1px solid #2a2a4a',
          fontSize: '13px',
          fontWeight: 600,
          color: '#a0a0cc',
          userSelect: 'none',
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}
