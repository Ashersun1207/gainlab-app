import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetBase } from '../WidgetBase';

describe('WidgetBase', () => {
  it('renders title as fallback when no header provided', () => {
    render(
      <WidgetBase title="My Widget">
        <div>content</div>
      </WidgetBase>,
    );
    expect(screen.getByText('My Widget')).toBeInTheDocument();
  });

  it('renders custom header content', () => {
    render(
      <WidgetBase header={<span>Custom Header</span>}>
        <div>body</div>
      </WidgetBase>,
    );
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });

  it('header takes priority over title when both provided', () => {
    render(
      <WidgetBase header={<span>Header Wins</span>} title="Title Loses">
        <div>body</div>
      </WidgetBase>,
    );
    expect(screen.getByText('Header Wins')).toBeInTheDocument();
    expect(screen.queryByText('Title Loses')).not.toBeInTheDocument();
  });

  it('renders close button and calls onRemove when clicked', () => {
    const onRemove = vi.fn();
    render(
      <WidgetBase title="Widget" onRemove={onRemove}>
        <div>body</div>
      </WidgetBase>,
    );
    const closeBtn = screen.getByTitle('关闭');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('does not render close button when onRemove is not provided', () => {
    render(
      <WidgetBase title="Widget">
        <div>body</div>
      </WidgetBase>,
    );
    expect(screen.queryByTitle('关闭')).not.toBeInTheDocument();
  });

  it('renders children in the body area', () => {
    render(
      <WidgetBase title="Widget">
        <div data-testid="child-content">child</div>
      </WidgetBase>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
