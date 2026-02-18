import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntervalPicker } from '../IntervalPicker';

describe('IntervalPicker', () => {
  it('renders all 8 time interval buttons', () => {
    render(<IntervalPicker value="1D" onChange={vi.fn()} />);
    const expectedLabels = ['1m', '5m', '15m', '1H', '4H', '1D', '1W', '1M'];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
  });

  it('highlights the currently active interval button', () => {
    render(<IntervalPicker value="1h" onChange={vi.fn()} />);
    const activeBtn = screen.getByText('1H');
    expect(activeBtn.className).toContain('bg-[#2563eb]');
    expect(activeBtn.className).toContain('text-white');
  });

  it('inactive buttons do not have the active highlight class', () => {
    render(<IntervalPicker value="1D" onChange={vi.fn()} />);
    const inactiveBtn = screen.getByText('1m');
    expect(inactiveBtn.className).not.toContain('bg-[#2563eb]');
    expect(inactiveBtn.className).toContain('text-[#5a5a8a]');
  });

  it('calls onChange with the correct interval value when clicked', () => {
    const onChange = vi.fn();
    render(<IntervalPicker value="1D" onChange={onChange} />);
    fireEvent.click(screen.getByText('4H'));
    expect(onChange).toHaveBeenCalledWith('4h');
  });

  it('calls onChange with 1m when 1m button is clicked', () => {
    const onChange = vi.fn();
    render(<IntervalPicker value="1D" onChange={onChange} />);
    fireEvent.click(screen.getByText('1m'));
    expect(onChange).toHaveBeenCalledWith('1m');
  });

  it('buttons have aria-pressed attribute reflecting active state', () => {
    render(<IntervalPicker value="1W" onChange={vi.fn()} />);
    const activeBtn = screen.getByText('1W');
    const inactiveBtn = screen.getByText('1D');
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true');
    expect(inactiveBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
