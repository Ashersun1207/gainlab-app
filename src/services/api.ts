import { WORKER_URL } from '../constants/markets';
import type { MarketType, TimeInterval } from '../types/market';
import type { KLineData } from '../types/data';

const FETCH_TIMEOUT = 8000; // 8s

/**
 * 带超时的 fetch 封装
 * ⚠️ 所有请求走 CF Worker 代理，前端不直连任何 API（中国封锁 Binance）
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs = FETCH_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * 从 WORKER_URL 提取 base URL（去掉末尾路径如 /api/chat）
 * WORKER_URL = "https://gainlab-api.asher-sun.workers.dev/api/chat"
 * → base = "https://gainlab-api.asher-sun.workers.dev"
 */
export function getWorkerBase(): string {
  try {
    const u = new URL(WORKER_URL);
    return `${u.protocol}//${u.host}`;
  } catch {
    // fallback: 去掉最后一段路径
    return WORKER_URL.replace(/\/api\/chat\/?$/, '');
  }
}

/** CF Worker 代理 — K线（所有市场统一入口） */
export async function fetchWorkerKline(
  symbol: string,
  market: MarketType,
  interval: TimeInterval = '1D',
): Promise<KLineData[]> {
  const base = getWorkerBase();
  const url = `${base}/api/kline?symbol=${encodeURIComponent(symbol)}&market=${market}&interval=${interval}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (err as Record<string, string>).error || `Worker ${res.status}`,
    );
  }
  const data = (await res.json()) as { data: KLineData[] };
  return data.data;
}

/** CF Worker 代理 — 报价 */
export async function fetchWorkerQuote(
  symbol: string,
  market: MarketType,
): Promise<{ price: number; change: number; changePercent: number }> {
  const base = getWorkerBase();
  const url = `${base}/api/quote?symbol=${encodeURIComponent(symbol)}&market=${market}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Worker quote ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  return {
    price: Number(data['price']) || 0,
    change: Number(data['change']) || 0,
    changePercent: Number(data['changePercent']) || 0,
  };
}

/** CF Worker 代理 — 搜索 */
export async function fetchWorkerSearch(
  query: string,
  market: MarketType,
): Promise<Array<{ symbol: string; name: string }>> {
  const base = getWorkerBase();
  const url = `${base}/api/search?q=${encodeURIComponent(query)}&market=${market}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results: Array<{ symbol: string; name: string }>;
  };
  return data.results ?? [];
}

/** CF Worker 代理 — 基本面 */
export async function fetchWorkerFundamentals(
  symbol: string,
): Promise<Record<string, unknown>> {
  const base = getWorkerBase();
  const url = `${base}/api/fundamentals?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Worker fundamentals ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

/** CF Worker 代理 — 板块数据（热力图） */
export async function fetchWorkerScreener(
  market: MarketType,
): Promise<Array<{ name: string; value: number; change: number }>> {
  const base = getWorkerBase();
  const url = `${base}/api/screener?market=${market}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data: Array<{ name: string; value: number; change: number }>;
  };
  return data.data ?? [];
}

/**
 * Fetch multiple quotes in parallel.
 * TODO (#10): Replace with single Worker batch endpoint when available
 * to reduce N parallel requests to 1.
 */
export async function fetchBatchQuotes(
  items: Array<{ symbol: string; market: MarketType }>,
): Promise<Array<{ price: number; change: number; changePercent: number } | null>> {
  const results = await Promise.allSettled(
    items.map(({ symbol, market }) => fetchWorkerQuote(symbol, market)),
  );
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}
