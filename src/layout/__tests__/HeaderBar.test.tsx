import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderBar } from '../HeaderBar';

describe('HeaderBar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the GainLab logo text', () => {
    render(<HeaderBar />);
    expect(screen.getByText('GainLab')).toBeInTheDocument();
  });

  it('renders all 4 data source status pills', () => {
    render(<HeaderBar />);
    expect(screen.getByText('Crypto')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('A股')).toBeInTheDocument();
    expect(screen.getByText('Metal')).toBeInTheDocument();
  });

  it('renders theme toggle button and Agent button', () => {
    render(<HeaderBar />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agent/i })).toBeInTheDocument();
  });

  it('Crypto status dot is always green (no localStorage key needed)', () => {
    // No localStorage set at all
    render(<HeaderBar />);
    const dot = screen.getByTestId('dot-Crypto');
    expect(dot).toHaveStyle({ background: '#26a69a' });
  });

  it('non-Crypto sources are offline (grey) when no BYOK keys set', () => {
    render(<HeaderBar />);
    expect(screen.getByTestId('dot-US')).toHaveStyle({ background: '#5a5a8a' });
    expect(screen.getByTestId('dot-A股')).toHaveStyle({ background: '#5a5a8a' });
    expect(screen.getByTestId('dot-Metal')).toHaveStyle({ background: '#5a5a8a' });
  });

  it('sources show green when corresponding BYOK keys are present', () => {
    localStorage.setItem(
      'gainlab-byok',
      JSON.stringify({ us: 'key123', cn: 'key456', metal: 'key789' }),
    );
    render(<HeaderBar />);
    expect(screen.getByTestId('dot-US')).toHaveStyle({ background: '#26a69a' });
    expect(screen.getByTestId('dot-A股')).toHaveStyle({ background: '#26a69a' });
    expect(screen.getByTestId('dot-Metal')).toHaveStyle({ background: '#26a69a' });
  });

  it('Agent button has highlighted blue style by default', () => {
    render(<HeaderBar />);
    const agentBtn = screen.getByRole('button', { name: /agent/i });
    expect(agentBtn).toHaveStyle({ background: '#2563eb' });
  });
});
