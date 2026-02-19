import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

interface EChartsWidgetProps {
  option: EChartsOption;
  style?: CSSProperties;
  onReady?: (instance: unknown) => void;
  onEvents?: Record<string, (params: Record<string, unknown>) => void>;
}

export function EChartsWidget({ option, style, onReady, onEvents }: EChartsWidgetProps) {
  return (
    <ReactECharts
      option={option}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 200,
        ...style,
      }}
      theme="dark"
      notMerge
      lazyUpdate
      onChartReady={onReady}
      onEvents={onEvents}
    />
  );
}
