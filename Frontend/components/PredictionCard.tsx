'use client';

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Prediction } from "@/types/prediction";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PredictionCardProps {
  prediction: Prediction;
  onSwipe: (direction: 'up' | 'down') => void;
  onTimeExpired?: () => void;
  isActive: boolean;
  hasBet?: boolean;
  userPosition?: number;
}

export function PredictionCard({ prediction, onSwipe, onTimeExpired, isActive, hasBet = false, userPosition }: PredictionCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<'up' | 'down' | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, prediction.endsAt - Date.now());
      setTimeLeft(remaining);

      // Check if time has expired
      if (remaining === 0 && !isExpired && !hasBet) {
        setIsExpired(true);
        // Trigger dissolve animation and callback after a short delay
        setTimeout(() => {
          if (onTimeExpired) {
            onTimeExpired();
          }
        }, 800); // Wait for dissolve animation
      }
    }, 100);

    return () => clearInterval(interval);
  }, [prediction.endsAt, isActive, isExpired, hasBet, onTimeExpired]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (hasBet) return; // Don't allow swiping if already bet

    const threshold = 100;

    if (info.offset.x > threshold) {
      // Swiped right - UP bet
      setShowFeedback('up');
      setTimeout(() => {
        onSwipe('up');
        setShowFeedback(null);
      }, 300);
    } else if (info.offset.x < -threshold) {
      // Swiped left - DOWN bet
      setShowFeedback('down');
      setTimeout(() => {
        onSwipe('down');
        setShowFeedback(null);
      }, 300);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPool = (num: number) => {
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  // Calculate progress based on timeframe (20 seconds)
  const totalTime = prediction.timeframe * 1000;
  const elapsed = totalTime - timeLeft;
  const progress = (elapsed / totalTime) * 100;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-4"
      style={{ x, rotate, opacity }}
      drag={isActive && !hasBet && !isExpired ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={showFeedback ? {
        x: showFeedback === 'up' ? 300 : -300,
        opacity: 0
      } : isExpired ? {
        scale: 0.8,
        opacity: 0,
        y: 20,
        filter: "blur(10px)"
      } : {}}
      transition={isExpired ? {
        duration: 0.8,
        ease: "easeOut"
      } : {
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <Card className={cn(
        "w-full max-w-md h-[600px] relative overflow-hidden border-[3px] rounded-3xl",
        "bg-[#27262c]",
        showFeedback === 'up' && "border-[#31d0aa]",
        showFeedback === 'down' && "border-[#ed4b9e]",
        hasBet && userPosition === 0 && "border-[#31d0aa]/50",
        hasBet && userPosition === 1 && "border-[#ed4b9e]/50",
        isExpired && "border-[#666171]",
        !showFeedback && !hasBet && !isExpired && "border-[#383241]",
        timeLeft < 3000 && timeLeft > 0 && !hasBet && !isExpired && "border-[#ed4b9e] animate-pulse"
      )}>
        {/* Swipe indicators */}
        <motion.div
          className="absolute inset-0 bg-[#31d0aa]/10 flex items-center justify-start pl-12 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: x.get() > 50 ? 1 : 0 }}
        >
          <div className="bg-[#31d0aa] rounded-full p-6">
            <TrendingUp className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-[#ed4b9e]/10 flex items-center justify-end pr-12 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: x.get() < -50 ? 1 : 0 }}
        >
          <div className="bg-[#ed4b9e] rounded-full p-6">
            <TrendingDown className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </motion.div>

        <CardContent className="p-8 h-full flex flex-col">
          {/* Timer bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[#b8add2]">
                Time Remaining
              </span>
              <span className="text-xl font-black text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-3 bg-[#353547] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#7645d9] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Asset Info */}
          <div className="text-center mb-8">
            <div className="text-sm font-bold text-[#b8add2] mb-2">
              {prediction.symbol}
            </div>
            <h2 className="text-5xl font-black text-white mb-3">
              {prediction.asset}
            </h2>
            <div className="text-6xl font-black text-white">
              {formatCurrency(prediction.currentPrice)}
            </div>
          </div>

          {/* Question */}
          <div className="bg-[#353547] rounded-2xl p-6 mb-8">
            <p className="text-center text-lg font-bold text-white">
              Will the price go <span className="text-[#31d0aa] font-black">UP</span> or{" "}
              <span className="text-[#ed4b9e] font-black">DOWN</span> in {prediction.timeframe}s?
            </p>
          </div>

          {/* Pools */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#31d0aa]/10 border-2 border-[#31d0aa]/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-6 h-6 text-[#31d0aa]" strokeWidth={3} />
                <span className="text-base font-black text-[#31d0aa]">UP</span>
              </div>
              <div className="text-3xl font-black text-[#31d0aa] mb-1">
                {prediction.multiplierUp}x
              </div>
              <div className="text-xs font-bold text-[#31d0aa]/70">
                Payout
              </div>
            </div>

            <div className="bg-[#ed4b9e]/10 border-2 border-[#ed4b9e]/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-6 h-6 text-[#ed4b9e]" strokeWidth={3} />
                <span className="text-base font-black text-[#ed4b9e]">DOWN</span>
              </div>
              <div className="text-3xl font-black text-[#ed4b9e] mb-1">
                {prediction.multiplierDown}x
              </div>
              <div className="text-xs font-bold text-[#ed4b9e]/70">
                Payout
              </div>
            </div>
          </div>

          {/* Instructions or Bet Status */}
          <div className="mt-auto">
            {hasBet ? (
              <div className={cn(
                "rounded-2xl p-5 text-center border-2",
                userPosition === 0 ? "bg-[#31d0aa]/20 border-[#31d0aa]" : "bg-[#ed4b9e]/20 border-[#ed4b9e]"
              )}>
                <p className={cn(
                  "text-base font-black",
                  userPosition === 0 ? "text-[#31d0aa]" : "text-[#ed4b9e]"
                )}>
                  You bet: {userPosition === 0 ? 'UP ⬆' : 'DOWN ⬇'}
                </p>
                <p className="text-xs font-bold text-[#b8add2] mt-1">
                  Waiting for round to end...
                </p>
              </div>
            ) : (
              <div className="bg-[#353547] rounded-2xl p-5 text-center">
                <p className="text-sm text-white font-bold">
                  Swipe <span className="text-[#31d0aa] font-black">RIGHT</span> for UP •
                  Swipe <span className="text-[#ed4b9e] font-black"> LEFT</span> for DOWN
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
