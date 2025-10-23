"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { encodeFunctionData, formatUnits, parseEther } from "viem";
import ConnectWallet from "../../components/ConnectWallet";
import { useWallet } from "../../contexts/WalletContext";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  type ContractRound,
  calculatePayout,
  formatEther,
  getPublicClient,
  getRoundData,
  MIN_BET_WEI,
  PREDICTION_ABI,
} from "../../lib/prediction";
import { getLatestPrice, type PriceData } from "./price";

interface Round {
  id: number;
  epoch: number;
  state: "previous" | "current" | "next";
  lockPrice: number;
  currentPrice: number;
  prizePool: number;
  upPayout: number;
  downPayout: number;
  upAmount: number;
  downAmount: number;
  contractData?: ContractRound | null;
}

export default function PredictionPage() {
  const { address, sdk, isConnected, chainId } = useWallet();
  const publicClient = getPublicClient();
  const roundStartTimeRef = useRef<number>(Date.now());
  const [countdown, setCountdown] = useState(() => {
    // Initialize countdown based on current time (5 minutes = 300 seconds)
    const now = Date.now();
    const elapsed = Math.floor((now - roundStartTimeRef.current) / 1000);
    return Math.max(1, 300 - (elapsed % 300));
  });
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [currentContractEpoch, setCurrentContractEpoch] = useState<
    number | null
  >(null);
  const [isBetting, setIsBetting] = useState(false);
  const [betFeedback, setBetFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(3); // Start at LIVE card (index 3)
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [betDirection, setBetDirection] = useState<"up" | "down" | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(6); // Track next unique ID (starts at 6 since we have 0-5 already)

  // Initialize with 8 rounds: 3 previous, 1 current, 4 next
  const [rounds, setRounds] = useState<Round[]>([
    {
      id: -2,
      epoch: 0,
      state: "previous",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: -1,
      epoch: 0,
      state: "previous",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: 0,
      epoch: 1,
      state: "previous",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: 1,
      epoch: 2,
      state: "current",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: 2,
      epoch: 3,
      state: "next",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: 3,
      epoch: 4,
      state: "next",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: 4,
      epoch: 5,
      state: "next",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
    {
      id: 5,
      epoch: 6,
      state: "next",
      lockPrice: 0,
      currentPrice: 0,
      prizePool: 0,
      upPayout: 0,
      downPayout: 0,
      upAmount: 0,
      downAmount: 0,
    },
  ]);

  // Fetch current epoch from contract and update round data
  const fetchContractEpoch = useCallback(async () => {
    if (!publicClient) return;
    try {
      const epoch = (await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: PREDICTION_ABI,
        functionName: "currentEpoch",
      })) as bigint;
      const epochNum = Number(epoch);
      setCurrentContractEpoch(epochNum);

      // Fetch round data for current and previous epochs
      if (epochNum > 0) {
        // Fetch current round
        const roundData = await getRoundData(epochNum);

        // Fetch previous rounds (up to 3)
        const previousRounds: Array<{ epoch: number; data: ContractRound }> = [];
        for (let i = 1; i <= 3 && epochNum - i > 0; i++) {
          const prevRoundData = await getRoundData(epochNum - i);
          if (prevRoundData) {
            previousRounds.push({ epoch: epochNum - i, data: prevRoundData });
          }
        }

        if (roundData) {

          // Update rounds with real data
          setRounds((prevRounds) =>
            prevRounds.map((round, index) => {
              // Update current round
              if (round.state === "current") {
                const prizePool = formatEther(roundData.totalAmount);
                const upAmount = formatEther(roundData.bullAmount);
                const downAmount = formatEther(roundData.bearAmount);
                const upPayout = calculatePayout(
                  roundData.totalAmount,
                  roundData.bullAmount,
                );
                const downPayout = calculatePayout(
                  roundData.totalAmount,
                  roundData.bearAmount,
                );

                return {
                  ...round,
                  epoch: epochNum,
                  prizePool,
                  upAmount,
                  downAmount,
                  upPayout,
                  downPayout,
                  contractData: roundData,
                };
              }

              // Update previous rounds
              if (round.state === "previous") {
                const prevIndex = 2 - index; // 0, 1, 2 maps to epoch-3, epoch-2, epoch-1
                const prevData = previousRounds.find(p => p.epoch === epochNum - (prevIndex + 1));

                if (prevData) {
                  const prizePool = formatEther(prevData.data.totalAmount);
                  const upAmount = formatEther(prevData.data.bullAmount);
                  const downAmount = formatEther(prevData.data.bearAmount);
                  const upPayout = calculatePayout(
                    prevData.data.totalAmount,
                    prevData.data.bullAmount,
                  );
                  const downPayout = calculatePayout(
                    prevData.data.totalAmount,
                    prevData.data.bearAmount,
                  );

                  return {
                    ...round,
                    epoch: prevData.epoch,
                    lockPrice: Number(prevData.data.lockPrice) / 1e8,
                    currentPrice: Number(prevData.data.closePrice) / 1e8,
                    prizePool,
                    upAmount,
                    downAmount,
                    upPayout,
                    downPayout,
                    contractData: prevData.data,
                  };
                }
              }

              return round;
            }),
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch contract epoch:", error);
    }
  }, [publicClient]);

  // Fetch latest price from Chainlink oracle
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await getLatestPrice();
        setLatestPrice(priceData.price);

        // Lock the price when countdown resets (new round starts)
        if (countdown === 300) {
          setLockedPrice(priceData.price);
        }
      } catch (error) {
        console.error("Failed to fetch price:", error);
      }
    };

    fetchPrice();
    fetchContractEpoch();
    const priceInterval = setInterval(() => {
      fetchPrice();
      fetchContractEpoch();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(priceInterval);
  }, [countdown, fetchContractEpoch]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - roundStartTimeRef.current) / 1000);
      const newCountdown = Math.max(1, 300 - (elapsed % 300));

      setCountdown(newCountdown);

      // Check if we've hit a new 5-minute boundary
      if (newCountdown === 300 && elapsed > 0) {
        handleAutoTransition();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleAutoTransition = () => {
    // Close any flipped cards before transitioning
    handleCloseSetPosition();

    // Auto-advance to next card
    if (currentIndex < rounds.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    // Add new round when we're getting close to the end
    if (currentIndex >= rounds.length - 3) {
      setRounds((prevRounds) => {
        const lastEpoch = prevRounds[prevRounds.length - 1].epoch;
        const newId = nextIdRef.current++; // Get unique ID and increment
        const newRound: Round = {
          id: newId,
          epoch: lastEpoch + 1,
          state: "next",
          lockPrice: 0,
          currentPrice: prevRounds[3].currentPrice + (Math.random() * 4 - 2),
          prizePool: Math.random() * 0.5,
          upPayout: Math.random() * 3 + 1.5,
          downPayout: Math.random() * 3 + 1.5,
          upAmount: Math.random() * 0.3,
          downAmount: Math.random() * 0.3,
        };

        // Update states based on new currentIndex
        const newIndex = currentIndex + 1;
        const updatedRounds = prevRounds.map((round, idx) => {
          if (idx < newIndex - 2)
            return { ...round, state: "previous" as const };
          if (idx === newIndex) return { ...round, state: "current" as const };
          return { ...round, state: "next" as const };
        });

        return [...updatedRounds, newRound];
      });
    }
  };

  const navigateToCard = (index: number) => {
    if (index >= 0 && index < rounds.length) {
      // Close any flipped cards before navigating
      handleCloseSetPosition();
      setCurrentIndex(index);
      // Don't reset countdown - keep it synchronized with real time
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const currentX = e.pageX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Determine if we should navigate based on drag distance
    const threshold = 100; // pixels to trigger navigation

    if (dragOffset > threshold) {
      // Dragged right - go to previous card
      navigateToCard(currentIndex - 1);
    } else if (dragOffset < -threshold) {
      // Dragged left - go to next card
      navigateToCard(currentIndex + 1);
    }

    // Reset drag offset
    setDragOffset(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(4)}`;
  };

  const handleSetPosition = (roundId: number, direction: "up" | "down") => {
    setFlippedCard(roundId);
    setBetDirection(direction);
    setBetAmount("");
  };

  const handleCloseSetPosition = () => {
    setFlippedCard(null);
    setBetDirection(null);
    setBetAmount("");
  };

  const handlePercentageClick = (percentage: number, balance: number) => {
    const amount = ((balance * percentage) / 100).toFixed(4);
    setBetAmount(amount);
  };

  const handleMaxClick = (balance: number) => {
    setBetAmount(balance.toFixed(4));
  };

  const renderCard = (round: Round, index: number) => {
    const isPrevious = index < currentIndex;
    const isCurrent = index === currentIndex;
    const isNext = index > currentIndex;
    const isImmediateNext = index === currentIndex + 1;
    const isFlipped =
      flippedCard === round.id && (isCurrent || isImmediateNext);
    const balance = 0.003294878; // Mock balance

    const cardOpacity = isPrevious
      ? "opacity-60"
      : isCurrent
        ? "opacity-100"
        : isImmediateNext
          ? "opacity-95"
          : "opacity-75";
    const cardScale = isCurrent ? "scale-100" : "scale-95";
    const borderColor = isCurrent
      ? "border-purple-400/60 shadow-2xl shadow-purple-500/30"
      : isImmediateNext
        ? "border-purple-400/40 shadow-lg shadow-purple-500/20"
        : "border-white/10";

    return (
      <div
        key={round.id}
        className={`flex-shrink-0 w-[420px] h-[680px] ${cardOpacity} ${cardScale} transition-all`}
        style={{ perspective: "1000px" }}
      >
        <div
          className={`relative w-full h-full transition-transform duration-600 ease-smooth ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front of card */}
          <div
            className={`absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80 rounded-3xl border ${borderColor} overflow-hidden cursor-pointer hover:scale-[0.98] hover:border-purple-400/50 transition-all`}
            style={{ backfaceVisibility: "hidden" }}
            onClick={() => {
              // Only navigate if not dragging and not flipped
              if (!isDragging && dragOffset === 0 && !isFlipped) {
                navigateToCard(index);
              }
            }}
          >
            {/* Header with Glass Effect */}
            <div
              className={`backdrop-blur-md ${isCurrent ? "bg-gradient-to-r from-purple-600/90 to-purple-500/90" : isPrevious ? "bg-purple-600/30" : "bg-purple-600/50"} px-6 py-3 flex items-center justify-between border-b border-white/10`}
            >
              <div className="flex items-center gap-3">
                {isCurrent && (
                  <div className="w-7 h-7 rounded-full border-2 border-white/90 flex items-center justify-center backdrop-blur-sm bg-white/20">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></div>
                  </div>
                )}
                {isImmediateNext && (
                  <div className="w-7 h-7 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-white/10">
                    <span className="text-white text-xs">▶</span>
                  </div>
                )}
                {isPrevious && (
                  <div className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center backdrop-blur-sm bg-white/5">
                    <span className="text-white/50 text-xs">✓</span>
                  </div>
                )}
                {isNext && !isImmediateNext && (
                  <div className="w-7 h-7 rounded-full border-2 border-white/20 flex items-center justify-center backdrop-blur-sm bg-white/5">
                    <span className="text-white/40 text-xs">•••</span>
                  </div>
                )}
                <span className="text-white font-semibold text-lg drop-shadow-lg">
                  {isCurrent
                    ? "LIVE"
                    : isImmediateNext
                      ? "Next"
                      : isPrevious
                        ? "Expired"
                        : "Later"}
                </span>
              </div>
              <span className="text-purple-100 text-sm font-mono backdrop-blur-sm bg-white/10 px-3 py-1 rounded-full">
                #{round.epoch}
              </span>
            </div>

            {/* Progress Bar - Only show for current card */}
            {isCurrent && (
              <div className="relative h-1.5 bg-gradient-to-r from-purple-900/30 to-purple-800/30 backdrop-blur-sm">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-1000 ease-linear shadow-lg shadow-cyan-500/50"
                  style={{
                    width: `${(countdown / 300) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* UP Section with Glass */}
            <div className="bg-gradient-to-b from-teal-500/15 via-teal-500/10 to-transparent p-6 border-b border-teal-500/20 backdrop-blur-sm">
              <div className="text-center mb-3">
                <div className="text-teal-300 text-3xl font-bold mb-1 drop-shadow-glow">
                  UP
                </div>
                <div className="text-teal-400 text-sm font-medium backdrop-blur-sm bg-teal-500/10 inline-block px-3 py-1 rounded-full">
                  {round.upPayout > 0
                    ? `${round.upPayout.toFixed(2)}x`
                    : "No bets"}{" "}
                  Payout
                </div>
              </div>
              {round.upAmount > 0 && (
                <div className="text-center text-xs text-teal-400/70">
                  {round.upAmount.toFixed(4)} ETH
                </div>
              )}
            </div>

            {/* Price Section with Enhanced Glass */}
            <div className="backdrop-blur-md bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-pink-500/30 rounded-2xl m-6 p-5 shadow-xl">
              {isCurrent && (
                <>
                  <div className="text-gray-300 text-xs mb-2 font-semibold tracking-wider uppercase">
                    Last Price
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-pink-400 text-3xl font-bold drop-shadow-glow">
                      {latestPrice ? formatPrice(latestPrice) : "Loading..."}
                    </div>
                    {latestPrice && lockedPrice && (
                      <div
                        className={`${latestPrice < lockedPrice ? "bg-gradient-to-r from-pink-500 to-pink-600" : "bg-gradient-to-r from-teal-500 to-teal-600"} backdrop-blur-sm text-white px-3 py-1 rounded-lg flex items-center gap-1 shadow-lg`}
                      >
                        <span>{latestPrice < lockedPrice ? "↓" : "↑"}</span>
                        <span className="text-sm font-semibold">
                          ${Math.abs(latestPrice - lockedPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm mb-4 backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-gray-400">Locked Price:</span>
                    <span className="text-white font-semibold">
                      {lockedPrice ? formatPrice(lockedPrice) : "Waiting..."}
                    </span>
                  </div>

                  {/* Betting status indicator */}
                  {round.contractData && (() => {
                    const now = Math.floor(Date.now() / 1000);
                    const lockTime = Number(round.contractData.lockTimestamp);
                    const startTime = Number(round.contractData.startTimestamp);
                    const isBettable = startTime > 0 && lockTime > 0 && now > startTime && now < lockTime;
                    const timeUntilLock = lockTime - now;

                    if (!isBettable && now >= lockTime) {
                      return (
                        <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/20 border border-red-400/30 text-center">
                          <span className="text-red-300 text-xs font-semibold">🔒 Round Locked</span>
                        </div>
                      );
                    } else if (isBettable && timeUntilLock < 60) {
                      return (
                        <div className="mb-3 px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-center">
                          <span className="text-yellow-300 text-xs font-semibold">⚡ Closing in {timeUntilLock}s</span>
                        </div>
                      );
                    } else if (isBettable) {
                      return (
                        <div className="mb-3 px-3 py-2 rounded-lg bg-green-500/20 border border-green-400/30 text-center">
                          <span className="text-green-300 text-xs font-semibold">✓ Betting Open</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPosition(round.id, "up");
                    }}
                    className="w-full backdrop-blur-md bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white font-bold py-3 rounded-xl mb-3 transition-all shadow-lg hover:shadow-teal-500/50 border border-teal-300/30"
                  >
                    Enter UP
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPosition(round.id, "down");
                    }}
                    className="w-full backdrop-blur-md bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-pink-500/50 border border-pink-400/30"
                  >
                    Enter DOWN
                  </button>
                </>
              )}

              {isPrevious && (
                <>
                  <div className="text-gray-300 text-xs mb-2 font-semibold tracking-wider uppercase">
                    Closed Price
                  </div>
                  {round.contractData && Number(round.contractData.closePrice) > 0 ? (
                    <>
                      <div className="text-center mb-4 backdrop-blur-sm bg-white/5 p-4 rounded-xl">
                        <div
                          className={`${Number(round.contractData.closePrice) < Number(round.contractData.lockPrice) ? "text-pink-400" : "text-teal-400"} text-3xl font-bold drop-shadow-glow`}
                        >
                          ${(Number(round.contractData.closePrice) / 1e8).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mb-2 backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg">
                        <span className="text-gray-400">Locked Price:</span>
                        <span className="text-white font-semibold">
                          ${(Number(round.contractData.lockPrice) / 1e8).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-4 text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${Number(round.contractData.closePrice) < Number(round.contractData.lockPrice) ? "bg-pink-500/20 border border-pink-400/30" : "bg-teal-500/20 border border-teal-400/30"}`}>
                          <span className={`text-2xl font-bold ${Number(round.contractData.closePrice) < Number(round.contractData.lockPrice) ? "text-pink-400" : "text-teal-400"}`}>
                            {Number(round.contractData.closePrice) < Number(round.contractData.lockPrice) ? "DOWN" : "UP"}
                          </span>
                          <span className={`text-sm ${Number(round.contractData.closePrice) < Number(round.contractData.lockPrice) ? "text-pink-300" : "text-teal-300"}`}>
                            WON
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 backdrop-blur-sm bg-white/5 rounded-xl">
                      <div className="text-gray-400 text-sm">No data available</div>
                    </div>
                  )}
                </>
              )}

              {isImmediateNext && (
                <>
                  <div className="flex justify-between text-sm mb-4 backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-gray-400">Prize Pool:</span>
                    <span className="text-white font-semibold">
                      {round.prizePool.toFixed(4)} ETH
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPosition(round.id, "up");
                    }}
                    className="w-full backdrop-blur-md bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white font-bold py-3 rounded-xl mb-3 transition-all shadow-lg hover:shadow-teal-500/50 border border-teal-300/30"
                  >
                    Enter UP
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPosition(round.id, "down");
                    }}
                    className="w-full backdrop-blur-md bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-pink-500/50 border border-pink-400/30"
                  >
                    Enter DOWN
                  </button>

                  <div className="mt-4 text-center text-xs text-gray-400 backdrop-blur-sm bg-white/5 py-2 rounded-lg">
                    Entry starts after LIVE round locks
                  </div>
                </>
              )}

              {isNext && !isImmediateNext && (
                <div className="text-center py-8 backdrop-blur-sm bg-white/5 rounded-xl">
                  <div className="text-gray-400 text-sm mb-2">
                    Upcoming Round
                  </div>
                  <div className="text-gray-500 text-xs">
                    Prize Pool: {round.prizePool.toFixed(4)} ETH
                  </div>
                </div>
              )}

              {!isNext && (
                <div className="flex justify-between text-sm backdrop-blur-sm bg-white/5 px-3 py-2 rounded-lg">
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="text-white font-semibold">
                    {round.prizePool.toFixed(4)} ETH
                  </span>
                </div>
              )}
            </div>

            {/* DOWN Section with Glass */}
            <div className="bg-gradient-to-t from-pink-500/15 via-pink-500/10 to-transparent p-6 pt-0 backdrop-blur-sm border-t border-pink-500/20">
              <div className="text-center mt-2">
                <div className="text-pink-400 text-sm font-medium backdrop-blur-sm bg-pink-500/10 inline-block px-3 py-1 rounded-full">
                  {round.downPayout > 0
                    ? `${round.downPayout.toFixed(2)}x`
                    : "No bets"}{" "}
                  Payout
                </div>
                <div className="text-pink-300 text-3xl font-bold mt-1 drop-shadow-glow">
                  DOWN
                </div>
              </div>
              {round.downAmount > 0 && (
                <div className="text-center text-xs text-pink-400/70 mt-1">
                  {round.downAmount.toFixed(4)} ETH
                </div>
              )}
            </div>
          </div>

          {/* Back of card - Set Position */}
          <div
            className={`absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 rounded-3xl border ${borderColor} overflow-hidden`}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`backdrop-blur-md ${betDirection === "up" ? "bg-gradient-to-r from-teal-600/90 to-teal-500/90" : "bg-gradient-to-r from-pink-600/90 to-pink-500/90"} px-6 py-4 flex items-center justify-between border-b border-white/10`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleCloseSetPosition();
                }}
                className="text-white hover:text-gray-200 transition-colors cursor-pointer z-50"
              >
                <span className="text-2xl">←</span>
              </button>
              <span className="text-white font-semibold text-lg drop-shadow-lg">
                Set Position
              </span>
              <div
                className={`${betDirection === "up" ? "bg-teal-500" : "bg-pink-500"} backdrop-blur-sm text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-lg`}
              >
                {betDirection?.toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Commit Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 text-sm font-semibold">
                    Commit:
                  </span>
                  <div className="flex items-center gap-2 backdrop-blur-sm bg-blue-500/20 px-3 py-1 rounded-lg">
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">⟠</span>
                    </div>
                    <span className="text-blue-300 font-bold text-sm">ETH</span>
                  </div>
                </div>

                {/* Input */}
                <div className="backdrop-blur-md bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-white/10 rounded-2xl p-5 mb-2">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent text-white text-4xl font-bold outline-none placeholder-gray-500 text-right"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="text-right text-gray-400 text-sm mt-2">
                    Balance: {balance.toFixed(9)}
                  </div>
                </div>

                {/* Percentage Buttons */}
                <div className="flex gap-2 mb-4">
                  {[
                    { label: "10%", icon: "🐰", percent: 10 },
                    { label: "25%", percent: 25 },
                    { label: "50%", percent: 50 },
                    { label: "75%", percent: 75 },
                    { label: "Max", percent: 100 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        btn.percent === 100
                          ? handleMaxClick(balance)
                          : handlePercentageClick(btn.percent, balance);
                      }}
                      className="flex-1 backdrop-blur-sm bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 hover:border-teal-500/50 text-teal-400 font-semibold py-2 rounded-lg transition-all text-sm"
                    >
                      {btn.icon && <span className="mr-1">{btn.icon}</span>}
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Enter Amount Placeholder */}
                {!betAmount && (
                  <div className="text-center py-4 backdrop-blur-sm bg-white/5 rounded-xl border border-dashed border-gray-600">
                    <span className="text-gray-500 text-sm">
                      Enter an amount
                    </span>
                  </div>
                )}

                {/* Warning */}
                <div className="mt-4 text-center text-xs text-gray-400 leading-relaxed">
                  You won't be able to remove or change your position once you
                  enter it.
                </div>
              </div>

              {/* Feedback Message */}
              {betFeedback && (
                <div
                  className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
                    betFeedback.type === "success"
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                      : betFeedback.type === "error"
                        ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
                        : "border-blue-400/40 bg-blue-500/10 text-blue-100"
                  }`}
                >
                  {betFeedback.text}
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();

                  if (!isConnected || !sdk || !address) {
                    setBetFeedback({
                      type: "error",
                      text: "Please connect your Base wallet first",
                    });
                    return;
                  }

                  if (!currentContractEpoch) {
                    setBetFeedback({
                      type: "error",
                      text: "Loading contract data...",
                    });
                    return;
                  }

                  if (!betAmount || parseFloat(betAmount) <= 0) {
                    setBetFeedback({
                      type: "error",
                      text: "Enter a valid bet amount",
                    });
                    return;
                  }

                  const MIN_BET_ETH = Number(formatUnits(MIN_BET_WEI, 18));
                  if (parseFloat(betAmount) < MIN_BET_ETH) {
                    setBetFeedback({
                      type: "error",
                      text: `Minimum bet is ${MIN_BET_ETH} ETH`,
                    });
                    return;
                  }

                  setIsBetting(true);
                  setBetFeedback({
                    type: "info",
                    text: "Checking round status...",
                  });

                  try {
                    const provider = sdk.getProvider();
                    const amountWei = parseEther(betAmount);

                    // Check if on correct network
                    if (chainId !== CHAIN_ID) {
                      setBetFeedback({
                        type: "error",
                        text: "Please switch to Base Sepolia network",
                      });
                      setIsBetting(false);
                      return;
                    }

                    // Fetch current round data to verify it's bettable
                    const roundData = await getRoundData(currentContractEpoch);
                    if (!roundData) {
                      setBetFeedback({
                        type: "error",
                        text: "Could not fetch round data",
                      });
                      setIsBetting(false);
                      return;
                    }

                    // Check if round is bettable
                    const now = Math.floor(Date.now() / 1000);
                    const isBettable =
                      roundData.startTimestamp > BigInt(0) &&
                      roundData.lockTimestamp > BigInt(0) &&
                      now > Number(roundData.startTimestamp) &&
                      now < Number(roundData.lockTimestamp);

                    if (!isBettable) {
                      const lockTime = Number(roundData.lockTimestamp);
                      const startTime = Number(roundData.startTimestamp);
                      const timeUntilLock = lockTime - now;
                      const timeSinceLock = now - lockTime;

                      if (roundData.startTimestamp === BigInt(0)) {
                        setBetFeedback({
                          type: "error",
                          text: "Round has not started yet. Please wait for the operator to start a new round.",
                        });
                      } else if (now < startTime) {
                        const timeUntilStart = startTime - now;
                        setBetFeedback({
                          type: "info",
                          text: `Round starts in ${Math.ceil(timeUntilStart / 60)} minutes. Please wait...`,
                        });
                      } else if (now >= lockTime && timeSinceLock < 60) {
                        setBetFeedback({
                          type: "error",
                          text: `Round locked ${Math.floor(timeSinceLock)}s ago. Waiting for next round...`,
                        });
                      } else if (now >= lockTime) {
                        setBetFeedback({
                          type: "error",
                          text: "Round is locked. The operator needs to advance to the next round.",
                        });
                      } else {
                        setBetFeedback({
                          type: "info",
                          text: `Betting closes in ${Math.floor(timeUntilLock)}s`,
                        });
                      }
                      setIsBetting(false);
                      return;
                    }

                    setBetFeedback({
                      type: "info",
                      text: "Approve the transaction in your wallet...",
                    });

                    // Encode the bet function
                    const data = encodeFunctionData({
                      abi: PREDICTION_ABI,
                      functionName:
                        betDirection === "up" ? "betBull" : "betBear",
                      args: [BigInt(currentContractEpoch)],
                    });

                    // Send transaction using wallet_sendCalls
                    await provider.request({
                      method: "wallet_sendCalls",
                      params: [
                        {
                          version: "1.0.0",
                          chainId: `0x${CHAIN_ID.toString(16)}`,
                          from: address,
                          calls: [
                            {
                              to: CONTRACT_ADDRESS,
                              value: `0x${amountWei.toString(16)}`,
                              data,
                            },
                          ],
                        },
                      ],
                    });

                    setBetFeedback({
                      type: "success",
                      text: `${betDirection === "up" ? "UP" : "DOWN"} bet placed! ${betAmount} ETH on epoch ${currentContractEpoch}`,
                    });

                    // Close the card after success
                    setTimeout(() => {
                      handleCloseSetPosition();
                      setBetFeedback(null);
                    }, 3000);
                  } catch (error: any) {
                    console.error("Bet failed:", error);
                    console.error("Error details:", {
                      message: error?.message,
                      code: error?.code,
                      data: error?.data,
                      reason: error?.reason,
                      stack: error?.stack,
                    });

                    let errorMessage = "Transaction failed. Please try again.";

                    if (error?.message) {
                      errorMessage = error.message;
                    } else if (error?.reason) {
                      errorMessage = error.reason;
                    } else if (error?.code) {
                      errorMessage = `Error code: ${error.code}`;
                    }

                    setBetFeedback({
                      type: "error",
                      text: errorMessage,
                    });
                  } finally {
                    setIsBetting(false);
                  }
                }}
                disabled={
                  !betAmount ||
                  parseFloat(betAmount) <= 0 ||
                  isBetting ||
                  !isConnected
                }
                className={`w-full ${betDirection === "up" ? "bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600" : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"} backdrop-blur-md text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border ${betDirection === "up" ? "border-teal-300/30" : "border-pink-400/30"}`}
              >
                {isBetting ? "Processing..." : "Confirm Bet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calculate transform position with drag offset
  const getTransform = () => {
    const baseOffset = 420 * currentIndex + 36 * currentIndex;
    return `translateX(calc(50% - ${baseOffset}px - 210px + ${dragOffset}px))`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="max-w-[1920px] mx-auto">
          <div className="flex justify-between items-center mb-8 px-8">
            <div className="relative">
              <h1 className="text-white text-4xl font-bold drop-shadow-2xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Prediction
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-cyan-500/50"></div>
            </div>

            <div className="flex items-center gap-4">
              {/* Rewards Button */}
              <button
                onClick={() => {
                  const rewardsSection =
                    document.getElementById("rewards-section");
                  rewardsSection?.scrollIntoView({ behavior: "smooth" });
                }}
                className="backdrop-blur-xl bg-gradient-to-br from-yellow-600/60 to-yellow-700/60 hover:from-yellow-600/80 hover:to-yellow-700/80 border border-yellow-400/30 hover:border-yellow-400/50 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl transition-all"
              >
                <span className="text-2xl">🏆</span>
                <span className="text-white font-semibold">Rewards</span>
              </button>

              {/* Current Epoch Display */}
              {currentContractEpoch !== null && (
                <div className="backdrop-blur-xl bg-gradient-to-br from-purple-800/60 to-purple-900/60 border border-purple-400/30 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl">
                  <span className="text-purple-200 text-sm">Epoch</span>
                  <span className="text-white font-mono text-2xl font-bold drop-shadow-lg">
                    #{currentContractEpoch}
                  </span>
                </div>
              )}

              {/* Timer with Glass Effect */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-white/10 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl">
                <span className="text-white font-mono text-2xl font-bold drop-shadow-lg">
                  {formatTime(countdown)}
                </span>
                <span className="text-gray-300 text-sm">auto-advance</span>
              </div>

              {/* Connect Wallet Button */}
              <ConnectWallet />
            </div>
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden px-8">
            {/* Navigation Arrows with Glass */}
            <button
              onClick={() => navigateToCard(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 backdrop-blur-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 hover:border-purple-400/50 disabled:opacity-30 disabled:cursor-not-allowed text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 hover:shadow-purple-500/50"
            >
              <span className="text-2xl">←</span>
            </button>

            <button
              onClick={() => navigateToCard(currentIndex + 1)}
              disabled={currentIndex === rounds.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 backdrop-blur-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/20 hover:border-purple-400/50 disabled:opacity-30 disabled:cursor-not-allowed text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 hover:shadow-purple-500/50"
            >
              <span className="text-2xl">→</span>
            </button>

            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-[#16213e] via-[#16213e]/50 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-[#16213e] via-[#16213e]/50 to-transparent z-10 pointer-events-none"></div>

            {/* Sliding Track */}
            <div
              ref={carouselRef}
              className={`flex gap-9 items-center ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${!isDragging ? "transition-transform duration-500 ease-out" : ""}`}
              style={{
                transform: getTransform(),
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {rounds.map((round, index) => renderCard(round, index))}
            </div>
          </div>

          {/* Info Section with Glass */}
          <div className="mt-8 text-center">
            <div className="flex justify-center gap-2 mb-4">
              {rounds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToCard(index)}
                  className={`h-2 rounded-full transition-all backdrop-blur-sm ${
                    index === currentIndex
                      ? "bg-gradient-to-r from-cyan-400 to-purple-400 w-8 shadow-lg shadow-cyan-500/50"
                      : index < currentIndex
                        ? "bg-gray-600/50 w-2"
                        : "bg-gray-500/50 w-2"
                  }`}
                />
              ))}
            </div>
            <p className="text-white/80 text-sm backdrop-blur-sm bg-white/5 inline-block px-6 py-2 rounded-full">
              Round {currentIndex + 1} of {rounds.length} ·{" "}
              {countdown <= 30 ? (
                <span className="text-yellow-300 font-bold animate-pulse">
                  Auto-advancing in {countdown}s
                </span>
              ) : (
                `Auto-advance in ${formatTime(countdown)}`
              )}
            </p>
            <p className="text-white/50 text-xs mt-3">
              Click cards · Drag to slide · Use arrow buttons · Auto-advances
              every 5 min · Powered by Chainlink ETH/USD Oracle
            </p>
          </div>

          {/* Rewards Section */}
          <div id="rewards-section" className="mt-16 px-8">
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 border border-yellow-400/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏆</span>
                  <h2 className="text-white text-2xl font-bold">
                    Your Rewards
                  </h2>
                </div>
                {isConnected && (
                  <div className="backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg">
                    <span className="text-yellow-300 text-sm font-semibold">
                      Total Claimable: 0.0000 ETH
                    </span>
                  </div>
                )}
              </div>

              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="text-white/60 text-lg mb-4">
                    Connect your wallet to view and claim rewards
                  </div>
                  <ConnectWallet />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="text-center text-white/60 py-8">
                      <span className="text-5xl mb-4 block">💎</span>
                      <p className="text-lg">No claimable rewards yet</p>
                      <p className="text-sm mt-2">
                        Place your predictions and win to earn rewards!
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="backdrop-blur-sm bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-400/20">
                      <div className="text-green-300 text-xs font-semibold mb-1">
                        Total Won
                      </div>
                      <div className="text-white text-2xl font-bold">
                        0 Rounds
                      </div>
                    </div>
                    <div className="backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-400/20">
                      <div className="text-blue-300 text-xs font-semibold mb-1">
                        Win Rate
                      </div>
                      <div className="text-white text-2xl font-bold">0%</div>
                    </div>
                    <div className="backdrop-blur-sm bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-4 border border-yellow-400/20">
                      <div className="text-yellow-300 text-xs font-semibold mb-1">
                        Total Claimed
                      </div>
                      <div className="text-white text-2xl font-bold">
                        0.0000 ETH
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={true}
                    className="w-full mt-6 backdrop-blur-md bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30"
                  >
                    Claim All Rewards
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
