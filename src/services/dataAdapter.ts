import type { EChartsOption } from 'echarts';
import type { KLineData, HeatmapItem } from '../types/data';

type RenderTarget = 'kline' | 'echarts';

/** 根据 tool 名称判断渲染目标 */
export function getRenderTarget(toolName: string): RenderTarget {
  const klineTools = [
    'gainlab_kline',
    'gainlab_indicators',
    'gainlab_volume_profile',
    'gainlab_wrb_scoring',
  ];
  return klineTools.includes(toolName) ? 'kline' : 'echarts';
}

/**
 * Binance 原始 K 线数组 → KLineData[]
 * Binance 返回格式：[openTime, open, high, low, close, volume, ...]
 */
export function binanceToKLine(raw: unknown[][]): KLineData[] {
  return raw.map((item) => ({
    timestamp: item[0] as number,
    open: parseFloat(item[1] as string),
    high: parseFloat(item[2] as string),
    low: parseFloat(item[3] as string),
    close: parseFloat(item[4] as string),
    volume: parseFloat(item[5] as string),
  }));
}

/**
 * MCP tool result → KLineData[]
 * MCP Worker 返回格式：{ data: KLineData[] } 或 { klines: unknown[][] }
 */
export function mcpToKLine(result: unknown): KLineData[] {
  if (!result || typeof result !== 'object') return [];

  const r = result as Record<string, unknown>;

  // 优先取 data 字段（已经是 KLineData 格式）
  if (Array.isArray(r['data'])) {
    const arr = r['data'] as unknown[];
    if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
      const first = arr[0] as Record<string, unknown>;
      if ('timestamp' in first && 'open' in first) {
        return arr as KLineData[];
      }
      // Binance 原始数组嵌套
      if (Array.isArray(arr[0])) {
        return binanceToKLine(arr as unknown[][]);
      }
    }
  }

  // 兼容 klines 字段（Binance raw）
  if (Array.isArray(r['klines'])) {
    return binanceToKLine(r['klines'] as unknown[][]);
  }

  // 结果本身就是数组
  if (Array.isArray(result)) {
    const arr = result as unknown[];
    if (arr.length > 0 && Array.isArray(arr[0])) {
      return binanceToKLine(arr as unknown[][]);
    }
    const first = arr[0] as Record<string, unknown>;
    if (first && 'timestamp' in first) {
      return arr as KLineData[];
    }
  }

  return [];
}

// ─── ECharts option builders ──────────────────────────────────────────────────

function buildHeatmapOption(items: HeatmapItem[]): EChartsOption {
  const sorted = [...items].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const data = sorted.map((item) => ({
    name: item.name,
    value: [item.value, item.change],
  }));

  return {
    backgroundColor: '#0d0d20',
    tooltip: {
      formatter: (params: unknown) => {
        const p = params as { name: string; value: [number, number] };
        const sign = p.value[1] >= 0 ? '+' : '';
        return `${p.name}<br/>市值: $${(p.value[0] / 1e9).toFixed(1)}B<br/>涨跌: ${sign}${p.value[1].toFixed(2)}%`;
      },
    },
    series: [
      {
        type: 'treemap',
        data: data.map((d) => ({
          name: d.name,
          value: d.value[0],
          itemStyle: {
            color:
              d.value[1] >= 0
                ? `rgba(38,166,154,${Math.min(0.3 + Math.abs(d.value[1]) * 0.07, 1)})`
                : `rgba(239,83,80,${Math.min(0.3 + Math.abs(d.value[1]) * 0.07, 1)})`,
          },
          label: {
            formatter: `{b}\n${d.value[1] >= 0 ? '+' : ''}${d.value[1].toFixed(2)}%`,
          },
        })),
        label: { show: true, color: '#fff', fontSize: 12 },
        breadcrumb: { show: false },
        roam: false,
      },
    ],
  } as EChartsOption;
}

function buildLineOption(toolName: string, result: Record<string, unknown>): EChartsOption {
  const series = (result['series'] as unknown[]) ?? [];
  const xAxis = (result['xAxis'] as string[]) ?? [];

  return {
    backgroundColor: '#0d0d20',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: '#aaa' } },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: xAxis, axisLabel: { color: '#aaa' } },
    yAxis: { type: 'value', axisLabel: { color: '#aaa' } },
    series: Array.isArray(series) ? series : [],
    title: { text: toolName.replace('gainlab_', ''), textStyle: { color: '#ccc' } },
  } as EChartsOption;
}

/**
 * MCP tool result → ECharts option
 * 根据 toolName 选择合适的图表类型
 */
export function mcpToEChartsOption(toolName: string, result: unknown): EChartsOption {
  if (!result || typeof result !== 'object') {
    return {
      backgroundColor: '#0d0d20',
      title: { text: '暂无数据', textStyle: { color: '#666' } },
    };
  }

  const r = result as Record<string, unknown>;

  // 如果结果已经是完整的 ECharts option（含 series 字段）
  if (Array.isArray(r['series'])) {
    return {
      backgroundColor: '#0d0d20',
      ...r,
    } as EChartsOption;
  }

  // heatmap 类工具
  if (toolName.includes('heatmap') || toolName.includes('market_cap')) {
    const items = (r['items'] ?? r['data'] ?? []) as HeatmapItem[];
    return buildHeatmapOption(items);
  }

  // 通用折线图兜底
  return buildLineOption(toolName, r);
}
