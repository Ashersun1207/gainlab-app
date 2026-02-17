import { useState, useCallback, useEffect } from 'react';
import { MarketTabs } from './MarketTabs';
import { SearchBox } from './SearchBox';
import { AssetList } from './AssetList';
import { ToolBar } from './ToolBar';
import { HOT_ASSETS } from '../../constants/markets';
import { fetchWorkerSearch } from '../../services/api';
import type { Asset, MarketType, ToolType, Quote } from '../../types/market';

interface SidebarProps {
  activeMarket: MarketType;
  activeSymbol: string;
  activeTool: ToolType | null;
  quotes: Map<string, Quote>;
  onMarketChange: (market: MarketType) => void;
  onAssetSelect: (asset: Asset) => void;
  onToolClick: (tool: ToolType) => void;
}

export function Sidebar({
  activeMarket,
  activeSymbol,
  activeTool,
  quotes,
  onMarketChange,
  onAssetSelect,
  onToolClick,
}: SidebarProps) {
  const [searchResults, setSearchResults] = useState<Asset[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const displayAssets = searchResults ?? HOT_ASSETS[activeMarket];

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query) {
        setSearchResults(null);
        return;
      }
      setSearchLoading(true);
      try {
        const results = await fetchWorkerSearch(query, activeMarket);
        setSearchResults(
          results.map((r) => ({
            symbol: r.symbol,
            name: r.name,
            market: activeMarket,
          })),
        );
      } catch {
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    },
    [activeMarket],
  );

  // 切换市场时清空搜索结果
  useEffect(() => {
    setSearchResults(null);
  }, [activeMarket]);

  return (
    <div className="w-[200px] h-full flex flex-col bg-[#0d0d20] border-r border-[#1e1e3a] flex-shrink-0">
      <MarketTabs active={activeMarket} onChange={onMarketChange} />
      <SearchBox onSearch={handleSearch} loading={searchLoading} />
      <AssetList
        assets={displayAssets}
        quotes={quotes}
        activeSymbol={activeSymbol}
        onSelect={onAssetSelect}
      />
      <ToolBar activeTool={activeTool} market={activeMarket} onToolClick={onToolClick} />
    </div>
  );
}
