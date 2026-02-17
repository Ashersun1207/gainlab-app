import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketTabs } from '../MarketTabs';
import { AssetList } from '../AssetList';
import { ToolBar } from '../ToolBar';
import { SearchBox } from '../SearchBox';
import type { Asset, Quote } from '../../../types/market';

describe('MarketTabs', () => {
  it('renders all 4 market tabs', () => {
    render(<MarketTabs active="crypto" onChange={vi.fn()} />);
    expect(screen.getByText('加密')).toBeInTheDocument();
    expect(screen.getByText('美股')).toBeInTheDocument();
    expect(screen.getByText('A股')).toBeInTheDocument();
    expect(screen.getByText('贵金属')).toBeInTheDocument();
  });

  it('calls onChange when tab clicked', () => {
    const onChange = vi.fn();
    render(<MarketTabs active="crypto" onChange={onChange} />);
    fireEvent.click(screen.getByText('美股'));
    expect(onChange).toHaveBeenCalledWith('us');
  });

  it('highlights the active tab', () => {
    render(<MarketTabs active="us" onChange={vi.fn()} />);
    const usButton = screen.getByText('美股').closest('button');
    expect(usButton?.className).toContain('bg-[#1e1e3a]');
  });
});

describe('AssetList', () => {
  const assets: Asset[] = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', market: 'crypto', displaySymbol: 'BTC' },
    { symbol: 'ETHUSDT', name: 'Ethereum', market: 'crypto', displaySymbol: 'ETH' },
  ];

  const quotes = new Map<string, Quote>([
    ['BTCUSDT', { symbol: 'BTCUSDT', price: 69000, change: 1200, changePercent: 1.77 }],
  ]);

  it('renders asset list with display symbols', () => {
    render(
      <AssetList assets={assets} quotes={quotes} activeSymbol="BTCUSDT" onSelect={vi.fn()} />,
    );
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('shows price for quoted assets', () => {
    render(
      <AssetList assets={assets} quotes={quotes} activeSymbol="" onSelect={vi.fn()} />,
    );
    expect(screen.getByText('+1.77%')).toBeInTheDocument();
  });

  it('calls onSelect when asset clicked', () => {
    const onSelect = vi.fn();
    render(
      <AssetList assets={assets} quotes={quotes} activeSymbol="" onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText('BTC'));
    expect(onSelect).toHaveBeenCalledWith(assets[0]);
  });

  it('shows empty state when no assets', () => {
    render(
      <AssetList assets={[]} quotes={new Map()} activeSymbol="" onSelect={vi.fn()} />,
    );
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });
});

describe('ToolBar', () => {
  it('renders all 5 tool buttons for us market', () => {
    render(<ToolBar activeTool={null} market="us" onToolClick={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('hides fundamentals for crypto market', () => {
    render(<ToolBar activeTool={null} market="crypto" onToolClick={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    // crypto 不支持 fundamentals → 只有 4 个
    expect(buttons).toHaveLength(4);
  });

  it('highlights active tool', () => {
    render(<ToolBar activeTool="heatmap" market="us" onToolClick={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const heatmapBtn = buttons.find((b) => b.textContent === '🔥');
    expect(heatmapBtn?.className).toContain('bg-[#2563eb]');
  });

  it('calls onToolClick when tool button clicked', () => {
    const onToolClick = vi.fn();
    render(<ToolBar activeTool={null} market="us" onToolClick={onToolClick} />);
    const buttons = screen.getAllByRole('button');
    const firstBtn = buttons[0];
    if (firstBtn) fireEvent.click(firstBtn);
    expect(onToolClick).toHaveBeenCalledWith('volume_profile');
  });
});

describe('SearchBox', () => {
  it('renders input with placeholder', () => {
    render(<SearchBox onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('搜索资产...')).toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    render(<SearchBox onSearch={vi.fn()} loading={true} />);
    expect(screen.getByText('搜索中...')).toBeInTheDocument();
  });
});
