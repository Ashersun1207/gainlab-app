import type { EChartsOption, TooltipComponentOption } from 'echarts';
import type { HeatmapItem } from './sampleHeatmapData';

function changeColor(change: number): string {
  if (change > 3) return '#00c853';
  if (change > 0) return '#69f0ae';
  if (change < -3) return '#d50000';
  if (change < 0) return '#ff5252';
  return '#607d8b';
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value}`;
}

interface TreeNode {
  name: string;
  value: number;
  itemStyle: { color: string };
  change: number;
}

// ECharts callback param shape we actually use
interface CallbackParams {
  name: string;
  data: TreeNode;
}

export function buildHeatmapOption(data: HeatmapItem[]): EChartsOption {
  const treeData: TreeNode[] = data.map((item) => ({
    name: item.name,
    value: item.value,
    itemStyle: { color: changeColor(item.change) },
    change: item.change,
  }));

  const tooltipFormatter = (params: CallbackParams) => {
    const sign = params.data.change >= 0 ? '+' : '';
    return [
      `<b>${params.name}</b>`,
      `涨跌: ${sign}${params.data.change.toFixed(2)}%`,
      `市值: ${formatMarketCap(params.data.value)}`,
    ].join('<br/>');
  };

  const tooltip: TooltipComponentOption = {
    formatter: tooltipFormatter as unknown as TooltipComponentOption['formatter'],
  };

  return {
    backgroundColor: '#1a1a2e',
    tooltip,
    series: [
      {
        type: 'treemap',
        data: treeData as unknown as EChartsOption['series'],
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: false as never,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: ((params: CallbackParams) => {
            const sign = params.data.change >= 0 ? '+' : '';
            return `{name|${params.name}}\n{change|${sign}${params.data.change.toFixed(2)}%}`;
          }) as unknown as string,
          rich: {
            name: {
              fontSize: 13,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 20,
            },
            change: {
              fontSize: 12,
              color: '#ffffffcc',
              lineHeight: 18,
            },
          },
        },
        itemStyle: {
          borderColor: '#1a1a2e',
          borderWidth: 2,
          gapWidth: 2,
        },
        emphasis: {
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1,
          },
        },
      } as never,
    ],
  };
}
