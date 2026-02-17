import type { IndicatorTemplate, IndicatorInput } from '../../component/Indicator'

interface Avp {
  avp?: number
}
const info = {
  title: '平均成交价格',
  subTitle: 'Average Volume Price',
  default: false,
  pertain: 'main',
  position: ['main', 'vice'],
  vip: 0,
  explain: `
  <p>AVP 平均成交价格</p>
  `
}
const defaultInputs = [
  {
    key: 'period',
    title: '周期',
    type: 'number',
    value: 20,
  },
]
const defaultStyles = {
  lines: [
    {
      title: '平均成交价格',
      color: '#FFFF00',
      dashedValue: [2, 2],
      size: 1,
      smooth: false,
      style: 'solid' as const
    },
  ]
}
/**
 * average price
 */
const averagePrice: IndicatorTemplate<Avp, IndicatorInput> = {
  name: 'AVP',
  shortName: 'AVP',
  series: 'price',
  precision: 2,
  info,
  inputs: defaultInputs,
  styles: defaultStyles,
  figures: [
    { key: 'avp', title: 'AVP: ', type: 'line' }
  ],
  calc: (dataList, indicator) => {
    const periodInput = indicator.inputs.find(input => input.key === 'period')
    const period = typeof periodInput?.value === 'number' ? periodInput.value : (typeof periodInput?.value === 'string' ? parseInt(periodInput.value) : 10)
    return dataList.map((kLineData, index) => {
      const avp: Avp = {}
      // 计算周期范围
      const startIndex = Math.max(0, index - period + 1)
      const endIndex = index + 1
      let totalTurnover = 0
      let totalVolume = 0
      for (let i = startIndex; i < endIndex; i++) {
        totalTurnover += dataList[i].turnover ?? 0
        totalVolume += dataList[i].volume ?? 0
      }

      if (totalVolume !== 0) {
        avp.avp = totalTurnover / totalVolume
      }

      return avp
    })
  }
}

export default averagePrice
