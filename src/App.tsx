import type { MosaicBranch, MosaicNode } from 'react-mosaic-component'
import { MosaicDashboard } from './layout/MosaicDashboard'
import { EChartsWidget } from './widgets/EChartsWidget'
import { buildHeatmapOption } from './widgets/EChartsWidget/charts/HeatmapChart'
import { sampleHeatmapData } from './widgets/EChartsWidget/charts/sampleHeatmapData'

const INITIAL_LAYOUT: MosaicNode<string> = {
  direction: 'row',
  first: 'kline',
  second: 'echarts',
  splitPercentage: 60,
}

const heatmapOption = buildHeatmapOption(sampleHeatmapData)

function renderWidget(id: string, _path: MosaicBranch[]) {
  if (id === 'echarts') {
    return (
      <EChartsWidget
        option={heatmapOption}
        style={{ height: '100%' }}
      />
    )
  }
  // kline placeholder（T3 实现）
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4a4a7a',
        fontSize: 16,
        fontWeight: 500,
      }}
    >
      K 线图 — 等待 T3 实现
    </div>
  )
}

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0f0f1a',
        overflow: 'hidden',
      }}
    >
      <MosaicDashboard
        initialLayout={INITIAL_LAYOUT}
        renderWidget={renderWidget}
      />
    </div>
  )
}

export default App
