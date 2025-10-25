"use client";

import { useEffect, useState } from "react";
import ConnectWallet from "../../components/ConnectWallet";
import { getLatestPrice, type PriceData } from "./price";

export default function PredictionPage() {
  const [latestPrice, setLatestPrice] = useState<PriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [countdown, setCountdown] = useState(60);

  // Fetch latest price from Chainlink oracle
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await getLatestPrice();
        setLatestPrice(price);
        setPriceHistory((prev) => {
          const newHistory = [...prev, price];
          // Keep only last 10 prices
          return newHistory.slice(-10);
        });
      } catch (error) {
        console.error("Failed to fetch price:", error);
      }
    };

    // Fetch immediately
    fetchPrice();

    // Then fetch every 10 seconds
    const interval = setInterval(fetchPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getPriceChange = () => {
    if (priceHistory.length < 2) return 0;
    const current = priceHistory[priceHistory.length - 1].price;
    const previous = priceHistory[priceHistory.length - 2].price;
    return ((current - previous) / previous) * 100;
  };

  const priceChange = getPriceChange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Phone screen container */}
      <div className="relative w-full max-w-[550px] h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] shadow-2xl overflow-y-auto">
        <div className="relative z-10 px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-white text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Price Monitor
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Real-time ETH/USD Price Feed
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectWallet />
          </div>
        </div>

        {/* Main Price Display */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-gray-800/60 border border-white/20 rounded-3xl p-8 shadow-2xl mb-8">
          <div className="text-center">
            <div className="text-white/60 text-sm mb-2">ETH/USD</div>
            {latestPrice ? (
              <>
                <div className="text-white text-6xl font-bold mb-2">
                  {formatPrice(latestPrice.price)}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    priceChange > 0
                      ? "text-green-400"
                      : priceChange < 0
                        ? "text-red-400"
                        : "text-white/60"
                  }`}
                >
                  {priceChange > 0 ? "+" : ""}
                  {priceChange.toFixed(2)}%
                  {priceChange > 0 ? " ↑" : priceChange < 0 ? " ↓" : ""}
                </div>
                <div className="text-white/40 text-xs mt-4">
                  Last updated:{" "}
                  {new Date(latestPrice.timestamp).toLocaleString()}
                </div>
                <div className="text-white/40 text-xs mt-1">
                  Round ID: {latestPrice.roundId.toString()}
                </div>
              </>
            ) : (
              <div className="text-white/60 text-xl">Loading price data...</div>
            )}
          </div>

          {/* Next update countdown */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <div className="text-white/40 text-sm">Next update in</div>
            <div className="text-white text-2xl font-bold mt-1">
              {countdown}s
            </div>
          </div>
        </div>

        {/* Price History */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-gray-800/60 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-white text-2xl font-bold mb-6">Price History</h2>
          {priceHistory.length > 0 ? (
            <div className="space-y-3">
              {priceHistory
                .slice()
                .reverse()
                .map((price, index) => (
                  <div
                    key={price.roundId.toString()}
                    className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-white font-semibold">
                        {formatPrice(price.price)}
                      </div>
                      <div className="text-white/40 text-xs">
                        {new Date(price.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">
                      Round {price.roundId.toString()}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-white/60 text-center py-8">
              No price history yet
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <p className="text-white/50 text-xs">
            Powered by Chainlink ETH/USD Oracle on Base Sepolia
          </p>
          <p className="text-white/40 text-xs mt-1">
            Price updates every 10 seconds
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
