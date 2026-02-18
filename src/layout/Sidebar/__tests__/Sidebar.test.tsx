import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../index';

describe('Sidebar (new 44px widget catalog)', () => {
  it('renders the GL logo', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('sidebar-logo')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-logo')).toHaveTextContent('GL');
  });

  it('renders 5 widget buttons (kline, heatmap, fundamentals, overlay, wrb)', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('widget-kline')).toBeInTheDocument();
    expect(screen.getByTestId('widget-heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('widget-fundamentals')).toBeInTheDocument();
    expect(screen.getByTestId('widget-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('widget-wrb')).toBeInTheDocument();
  });

  it('renders layout preset button', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('widget-layout')).toBeInTheDocument();
  });

  it('renders chat button', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('widget-chat')).toBeInTheDocument();
  });

  it('renders settings button', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('widget-settings')).toBeInTheDocument();
  });

  it('clicking kline button calls onAddWidget("kline")', () => {
    const onAddWidget = vi.fn();
    render(<Sidebar onAddWidget={onAddWidget} />);
    fireEvent.click(screen.getByTestId('widget-kline'));
    expect(onAddWidget).toHaveBeenCalledWith('kline');
  });

  it('clicking heatmap button calls onAddWidget("heatmap")', () => {
    const onAddWidget = vi.fn();
    render(<Sidebar onAddWidget={onAddWidget} />);
    fireEvent.click(screen.getByTestId('widget-heatmap'));
    expect(onAddWidget).toHaveBeenCalledWith('heatmap');
  });

  it('clicking fundamentals button calls onAddWidget("fundamentals")', () => {
    const onAddWidget = vi.fn();
    render(<Sidebar onAddWidget={onAddWidget} />);
    fireEvent.click(screen.getByTestId('widget-fundamentals'));
    expect(onAddWidget).toHaveBeenCalledWith('fundamentals');
  });

  it('clicking chat button calls onToggleChat()', () => {
    const onToggleChat = vi.fn();
    render(<Sidebar onToggleChat={onToggleChat} />);
    fireEvent.click(screen.getByTestId('widget-chat'));
    expect(onToggleChat).toHaveBeenCalledTimes(1);
  });

  it('sidebar container has w-[44px] class', () => {
    const { container } = render(<Sidebar />);
    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar.className).toContain('w-[44px]');
  });

  it('accepts legacy props without TypeScript errors (backward compat)', () => {
    // This test verifies that old App.tsx props are accepted without errors.
    // The props are passed but ignored in the new implementation.
    const noop = vi.fn();
    expect(() =>
      render(
        <Sidebar
          activeMarket="crypto"
          activeSymbol="BTCUSDT"
          activeTool={null}
          quotes={new Map()}
          onMarketChange={noop}
          onAssetSelect={noop}
          onToolClick={noop}
        />,
      ),
    ).not.toThrow();
  });

  it('clicking overlay button calls onAddWidget("overlay")', () => {
    const onAddWidget = vi.fn();
    render(<Sidebar onAddWidget={onAddWidget} />);
    fireEvent.click(screen.getByTestId('widget-overlay'));
    expect(onAddWidget).toHaveBeenCalledWith('overlay');
  });

  it('clicking wrb button calls onAddWidget("wrb")', () => {
    const onAddWidget = vi.fn();
    render(<Sidebar onAddWidget={onAddWidget} />);
    fireEvent.click(screen.getByTestId('widget-wrb'));
    expect(onAddWidget).toHaveBeenCalledWith('wrb');
  });

  it('clicking layout button calls onLayoutPreset("default")', () => {
    const onLayoutPreset = vi.fn();
    render(<Sidebar onLayoutPreset={onLayoutPreset} />);
    fireEvent.click(screen.getByTestId('widget-layout'));
    expect(onLayoutPreset).toHaveBeenCalledWith('default');
  });

  it('widget buttons have title attributes (tooltips)', () => {
    render(<Sidebar />);
    expect(screen.getByTitle('K线图')).toBeInTheDocument();
    expect(screen.getByTitle('热力图')).toBeInTheDocument();
    expect(screen.getByTitle('基本面')).toBeInTheDocument();
    expect(screen.getByTitle('AI 对话')).toBeInTheDocument();
    expect(screen.getByTitle('设置')).toBeInTheDocument();
  });

  it('renders without any required props (all props optional)', () => {
    // Should render fine with zero props
    expect(() => render(<Sidebar />)).not.toThrow();
  });
});
