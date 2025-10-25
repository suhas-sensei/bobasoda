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

export interface DemoSwipe {
  asset: string;
  symbol: string;
  startPrice: number;
  endPrice: number;
  prediction: BetDirection;
  result: 'win' | 'loss';
  profit: number; // in USD
}

export interface DemoRoundResult {
  swipes: DemoSwipe[];
  totalProfit: number;
  winCount: number;
  lossCount: number;
}
