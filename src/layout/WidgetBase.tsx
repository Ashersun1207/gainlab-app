import React from 'react';

interface WidgetBaseProps {
  /** 可组合 Header 内容（优先级高于 title） */
  header?: React.ReactNode;
  /** 简单标题（header 为空时使用） */
  title?: string;
  /** 关闭按钮回调（Mosaic 中移除此 Widget） */
  onRemove?: () => void;
  children: React.ReactNode;
}

export function WidgetBase({ header, title, onRemove, children }: WidgetBaseProps) {
  return (
    <div className="flex flex-col h-full bg-[#12122a] border border-[#2a2a4a] rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1 px-1.5 bg-[#0d0d20] border-b border-[#2a2a4a] flex-shrink-0 min-h-[32px]">
        {header ?? (
          <span className="text-[13px] font-semibold text-[#a0a0cc] select-none px-1.5 py-1">
            {title}
          </span>
        )}
        {/* 右侧关闭按钮（如果有 onRemove） */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="ml-auto w-[20px] h-[20px] rounded flex items-center justify-center text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] text-xs transition-colors flex-shrink-0"
            title="关闭"
          >
            ✕
          </button>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );
}
