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

import IndicatorWidget from './IndicatorWidget'
// import ScriptManager from '../extension/scripts/ScriptManager' // 已废�?

import CandleBarView from '../view/CandleBarView'
import CandleAreaView from '../view/CandleAreaView'
import CandlePriceLineView from '../view/CandlePriceLineView'
import CandleFootprintView from '../view/CandleFootprintView.ts'
import CandleFootprintPeriodView from '../view/CandleFootprintPeriodView.ts'
import CandleHighLowPriceView from '../view/CandleHighLowPriceView'
import CandleLastPriceLineView from '../view/CandleLastPriceLineView'
import ScriptView from '../view/ScriptView'

import type IndicatorTooltipView from '../view/IndicatorTooltipView'
import CandleTooltipView from '../view/CandleTooltipView'
import CrosshairFeatureView from '../view/CrosshairFeatureView'

import type AxisPane from '../pane/DrawPane'

import type { YAxis } from '../component/YAxis'
// @ts-ignore
import { getWatermarkDrawPosition } from '../Chart'

// 导入绘制函数
import { outputLine, outputShape, outputLabel, outputRect, outputArea, outputBar, outputCandle } from '../extension/scripts/output/index'

export default class CandleWidget extends IndicatorWidget {
  private readonly _candleBarView = new CandleBarView(this)
  private readonly _candleAreaView = new CandleAreaView(this)
  private readonly _candlePriceLineView = new CandlePriceLineView(this)
  private readonly _candleFootprintView = new CandleFootprintView(this)
  private readonly _candleFootprintPeriodView = new CandleFootprintPeriodView(this)
  private readonly _candleHighLowPriceView = new CandleHighLowPriceView(this)
  private readonly _candleLastPriceLineView = new CandleLastPriceLineView(this)
  private readonly _crosshairFeatureView = new CrosshairFeatureView(this)

  constructor (rootContainer: HTMLElement, pane: AxisPane<YAxis>) {
    super(rootContainer, pane)
    this.addChild(this._candleBarView)
    this.addChild(this._candleFootprintView)
    this.addChild(this._candleFootprintPeriodView)
    this.addChild(this._crosshairFeatureView)
  }

  override updateMainContent (ctx: CanvasRenderingContext2D): void {
    const candleStyles = this.getPane().getChart().getStyles().candle
    const type = candleStyles.type as string
    if (type === 'area') {
      this._candleAreaView.draw(ctx)
      this._candlePriceLineView.stopAnimation()
      this._candleFootprintView.stopAnimation()
      this._candleFootprintPeriodView.stopAnimation()
    } else if (type === 'price_line') {
      this._candleAreaView.stopAnimation()
      this._candlePriceLineView.draw(ctx)
      this._candleFootprintView.stopAnimation()
      this._candleFootprintPeriodView.stopAnimation()
    } else if (type === 'footprint') {
      this._candleAreaView.stopAnimation()
      this._candlePriceLineView.stopAnimation()
      this._candleFootprintView.draw(ctx)
      this._candleFootprintPeriodView.stopAnimation()
    } else if (type === 'footprint_period') {
      this._candleAreaView.stopAnimation()
      this._candlePriceLineView.stopAnimation()
      this._candleFootprintView.stopAnimation()
      this._candleFootprintPeriodView.draw(ctx)
    } else {
      this._candleBarView.draw(ctx)
      this._candleHighLowPriceView.draw(ctx)
      this._candleAreaView.stopAnimation()
      this._candlePriceLineView.stopAnimation()
      this._candleFootprintView.stopAnimation()
      this._candleFootprintPeriodView.stopAnimation()
    }
    this._candleLastPriceLineView.draw(ctx)
    // --- 水印绘制 ---
    const chart = this.getPane().getChart()
    const list = chart.watermarkList || []
    list.forEach((item, idx) => {
      if (item.img && item.img.complete) {
        const { position = 9, offsetX = 0, offsetY = 0, width: w, height: h, opacity = 0.15, grayscale = false, rotate = 0 } = item
        const imgWidth = w || item.img.width
        const imgHeight = h || item.img.height
        const boxWidth = ctx.canvas.width
        const boxHeight = ctx.canvas.height
        const anchor = getWatermarkDrawPosition(position, boxWidth, boxHeight, imgWidth, imgHeight)
        const x = anchor.x + offsetX
        const y = anchor.y + offsetY
        ctx.save()
        ctx.globalAlpha = opacity
        const rad = rotate * Math.PI / 180
        ctx.translate(x + imgWidth / 2, y + imgHeight / 2)
        ctx.rotate(rad)
        if (grayscale) {
          const offCanvas = document.createElement('canvas')
          offCanvas.width = imgWidth
          offCanvas.height = imgHeight
          const offCtx = offCanvas.getContext('2d')!
          offCtx.drawImage(item.img, 0, 0, imgWidth, imgHeight)
          const imgData = offCtx.getImageData(0, 0, imgWidth, imgHeight)
          for (let i = 0; i < imgData.data.length; i += 4) {
            const avg = 0.299 * imgData.data[i] + 0.587 * imgData.data[i+1] + 0.114 * imgData.data[i+2]
            imgData.data[i] = imgData.data[i+1] = imgData.data[i+2] = avg
          }
          offCtx.putImageData(imgData, 0, 0)
          ctx.drawImage(offCanvas, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight)
        } else {
          ctx.drawImage(item.img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight)
        }
        ctx.restore()
      }
    })
    // === 脚本指标渲染 ===
    // 脚本渲染现在由ScriptView 组件处理
    // 注释掉重复的ScriptView调用，避免重复执行
    // const scriptView = (this as any)._scriptView;
    // if (scriptView && typeof scriptView.draw === 'function') {
    //   scriptView.draw(ctx);
    // }
    
    // === 主图绘制数据渲染 ===
    // 现在MD方法直接在主图上绘制并触发统一更新，不需要在这里处理
  }

