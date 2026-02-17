/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { isValid } from '../common/utils/typeChecks'
import { calcTextWidth } from '../common/utils/canvas'
import type { TextStyle } from '../common/Styles'

import View from './View'

import type { FigureCreate } from '../component/Figure'
import type YAxis from '../component/YAxis'
import type { TextAttrs } from '../extension/figure/text'
import type { Period } from '../common/Period'
import { UpdateLevel } from '../common/Updater'

export default class CandleLastPriceLabelView extends View {
  private _countdownTimer: number | null = null

     /**
    * 计算当前周期的剩余时间
    */
   private calculateRemainingTime(currentTimestamp: number, period: Period): string {
     const widget = this.getWidget()
     const pane = widget.getPane()
     const chartStore = pane.getChart().getChartStore()
     const { type, span } = period
     
     const now = Date.now()
    
    // 计算周期的毫秒数
    let periodMs = 0
    switch (type) {
      case 'second':
        periodMs = span * 1000
        break
      case 'minute':
        periodMs = span * 60 * 1000
        break
      case 'hour':
        periodMs = span * 60 * 60 * 1000
        break
      case 'day':
        periodMs = span * 24 * 60 * 60 * 1000
        break
      case 'week':
        periodMs = span * 7 * 24 * 60 * 60 * 1000
        break
      case 'month':
        periodMs = span * 30 * 24 * 60 * 60 * 1000 // 近似30天（仅用于非月线周期的计算）
        break
      default:
        return ''
    }

         // 计算下一个周期的开始时间
     let nextPeriodStart: number
     
          if (type === 'day' || type === 'week' || type === 'month') {
       // 日、周、月线：基于K线数据的时区对齐到下一个周期开始
       const currentDate = new Date(currentTimestamp)
       const nextDate = new Date(currentDate)
       
       switch (type) {
         case 'day':
           // 日线：计算到明天0点（基于图表时区）
           const chartTimezone = chartStore.getTimezone()
           
           // 获取当前时间在目标时区的各个部分
           const nowDate = new Date(now)
           const formatter = new Intl.DateTimeFormat('en-CA', {
             timeZone: chartTimezone,
             year: 'numeric',
             month: '2-digit',
             day: '2-digit',
             hour: '2-digit',
             minute: '2-digit',
             second: '2-digit',
             hour12: false
           })
           
           const parts = formatter.formatToParts(nowDate)
           const year = parseInt(parts.find(p => p.type === 'year')?.value || '0')
           const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1 // 月份从0开始
           const day = parseInt(parts.find(p => p.type === 'day')?.value || '0')
           const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
           const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
           const second = parseInt(parts.find(p => p.type === 'second')?.value || '0')
           
           // 创建今天在目标时区的Date对象（作为本地时间）
           const todayInTz = new Date(year, month, day, hour, minute, second)
           
           // 创建明天0点在目标时区的Date对象
           const tomorrowInTz = new Date(year, month, day + 1, 0, 0, 0)
           
           // 计算时间差
           const diffInTz = tomorrowInTz.getTime() - todayInTz.getTime()
           
           // 计算实际的下一个周期开始时间（UTC）
           nextDate.setTime(now + diffInTz)
           
           break
         case 'week':
           // 周线：计算到下周一0点（基于图表时区）
           const chartTimezoneWeek = chartStore.getTimezone()
           
           // 获取当前时间在目标时区的各个部分
           const nowDateWeek = new Date(now)
           const formatterWeek = new Intl.DateTimeFormat('en-CA', {
             timeZone: chartTimezoneWeek,
             year: 'numeric',
             month: '2-digit',
             day: '2-digit',
             hour: '2-digit',
             minute: '2-digit',
             second: '2-digit',
             weekday: 'short',
             hour12: false
           })
           
           const partsWeek = formatterWeek.formatToParts(nowDateWeek)
           const yearWeek = parseInt(partsWeek.find(p => p.type === 'year')?.value || '0')
           const monthWeek = parseInt(partsWeek.find(p => p.type === 'month')?.value || '0') - 1
           const dayWeek = parseInt(partsWeek.find(p => p.type === 'day')?.value || '0')
           const hourWeek = parseInt(partsWeek.find(p => p.type === 'hour')?.value || '0')
           const minuteWeek = parseInt(partsWeek.find(p => p.type === 'minute')?.value || '0')
           const secondWeek = parseInt(partsWeek.find(p => p.type === 'second')?.value || '0')
           
           // 创建今天在目标时区的Date对象
           const todayInTzWeek = new Date(yearWeek, monthWeek, dayWeek, hourWeek, minuteWeek, secondWeek)
           
           // 计算下周一0点（周一是1，周日是0）
           const currentDayOfWeek = todayInTzWeek.getDay() // 0=周日, 1=周一...6=周六
           const daysUntilNextMonday = currentDayOfWeek === 0 ? 1 : (8 - currentDayOfWeek) // 如果是周日，1天后是周一；否则8-当前天数
           
           const nextMondayInTz = new Date(yearWeek, monthWeek, dayWeek + daysUntilNextMonday, 0, 0, 0)
           
           // 计算时间差
           const diffInTzWeek = nextMondayInTz.getTime() - todayInTzWeek.getTime()
           
           nextDate.setTime(now + diffInTzWeek)
           break
         case 'month':
           // 月线：计算到下个月1日0时0分（基于图表时区）
           const chartTimezoneMonth = chartStore.getTimezone()
           
           // 获取当前时间在目标时区的各个部分
           const nowDateMonth = new Date(now)
           const formatterMonth = new Intl.DateTimeFormat('en-CA', {
             timeZone: chartTimezoneMonth,
             year: 'numeric',
             month: '2-digit',
             day: '2-digit',
             hour: '2-digit',
             minute: '2-digit',
             second: '2-digit',
             hour12: false
           })
           
           const partsMonth = formatterMonth.formatToParts(nowDateMonth)
           const yearMonth = parseInt(partsMonth.find(p => p.type === 'year')?.value || '0')
           const monthMonth = parseInt(partsMonth.find(p => p.type === 'month')?.value || '0') - 1
           const dayMonth = parseInt(partsMonth.find(p => p.type === 'day')?.value || '0')
           const hourMonth = parseInt(partsMonth.find(p => p.type === 'hour')?.value || '0')
           const minuteMonth = parseInt(partsMonth.find(p => p.type === 'minute')?.value || '0')
           const secondMonth = parseInt(partsMonth.find(p => p.type === 'second')?.value || '0')
           
           // 创建今天在目标时区的Date对象
           const todayInTzMonth = new Date(yearMonth, monthMonth, dayMonth, hourMonth, minuteMonth, secondMonth)
           
           // 创建下个月1日0点在目标时区的Date对象
           const nextMonthInTz = new Date(yearMonth, monthMonth + 1, 1, 0, 0, 0)
           
           // 计算时间差
           const diffInTzMonth = nextMonthInTz.getTime() - todayInTzMonth.getTime()
           
           nextDate.setTime(now + diffInTzMonth)
           break
       }
       nextPeriodStart = nextDate.getTime()
     } else {
       // 秒、分钟、小时：直接加时间间隔
       nextPeriodStart = currentTimestamp + periodMs
     }
     
     const remainingMs = nextPeriodStart - now

    if (remainingMs <= 0) {
      return '0:00:00'
    }

    // 转换为时分秒格式
    const hours = Math.floor(remainingMs / (60 * 60 * 1000))
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000)

