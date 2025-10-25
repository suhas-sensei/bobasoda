'use client';

import { motion } from "framer-motion";
import { DemoRoundResult } from "@/types/prediction";
import { TrendingUp, TrendingDown, Trophy, XCircle } from "lucide-react";

interface RoundResultsProps {
  result: DemoRoundResult;
  onNextRound: () => void;
}

export function RoundResults({ result, onNextRound }: RoundResultsProps) {
  const isProfit = result.totalProfit > 0;

  const formatCurrency = (num: number) => {
    const absNum = Math.abs(num);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absNum);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

      {/* Phone screen container */}
      <div className="relative w-full max-w-[550px] h-screen bg-[#08060b] shadow-2xl overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1028] via-[#08060b] to-black" />

        <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
        {/* Main Result Card */}
        <div className="bg-[#27262c] border-[3px] border-[#383241] rounded-3xl p-8 mb-6">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {isProfit ? (
                <Trophy className="w-24 h-24 text-[#ffd800] mx-auto mb-4" strokeWidth={2} />
              ) : (
                <XCircle className="w-24 h-24 text-[#666171] mx-auto mb-4" strokeWidth={2} />
              )}
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-2">Round Complete!</h2>
            <p className="text-[#b8add2] font-bold">Here&apos;s how you did</p>
          </div>

          {/* Profit/Loss Display */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-center mb-8 p-8 rounded-3xl border-[3px] ${
              isProfit
                ? 'bg-[#31d0aa]/10 border-[#31d0aa]'
                : 'bg-[#ed4b9e]/10 border-[#ed4b9e]'
            }`}
          >
            <div className="text-sm font-bold text-[#b8add2] mb-3">
              {isProfit ? 'Total Profit' : 'Total Loss'}
            </div>
            <div className={`text-6xl font-black ${isProfit ? 'text-[#31d0aa]' : 'text-[#ed4b9e]'}`}>
              {isProfit ? '+' : '-'}{formatCurrency(result.totalProfit)}
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-[#31d0aa]/10 border-2 border-[#31d0aa]/30 rounded-2xl p-6 text-center"
            >
              <TrendingUp className="w-10 h-10 text-[#31d0aa] mx-auto mb-3" strokeWidth={3} />
              <div className="text-4xl font-black text-[#31d0aa]">{result.winCount}</div>
              <div className="text-sm font-bold text-[#b8add2]">Wins</div>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-[#ed4b9e]/10 border-2 border-[#ed4b9e]/30 rounded-2xl p-6 text-center"
            >
              <TrendingDown className="w-10 h-10 text-[#ed4b9e] mx-auto mb-3" strokeWidth={3} />
              <div className="text-4xl font-black text-[#ed4b9e]">{result.lossCount}</div>
              <div className="text-sm font-bold text-[#b8add2]">Losses</div>
            </motion.div>
          </div>

          {/* Details Table */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <h3 className="text-xl font-black text-white mb-4">Round Details</h3>
            <div className="space-y-3">
              {result.swipes.map((swipe, index) => (
                <div
                  key={index}
                  className="bg-[#353547] border-2 border-[#383241] rounded-2xl p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      swipe.result === 'win'
                        ? 'bg-[#31d0aa]/20 border-[#31d0aa]'
                        : 'bg-[#ed4b9e]/20 border-[#ed4b9e]'
                    }`}>
                      <span className={`text-xl font-black ${
                        swipe.result === 'win' ? 'text-[#31d0aa]' : 'text-[#ed4b9e]'
                      }`}>
                        {swipe.result === 'win' ? '✓' : '✗'}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-black text-base">{swipe.asset}</div>
                      <div className="text-xs font-bold text-[#b8add2]">
                        {formatCurrency(swipe.startPrice)} → {formatCurrency(swipe.endPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black mb-1 ${
                      swipe.prediction === 'up' ? 'text-[#31d0aa]' : 'text-[#ed4b9e]'
                    }`}>
                      {swipe.prediction === 'up' ? '↑ UP' : '↓ DOWN'}
                    </div>
                    <div className={`text-xl font-black ${
                      swipe.result === 'win' ? 'text-[#31d0aa]' : 'text-[#ed4b9e]'
                    }`}>
                      {swipe.profit > 0 ? '+' : ''}{formatCurrency(swipe.profit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Next Round Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onNextRound}
            className="w-full bg-[#7645d9] hover:bg-[#633bb5] text-white font-black py-5 rounded-2xl transition-colors text-lg shadow-lg"
          >
            Start Next Round
          </motion.button>
        </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
