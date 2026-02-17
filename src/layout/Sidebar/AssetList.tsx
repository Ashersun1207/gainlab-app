import type { Asset, Quote } from '../../types/market';

interface AssetListProps {
  assets: Asset[];
  quotes: Map<string, Quote>;
  activeSymbol: string;
  onSelect: (asset: Asset) => void;
}

/** Skeleton loading 占位条（报价未加载时显示） */
function QuoteSkeleton() {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="h-3 w-12 bg-[#1e1e3a] rounded animate-pulse" />
      <div className="h-2.5 w-8 bg-[#1e1e3a] rounded animate-pulse" />
    </div>
  );
}

export function AssetList({ assets, quotes, activeSymbol, onSelect }: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#4a4a7a] text-sm">
        暂无数据
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-1">
      {assets.map((asset) => {
        const q = quotes.get(asset.symbol);
        const isActive = asset.symbol === activeSymbol;
        return (
          <button
            key={asset.symbol}
            onClick={() => onSelect(asset)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
              ${isActive ? 'bg-[#1e1e3a] text-white' : 'text-[#aaaacc] hover:bg-[#16162a] hover:text-white'}`}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{asset.displaySymbol ?? asset.symbol}</span>
              <span className="text-[10px] text-[#6666aa]">{asset.name}</span>
            </div>
            {q ? (
              <div className="flex flex-col items-end">
                <span className="font-mono text-xs">{q.price.toLocaleString()}</span>
                <span
                  className={`text-[10px] font-mono ${q.changePercent >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}
                >
                  {q.changePercent >= 0 ? '+' : ''}
                  {q.changePercent.toFixed(2)}%
                </span>
              </div>
            ) : (
              <QuoteSkeleton />
            )}
          </button>
        );
      })}
    </div>
  );
}
