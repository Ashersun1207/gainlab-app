import { TOOL_CONFIG, TOOL_MARKET_SUPPORT } from '../../constants/markets';
import type { MarketType, ToolType } from '../../types/market';

interface ToolBarProps {
  activeTool: ToolType | null;
  market: MarketType;
  onToolClick: (tool: ToolType) => void;
}

const tools = Object.entries(TOOL_CONFIG) as [
  ToolType,
  { label: string; icon: string; description: string },
][];

export function ToolBar({ activeTool, market, onToolClick }: ToolBarProps) {
  return (
    <div className="border-t border-[#1e1e3a] px-2 py-2 flex flex-wrap gap-1">
      {tools.map(([key, { icon, description }]) => {
        const supported = TOOL_MARKET_SUPPORT[key]?.includes(market) ?? true;
        if (!supported) return null;
        return (
          <button
            key={key}
            onClick={() => onToolClick(key)}
            title={description}
            className={`flex items-center justify-center w-9 h-9 rounded-md text-base transition-colors
              ${
                activeTool === key
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#8888aa] hover:text-white hover:bg-[#1e1e3a]'
              }`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
