'use client';

import { useState, useEffect, useRef } from "react";
import { PredictionCard } from "@/components/PredictionCard";
import { RoundResults } from "@/components/RoundResults";
import { BottomNavbar } from "@/components/BottomNavbar";
import { BetDirection, DemoRoundResult } from "@/types/prediction";
import { fetchCryptoPrices, getRandomCryptos, CryptoPrice } from "@/lib/crypto-prices";
import { DemoGame, DemoCard } from "@/lib/demo-game";

export default function Home() {
  const account = null; // Removed wallet connection

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

    initializePrices();
  }, []);

  const startNewRound = (prices: CryptoPrice[]) => {
    gameRef.current.reset();
    setShowResults(false);
    setCurrentCardIndex(0);

    // Select 5 random cryptos
    const selectedIds = getRandomCryptos(5);
    const cards: DemoCard[] = selectedIds
      .map(id => {
        const crypto = prices.find(p => p.id === id);
        if (!crypto) return null;
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

  // Show loading while fetching prices
  if (currentCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

        {/* Phone screen container */}
        <div className="relative w-full max-w-[550px] h-screen bg-[#08060b] shadow-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />
          <div className="relative z-10 text-center">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#7645d9] mx-auto mb-4"></div>
            <p className="text-white text-xl font-black">Loading crypto prices...</p>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Background gradient for desktop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

      {/* Phone screen container */}
      <div className="relative w-full max-w-[550px] h-screen bg-[#08060b] shadow-2xl">
        {/* Phone screen gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

        {/* Single Card */}
        <div className="relative w-full h-full">
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

        {/* Bottom Navigation Bar */}
        <BottomNavbar />
      </div>
    </div>
  );
}