  override updateOverlayContent (ctx: CanvasRenderingContext2D): void {
    this._crosshairFeatureView.draw(ctx)
    
    // === 重新绘制MD内容 ===
    // 当overlayCanvas更新时，重新绘制所有副图脚本的MD内容
    const chart = this.getPane().getChart();
    const drawPanes = chart.getDrawPanes();
    
    // 收集所有副图脚本的MD绘制数据
    const allMDDrawData: any[] = [];
    drawPanes.forEach(pane => {
      if (pane.getId() !== 'candle_pane') { // 跳过主图
        const paneMDDrawData = (pane as any)._mdDrawData;
        if (paneMDDrawData && paneMDDrawData.length > 0) {
          allMDDrawData.push(...paneMDDrawData);
        }
      }
    });
    
    // 重新绘制所有MD内容
    if (allMDDrawData && allMDDrawData.length > 0) {
      const mainRenderContext = {
        ctx: ctx,
        bounding: this.getBounding(),
        yAxis: this.getPane().getAxisComponent(),
        xAxis: chart.getXAxisPane()?.getAxisComponent(),
        chart: chart,
        script: { position: 'main' }
      };
      
      allMDDrawData.forEach((drawData: any) => {
        const renderContext = {
          ...mainRenderContext,
          dataList: drawData.dataList
        };
        
        switch (drawData.type) {
          case 'line':
            outputLine(renderContext, drawData.data, drawData.styles);
            break;
          case 'shape':
            outputShape(renderContext, drawData.data, drawData.styles);
            break;
          case 'label':
            outputLabel(renderContext, drawData.data, drawData.labelStyles, drawData.backgroundStyles);
            break;
          case 'rect':
            outputRect(renderContext, drawData.data, drawData.styles);
            break;
          case 'area':
            outputArea(renderContext, drawData.data, drawData.data2, drawData.styles);
            break;
          case 'bar':
            outputBar(renderContext, drawData.data, drawData.baseline, drawData.styles);
            break;
          case 'candle':
            outputCandle(renderContext, drawData.data, drawData.styles);
            break;
        }
      });
    }
  }

  override createTooltipView (): IndicatorTooltipView {
    return new CandleTooltipView(this)
  }
}
