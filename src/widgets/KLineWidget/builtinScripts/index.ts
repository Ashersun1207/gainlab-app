/**
 * 内置技术指标脚本注册表
 *
 * 每个脚本通过 chart.addScript({ code: encryptScript(script) }) 注册到 Script 引擎。
 * VP/WRB 走 overlay，不在此注册。
 *
 * @see T17-indicator-script-migration.md
 */
import { MA_SCRIPT } from './ma';
import { EMA_SCRIPT } from './ema';
import { BOLL_SCRIPT } from './boll';
import { VWAP_SCRIPT } from './vwap';
import { RSI_SCRIPT } from './rsi';
import { MACD_SCRIPT } from './macd';
import { KDJ_SCRIPT } from './kdj';
import { ATR_SCRIPT } from './atr';

export interface BuiltinScriptDef {
  /** 明文脚本内容 */
  script: string;
  /** 主图 or 副图（与脚本 @position 一致） */
  position: 'main' | 'vice';
}

/** 内置指标脚本映射（key = INDICATORS 数组中的名称） */
export const BUILTIN_SCRIPTS: Record<string, BuiltinScriptDef> = {
  MA: { script: MA_SCRIPT, position: 'main' },
  EMA: { script: EMA_SCRIPT, position: 'main' },
  BOLL: { script: BOLL_SCRIPT, position: 'main' },
  VWAP: { script: VWAP_SCRIPT, position: 'main' },
  RSI: { script: RSI_SCRIPT, position: 'vice' },
  MACD: { script: MACD_SCRIPT, position: 'vice' },
  KDJ: { script: KDJ_SCRIPT, position: 'vice' },
  ATR: { script: ATR_SCRIPT, position: 'vice' },
};

/** VP/WRB 走 overlay，不走 Script 引擎 */
export const OVERLAY_INDICATORS = new Set(['VP', 'WRB']);
