import { BetDirection, DemoSwipe } from '@/types/prediction';
import { CryptoPrice, simulatePriceChange } from './crypto-prices';

export interface DemoCard {
  crypto: CryptoPrice;
  startPrice: number;
  timeframe: number;
}

export class DemoGame {
  private swipes: DemoSwipe[] = [];
  private readonly betAmount = 100; // Fixed bet amount in USD

  recordSwipe(card: DemoCard, prediction: BetDirection): DemoSwipe {
    // Simulate price change based on prediction (50% random chance)
    const actualDirection: BetDirection = Math.random() > 0.5 ? 'up' : 'down';
    const endPrice = simulatePriceChange(card.startPrice, actualDirection);

    const isCorrect = prediction === actualDirection;
    const multiplier = 1.95; // Standard multiplier
    const profit = isCorrect ? this.betAmount * (multiplier - 1) : -this.betAmount;

    const swipe: DemoSwipe = {
      asset: card.crypto.name,
      symbol: card.crypto.symbol,
      startPrice: card.startPrice,
      endPrice,
      prediction,
      result: isCorrect ? 'win' : 'loss',
      profit,
    };

    this.swipes.push(swipe);
    return swipe;
  }

  getSwipes(): DemoSwipe[] {
    return [...this.swipes];
  }

  getTotalProfit(): number {
    return this.swipes.reduce((sum, swipe) => sum + swipe.profit, 0);
  }

  getWinCount(): number {
    return this.swipes.filter(s => s.result === 'win').length;
  }

  getLossCount(): number {
    return this.swipes.filter(s => s.result === 'loss').length;
  }

  reset(): void {
    this.swipes = [];
  }

  isRoundComplete(): boolean {
    return this.swipes.length >= 5;
  }
}
