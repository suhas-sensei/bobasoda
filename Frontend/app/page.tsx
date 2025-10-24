'use client';

import { useState, useEffect } from "react";
import { PredictionCard } from "@/components/PredictionCard";
import { useWeb3 } from "@/lib/web3/provider";
import { usePredictionContract } from "@/lib/web3/hooks";
import { BetDirection } from "@/types/prediction";

export default function Home() {
  const { isConnected, connectWallet, account, balance, refreshBalance, contract } = useWeb3();
  const { currentEpoch, currentRound, betBull, betBear, getCurrentPrice, userBet } = usePredictionContract();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [hasBet, setHasBet] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Check if we should use mock data (when contract not deployed)
  useEffect(() => {
    if (isConnected) {
      // Wait 5 seconds for contract data, if still null, use mock data
      const timeout = setTimeout(() => {
        if (!currentRound && !currentPrice) {
          console.log('⚠️ Contract not responding, using mock data for development');
          console.log('currentRound:', currentRound);
          console.log('currentEpoch:', currentEpoch);
          console.log('contract:', contract);
          setUseMockData(true);
          setCurrentPrice(3250.45); // Mock ETH price
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isConnected, currentRound, currentPrice]);

  // Fetch current price from oracle
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getCurrentPrice();
      if (price) {
        setCurrentPrice(price);
        setUseMockData(false); // We got real data
      }
    };

    if (isConnected && !useMockData) {
      fetchPrice();
      const interval = setInterval(fetchPrice, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, getCurrentPrice, useMockData]);

  // Check if user has bet in current round
  useEffect(() => {
    if (userBet && userBet.amount > 0n) {
      setHasBet(true);
    } else {
      setHasBet(false);
    }
  }, [userBet]);

  const handleSwipe = async (direction: BetDirection) => {
    if (!isConnected || hasBet) return;

    try {
      // Use minimum bet amount (0.0001 ETH)
      if (direction === 'up') {
        await betBull('0.0001');
      } else {
        await betBear('0.0001');
      }
      setHasBet(true);
      // Refresh balance after betting
      await refreshBalance();
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black" />
        <div className="relative z-10 text-center p-8">
          <h1 className="text-4xl font-bold text-white mb-4">ETH/USD Prediction</h1>
          <p className="text-neutral-400 mb-8">Connect your wallet to start predicting</p>
          <button
            onClick={connectWallet}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Show loading screen only if not using mock data and still waiting for real data
  if (!useMockData && !currentRound) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading prediction round...</p>
          <p className="text-neutral-500 text-xs mt-2">Waiting for contract data...</p>
        </div>
      </div>
    );
  }

  // Use mock data or real data
  const mockRound = {
    bullAmount: 0n,
    bearAmount: 0n,
    lockTimestamp: BigInt(Math.floor(Date.now() / 1000) + 20), // 20 seconds from now
  };

  const activeRound = useMockData ? mockRound : currentRound!;
  const activeEpoch = useMockData ? 1n : currentEpoch;
  const activePrice = currentPrice || 3250.45;

  // Calculate pool amounts and multipliers
  const bullAmount = Number(activeRound.bullAmount) / 1e18;
  const bearAmount = Number(activeRound.bearAmount) / 1e18;
  const totalAmount = bullAmount + bearAmount;

  const multiplierUp = totalAmount > 0 && bullAmount > 0 ? totalAmount / bullAmount : 2.0;
  const multiplierDown = totalAmount > 0 && bearAmount > 0 ? totalAmount / bearAmount : 2.0;

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black" />

      {/* Mock Data Warning Banner */}
      {useMockData && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-600/20 border-b border-yellow-600/50 px-4 py-2 z-30">
          <p className="text-yellow-200 text-xs text-center">
            ⚠️ DEMO MODE: Contract not deployed. Deploy contract to use real prediction market.
          </p>
        </div>
      )}

      {/* Stats overlay - top */}
      <div className={`absolute top-0 left-0 right-0 p-6 z-20 ${useMockData ? 'mt-8' : ''}`}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="text-white">
            <div className="text-xs text-neutral-400 mb-1">Connected</div>
            <div className="text-sm font-bold truncate max-w-[150px]">{account?.slice(0, 6)}...{account?.slice(-4)}</div>
          </div>
          <div className="text-white text-center">
            <div className="text-xs text-neutral-400 mb-1">Balance</div>
            <div className="text-sm font-bold">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : '...'}</div>
          </div>
          <div className="text-white">
            <div className="text-xs text-neutral-400 mb-1 text-right">Round</div>
            <div className="text-xl font-bold text-right">#{activeEpoch?.toString()}</div>
          </div>
        </div>
      </div>

      {/* Single Card */}
      <div className="relative w-full h-screen max-w-2xl">
        <PredictionCard
          prediction={{
            id: activeEpoch?.toString() || '0',
            asset: 'Ethereum',
            symbol: 'ETH/USD',
            currentPrice: activePrice,
            timeframe: 20, // 20 seconds for betting
            poolUp: bullAmount,
            poolDown: bearAmount,
            multiplierUp: Number(multiplierUp.toFixed(2)),
            multiplierDown: Number(multiplierDown.toFixed(2)),
            endsAt: Number(activeRound.lockTimestamp) * 1000, // Convert to milliseconds
          }}
          onSwipe={useMockData ? (dir) => {
            alert('🎮 DEMO MODE: Betting is disabled. Deploy the contract to place real bets!');
          } : handleSwipe}
          isActive={true}
          hasBet={hasBet}
          userPosition={userBet?.position}
        />
      </div>

      {/* Bottom hint */}
      {!hasBet && (
        <div className="absolute bottom-8 left-0 right-0 z-20 text-center animate-pulse">
          <p className="text-neutral-400 text-sm">
            {useMockData
              ? 'Swipe to test the UI (Demo Mode - No real bets)'
              : 'Swipe to make your prediction (0.001 ETH)'}
          </p>
        </div>
      )}

      {hasBet && (
        <div className="absolute bottom-8 left-0 right-0 z-20 text-center">
          <div className="bg-green-500/20 border border-green-500 rounded-lg px-6 py-3 mx-auto max-w-md">
            <p className="text-green-400 text-sm font-semibold">
              Bet Placed! Position: {userBet?.position === 0 ? 'UP' : 'DOWN'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
