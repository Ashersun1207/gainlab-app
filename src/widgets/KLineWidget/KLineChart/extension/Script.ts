import type Nullable from '../common/Nullable'

import ScriptImp, { type ScriptTemplate, type ScriptConstructor } from '../component/Script'

// 自动导入本目录下所有 ts 文件（不包括 Script.ts 自己）
const modules = import.meta.glob('./Script/*.ts', { eager: true })

const scripts: Record<string, ScriptConstructor> = {}
const scriptTemplates: Record<string, ScriptTemplate> = {}

Object.entries(modules).forEach(([path, mod]: [string, any]) => {
  // 排除 index.ts 或其它非脚本文件
  if (path.endsWith('index.ts')) return
  const script: ScriptTemplate = mod.default
  if (script && script.name) {
    scriptTemplates[script.name] = script
    scripts[script.name] = ScriptImp.extend(script)
  }
})

function registerScript<D = unknown, C = unknown, E = unknown> (script: ScriptTemplate<D, C, E>): void {
  scriptTemplates[script.name] = script
  scripts[script.name] = ScriptImp.extend(script)
}

function getScriptClass (name: string): Nullable<ScriptConstructor> {
  return scripts[name] ?? null
}

function getSupportedScripts (): any[] {
  return Object.values(scriptTemplates).map(script => ({
    name: script.name,
    shortName: script.shortName,
    info: script.info,
    inputs: script.inputs,
    styles: script.styles
  }))
}

function getScripts(name: string): any | null {
  return getSupportedScripts().find(item => item.name.toLowerCase() === name.toLowerCase()) || null
}

export { registerScript, getScriptClass, getSupportedScripts, getScripts } 