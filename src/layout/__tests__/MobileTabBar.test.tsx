import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileTabBar } from '../MobileTabBar';

describe('MobileTabBar', () => {
  it('renders three tabs', () => {
    render(<MobileTabBar activeTab="market" onTabChange={() => {}} />);
    expect(screen.getByText('市场')).toBeDefined();
    expect(screen.getByText('工具')).toBeDefined();
    expect(screen.getByText('聊天')).toBeDefined();
  });

  it('highlights the active tab', () => {
    const { container } = render(
      <MobileTabBar activeTab="tools" onTabChange={() => {}} />,
    );
    const buttons = container.querySelectorAll('button');
    // tools is the second button
    expect(buttons[1].className).toContain('text-[#60a5fa]');
    // market is not active
    expect(buttons[0].className).toContain('text-[#6666aa]');
  });

  it('calls onTabChange with the clicked tab key', () => {
    const onTabChange = vi.fn();
    render(<MobileTabBar activeTab="market" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('聊天'));
    expect(onTabChange).toHaveBeenCalledWith('chat');
  });

  it('calls onTabChange when clicking tools tab', () => {
    const onTabChange = vi.fn();
    render(<MobileTabBar activeTab="market" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText('工具'));
    expect(onTabChange).toHaveBeenCalledWith('tools');
  });
});
