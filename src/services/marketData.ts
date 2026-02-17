import type { MarketType, TimeInterval } from '../types/market';
import type { KLineData } from '../types/data';
import { fetchWorkerKline, fetchWorkerQuote } from './api';

// ⚠️ 所有市场统一走 CF Worker，前端不直连任何外部 API。
// crypto 也走 Worker（Binance 国内被墙）。

/** 获取 K线数据（统一走 CF Worker） */
export async function getKlineData(
  symbol: string,
  market: MarketType,
  interval: TimeInterval = '1D',
): Promise<KLineData[]> {
  return fetchWorkerKline(symbol, market, interval);
}

/** 获取报价（统一走 CF Worker） */
export async function getQuote(
  symbol: string,
  market: MarketType,
): Promise<{ price: number; change: number; changePercent: number }> {
  return fetchWorkerQuote(symbol, market);
}
