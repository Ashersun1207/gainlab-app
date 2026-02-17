export interface HeatmapItem {
  name: string;
  value: number;
  change: number;
}

export const sampleHeatmapData: HeatmapItem[] = [
  { name: 'BTC', value: 1_200_000_000_000, change: 2.5 },
  { name: 'ETH', value: 350_000_000_000, change: -1.2 },
  { name: 'BNB', value: 80_000_000_000, change: 0.8 },
  { name: 'SOL', value: 75_000_000_000, change: 4.3 },
  { name: 'XRP', value: 60_000_000_000, change: -0.5 },
  { name: 'USDC', value: 45_000_000_000, change: 0.01 },
  { name: 'ADA', value: 18_000_000_000, change: -2.1 },
  { name: 'AVAX', value: 16_000_000_000, change: 3.7 },
  { name: 'DOGE', value: 15_000_000_000, change: 6.2 },
  { name: 'TRX', value: 14_000_000_000, change: 1.1 },
  { name: 'DOT', value: 11_000_000_000, change: -3.4 },
  { name: 'LINK', value: 10_000_000_000, change: 2.0 },
  { name: 'MATIC', value: 8_500_000_000, change: -1.8 },
  { name: 'LTC', value: 8_000_000_000, change: 0.3 },
  { name: 'SHIB', value: 7_500_000_000, change: 5.1 },
  { name: 'UNI', value: 6_000_000_000, change: -0.9 },
  { name: 'ATOM', value: 5_500_000_000, change: 1.5 },
  { name: 'XLM', value: 4_800_000_000, change: -0.4 },
  { name: 'ICP', value: 4_200_000_000, change: 7.3 },
  { name: 'FIL', value: 3_900_000_000, change: -2.6 },
];
