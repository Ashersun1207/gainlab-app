import { useCallback } from 'react';
import { TOOL_CONFIG } from '../constants/markets';
import type { ToolType } from '../types/market';

interface DrawerProps {
  open: boolean;
  activeTool: ToolType | null;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ open, activeTool, onClose, children }: DrawerProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!open || !activeTool) return null;

  const config = TOOL_CONFIG[activeTool];

  return (
    <div
      className="flex flex-col border-t border-[#1e1e3a] bg-[#0d0d20]"
      style={{ height: '40%', minHeight: 200 }}
    >
      {/* 抽屉标题栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1e1e3a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span className="text-sm font-medium text-[#d0d0f0]">{config.description}</span>
        </div>
        <button
          onClick={handleClose}
          className="text-[#6666aa] hover:text-white text-sm px-2 py-1 rounded hover:bg-[#1e1e3a] transition-colors"
        >
          ✕
        </button>
      </div>
      {/* 抽屉内容 */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
