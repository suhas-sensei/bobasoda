'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { PredictionCard } from "@/components/PredictionCard";
import { LoginScreen } from "@/components/LoginScreen";
import { WalletInfo } from "@/components/WalletInfo";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useChainId } from "wagmi";
import { BetDirection } from "@/types/prediction";
import { usePredictionContract } from "@/lib/web3/hooks";
import { PREDICTION_CONFIG, CURRENT_NETWORK } from "@/lib/contracts/config";
import { fetchPythETHPrice } from "@/lib/pyth-prices";
import { useContractRounds, useUserBet } from "@/lib/web3/contract-hooks";

export default function Home() {
  const { authenticated, user } = usePrivy();
  const isConnected = authenticated;

  // Network detection - use wagmi's useAccount for wallet address and chain
  const chainId = useChainId();
  const { address: account, chain } = useAccount();

  // Blockchain data hooks
  const { currentEpoch, currentRound, nextRound, isLoading: roundsLoading } = useContractRounds();
  const { betBull, betBear, isLoading: txLoading } = usePredictionContract();
  const userBet = useUserBet(currentEpoch, account || undefined);

  // Local state
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [showBetModal, setShowBetModal] = useState(false);
  const [betAmount, setBetAmount] = useState<string>('0.001');
  const [userBetDirection, setUserBetDirection] = useState<'bull' | 'bear' | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const isLoading = roundsLoading || txLoading;
  const hasPlacedBet = userBet.amount !== '0' && Number(userBet.amount) > 0;

  // Log network info when connected
  useEffect(() => {
    if (isConnected && account) {
      console.log('═══════════════════════════════════════');
      console.log('🔗 NETWORK INFO');
      console.log('═══════════════════════════════════════');
      console.log('Chain ID:', chainId);
      console.log('Chain Name:', chain?.name);
      console.log('Is Celo Alfajores?', chainId === 44787);
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

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch ETH price from Pyth oracle every 5 seconds
  useEffect(() => {
    console.log('🚀 Starting ETH price fetching...');

    const updatePrice = async () => {
      console.log('🔄 Calling fetchPythETHPrice...');
      try {
        const price = await fetchPythETHPrice();
        console.log('📊 Fetched ETH price from Pyth:', price);
        setEthPrice(price);
      } catch (error) {
        console.error('❌ Failed to fetch ETH price:', error);
      }
    };

    // Fetch immediately
    updatePrice();

    // Update every 5 seconds
    const interval = setInterval(updatePrice, 5000);
    return () => {
      console.log('🛑 Stopping ETH price fetching');
      clearInterval(interval);
    };
  }, []);

  const handleSwipe = async (direction: BetDirection) => {
    if (!account || hasPlacedBet || !currentRound) return;

    // Check if round is still bettable (before lockTimestamp)
    const now = Math.floor(Date.now() / 1000);
    if (now >= currentRound.lockTimestamp) {
      console.log('Round locked, cannot bet');
      return;
    }

    const position = direction === 'up' ? 'bull' : 'bear';
    setUserBetDirection(position);
    setShowBetModal(true);
  };

  const confirmBet = async () => {
    if (!userBetDirection || !account || isLoading) return;

    try {
      // Place bet on the contract for the CURRENT round
      if (userBetDirection === 'bull') {
        await betBull(betAmount);
      } else {
        await betBear(betAmount);
      }

      setShowBetModal(false);
      setUserBetDirection(null);

      // Contract hooks will automatically refresh and show the bet
    } catch (error) {
      console.error('Bet failed:', error);
      setUserBetDirection(null);
      setShowBetModal(false);
    }
  };

  // Show wallet connect screen
  if (!isConnected) {
    return <LoginScreen />;
  }

  // Show loading while initializing
  if (roundsLoading || !currentRound || currentEpoch === 0) {
    return (
      <div className="min-h-screen bg-[#08060b] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#7645d9] mx-auto mb-4"></div>
          <p className="text-white text-xl font-black">Loading blockchain data...</p>
          <p className="text-[#b8add2] text-sm mt-2">Fetching rounds from Celo Alfajores...</p>
        </div>
      </div>
    );
  }

  // Calculate round status and timing
  const now = Math.floor(Date.now() / 1000);
  const roundStartTime = currentRound.startTimestamp;
  const roundLockTime = currentRound.lockTimestamp;
  const roundCloseTime = currentRound.closeTimestamp;
  const timeUntilLock = Math.max(0, roundLockTime - now);
  const timeUntilClose = Math.max(0, roundCloseTime - now);
  const elapsed = now - roundStartTime;
  const totalDuration = roundLockTime - roundStartTime;

  let roundStatus: 'betting' | 'locked' | 'ended' = 'betting';
  if (now >= roundCloseTime) {
    roundStatus = 'ended';
  } else if (now >= roundLockTime) {
    roundStatus = 'locked';
  }

  // Calculate multipliers
  const bullTotal = parseFloat(currentRound.bullAmount) || 0.01;
  const bearTotal = parseFloat(currentRound.bearAmount) || 0.01;
  const totalPool = bullTotal + bearTotal;
  const bullMultiplier = totalPool / bullTotal;
  const bearMultiplier = totalPool / bearTotal;

  return (
    <div className="min-h-screen bg-[#08060b] flex items-center justify-center overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

      {/* Stats overlay - top */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">
        {/* Network indicator */}
        <div className="max-w-md mx-auto mb-3 flex justify-center">
          <div className={`px-4 py-2 rounded-full backdrop-blur-xl border-2 ${
            chainId === 44787
              ? 'bg-[#31d0aa]/20 border-[#31d0aa]'
              : 'bg-yellow-500/20 border-yellow-500'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                chainId === 44787 ? 'bg-[#31d0aa]' : 'bg-yellow-500'
              } animate-pulse`} />
              <span className={`text-xs font-bold ${
                chainId === 44787 ? 'text-[#31d0aa]' : 'text-yellow-500'
              }`}>
                {chainId === 44787 ? 'Celo Alfajores Testnet' : (chain?.name || 'Unknown Network')} (ID: {chainId})
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto flex items-center justify-between">
          <WalletInfo />
          <div className="text-white text-center">
            <div className="text-xs font-bold text-[#b8add2] mb-1">Current Epoch</div>
            <div className="text-2xl font-black">#{currentEpoch}</div>
          </div>
          <div className="text-white">
            <div className="text-xs font-bold text-[#b8add2] mb-1 text-right">ETH Price</div>
            <div className="text-lg font-black text-right">${ethPrice > 0 ? ethPrice.toFixed(2) : '...'}</div>
          </div>
        </div>
      </div>

      {/* Single ETH Card */}
      <div className="relative w-full h-screen max-w-2xl">
        <PredictionCard
          key={`round-${currentEpoch}`}
          prediction={{
            id: currentEpoch.toString(),
            asset: 'Ethereum',
            symbol: 'ETH',
            currentPrice: ethPrice,
            timeframe: PREDICTION_CONFIG[CURRENT_NETWORK].intervalSeconds,
            poolUp: bullTotal,
            poolDown: bearTotal,
            multiplierUp: bullMultiplier,
            multiplierDown: bearMultiplier,
            endsAt: roundLockTime * 1000, // Convert to ms
          }}
          onSwipe={handleSwipe}
          onTimeExpired={() => {}}
          isActive={roundStatus === 'betting' && !hasPlacedBet}
          hasBet={hasPlacedBet}
          userPosition={hasPlacedBet ? userBet.position : undefined}
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
              Betting on <span className="font-black">ROUND #{currentEpoch}</span>
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
                Potential payout: {userBetDirection === 'bull' ? bullMultiplier.toFixed(2) : bearMultiplier.toFixed(2)}x
              </p>
            </div>

            <div className="mb-6">
              <label className="text-[#b8add2] text-sm font-bold mb-2 block">
                Bet Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min={PREDICTION_CONFIG[CURRENT_NETWORK].minBetAmount}
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
              <p className="text-[#b8add2] text-xs font-bold">Time Left</p>
              <p className="text-white text-lg font-black">
                {roundStatus === 'betting' ? `${timeUntilLock}s` : roundStatus === 'locked' ? `${timeUntilClose}s` : 'Ended'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[#b8add2] text-xs font-bold">Status</p>
              <p className={`text-lg font-black ${
                roundStatus === 'betting' ? 'text-[#31d0aa]' :
                roundStatus === 'locked' ? 'text-[#ed4b9e]' :
                'text-[#b8add2]'
              }`}>
                {roundStatus === 'betting' ? '🟢 Live' :
                 roundStatus === 'locked' ? '🔒 Locked' :
                 '✅ Ended'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#b8add2] text-xs font-bold">Total Pool</p>
              <p className="text-white text-lg font-black">{totalPool.toFixed(4)} CELO</p>
            </div>
          </div>

          <div className="border-t border-[#383241] pt-3">
            <p className="text-[#a881fd] text-xs font-bold mb-2">
              Round #{currentEpoch} Pool Distribution
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#31d0aa]/10 rounded-lg p-2">
                <p className="text-[#31d0aa] font-bold">UP: {bullTotal.toFixed(4)} CELO</p>
                <p className="text-[#31d0aa]/70 text-xs">{bullMultiplier.toFixed(2)}x payout</p>
              </div>
              <div className="bg-[#ed4b9e]/10 rounded-lg p-2">
                <p className="text-[#ed4b9e] font-bold">DOWN: {bearTotal.toFixed(4)} CELO</p>
                <p className="text-[#ed4b9e]/70 text-xs">{bearMultiplier.toFixed(2)}x payout</p>
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
