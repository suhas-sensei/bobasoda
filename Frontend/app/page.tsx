'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react";
import { PredictionCard } from "@/components/PredictionCard";
import { RoundResults } from "@/components/RoundResults";
import { LoginScreen } from "@/components/LoginScreen";
import { usePrivy } from "@privy-io/react-auth";
import { BetDirection, DemoRoundResult } from "@/types/prediction";
import { fetchCryptoPrices, getRandomCryptos, CryptoPrice } from "@/lib/crypto-prices";
import { DemoGame, DemoCard } from "@/lib/demo-game";

export default function Home() {
  const { authenticated, user } = usePrivy();
  const account = user?.wallet?.address;
  const isConnected = authenticated;

  // Demo mode states
  const [demoMode] = useState(true); // Always in demo mode
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [currentCards, setCurrentCards] = useState<DemoCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [roundResult, setRoundResult] = useState<DemoRoundResult | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const gameRef = useRef<DemoGame>(new DemoGame());

  // Initialize crypto prices and cards on mount
  useEffect(() => {
    const initializePrices = async () => {
      const prices = await fetchCryptoPrices();
      setCryptoPrices(prices);
      startNewRound(prices);
    };

    if (isConnected && demoMode) {
      initializePrices();
    }
  }, [isConnected, demoMode]);

  const startNewRound = (prices: CryptoPrice[]) => {
    gameRef.current.reset();
    setShowResults(false);
    setCurrentCardIndex(0);

    // Select 5 random cryptos
    const selectedIds = getRandomCryptos(5);
    const cards: DemoCard[] = selectedIds
      .map(id => {
        const crypto = prices.find(p => p.id === id);
        if (!crypto) {
          console.warn(`Crypto not found for id: ${id}`);
          return null;
        }
        return {
          crypto,
          startPrice: crypto.currentPrice,
          timeframe: 15, // 15 seconds per card
        };
      })
      .filter((card): card is DemoCard => card !== null);

    setCurrentCards(cards);
  };

  const handleSwipe = (direction: BetDirection) => {
    const currentCard = currentCards[currentCardIndex];
    if (!currentCard) return;

    // Record the swipe
    gameRef.current.recordSwipe(currentCard, direction);

    // Move to next card or show results
    moveToNextCard();
  };

  const handleTimeExpired = () => {
    // Card expired without a swipe, skip it
    moveToNextCard();
  };

  const moveToNextCard = () => {
    if (currentCardIndex < currentCards.length - 1) {
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
      }, 500);
    } else {
      // Round complete, show results
      setTimeout(() => {
        const result: DemoRoundResult = {
          swipes: gameRef.current.getSwipes(),
          totalProfit: gameRef.current.getTotalProfit(),
          winCount: gameRef.current.getWinCount(),
          lossCount: gameRef.current.getLossCount(),
        };
        setRoundResult(result);
        setShowResults(true);
      }, 500);
    }
  };

  const handleNextRound = () => {
    setRoundNumber(prev => prev + 1);
    startNewRound(cryptoPrices);
  };

  // Show wallet connect screen
  if (!isConnected) {
    return <LoginScreen />;
  }

  // Show loading while fetching prices
  if (currentCards.length === 0) {
    return (
      <div className="min-h-screen bg-[#08060b] flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#7645d9] mx-auto mb-4"></div>
          <p className="text-white text-xl font-black">Loading crypto prices...</p>
        </div>
      </div>
    );
  }

  // Show results screen
  if (showResults && roundResult) {
    return <RoundResults result={roundResult} onNextRound={handleNextRound} />;
  }

  const currentCard = currentCards[currentCardIndex];
  if (!currentCard) return null;

  return (
    <div className="min-h-screen bg-[#08060b] flex items-center justify-center overflow-hidden relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

      {/* Stats overlay - top */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="text-white">
            <div className="text-xs font-bold text-[#b8add2] mb-1">Connected</div>
            <div className="text-sm font-black truncate max-w-[150px]">{account?.slice(0, 6)}...{account?.slice(-4)}</div>
          </div>
          <div className="text-white text-center">
            <div className="text-xs font-bold text-[#b8add2] mb-1">Round</div>
            <div className="text-2xl font-black">#{roundNumber}</div>
          </div>
          <div className="text-white">
            <div className="text-xs font-bold text-[#b8add2] mb-1 text-right">Card</div>
            <div className="text-2xl font-black text-right">{currentCardIndex + 1}/5</div>
          </div>
        </div>
      </div>

      {/* Single Card */}
      <div className="relative w-full h-screen max-w-2xl">
        <PredictionCard
          key={currentCardIndex}
          prediction={{
            id: currentCardIndex.toString(),
            asset: currentCard.crypto.name,
            symbol: currentCard.crypto.symbol,
            currentPrice: currentCard.startPrice,
            timeframe: currentCard.timeframe,
            poolUp: 0,
            poolDown: 0,
            multiplierUp: 1.95,
            multiplierDown: 1.95,
            endsAt: Date.now() + currentCard.timeframe * 1000,
          }}
          onSwipe={handleSwipe}
          onTimeExpired={handleTimeExpired}
          isActive={true}
          hasBet={false}
        />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-8 left-0 right-0 z-20 text-center px-4">
        <div className="bg-[#7645d9]/20 border-2 border-[#7645d9] rounded-2xl px-6 py-4 mx-auto max-w-md mb-3">
          <p className="text-[#a881fd] text-sm font-black">
            Demo Mode - Prices are simulated
          </p>
        </div>
        <p className="text-[#b8add2] text-sm font-bold animate-pulse">
          Swipe <span className="text-[#31d0aa] font-black">RIGHT</span> for UP • Swipe <span className="text-[#ed4b9e] font-black">LEFT</span> for DOWN
        </p>
      </div>
    </div>
  );
}
