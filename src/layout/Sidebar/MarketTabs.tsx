import { MARKET_CONFIG } from '../../constants/markets';
import type { MarketType } from '../../types/market';

interface MarketTabsProps {
  active: MarketType;
  onChange: (market: MarketType) => void;
}

const markets = Object.entries(MARKET_CONFIG) as [
  MarketType,
  { label: string; icon: string },
][];

export function MarketTabs({ active, onChange }: MarketTabsProps) {
  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      {markets.map(([key, { label, icon }]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${
              active === key
                ? 'bg-[#1e1e3a] text-white'
                : 'text-[#8888aa] hover:text-white hover:bg-[#16162a]'
            }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
