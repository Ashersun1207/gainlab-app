import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScriptSetting } from '../ScriptSetting';
import type { ScriptInput, ScriptStyle } from '../ScriptSetting';

const sampleInputs: ScriptInput[] = [
  { key: 'p1', title: 'MA1 周期', type: 'int', defaultValue: 5, value: 5, min: 1, max: 200 },
  { key: 'p2', title: 'MA2 周期', type: 'int', defaultValue: 10, value: 10, min: 1, max: 200 },
];

const sampleStyles: ScriptStyle[] = [
  { key: 'c1', title: 'MA1 颜色', type: 'color', defaultValue: '#FF6D00', value: '#FF6D00' },
  { key: 'c2', title: 'MA2 颜色', type: 'color', defaultValue: '#2196F3', value: '#2196F3' },
];

const defaultProps = {
  scriptName: 'MA',
  inputs: sampleInputs,
  styles: sampleStyles,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
};

describe('ScriptSetting — T18 指标参数调节', () => {
  it('renders panel with script name', () => {
    const { container } = render(<ScriptSetting {...defaultProps} />);
    const title = container.querySelector('.ss-title');
    expect(title).toBeTruthy();
    expect(title!.textContent).toContain('MA');
  });

  it('renders params tab with input fields', () => {
    render(<ScriptSetting {...defaultProps} />);
    expect(screen.getByText('MA1 周期')).toBeInTheDocument();
    expect(screen.getByText('MA2 周期')).toBeInTheDocument();
  });

  it('renders styles tab with color fields', () => {
    render(<ScriptSetting {...defaultProps} />);
    // Switch to styles tab
    fireEvent.click(screen.getByText(/样式|Styles/));
    expect(screen.getByText('MA1 颜色')).toBeInTheDocument();
    expect(screen.getByText('MA2 颜色')).toBeInTheDocument();
  });

  it('number input shows current value', () => {
    render(<ScriptSetting {...defaultProps} />);
    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs).toHaveLength(2);
    expect(numberInputs[0]).toHaveValue(5);
    expect(numberInputs[1]).toHaveValue(10);
  });

  it('changing number input updates value', () => {
    render(<ScriptSetting {...defaultProps} />);
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '20' } });
    expect(numberInputs[0]).toHaveValue(20);
  });

  it('onConfirm is called with updated values', () => {
    const onConfirm = vi.fn();
    render(<ScriptSetting {...defaultProps} onConfirm={onConfirm} />);
    // Change first input
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], { target: { value: '15' } });
    // Click confirm
    fireEvent.click(screen.getByText(/确认|Apply/));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const args = onConfirm.mock.calls[0][0];
    expect(args.inputs[0].value).toBe(15);
    expect(args.inputs[1].value).toBe(10); // unchanged
  });

  it('reset restores default values', () => {
    render(<ScriptSetting {...defaultProps} />);
    const numberInputs = screen.getAllByRole('spinbutton');
    // Change value
    fireEvent.change(numberInputs[0], { target: { value: '99' } });
    expect(numberInputs[0]).toHaveValue(99);
    // Reset
    fireEvent.click(screen.getByText(/恢复默认|Reset/));
    expect(numberInputs[0]).toHaveValue(5);
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(<ScriptSetting {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<ScriptSetting {...defaultProps} onClose={onClose} />);
    const backdrop = container.querySelector('.ss-backdrop');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tab switching works', () => {
    render(<ScriptSetting {...defaultProps} />);
    // Initially on params tab
    expect(screen.getByText('MA1 周期')).toBeInTheDocument();
    // Switch to styles
    fireEvent.click(screen.getByText(/样式|Styles/));
    expect(screen.getByText('MA1 颜色')).toBeInTheDocument();
    // Switch back to params
    fireEvent.click(screen.getByText(/参数|Params/));
    expect(screen.getByText('MA1 周期')).toBeInTheDocument();
  });

  it('styles-only mode hides tabs (e.g. VWAP)', () => {
    render(
      <ScriptSetting
        scriptName="VWAP"
        inputs={[]}
        styles={[sampleStyles[0]]}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    // No tabs rendered when only one type exists
    expect(screen.queryByText(/参数|Params/)).not.toBeInTheDocument();
    // Style field is visible
    expect(screen.getByText('MA1 颜色')).toBeInTheDocument();
  });

  it('min/max clamping works', () => {
    render(<ScriptSetting {...defaultProps} />);
    const numberInputs = screen.getAllByRole('spinbutton');
    // Try to set below min (1)
    fireEvent.change(numberInputs[0], { target: { value: '0' } });
    expect(numberInputs[0]).toHaveValue(1);
    // Try to set above max (200)
    fireEvent.change(numberInputs[0], { target: { value: '999' } });
    expect(numberInputs[0]).toHaveValue(200);
  });
});
