'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { PredictionCard } from "@/components/PredictionCard";
import { LoginScreen } from "@/components/LoginScreen";
import { WalletInfo } from "@/components/WalletInfo";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useChainId } from "wagmi";
import { BetDirection } from "@/types/prediction";
import { roundManager, RoundData } from "@/lib/round-manager";
import { usePredictionContract } from "@/lib/web3/hooks";
import { PREDICTION_CONFIG } from "@/lib/contracts/config";

export default function Home() {
  const { authenticated, user } = usePrivy();
  const isConnected = authenticated;

  // Network detection - use wagmi's useAccount for wallet address and chain
  const chainId = useChainId();
  const { address: account, chain } = useAccount();

  // Contract hooks
  const { currentEpoch, currentRound: contractRound, betBull, betBear, isLoading } = usePredictionContract();

  // Round management
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [nextRound, setNextRound] = useState<RoundData | null>(null);
  const [ethPrice, setEthPrice] = useState<number>(2500); // Default ETH price
  const [showBetModal, setShowBetModal] = useState(false);
  const [betAmount, setBetAmount] = useState<string>('0.01');
  const [userBetDirection, setUserBetDirection] = useState<'bull' | 'bear' | null>(null);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Log network info when connected
  useEffect(() => {
    if (isConnected && account) {
      console.log('═══════════════════════════════════════');
      console.log('🔗 NETWORK INFO');
      console.log('═══════════════════════════════════════');
      console.log('Chain ID:', chainId);
      console.log('Chain Name:', chain?.name);
      console.log('Is Base Sepolia?', chainId === 84532);
      console.log('───────────────────────────────────────');
      console.log('💼 YOUR WALLET ADDRESS:');
      console.log(account);
      console.log('───────────────────────────────────────');
      console.log('📋 Privy User Info:', user);
      console.log('═══════════════════════════════════════');

      // Make it easy to copy
      if (typeof window !== 'undefined') {
        (window as any).walletAddress = account;
        (window as any).chainId = chainId;
        console.log('💡 TIP: Type "walletAddress" or "chainId" in console to see values again');
      }
    }
  }, [isConnected, chainId, chain, account, user]);

  // Update time and round status every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      roundManager.updateRoundStatus(now);
      setCurrentRound(roundManager.getCurrentRound());
      setNextRound(roundManager.getNextRound());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Simulate ETH price changes
  useEffect(() => {
    const updatePrice = () => {
      setEthPrice(prev => {
        const change = (Math.random() - 0.5) * 10; // -5 to +5
        return Math.max(2000, Math.min(3000, prev + change));
      });
    };

    const interval = setInterval(updatePrice, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSwipe = async (direction: BetDirection) => {
    if (!account || hasPlacedBet) return;

    const position = direction === 'up' ? 'bull' : 'bear';
    setUserBetDirection(position);
    setShowBetModal(true);
  };

  const confirmBet = async () => {
    if (!userBetDirection || !account || isLoading) return;

    try {
      // Place bet on the contract for the NEXT round
      if (userBetDirection === 'bull') {
        await betBull(betAmount);
      } else {
        await betBear(betAmount);
      }

      // Add to local round manager for display
      roundManager.addUserBetToNextRound(
        userBetDirection,
        parseFloat(betAmount),
        account
      );

      setHasPlacedBet(true);
      setShowBetModal(false);

      // Reset for next round
      setTimeout(() => {
        setHasPlacedBet(false);
        setUserBetDirection(null);
      }, 30000);
    } catch (error) {
      console.error('Bet failed:', error);
      setUserBetDirection(null);
    }
  };

  // Show wallet connect screen
  if (!isConnected) {
    return <LoginScreen />;
  }

  // Show loading while initializing
  if (!currentRound || !nextRound) {
    return (
      <div className="min-h-screen bg-[#08060b] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#7645d9] mx-auto mb-4"></div>
          <p className="text-white text-xl font-black">Initializing rounds...</p>
        </div>
      </div>
    );
  }

  const timeSinceStart = roundManager.getTimeSinceStart();
  const multipliers = roundManager.getMultipliers(nextRound);
  const totalPool = roundManager.getTotalPoolSize(nextRound);

  return (
    <div className="min-h-screen bg-[#08060b] flex items-center justify-center overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

      {/* Stats overlay - top */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">
        {/* Network indicator */}
        <div className="max-w-md mx-auto mb-3 flex justify-center">
          <div className={`px-4 py-2 rounded-full backdrop-blur-xl border-2 ${
            chainId === 84532
              ? 'bg-[#31d0aa]/20 border-[#31d0aa]'
              : 'bg-yellow-500/20 border-yellow-500'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                chainId === 84532 ? 'bg-[#31d0aa]' : 'bg-yellow-500'
              } animate-pulse`} />
              <span className={`text-xs font-bold ${
                chainId === 84532 ? 'text-[#31d0aa]' : 'text-yellow-500'
              }`}>
                {chainId === 84532 ? 'Base Sepolia Testnet' : (chain?.name || 'Unknown Network')} (ID: {chainId})
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto flex items-center justify-between">
          <WalletInfo />
          <div className="text-white text-center">
            <div className="text-xs font-bold text-[#b8add2] mb-1">Current Round</div>
            <div className="text-2xl font-black">#{currentRound.epoch}</div>
          </div>
          <div className="text-white">
            <div className="text-xs font-bold text-[#b8add2] mb-1 text-right">Next Round</div>
            <div className="text-2xl font-black text-right">#{nextRound.epoch}</div>
          </div>
        </div>
      </div>

      {/* Single ETH Card */}
      <div className="relative w-full h-screen max-w-2xl">
        <PredictionCard
          key={`round-${currentRound.epoch}`}
          prediction={{
            id: currentRound.epoch.toString(),
            asset: 'Ethereum',
            symbol: 'ETH',
            currentPrice: ethPrice,
            timeframe: PREDICTION_CONFIG.intervalSeconds,
            poolUp: nextRound.bullAmount,
            poolDown: nextRound.bearAmount,
            multiplierUp: multipliers.bull,
            multiplierDown: multipliers.bear,
            endsAt: currentRound.endTime,
          }}
          onSwipe={handleSwipe}
          onTimeExpired={() => {}}
          isActive={!hasPlacedBet}
          hasBet={hasPlacedBet}
          userPosition={hasPlacedBet && userBetDirection ? (userBetDirection === 'bull' ? 0 : 1) : undefined}
        />
      </div>

      {/* Bet Modal */}
      {showBetModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-[#27262c] border-2 border-[#383241] rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-white text-2xl font-black mb-4">
              Confirm Your Bet
            </h3>
            <p className="text-[#b8add2] text-sm mb-6">
              Betting on <span className="font-black">NEXT ROUND #{nextRound.epoch}</span>
            </p>

            <div className={`p-6 rounded-2xl mb-6 ${
              userBetDirection === 'bull'
                ? 'bg-[#31d0aa]/20 border-2 border-[#31d0aa]'
                : 'bg-[#ed4b9e]/20 border-2 border-[#ed4b9e]'
            }`}>
              <p className={`text-xl font-black mb-2 ${
                userBetDirection === 'bull' ? 'text-[#31d0aa]' : 'text-[#ed4b9e]'
              }`}>
                {userBetDirection === 'bull' ? 'UP ⬆' : 'DOWN ⬇'}
              </p>
              <p className="text-white text-sm font-bold">
                Potential payout: {userBetDirection === 'bull' ? multipliers.bull.toFixed(2) : multipliers.bear.toFixed(2)}x
              </p>
            </div>

            <div className="mb-6">
              <label className="text-[#b8add2] text-sm font-bold mb-2 block">
                Bet Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min={PREDICTION_CONFIG.minBetAmount}
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-[#353547] text-white px-4 py-3 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#7645d9]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBetModal(false);
                  setUserBetDirection(null);
                }}
                className="flex-1 bg-[#353547] text-white px-6 py-3 rounded-xl font-black hover:bg-[#454357] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmBet}
                disabled={isLoading}
                className={`flex-1 px-6 py-3 rounded-xl font-black transition ${
                  userBetDirection === 'bull'
                    ? 'bg-[#31d0aa] text-white hover:bg-[#2ab899]'
                    : 'bg-[#ed4b9e] text-white hover:bg-[#d6438e]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Placing Bet...' : 'Confirm Bet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-8 left-0 right-0 z-20 text-center px-4">
        <div className="bg-[#27262c]/90 border-2 border-[#383241] rounded-2xl px-6 py-4 mx-auto max-w-md mb-3 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-3">
            <div className="text-left">
              <p className="text-[#b8add2] text-xs font-bold">Current Round</p>
              <p className="text-white text-lg font-black">
                {Math.floor(timeSinceStart / 1000)}s / 30s
              </p>
            </div>
            <div className="text-center">
              <p className="text-[#b8add2] text-xs font-bold">Status</p>
              <p className={`text-lg font-black ${
                currentRound.status === 'betting' ? 'text-[#31d0aa]' :
                currentRound.status === 'locked' ? 'text-[#ed4b9e]' :
                'text-[#b8add2]'
              }`}>
                {currentRound.status === 'betting' ? '🟢 Live' :
                 currentRound.status === 'locked' ? '🔒 Locked' :
                 '✅ Ended'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#b8add2] text-xs font-bold">Total Pool</p>
              <p className="text-white text-lg font-black">${totalPool.toFixed(3)}</p>
            </div>
          </div>

          <div className="border-t border-[#383241] pt-3">
            <p className="text-[#a881fd] text-xs font-bold mb-2">
              {nextRound.simulatedBets.length} bets on next round #{nextRound.epoch}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#31d0aa]/10 rounded-lg p-2">
                <p className="text-[#31d0aa] font-bold">UP: {nextRound.bullAmount.toFixed(3)} ETH</p>
              </div>
              <div className="bg-[#ed4b9e]/10 rounded-lg p-2">
                <p className="text-[#ed4b9e] font-bold">DOWN: {nextRound.bearAmount.toFixed(3)} ETH</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[#b8add2] text-sm font-bold">
          {hasPlacedBet ? (
            <span className="text-[#31d0aa]">Bet placed for next round! Waiting for current round to end...</span>
          ) : (
            <>
              Swipe <span className="text-[#31d0aa] font-black">RIGHT</span> for UP • Swipe <span className="text-[#ed4b9e] font-black">LEFT</span> for DOWN
            </>
          )}
        </p>
      </div>
    </div>
  );
}
