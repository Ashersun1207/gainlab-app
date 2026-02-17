import { useState, useCallback } from 'react'
import type { MosaicBranch, MosaicNode } from 'react-mosaic-component'
import type { EChartsOption } from 'echarts'
import { MosaicDashboard } from './layout/MosaicDashboard'
import { EChartsWidget } from './widgets/EChartsWidget'
import { buildHeatmapOption } from './widgets/EChartsWidget/charts/HeatmapChart'
import { sampleHeatmapData } from './widgets/EChartsWidget/charts/sampleHeatmapData'
import { KLineWidget } from './widgets/KLineWidget'
import { ChatPanel } from './chat/ChatPanel'
import { getRenderTarget, mcpToKLine, mcpToEChartsOption } from './services/dataAdapter'
import type { KLineData } from './types/data'

// 默认热力图（Chat 更新前显示）
const defaultHeatmapOption = buildHeatmapOption(sampleHeatmapData)

// Mosaic 左侧布局：kline 上 / echarts 下
const INNER_LAYOUT: MosaicNode<string> = {
  direction: 'column',
  first: 'kline',
  second: 'echarts',
  splitPercentage: 60,
}

function App() {
  // Widget 数据状态：null 表示使用默认/fallback 数据
  const [klineData, setKlineData] = useState<KLineData[] | null>(null)
  const [echartsOption, setEchartsOption] = useState<EChartsOption | null>(null)

  // ChatPanel 回调：tool result → 更新 Widget
  const handleToolResult = useCallback(
    (toolName: string, result: unknown) => {
      const target = getRenderTarget(toolName)
      if (target === 'kline') {
        const data = mcpToKLine(result)
        if (data.length > 0) {
          setKlineData(data)
        }
      } else {
        const option = mcpToEChartsOption(toolName, result)
        setEchartsOption(option)
      }
    },
    [],
  )

  // Mosaic renderWidget（只渲染左侧两个 widget）
  const renderWidget = useCallback(
    (id: string, _path: MosaicBranch[]) => {
      if (id === 'kline') {
        return (
          <KLineWidget
            symbol="BTCUSDT"
            data={klineData ?? undefined}
            indicators={['RSI']}
          />
        )
      }
      if (id === 'echarts') {
        return (
          <EChartsWidget
            option={echartsOption ?? defaultHeatmapOption}
            style={{ height: '100%' }}
          />
        )
      }
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
          Unknown widget: {id}
        </div>
      )
    },
    [klineData, echartsOption],
  )

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0f0f1a',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* 左侧：Mosaic（kline + echarts） */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <MosaicDashboard
          initialLayout={INNER_LAYOUT}
          renderWidget={renderWidget}
        />
      </div>

      {/* 右侧：固定 Chat 面板（320px） */}
      <div style={{ width: 320, flexShrink: 0, overflow: 'hidden' }}>
        <ChatPanel onToolResult={handleToolResult} />
      </div>
    </div>
  )
}

export default App
