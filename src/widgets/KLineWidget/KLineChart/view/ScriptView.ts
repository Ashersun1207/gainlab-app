import type { YAxis } from '../component/YAxis'
import type DrawPane from '../pane/DrawPane'
import type DrawWidget from '../widget/DrawWidget'
import View from './View'


export default class ScriptView extends View<YAxis> {
  private _isRendering = false  // 添加渲染锁
  private _lastRenderHash = ''  // 添加渲染内容哈希

  constructor (widget: DrawWidget<DrawPane<YAxis>>) {
    super(widget)
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    // 如果正在渲染，跳过本次渲染
    if (this._isRendering) {
      return
    }

    this._isRendering = true
    
    try {
      const widget = this.getWidget()
      const pane = widget.getPane()
      const chartStore = pane.getChart().getChartStore()
      const paneId = pane.getId()
      const scripts = chartStore.getScriptsByPaneId(paneId)

      if (scripts.length === 0) {
        return
      }

      const bounding = widget.getBounding()
      const xAxis = pane.getChart().getXAxisPane().getAxisComponent()
      const yAxis = pane.getAxisComponent()

      // 渲染脚本
      scripts.forEach((script, index) => {
        if (script.visible) {
          try {
            // 从ScriptManager获取正确的脚本对象
            const scriptManager = pane.getChart()._ScriptManager;
            const scriptObj = scriptManager.getScript(script.key);
            
            if (scriptObj && scriptObj._compiledFunction) {
              // 每个脚本执行前都重置canvas状态
              ctx.save();
              // 完全重置canvas状态
              ctx.setLineDash([]);
              ctx.globalAlpha = 1;  // 重置透明度
              ctx.lineWidth = 1;     // 重置线宽为1
              ctx.lineCap = 'butt';
              ctx.lineJoin = 'miter';
              ctx.miterLimit = 10;
              ctx.strokeStyle = '#000000';  // 重置描边颜色
              ctx.fillStyle = '#000000';    // 重置填充颜色
              ctx.font = '12px Arial';      // 重置字体
              ctx.textAlign = 'left';       // 重置文本对齐
              ctx.textBaseline = 'alphabetic'; // 重置文本基线

              // 创建渲染上下文
              const renderContext = {
                ctx: ctx,
                bounding: bounding,
                yAxis: yAxis,
                xAxis: xAxis,
                chart: pane.getChart(),
                indicator: script
              };
        
              const scriptCtx = scriptManager.createContext(
                pane.getChart().getDataList(), 
                script.key,
                script.msgCallback, 
                renderContext, 
                scriptObj
              );
              
              scriptObj._compiledFunction(scriptCtx);
              
              // 脚本执行完成后恢复canvas状态
              ctx.restore();
            }
          } catch (error) {
            console.error(`脚本 ${script.key} 执行错误:`, error);
            // 确保即使出错也恢复canvas状态
            ctx.restore();
          }
        }
      })
    } finally {
      this._isRendering = false
    }
  }
} 