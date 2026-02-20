import { describe, it, expect } from 'vitest';
import { buildWidgetPrompt } from '../build-prompt';
import { WIDGET_TYPES } from '../widget-catalog';

describe('buildWidgetPrompt', () => {
  const output = buildWidgetPrompt();

  it('should include Available Widgets header', () => {
    expect(output).toContain('## Available Widgets');
  });

  it('should include all 7 widget type names', () => {
    for (const type of WIDGET_TYPES) {
      expect(output).toContain(`### ${type}`);
    }
  });

  it('should include parameter descriptions', () => {
    expect(output).toContain('symbol');
    expect(output).toContain('market');
    expect(output).toContain('required');
  });

  it('should include Output Format section', () => {
    expect(output).toContain('## Output Format');
    expect(output).toContain('widgetState');
  });

  it('should include example prompts', () => {
    expect(output).toContain('show BTC 1h chart');
    expect(output).toContain('crypto heatmap');
  });

  it('should include market enum values', () => {
    expect(output).toContain('crypto');
    expect(output).toContain('metal');
  });
});
