/**
 * 脚本工具类 — 元数据提取
 * 提供脚本元数据（@name/@desc/@position 等）的解析方法
 *
 * 从 gainlab-dashboard/src/plugins/klines/scriptUtils.ts 同步
 * 原 stub 版本缺少 extractMetadata 等方法，导致 ScriptManager.registerScript() crash
 *
 * ⚠️ 别和 versions/v1/ScriptUtils.ts 搞混！
 *    本文件：元数据提取（extractName/extractMetadata）→ ScriptManager 用
 *    v1/ScriptUtils.ts：数值工具（isValid/formatNumber）→ ScriptFormula + output 用
 */

export class ScriptUtils {
  /**
   * 从脚本代码中提取脚本名称
   * 支持格式：//@name=脚本名称
   */
  static extractName(scriptCode: string): string {
    const match = scriptCode.match(/\/\/\s*@name\s*=\s*(.+)$/m)
    return match ? match[1].trim() : ''
  }

  /**
   * 从脚本代码中提取脚本标题
   * 支持格式：//@title=标题
   */
  static extractTitle(scriptCode: string): string {
    const match = scriptCode.match(/\/\/\s*@title\s*=\s*(.+)$/m)
    return match ? match[1].trim() : ''
  }

  /**
   * 从脚本代码中提取脚本描述
   * 支持多行格式：
   * //@desc= 描述第一行
   * //描述第二行
   * //描述第三行
   */
  static extractDescription(scriptCode: string): string {
    const lines = scriptCode.split('\n')
    let descContent = ''
    let inDesc = false
    let descStarted = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // 检查是否是 @desc 开始
      const descStartMatch = line.match(/^\/\/\s*@desc\s*=\s*(.*)$/)
      if (descStartMatch) {
        inDesc = true
        descStarted = true
        const firstLineContent = descStartMatch[1].trim()

        if (firstLineContent) {
          descContent = firstLineContent + '\n'
        }
        continue
      }

      // 如果在desc中，继续处理
      if (inDesc) {
        if (line.startsWith('//')) {
          // 检查是否是其他元数据（结束desc）
          if (line.match(/^\/\/\s*@\w+/)) {
            inDesc = false
            break
          }

          // 提取注释内容
          const commentContent = line.replace(/^\/\/\s*/, '')
          descContent += commentContent + '\n'
        } else {
          // 非注释行，desc结束
          inDesc = false
          break
        }
      }
    }

    return descStarted ? descContent.trim() : ''
  }

  /**
   * 从脚本代码中提取脚本位置
   * 支持格式：//@position=main 或 //@position=vice
   */
  static extractPosition(scriptCode: string): 'main' | 'vice' {
    const match = scriptCode.match(/\/\/\s*@position\s*=\s*(.+)$/m)
    const position = match ? match[1].trim() : 'vice'
    return position === 'main' ? 'main' : 'vice'
  }

  /**
   * 从脚本代码中提取脚本版本
   * 支持格式：//@version=1
   */
  static extractVersion(scriptCode: string): number {
    const match = scriptCode.match(/\/\/\s*@version\s*=\s*(\d+)/)
    return match ? parseInt(match[1]) : 1
  }

  /**
   * 从脚本代码中提取 VIP 等级
   * 支持格式：//@vip=等级
   */
  static extractVip(scriptCode: string): number {
    const match = scriptCode.match(/\/\/\s*@vip\s*=\s*(.+)$/m)
    return match ? parseInt(match[1].trim()) : 0
  }

  /**
   * 提取脚本的所有元数据（纯提取，不包含验证）
   * ScriptManager.registerScript() 依赖此方法
   */
  static extractMetadata(scriptCode: string) {
    let title = this.extractTitle(scriptCode) || ''
    let name = this.extractName(scriptCode) || ''
    if (!title) {
      title = name
    }
    return {
      title,
      name,
      desc: this.extractDescription(scriptCode),
      position: this.extractPosition(scriptCode),
      version: this.extractVersion(scriptCode),
      vip: this.extractVip(scriptCode),
    }
  }
}
