import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatToggle } from '../ChatToggle';

describe('ChatToggle', () => {
  it('renders the toggle button with chat emoji', () => {
    render(<ChatToggle onClick={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /💬/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', '打开 AI 助手');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ChatToggle onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has hover scale transition classes', () => {
    render(<ChatToggle onClick={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('hover:scale-110');
  });
});
