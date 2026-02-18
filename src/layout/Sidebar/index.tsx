import type { MarketType, ToolType, Asset, Quote } from '../../types/market';

// Widget type for the new narrow-bar catalog
// (will be moved to types/market.ts in T4)
type WidgetType = 'kline' | 'heatmap' | 'fundamentals' | 'overlay' | 'wrb';

interface SidebarProps {
  // === New props ===
  onAddWidget?: (type: WidgetType) => void;
  onToggleChat?: () => void;
  onLayoutPreset?: (preset: string) => void;
  // === Legacy props (deprecated — will be removed in T4) ===
  /** @deprecated T4 will remove this prop */
  activeMarket?: MarketType;
  /** @deprecated T4 will remove this prop */
  activeSymbol?: string;
  /** @deprecated T4 will remove this prop */
  activeTool?: ToolType | null;
  /** @deprecated T4 will remove this prop */
  quotes?: Map<string, Quote>;
  /** @deprecated T4 will remove this prop */
  onMarketChange?: (market: MarketType) => void;
  /** @deprecated T4 will remove this prop */
  onAssetSelect?: (asset: Asset) => void;
  /** @deprecated T4 will remove this prop */
  onToolClick?: (tool: ToolType) => void;
}

// Divider line between sections
function Divider() {
  return <div className="w-5 h-px bg-[#2a2a4a] mx-auto my-1" />;
}

interface WidgetButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  testId?: string;
}

// Individual icon button with tooltip
function WidgetButton({ icon, label, onClick, testId }: WidgetButtonProps) {
  return (
    <button
      className="w-[32px] h-[32px] rounded-md flex items-center justify-center text-sm cursor-pointer text-[#5a5a8a] hover:bg-[#1e1e3a] hover:text-[#e0e0f0] relative group transition-colors"
      onClick={onClick}
      title={label}
      data-testid={testId}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute left-[110%] top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#1a1a3e] border border-[#2a2a4a] text-[#e0e0f0] text-[9px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
        {label}
      </span>
    </button>
  );
}

export function Sidebar({
  onAddWidget,
  onToggleChat,
  onLayoutPreset,
  // Legacy props — accepted but ignored (T4 will remove)
  activeMarket: _activeMarket,
  activeSymbol: _activeSymbol,
  activeTool: _activeTool,
  quotes: _quotes,
  onMarketChange: _onMarketChange,
  onAssetSelect: _onAssetSelect,
  onToolClick: _onToolClick,
}: SidebarProps) {
  return (
    <div className="w-[44px] h-full flex flex-col items-center bg-[#0d0d20] border-r border-[#1e1e3a] flex-shrink-0 py-1.5 gap-0.5">
      {/* Logo */}
      <div
        className="w-[32px] h-[32px] flex items-center justify-center text-[11px] font-bold bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white rounded-md mb-0.5"
        data-testid="sidebar-logo"
      >
        GL
      </div>

      <Divider />

      {/* Widget buttons */}
      <WidgetButton
        icon="📈"
        label="K线图"
        onClick={() => onAddWidget?.('kline')}
        testId="widget-kline"
      />
      <WidgetButton
        icon="🔥"
        label="热力图"
        onClick={() => onAddWidget?.('heatmap')}
        testId="widget-heatmap"
      />
      <WidgetButton
        icon="💰"
        label="基本面"
        onClick={() => onAddWidget?.('fundamentals')}
        testId="widget-fundamentals"
      />
      <WidgetButton
        icon="📐"
        label="叠加对比"
        onClick={() => onAddWidget?.('overlay')}
        testId="widget-overlay"
      />
      <WidgetButton
        icon="📊"
        label="WRB"
        onClick={() => onAddWidget?.('wrb')}
        testId="widget-wrb"
      />

      <Divider />

      {/* Layout preset */}
      <WidgetButton
        icon="⊞"
        label="布局"
        onClick={() => onLayoutPreset?.('default')}
        testId="widget-layout"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Chat */}
      <WidgetButton
        icon="💬"
        label="AI 对话"
        onClick={() => onToggleChat?.()}
        testId="widget-chat"
      />

      {/* Settings */}
      <WidgetButton
        icon="⚙️"
        label="设置"
        testId="widget-settings"
      />
    </div>
  );
}
