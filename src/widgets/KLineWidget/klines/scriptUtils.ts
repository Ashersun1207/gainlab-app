/**
 * Stub for scriptUtils — 骨架阶段不需要脚本编辑器功能
 * 原始文件在 gainlab-dashboard/src/plugins/klines/scriptUtils.ts
 */

export class ScriptUtils {
  static extractName(scriptCode: string): string {
    const match = scriptCode.match(/\/\/\s*@name\s*=\s*(.+)$/m)
    return match ? match[1].trim() : ''
  }

  static extractTitle(scriptCode: string): string {
    const match = scriptCode.match(/\/\/\s*@title\s*=\s*(.+)$/m)
    return match ? match[1].trim() : ''
  }

  static extractDesc(_scriptCode: string): string {
    return ''
  }

  static extractVersion(_scriptCode: string): string {
    return '1.0.0'
  }

  static extractType(_scriptCode: string): string {
    return 'indicator'
  }
}
