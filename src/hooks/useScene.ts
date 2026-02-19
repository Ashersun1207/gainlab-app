/**
 * useScene — Scene management + URL routing + drill-down
 *
 * Single source of truth for active scene & params.
 * Replaces scattered useState in App.tsx.
 *
 * URL format: ?s=<sceneId>&sym=<symbol>&m=<market>&p=<period>
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SCENE_CONFIGS,
  SYMBOL_MARKET,
} from '../layout/Sidebar/sceneConfig';
import type { MarketType, TimeInterval, SceneParams } from '../types/market';

/** Read URL params and return initial scene */
function getInitialScene(): string {
  const s = new URLSearchParams(window.location.search).get('s');
  return s && SCENE_CONFIGS.some((sc) => sc.id === s) ? s : 'stock_analysis';
}

/** Read URL params and return initial scene params */
function getInitialParams(): SceneParams {
  const urlParams = new URLSearchParams(window.location.search);
  const sym = urlParams.get('sym');
  const m = urlParams.get('m') as MarketType | null;
  const p = urlParams.get('p') as TimeInterval | null;

  return {
    symbol: sym || 'BTCUSDT',
    market: m || (sym ? (SYMBOL_MARKET[sym] as MarketType) ?? 'crypto' : 'crypto'),
    period: p || '1D',
  };
}

export function useScene() {
  const [activeScene, setActiveScene] = useState<string>(getInitialScene);
  const [sceneParams, setSceneParams] = useState<SceneParams>(getInitialParams);
  const isInitialized = useRef(false);
  const activeSceneRef = useRef(activeScene);
  activeSceneRef.current = activeScene;

  // Record initial state for popstate (run once)
  useEffect(() => {
    window.history.replaceState(
      { scene: activeScene, ...sceneParams },
      '',
    );
    isInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  // ── Push URL (internal helper) ──
  const pushUrl = useCallback(
    (scene: string, params: SceneParams) => {
      if (!isInitialized.current) return;
      const url = new URL(window.location.href);
      url.searchParams.set('s', scene);
      if (params.symbol) url.searchParams.set('sym', params.symbol);
      if (params.market) url.searchParams.set('m', params.market);
      if (params.period) url.searchParams.set('p', params.period);
      window.history.pushState(
        { scene, ...params },
        '',
        url.toString(),
      );
    },
    [],
  );

  // ── popstate (browser back/forward) ──
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      if (e.state?.scene) {
        setActiveScene(e.state.scene);
        setSceneParams((prev) => ({
          ...prev,
          ...(e.state.symbol ? { symbol: e.state.symbol } : {}),
          ...(e.state.market ? { market: e.state.market } : {}),
          ...(e.state.period ? { period: e.state.period } : {}),
        }));
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // ── switchScene ──
  const switchScene = useCallback(
    (sceneId: string, params?: Partial<SceneParams>) => {
      const config = SCENE_CONFIGS.find((sc) => sc.id === sceneId);
      if (!config) return;

      // Skip if same scene and no param changes
      if (sceneId === activeSceneRef.current && !params) return;

      setActiveScene(sceneId);

      if (params) {
        setSceneParams((prev) => {
          const next = { ...prev, ...params };
          pushUrl(sceneId, next);
          return next;
        });
      } else {
        setSceneParams((prev) => {
          pushUrl(sceneId, prev);
          return prev;
        });
      }
    },
    [pushUrl],
  );

  // ── drillDown (Widget row click → CK scene) ──
  const drillDown = useCallback(
    (symbol: string, market?: string) => {
      const inferredMarket =
        market || SYMBOL_MARKET[symbol] || 'crypto';
      const params: SceneParams = {
        symbol,
        market: inferredMarket as MarketType,
        period: '1D',
      };
      setActiveScene('stock_analysis');
      setSceneParams((prev) => {
        const next = { ...prev, ...params };
        pushUrl('stock_analysis', next);
        return next;
      });
    },
    [pushUrl],
  );

  // ── Derived: is current scene implemented? ──
  const isImplemented =
    SCENE_CONFIGS.find((sc) => sc.id === activeScene)?.implemented ?? false;

  return {
    activeScene,
    sceneParams,
    switchScene,
    drillDown,
    isImplemented,
  };
}
