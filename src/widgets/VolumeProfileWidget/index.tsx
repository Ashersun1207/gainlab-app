import { useMemo, Suspense, lazy } from 'react';
import type { EChartsOption } from 'echarts';
import type { KLineData, VolumeProfileData } from '../../types/data';
import { calculateVP } from './calculateVP';

const LazyECharts = lazy(() =>
  import('../EChartsWidget').then((m) => ({ default: m.EChartsWidget })),
);

interface VolumeProfileWidgetProps {
  klineData: KLineData[];
  bins?: number;
}

function buildVPOption(vp: VolumeProfileData): EChartsOption {
  return {
    backgroundColor: '#0d0d20',
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = (params as Array<{ name: string; value: number }>)[0];
        if (!p) return '';
        const level = vp.levels.find(
          (l) => l.price.toFixed(2) === p.name,
        );
        if (!level) return `${p.name}: ${p.value.toFixed(0)}`;
        return [
          `<b>$${p.name}</b>`,
          `总量: ${level.volume.toFixed(0)}`,
          `<span style="color:#22c55e">买: ${level.buyVolume.toFixed(0)}</span>`,
          `<span style="color:#ef4444">卖: ${level.sellVolume.toFixed(0)}</span>`,
        ].join('<br/>');
      },
    } as EChartsOption['tooltip'],
    grid: { left: 70, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#888' },
      splitLine: { lineStyle: { color: '#1e1e3a' } },
    },
    yAxis: {
      type: 'category',
      data: vp.levels.map((l) => l.price.toFixed(2)),
      axisLabel: { color: '#888', fontSize: 9 },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: vp.levels.map((l) => ({
          value: l.volume,
          itemStyle: {
            color:
              l.price === vp.poc
                ? '#ffc107' // POC — gold
                : l.price >= vp.val && l.price <= vp.vah
                  ? 'rgba(34,197,94,0.5)' // Value Area — green
                  : 'rgba(100,100,180,0.25)', // Outside — dim
          },
        })),
        barWidth: '80%',
      },
    ],
    title: {
      text: `VP · POC ${vp.poc.toFixed(2)} | VAH ${vp.vah.toFixed(2)} | VAL ${vp.val.toFixed(2)}`,
      textStyle: { color: '#ccc', fontSize: 11 },
      left: 10,
      top: 8,
    },
  };
}

export function VolumeProfileWidget({
  klineData,
  bins = 50,
}: VolumeProfileWidgetProps) {
  const vp = useMemo(() => calculateVP(klineData, bins), [klineData, bins]);
  const option = useMemo(() => buildVPOption(vp), [vp]);

  if (klineData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#6666aa] text-sm">
        请先选择资产以查看筹码分布
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="w-full h-full bg-[#0d0d20]" />}>
      <LazyECharts option={option} style={{ height: '100%' }} />
    </Suspense>
  );
}
