/**
 * 脚本版本初始化
 * 注册所有可用的脚本引擎版本
 */

import { VersionManager } from './VersionManager';
import { V1Engine } from './v1/Engine';

// 注册 v1 引擎
VersionManager.registerEngine(V1Engine);
  
// 导出版本管理器
export { VersionManager } from './VersionManager';
export { V1Engine } from './v1/Engine';

// 导出所有版本配置
export const AVAILABLE_VERSIONS = VersionManager.getAvailableVersions(); 