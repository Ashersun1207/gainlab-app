import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetPanel } from '../WidgetPanel';

describe('WidgetPanel', () => {
  it('renders title', () => {
    render(<WidgetPanel title="MY TITLE">content</WidgetPanel>);
    expect(screen.getByText('MY TITLE')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<WidgetPanel title="T" subtitle="SUB">content</WidgetPanel>);
    expect(screen.getByText('SUB')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<WidgetPanel title="T">content</WidgetPanel>);
    expect(container.querySelector('.wph-sym')).toBeNull();
  });

  it('calls onRefresh when clicked', () => {
    const onRefresh = vi.fn();
    render(<WidgetPanel title="T" onRefresh={onRefresh}>content</WidgetPanel>);
    fireEvent.click(screen.getByTitle('刷新'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onFullscreen when clicked', () => {
    const onFullscreen = vi.fn();
    render(<WidgetPanel title="T" onFullscreen={onFullscreen}>content</WidgetPanel>);
    fireEvent.click(screen.getByTitle('全屏'));
    expect(onFullscreen).toHaveBeenCalledTimes(1);
  });

  it('hides buttons when callbacks not provided', () => {
    const { container } = render(<WidgetPanel title="T">content</WidgetPanel>);
    expect(container.querySelectorAll('.wph-btn')).toHaveLength(0);
  });

  it('renders children', () => {
    render(<WidgetPanel title="T"><span data-testid="child">hi</span></WidgetPanel>);
    expect(screen.getByTestId('child')).toBeTruthy();
  });
});
