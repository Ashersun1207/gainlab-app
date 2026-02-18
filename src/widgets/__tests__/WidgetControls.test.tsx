import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetControls } from '../WidgetControls';

describe('WidgetControls', () => {
  it('renders no buttons when no props are provided', () => {
    render(<WidgetControls />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders refresh button when onRefresh is provided', () => {
    render(<WidgetControls onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('renders fullscreen button when onFullscreen is provided', () => {
    render(<WidgetControls onFullscreen={vi.fn()} />);
    expect(screen.getByRole('button', { name: /fullscreen/i })).toBeInTheDocument();
  });

  it('renders close button when onRemove is provided', () => {
    render(<WidgetControls onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<WidgetControls onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onFullscreen when fullscreen button is clicked', () => {
    const onFullscreen = vi.fn();
    render(<WidgetControls onFullscreen={onFullscreen} />);
    fireEvent.click(screen.getByRole('button', { name: /fullscreen/i }));
    expect(onFullscreen).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when close button is clicked', () => {
    const onRemove = vi.fn();
    render(<WidgetControls onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders all 3 buttons when all props are provided', () => {
    render(
      <WidgetControls
        onRefresh={vi.fn()}
        onFullscreen={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('does not render fullscreen button when onFullscreen is not provided', () => {
    render(<WidgetControls onRefresh={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /fullscreen/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
