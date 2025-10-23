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
  isActive: boolean;
  hasBet?: boolean;
  userPosition?: number;
}

export function PredictionCard({ prediction, onSwipe, isActive, hasBet = false, userPosition }: PredictionCardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<'up' | 'down' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, prediction.endsAt - Date.now());
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [prediction.endsAt, isActive]);

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
      drag={isActive && !hasBet ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={showFeedback ? {
        x: showFeedback === 'up' ? 300 : -300,
        opacity: 0
      } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className={cn(
        "w-full max-w-md h-[600px] relative overflow-hidden border-2",
        "bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950",
        showFeedback === 'up' && "border-green-500",
        showFeedback === 'down' && "border-red-500",
        hasBet && userPosition === 0 && "border-green-500/50",
        hasBet && userPosition === 1 && "border-red-500/50"
      )}>
        {/* Swipe indicators */}
        <motion.div
          className="absolute inset-0 bg-green-500/10 flex items-center justify-start pl-12 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: x.get() > 50 ? 1 : 0 }}
        >
          <div className="bg-green-500 rounded-full p-6">
            <TrendingUp className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-red-500/10 flex items-center justify-end pr-12 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: x.get() < -50 ? 1 : 0 }}
        >
          <div className="bg-red-500 rounded-full p-6">
            <TrendingDown className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
        </motion.div>

        <CardContent className="p-8 h-full flex flex-col">
          {/* Timer bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Time Remaining
              </span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Asset Info */}
          <div className="text-center mb-8">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              {prediction.symbol}
            </div>
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              {prediction.asset}
            </h2>
            <div className="text-5xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(prediction.currentPrice)}
            </div>
          </div>

          {/* Question */}
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 mb-8">
            <p className="text-center text-lg font-medium text-neutral-700 dark:text-neutral-300">
              Will the price go <span className="text-green-600 font-bold">UP</span> or{" "}
              <span className="text-red-600 font-bold">DOWN</span> in {prediction.timeframe}s?
            </p>
          </div>

          {/* Pools */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">UP</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {prediction.multiplierUp}x
              </div>
              <div className="text-xs text-green-600/70">
                Pool: {formatPool(prediction.poolUp)}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">DOWN</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">
                {prediction.multiplierDown}x
              </div>
              <div className="text-xs text-red-600/70">
                Pool: {formatPool(prediction.poolDown)}
              </div>
            </div>
          </div>

          {/* Instructions or Bet Status */}
          <div className="mt-auto">
            {hasBet ? (
              <div className={cn(
                "rounded-xl p-4 text-center",
                userPosition === 0 ? "bg-green-500/20 border-2 border-green-500" : "bg-red-500/20 border-2 border-red-500"
              )}>
                <p className={cn(
                  "text-sm font-bold",
                  userPosition === 0 ? "text-green-500" : "text-red-500"
                )}>
                  You bet: {userPosition === 0 ? 'UP ⬆' : 'DOWN ⬇'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Waiting for round to end...
                </p>
              </div>
            ) : (
              <div className="bg-neutral-900 dark:bg-white rounded-xl p-4 text-center">
                <p className="text-sm text-white dark:text-neutral-900 font-medium">
                  Swipe <span className="text-green-400 dark:text-green-600">RIGHT</span> for UP •
                  Swipe <span className="text-red-400 dark:text-red-600"> LEFT</span> for DOWN
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
