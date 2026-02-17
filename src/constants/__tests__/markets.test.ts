import { describe, it, expect } from 'vitest';
import {
  HOT_ASSETS,
  MARKET_CONFIG,
  TOOL_CONFIG,
  TOOL_MARKET_SUPPORT,
  TIME_INTERVALS,
  AVAILABLE_INDICATORS,
} from '../markets';

describe('markets constants', () => {
  it('has 4 markets configured', () => {
    expect(Object.keys(MARKET_CONFIG)).toHaveLength(4);
  });

  it('every market has hot assets', () => {
    for (const market of Object.keys(MARKET_CONFIG)) {
      expect(
        HOT_ASSETS[market as keyof typeof HOT_ASSETS].length,
      ).toBeGreaterThan(0);
    }
  });

  it('every asset has required fields', () => {
    for (const assets of Object.values(HOT_ASSETS)) {
      for (const asset of assets) {
        expect(asset.symbol).toBeTruthy();
        expect(asset.name).toBeTruthy();
        expect(asset.market).toBeTruthy();
      }
    }
  });

  it('has 5 tools configured', () => {
    expect(Object.keys(TOOL_CONFIG)).toHaveLength(5);
  });

  it('every tool has market support defined', () => {
    for (const tool of Object.keys(TOOL_CONFIG)) {
      expect(
        TOOL_MARKET_SUPPORT[tool as keyof typeof TOOL_MARKET_SUPPORT],
      ).toBeDefined();
    }
  });

  it('has 8 time intervals', () => {
    expect(TIME_INTERVALS).toHaveLength(8);
  });

  it('has 8 available indicators', () => {
    expect(AVAILABLE_INDICATORS).toHaveLength(8);
  });
});
