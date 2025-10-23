export interface Prediction {
  id: string;
  asset: string;
  symbol: string;
  currentPrice: number;
  timeframe: number; // in seconds
  poolUp: number;
  poolDown: number;
  multiplierUp: number;
  multiplierDown: number;
  endsAt: number; // timestamp
}

export type BetDirection = 'up' | 'down';

export interface BetResult {
  id: string;
  direction: BetDirection;
  amount: number;
  timestamp: number;
}
