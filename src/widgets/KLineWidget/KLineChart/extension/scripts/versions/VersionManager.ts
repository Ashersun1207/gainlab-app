/**
 * 脚本版本管理器
 * 支持动态加载不同版本的脚本引擎
 */

// 版本引擎接口
export interface ScriptEngine {
  version: number;
  name: string;
  description: string;
  features?: string[];
  
  // 核心组件
  Parser: any;
  Inputs: any;
  Styles: any;
  Outputs: any;
  Formula: any;
  Utils: any;
  Constants: any;
  Keywords: any;
  
  // 版本特定方法
  compileScript?: (script: string, context: any) => any;
  validateScript?: (script: string) => { valid: boolean; errors: string[] };
}

// 版本配置
export interface VersionConfig {
  version: number;
  name: string;
  description: string;
  features: string[];
  deprecated?: boolean;
}

/**
 * 版本管理器
 */
export class VersionManager {
  private static engines: Map<number, ScriptEngine> = new Map();
  private static defaultVersion = 1;
  
  /**
   * 注册版本引擎
   */
  static registerEngine(engine: ScriptEngine): void {
    this.engines.set(engine.version, engine);
  }
  
  /**
   * 获取指定版本的引擎
   */
  static getEngine(version: number): ScriptEngine | null {
    return this.engines.get(version) || null;
  }
  
  /**
   * 获取默认版本引擎
   */
  static getDefaultEngine(): ScriptEngine {
    return this.engines.get(this.defaultVersion) || this.engines.get(1)!;
  }
  
  /**
   * 获取所有可用版本
   */
  static getAvailableVersions(): VersionConfig[] {
    const versions: VersionConfig[] = [];
    for (const [version, engine] of this.engines) {
      versions.push({
        version: engine.version,
        name: engine.name,
        description: engine.description,
        features: engine.features || []
      });
    }
    return versions.sort((a, b) => a.version - b.version);
  }
  
    /**
   * 根据脚本内容自动选择版本
   */
  static detectVersion(script: string): number {
    // 解析脚本中的版本声明
    const versionMatch = script.match(/\/\/\s*@version\s*=\s*(\d+)/);
    if (versionMatch) {
      const version = parseInt(versionMatch[1]);
      if (this.engines.has(version)) {
        return version;
      }
    }
    
    // 默认返回最新版本
    const versions = Array.from(this.engines.keys()).sort((a, b) => b - a);
    return versions[0] || this.defaultVersion;
  }

  /**
   * 验证脚本版本兼容性
   */
  static validateVersion(script: string): { valid: boolean; version: number; error?: string } {
    const detectedVersion = this.detectVersion(script);
    const engine = this.getEngine(detectedVersion);
    
    if (!engine) {
      return {
        valid: false,
        version: detectedVersion,
        error: `不支持的脚本版本: ${detectedVersion}`
      };
    }

    return {
      valid: true,
      version: detectedVersion
    };
  }
} 