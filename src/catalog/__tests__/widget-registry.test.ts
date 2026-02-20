import { describe, it, expect } from 'vitest';
import { registerWidget, getWidget, isKlineWidget } from '../widget-registry';
import { lazy } from 'react';

// Mock lazy component for testing
const MockComponent = lazy(() => Promise.resolve({ default: () => null }));

describe('widget-registry', () => {
  // Register test widgets
  registerWidget('test_kline', {
    component: MockComponent,
    wrapper: 'kline',
    propsMapper: () => ({}),
  });
  registerWidget('test_panel', {
    component: MockComponent,
    wrapper: 'panel',
    title: 'TEST',
    propsMapper: (ws) => ({ foo: ws.foo }),
  });

  it('getWidget should return registered widget', () => {
    const reg = getWidget('test_kline');
    expect(reg).toBeDefined();
    expect(reg?.wrapper).toBe('kline');
  });

  it('getWidget should return undefined for unknown type', () => {
    expect(getWidget('nonexistent')).toBeUndefined();
  });

  it('isKlineWidget should return true for kline wrapper', () => {
    expect(isKlineWidget('test_kline')).toBe(true);
  });

  it('isKlineWidget should return false for panel wrapper', () => {
    expect(isKlineWidget('test_panel')).toBe(false);
  });

  it('isKlineWidget should return false for unknown type', () => {
    expect(isKlineWidget('unknown_type')).toBe(false);
  });

  it('propsMapper should extract props from widgetState', () => {
    const reg = getWidget('test_panel');
    const props = reg?.propsMapper({ type: 'test_panel', foo: 'bar' });
    expect(props).toEqual({ foo: 'bar' });
  });
});
