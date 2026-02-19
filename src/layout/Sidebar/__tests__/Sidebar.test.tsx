import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../index';
import { SCENE_CONFIGS } from '../sceneConfig';

describe('Sidebar (scene catalog model)', () => {
  const defaultProps = {
    activeScene: 'stock_analysis',
    onSceneSelect: vi.fn(),
  };

  it('renders the GL logo', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByTestId('sidebar-logo')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-logo')).toHaveTextContent('GL');
  });

  it('renders sidebar toggle button', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('renders all 14 scene items', () => {
    render(<Sidebar {...defaultProps} />);
    SCENE_CONFIGS.forEach((scene) => {
      expect(screen.getByTestId(`scene-${scene.id}`)).toBeInTheDocument();
    });
  });

  it('clicking implemented scene calls onSceneSelect', () => {
    const onSceneSelect = vi.fn();
    render(<Sidebar {...defaultProps} onSceneSelect={onSceneSelect} />);
    fireEvent.click(screen.getByTestId('scene-snapshot'));
    expect(onSceneSelect).toHaveBeenCalledWith('snapshot');
  });

  it('clicking unimplemented scene does NOT call onSceneSelect', () => {
    const onSceneSelect = vi.fn();
    render(<Sidebar {...defaultProps} onSceneSelect={onSceneSelect} />);
    const btn = screen.getByTestId('scene-fundamentals');
    fireEvent.click(btn);
    expect(onSceneSelect).not.toHaveBeenCalled();
  });

  it('active scene has active class', () => {
    render(<Sidebar {...defaultProps} activeScene="snapshot" />);
    const btn = screen.getByTestId('scene-snapshot');
    expect(btn.className).toContain('sb-item-active');
  });

  it('non-active scene does not have active class', () => {
    render(<Sidebar {...defaultProps} activeScene="snapshot" />);
    const btn = screen.getByTestId('scene-stock_analysis');
    expect(btn.className).not.toContain('sb-item-active');
  });

  it('unimplemented scenes are disabled', () => {
    render(<Sidebar {...defaultProps} />);
    const btn = screen.getByTestId('scene-fundamentals');
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('sb-item-disabled');
  });

  it('toggle expands sidebar', () => {
    render(<Sidebar {...defaultProps} />);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.className).not.toContain('sidebar-expanded');

    fireEvent.click(screen.getByTestId('sidebar-toggle'));
    expect(sidebar.className).toContain('sidebar-expanded');
  });

  it('toggle collapses sidebar when already expanded', () => {
    render(<Sidebar {...defaultProps} />);
    const toggle = screen.getByTestId('sidebar-toggle');
    const sidebar = screen.getByTestId('sidebar');

    fireEvent.click(toggle); // expand
    expect(sidebar.className).toContain('sidebar-expanded');

    fireEvent.click(toggle); // collapse
    expect(sidebar.className).not.toContain('sidebar-expanded');
  });

  it('shows section headers when expanded', () => {
    render(<Sidebar {...defaultProps} />);
    // Expand sidebar first
    fireEvent.click(screen.getByTestId('sidebar-toggle'));
    expect(screen.getByTestId('section-dashboards')).toBeInTheDocument();
    expect(screen.getByTestId('section-portfolio')).toBeInTheDocument();
    expect(screen.getByTestId('section-ai')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    expect(() =>
      render(
        <Sidebar activeScene="stock_analysis" onSceneSelect={vi.fn()} />,
      ),
    ).not.toThrow();
  });

  it('implemented scenes count matches SCENE_CONFIGS', () => {
    const implemented = SCENE_CONFIGS.filter((s) => s.implemented);
    render(<Sidebar {...defaultProps} />);
    implemented.forEach((scene) => {
      const btn = screen.getByTestId(`scene-${scene.id}`);
      expect(btn).not.toBeDisabled();
    });
  });

  it('unimplemented scenes count matches SCENE_CONFIGS', () => {
    const unimplemented = SCENE_CONFIGS.filter((s) => !s.implemented);
    render(<Sidebar {...defaultProps} />);
    unimplemented.forEach((scene) => {
      const btn = screen.getByTestId(`scene-${scene.id}`);
      expect(btn).toBeDisabled();
    });
  });

  it('scene list container renders', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByTestId('scene-list')).toBeInTheDocument();
  });

  it('clicking same scene twice still calls onSceneSelect', () => {
    const onSceneSelect = vi.fn();
    render(<Sidebar {...defaultProps} onSceneSelect={onSceneSelect} />);
    fireEvent.click(screen.getByTestId('scene-stock_analysis'));
    fireEvent.click(screen.getByTestId('scene-stock_analysis'));
    expect(onSceneSelect).toHaveBeenCalledTimes(2);
  });

  it('all 4 implemented scenes are clickable', () => {
    const onSceneSelect = vi.fn();
    render(<Sidebar {...defaultProps} onSceneSelect={onSceneSelect} />);
    // ai, snapshot, stock_analysis, market_heat
    fireEvent.click(screen.getByTestId('scene-ai'));
    fireEvent.click(screen.getByTestId('scene-snapshot'));
    fireEvent.click(screen.getByTestId('scene-stock_analysis'));
    fireEvent.click(screen.getByTestId('scene-market_heat'));
    expect(onSceneSelect).toHaveBeenCalledTimes(4);
  });
});