     // 统一的时间格式化函数
     const formatTime = (h: number, m: number, s: number) => {
       const hourStr = h >= 10 ? h.toString() : h.toString() // 小时：>=10显示两位，<10显示一位
       const minStr = m.toString().padStart(2, '0') // 分钟：始终两位
       const secStr = s.toString().padStart(2, '0') // 秒：始终两位
       return `${hourStr}:${minStr}:${secStr}`
     }

     // 根据周期类型选择显示格式
     if (type === 'second' || type === 'minute' || type === 'hour' || type === 'day') {
       // 秒、分钟、小时、日线：只显示时分秒
       return formatTime(hours, minutes, seconds)
     } else {
       // 周线、月线：显示天数和时间
       const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000))
       const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
       const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
       const remainingSeconds = Math.floor((remainingMs % (60 * 1000)) / 1000)
       
       if (days > 0) {
         // 周线和月线：显示天数 + 时间
         const adjustedHours = remainingHours % 24
         return `${days}d ${formatTime(adjustedHours, remainingMinutes, remainingSeconds)}`
       } else {
         return formatTime(hours, minutes, seconds)
       }
          }
   }
   /**
   * 启动倒计时更新定时器
   */
  private startCountdownTimer(): void {
    // 清除现有定时器
    if (this._countdownTimer !== null) {
      clearInterval(this._countdownTimer)
    }
    
    // 启动新的定时器，每秒更新一次
    this._countdownTimer = window.setInterval(() => {
      // 优化：只更新Y轴widget，而不是整个pane
      const widget = this.getWidget()
      const pane = widget.getPane()
      
      // 直接更新Y轴widget的main canvas（倒计时文本在main层）
      const yAxisWidget = pane.getYAxisWidget()
      if (yAxisWidget) {
        yAxisWidget.update(UpdateLevel.Main)
      } else {
        // 备用方案：如果无法获取Y轴widget，则使用Main级别更新pane
        pane.getChart().updatePane(UpdateLevel.Main, pane.getId())
      }
    }, 1000)
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const bounding = widget.getBounding()
    const chartStore = pane.getChart().getChartStore()
    
    // 启动倒计时更新定时器（仅在需要时启动）
    const period = chartStore.getPeriod()
    if (period && this._countdownTimer === null) {
      this.startCountdownTimer()
    }
    const priceMarkStyles = chartStore.getStyles().candle.priceMark
    const lastPriceMarkStyles = priceMarkStyles.last
    const lastPriceMarkTextStyles = lastPriceMarkStyles.text
    if (priceMarkStyles.show && lastPriceMarkStyles.show && lastPriceMarkTextStyles.show) {
      const precision = chartStore.getSymbol()?.pricePrecision ?? 2
      const yAxis = pane.getAxisComponent() as YAxis
      const dataList = chartStore.getDataList()
      const data = dataList[dataList.length - 1]
      if (isValid(data)) {
        const { close, open } = data
        const comparePrice = lastPriceMarkStyles.compareRule === 'current_open' ? open : (dataList[dataList.length - 2]?.close ?? close)
        const priceY = yAxis.convertToNicePixel(close)
        let backgroundColor = ''
        if (close > comparePrice) {
          backgroundColor = lastPriceMarkStyles.upColor
        } else if (close < comparePrice) {
          backgroundColor = lastPriceMarkStyles.downColor
        } else {
          backgroundColor = lastPriceMarkStyles.noChangeColor
        }
        let x = 0
        let textAlgin: CanvasTextAlign = 'left'
        if (yAxis.isFromZero()) {
          x = 0
          textAlgin = 'left'
        } else {
          x = bounding.width
          textAlgin = 'right'
        }

        const textFigures: Array<FigureCreate<TextAttrs, TextStyle>> = []
        const yAxisRange = yAxis.getRange()
        let priceText = yAxis.displayValueToText(
          yAxis.realValueToDisplayValue(
            yAxis.valueToRealValue(close, { range: yAxisRange }),
            { range: yAxisRange }
          ),
          precision
        )
        priceText = chartStore.getDecimalFold().format(chartStore.getThousandsSeparator().format(priceText))
        const { paddingLeft, paddingRight, paddingTop, paddingBottom, size, family, weight } = lastPriceMarkTextStyles
        let textWidth = paddingLeft + calcTextWidth(priceText, size, weight, family) + paddingRight
        const priceTextHeight = paddingTop + size + paddingBottom
        textFigures.push({
          name: 'text',
          attrs: {
            x,
            y: priceY,
            width: textWidth,
            height: priceTextHeight,
            text: priceText,
            align: textAlgin,
            baseline: 'middle'
          },
          styles: {
            ...lastPriceMarkTextStyles,
            backgroundColor
          }
        })
        const formatExtendText = chartStore.getInnerFormatter().formatExtendText
        const priceTextHalfHeight = size / 2
        let aboveY = priceY - priceTextHalfHeight - paddingTop
        let belowY = priceY + priceTextHalfHeight + paddingBottom
        lastPriceMarkStyles.extendTexts.forEach((item, index) => {
          const text = formatExtendText({ type: 'last_price', data, index })
          if (text.length > 0 && item.show) {
            const textHalfHeight = item.size / 2
            let textY = 0
            if (item.position === 'above_price') {
              aboveY -= (item.paddingBottom + textHalfHeight)
              textY = aboveY
              aboveY -= (textHalfHeight + item.paddingTop)
            } else {
              belowY += (item.paddingTop + textHalfHeight)
              textY = belowY
              belowY += (textHalfHeight + item.paddingBottom)
            }
            textWidth = Math.max(textWidth, item.paddingLeft + calcTextWidth(text, item.size, item.weight, item.family) + item.paddingRight)
            textFigures.push({
              name: 'text',
              attrs: {
                x,
                y: textY,
                width: textWidth,
                height: item.paddingTop + item.size + item.paddingBottom,
                text,
                align: textAlgin,
                baseline: 'middle'
              },
              styles: { ...item, backgroundColor }
            })
          }
        })

        // 添加倒计时显示
        const period = chartStore.getPeriod()
        if (period) {
          const remainingTime = this.calculateRemainingTime(data.timestamp, period)
          
          if (remainingTime) {
            const countdownStyles: TextStyle = {
              size: Math.max(12, size), // 字体稍大一点
              family,
              weight: 'normal',
              color: '#ffffff', // 白色文字
              paddingLeft: paddingLeft,
              paddingRight: paddingRight,
              paddingTop: 3, // 上下padding 3px
              paddingBottom: 3,
              show: true,
              style: 'fill',
              borderStyle: 'solid',
              borderDashedValue: [],
              borderSize: 0,
              borderColor: 'transparent',
              borderRadius: 3,
              backgroundColor: '#409EFF'
            }
            
            const countdownText = remainingTime // 去掉图标
            const countdownTextHalfHeight = countdownStyles.size / 2
            belowY += (countdownStyles.paddingTop + countdownTextHalfHeight)
            const countdownY = belowY
            belowY += (countdownTextHalfHeight + countdownStyles.paddingBottom)
            
            const countdownWidth = countdownStyles.paddingLeft + calcTextWidth(countdownText, countdownStyles.size, countdownStyles.weight, countdownStyles.family) + countdownStyles.paddingRight
            textWidth = Math.max(textWidth, countdownWidth)
            
            textFigures.push({
              name: 'text',
              attrs: {
                x,
                y: countdownY,
                width: countdownWidth,
                height: countdownStyles.paddingTop + countdownStyles.size + countdownStyles.paddingBottom,
                text: countdownText,
                align: textAlgin,
                baseline: 'middle'
              },
              styles: countdownStyles
            })
          }
        }
        textFigures.forEach(figure => {
          figure.attrs.width = textWidth
          this.createFigure(figure)?.draw(ctx)
        })
      }
    }
  }
}
