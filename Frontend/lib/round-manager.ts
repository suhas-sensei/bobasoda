/**
 * Round Manager for ETH Prediction Game
 *
 * Manages 30-second rounds where:
 * - Users can bet on the NEXT round while current round is active
 * - Price is locked at 25 seconds (from Pyth oracle)
 * - Round resolves at 30 seconds using price difference
 */

export interface SimulatedBet {
  id: string;
  address: string;
  amount: number;
  position: 'bull' | 'bear';
  timestamp: number;
}

export interface RoundData {
  epoch: number;
  startTime: number;
  lockTime: number;
  endTime: number;
  lockPrice: number | null;
  closePrice: number | null;
  bullAmount: number;
  bearAmount: number;
  simulatedBets: SimulatedBet[];
  status: 'betting' | 'locked' | 'ended';
  isResolved: boolean;
}

export class RoundManager {
  private currentRound: RoundData | null = null;
  private nextRound: RoundData | null = null;
  private simulatedBetCounter = 0;

  constructor() {
    this.initializeRounds();
  }

  private initializeRounds() {
    const now = Date.now();

    // Create current round (already in progress)
    this.currentRound = {
      epoch: 1,
      startTime: now - 10000, // Started 10 seconds ago
      lockTime: now + 15000, // Will lock in 15 seconds
      endTime: now + 20000, // Will end in 20 seconds
      lockPrice: null,
      closePrice: null,
      bullAmount: 0,
      bearAmount: 0,
      simulatedBets: this.generateSimulatedBets(8), // Generate some existing bets
      status: 'betting',
      isResolved: false,
    };

    // Create next round (for betting)
    this.nextRound = {
      epoch: 2,
      startTime: this.currentRound.endTime,
      lockTime: this.currentRound.endTime + 25000,
      endTime: this.currentRound.endTime + 30000,
      lockPrice: null,
      closePrice: null,
      bullAmount: 0,
      bearAmount: 0,
      simulatedBets: this.generateSimulatedBets(3), // Some early bets
      status: 'betting',
      isResolved: false,
    };
  }

  private generateSimulatedBets(count: number): SimulatedBet[] {
    const bets: SimulatedBet[] = [];
    const addresses = [
      '0x742d...3a8f',
      '0x8e59...2b4c',
      '0x9f3a...7d1e',
      '0x4c2b...9a3f',
      '0x7d8e...4f2a',
      '0x3b9c...6e5d',
      '0x6a4f...8c1b',
      '0x2e7d...5a9c',
    ];

    for (let i = 0; i < count; i++) {
      const position = Math.random() > 0.5 ? 'bull' : 'bear';
      const amount = Math.random() * 0.05 + 0.001; // 0.001 - 0.051 ETH

      bets.push({
        id: `bet-${this.simulatedBetCounter++}`,
        address: addresses[Math.floor(Math.random() * addresses.length)],
        amount: parseFloat(amount.toFixed(4)),
        position,
        timestamp: Date.now() - Math.random() * 10000,
      });
    }

    return bets;
  }

  public getCurrentRound(): RoundData | null {
    return this.currentRound;
  }

  public getNextRound(): RoundData | null {
    return this.nextRound;
  }

  public updateRoundStatus(currentTime: number) {
    if (!this.currentRound || !this.nextRound) return;

    const timeSinceStart = currentTime - this.currentRound.startTime;

    // Update current round status
    if (timeSinceStart >= 30000 && !this.currentRound.isResolved) {
      // Round ended, resolve it
      this.currentRound.status = 'ended';
      this.currentRound.isResolved = true;

      // Move to next round
      this.advanceToNextRound();
    } else if (timeSinceStart >= 25000 && this.currentRound.status === 'betting') {
      // Lock the round at 25 seconds
      this.currentRound.status = 'locked';
      // Lock price would be fetched from Pyth here
    }

    // Occasionally add simulated bets to next round
    if (Math.random() < 0.1 && this.nextRound.simulatedBets.length < 12) {
      const newBets = this.generateSimulatedBets(1);
      this.nextRound.simulatedBets.push(...newBets);

      // Update pool amounts
      newBets.forEach(bet => {
        if (bet.position === 'bull') {
          this.nextRound!.bullAmount += bet.amount;
        } else {
          this.nextRound!.bearAmount += bet.amount;
        }
      });
    }
  }

  private advanceToNextRound() {
    // Current round becomes historical
    const now = Date.now();

    // Next round becomes current
    this.currentRound = {
      ...this.nextRound!,
      startTime: now,
      lockTime: now + 25000,
      endTime: now + 30000,
      status: 'betting',
    };

    // Create new next round
    this.nextRound = {
      epoch: this.currentRound.epoch + 1,
      startTime: this.currentRound.endTime,
      lockTime: this.currentRound.endTime + 25000,
      endTime: this.currentRound.endTime + 30000,
      lockPrice: null,
      closePrice: null,
      bullAmount: 0,
      bearAmount: 0,
      simulatedBets: this.generateSimulatedBets(2),
      status: 'betting',
      isResolved: false,
    };
  }

  public addUserBetToNextRound(position: 'bull' | 'bear', amount: number, userAddress: string) {
    if (!this.nextRound) return;

    const bet: SimulatedBet = {
      id: `user-bet-${Date.now()}`,
      address: userAddress.slice(0, 6) + '...' + userAddress.slice(-4),
      amount,
      position,
      timestamp: Date.now(),
    };

    this.nextRound.simulatedBets.push(bet);

    if (position === 'bull') {
      this.nextRound.bullAmount += amount;
    } else {
      this.nextRound.bearAmount += amount;
    }
  }

  public getTimeRemaining(): number {
    if (!this.currentRound) return 0;
    return Math.max(0, this.currentRound.endTime - Date.now());
  }

  public getTimeSinceStart(): number {
    if (!this.currentRound) return 0;
    return Math.max(0, Date.now() - this.currentRound.startTime);
  }

  public getTimeUntilLock(): number {
    if (!this.currentRound) return 0;
    return Math.max(0, this.currentRound.lockTime - Date.now());
  }

  public getTotalPoolSize(round: RoundData): number {
    return round.bullAmount + round.bearAmount;
  }

  public getMultipliers(round: RoundData): { bull: number; bear: number } {
    const totalPool = this.getTotalPoolSize(round);

    if (totalPool === 0) {
      return { bull: 1.95, bear: 1.95 };
    }

    const treasuryFee = 0.03; // 3% fee
    const payoutPool = totalPool * (1 - treasuryFee);

    const bullMultiplier = round.bullAmount > 0
      ? payoutPool / round.bullAmount
      : 1.95;

    const bearMultiplier = round.bearAmount > 0
      ? payoutPool / round.bearAmount
      : 1.95;

    return {
      bull: Math.max(1.01, Math.min(10, bullMultiplier)),
      bear: Math.max(1.01, Math.min(10, bearMultiplier)),
    };
  }
}

// Singleton instance
export const roundManager = new RoundManager();
