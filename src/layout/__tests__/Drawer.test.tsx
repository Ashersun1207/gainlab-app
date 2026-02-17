import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from '../Drawer';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Drawer open={false} activeTool={null} onClose={vi.fn()}>
        <div>content</div>
      </Drawer>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when open but no active tool', () => {
    const { container } = render(
      <Drawer open={true} activeTool={null} onClose={vi.fn()}>
        <div>content</div>
      </Drawer>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders tool title and children when open with tool', () => {
    render(
      <Drawer open={true} activeTool="heatmap" onClose={vi.fn()}>
        <div>heatmap content</div>
      </Drawer>,
    );
    expect(screen.getByText('板块热力图')).toBeInTheDocument();
    expect(screen.getByText('heatmap content')).toBeInTheDocument();
  });

  it('renders correct icon for active tool', () => {
    render(
      <Drawer open={true} activeTool="volume_profile" onClose={vi.fn()}>
        <div>vp content</div>
      </Drawer>,
    );
    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('筹码分布')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} activeTool="heatmap" onClose={onClose}>
        <div>content</div>
      </Drawer>,
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets drawer height to 40%', () => {
    const { container } = render(
      <Drawer open={true} activeTool="wrb" onClose={vi.fn()}>
        <div>wrb content</div>
      </Drawer>,
    );
    const drawer = container.firstChild as HTMLElement;
    expect(drawer.style.height).toBe('40%');
    expect(drawer.style.minHeight).toBe('200px');
  });
});
