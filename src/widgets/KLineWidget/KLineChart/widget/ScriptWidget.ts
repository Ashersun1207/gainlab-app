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

import type DrawPane from '../pane/DrawPane'

import { WidgetNameConstants } from './types'
import DrawWidget from './DrawWidget'

import type { YAxis } from '../component/YAxis'
import type { MouseTouchEvent, EventName } from '../common/EventHandler'
import { isValid } from '../common/utils/typeChecks'

import GridView from '../view/GridView'
import ScriptView from '../view/ScriptView'
import CrosshairLineView from '../view/CrosshairLineView'
import ScriptTooltipView from '../view/ScriptTooltipView'
import OverlayView from '../view/OverlayView'

export default class ScriptWidget extends DrawWidget<DrawPane<YAxis>> {
  private static instanceCount = 0;
  private instanceId: number;
  private readonly _gridView = new GridView(this)
  private readonly _scriptView = new ScriptView(this)
  private readonly _crosshairLineView = new CrosshairLineView(this)
  private readonly _tooltipView = this.createTooltipView()
  private readonly _overlayView = new OverlayView(this)

  constructor (rootContainer: HTMLElement, pane: DrawPane<YAxis>) {
    super(rootContainer, pane)
    this.instanceId = ++ScriptWidget.instanceCount;
    this.addChild(this._overlayView)
    this.addChild(this._tooltipView)
  }

  getName (): string {
    return WidgetNameConstants.SCRIPT
  }

  protected updateMain (ctx: CanvasRenderingContext2D): void {
    if (this.getPane().getOptions().state !== 'minimize') {
      this.updateMainContent(ctx)
      this._scriptView.draw(ctx)
      this._gridView.draw(ctx)
    }
  }

  protected createTooltipView (): ScriptTooltipView {
    return new ScriptTooltipView(this)
  }

  protected updateMainContent (ctx: CanvasRenderingContext2D): void {
    // 脚本渲染逻辑
    const chart = this.getPane().getChart()
    const paneId = this.getPane().getId()
    
    // 这里可以添加脚本特有的渲染逻辑
    // 目前ScriptView会处理所有的脚本渲染
  }

  protected updateOverlayContent (_ctx: CanvasRenderingContext2D): void {
    // to do it
  }

  override updateOverlay (ctx: CanvasRenderingContext2D): void {
    const paneState = this.getPane().getOptions().state
    
    if (paneState !== 'minimize') {
      this._overlayView.draw(ctx)
      this._crosshairLineView.draw(ctx)
      this.updateOverlayContent(ctx)
    }
    this._tooltipView.draw(ctx)
  }

  override checkEventOn (event: MouseTouchEvent): boolean {
    // 检查鼠标是否在脚本按钮区域内
    const result = this._isMouseInScriptButtons(event)
    return result
  }

  override dispatchEvent (name: EventName, event: MouseTouchEvent): boolean {
    // 让子组件处理事件
    const children = (this as any)._children || []
    for (const child of children) {
      if (child.dispatchEvent && child.dispatchEvent(name, event)) {
        return true
      }
    }
    return false
  }

  private _isMouseInScriptButtons(event: MouseTouchEvent): boolean {
    const pane = this.getPane()
    const chartStore = pane.getChart().getChartStore()
    const crosshair = chartStore.getCrosshair()
    
    // 只有在显示tooltip时才检查
    if (!isValid(crosshair.kLineData)) {
      return false
    }
    
    const scripts = chartStore.getScriptsByPaneId(pane.getId())
    
    if (scripts.length === 0) {
      return false
    }
    
    const bounding = this.getBounding()
    
    // 检查鼠标是否在脚本按钮区域内
    for (const script of scripts) {
      const tooltipData = this._tooltipView.getScriptTooltipData(script)
      const { features } = tooltipData
      
      // 模拟绘制时的坐标计算（与 ScriptTooltipView 一致）
      let coordinate = { x: 0, y: 0 } // 从左上角开始
      
      // 检查features中的按钮区域
      for (const feature of features) {
        const {
          marginLeft = 0, marginTop = 0, marginRight = 0,
          paddingLeft = 0, paddingTop = 0, paddingRight = 0, paddingBottom = 0,
          size = 10
        } = feature
        
        // 计算按钮的实际位置（与绘制时一致）
        const buttonLeft = bounding.left + coordinate.x + marginLeft
        const buttonTop = bounding.top + coordinate.y + marginTop
        const buttonWidth = size
        const buttonHeight = size
        
        if (
          event.x >= buttonLeft && 
          event.x <= buttonLeft + buttonWidth &&
          event.y >= buttonTop && 
          event.y <= buttonTop + buttonHeight
        ) {
          return true
        }
        
        // 更新坐标（与绘制时一致）
        coordinate.x += (marginLeft + paddingLeft + size + paddingRight + marginRight)
      }
    }
    
    return false
  }
} 