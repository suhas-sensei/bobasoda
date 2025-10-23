'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './provider';
import { ethers } from 'ethers';

export interface Round {
  epoch: bigint;
  startTimestamp: bigint;
  lockTimestamp: bigint;
  closeTimestamp: bigint;
  lockPrice: bigint;
  closePrice: bigint;
  totalAmount: bigint;
  bullAmount: bigint;
  bearAmount: bigint;
  rewardBaseCalAmount: bigint;
  rewardAmount: bigint;
  oracleCalled: boolean;
}

export interface BetInfo {
  position: number; // 0 = Bull, 1 = Bear
  amount: bigint;
  claimed: boolean;
}

export function usePredictionContract() {
  const { contract, account } = useWeb3();
  const [currentEpoch, setCurrentEpoch] = useState<bigint | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [userBet, setUserBet] = useState<BetInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current epoch
  const fetchCurrentEpoch = useCallback(async () => {
    if (!contract) return;
    try {
      const epoch = await contract.currentEpoch();
      setCurrentEpoch(epoch);
      return epoch;
    } catch (error) {
      console.error('Error fetching current epoch:', error);
      return null;
    }
  }, [contract]);

  // Fetch round data
  const fetchRound = useCallback(async (epoch: bigint) => {
    if (!contract) return null;
    try {
      const round = await contract.rounds(epoch);
      return {
        epoch: round.epoch,
        startTimestamp: round.startTimestamp,
        lockTimestamp: round.lockTimestamp,
        closeTimestamp: round.closeTimestamp,
        lockPrice: round.lockPrice,
        closePrice: round.closePrice,
        totalAmount: round.totalAmount,
        bullAmount: round.bullAmount,
        bearAmount: round.bearAmount,
        rewardBaseCalAmount: round.rewardBaseCalAmount,
        rewardAmount: round.rewardAmount,
        oracleCalled: round.oracleCalled,
      } as Round;
    } catch (error) {
      console.error('Error fetching round:', error);
      return null;
    }
  }, [contract]);

  // Fetch user bet for a round
  const fetchUserBet = useCallback(async (epoch: bigint, userAddress: string) => {
    if (!contract) return null;
    try {
      const bet = await contract.ledger(epoch, userAddress);
      return {
        position: bet.position,
        amount: bet.amount,
        claimed: bet.claimed,
      } as BetInfo;
    } catch (error) {
      console.error('Error fetching user bet:', error);
      return null;
    }
  }, [contract]);

  // Place a Bull bet
  const betBull = useCallback(async (amount: string) => {
    if (!contract || !currentEpoch) return null;
    setIsLoading(true);
    try {
      const tx = await contract.betBull(currentEpoch, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error placing bull bet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contract, currentEpoch]);

  // Place a Bear bet
  const betBear = useCallback(async (amount: string) => {
    if (!contract || !currentEpoch) return null;
    setIsLoading(true);
    try {
      const tx = await contract.betBear(currentEpoch, {
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error placing bear bet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contract, currentEpoch]);

  // Claim rewards
  const claim = useCallback(async (epochs: bigint[]) => {
    if (!contract) return null;
    setIsLoading(true);
    try {
      const tx = await contract.claim(epochs);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Get current price from oracle
  const getCurrentPrice = useCallback(async () => {
    if (!contract) return null;
    try {
      const oracleAddress = await contract.oracle();
      const oracleABI = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
      ];
      const oracle = new ethers.Contract(oracleAddress, oracleABI, contract.runner);
      const roundData = await oracle.latestRoundData();

      // Chainlink ETH/USD has 8 decimals
      return Number(roundData.answer) / 1e8;
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }, [contract]);

  // Check if user can claim for a specific epoch
  const canClaim = useCallback(async (epoch: bigint, userAddress: string) => {
    if (!contract) return false;
    try {
      return await contract.claimable(epoch, userAddress);
    } catch (error) {
      console.error('Error checking claimable:', error);
      return false;
    }
  }, [contract]);

  // Get user rounds
  const getUserRounds = useCallback(async (userAddress: string) => {
    if (!contract) return [];
    try {
      const roundsLength = await contract.getUserRoundsLength(userAddress);
      if (roundsLength === 0n) return [];

      const [epochs] = await contract.getUserRounds(userAddress, 0, roundsLength);
      return epochs;
    } catch (error) {
      console.error('Error fetching user rounds:', error);
      return [];
    }
  }, [contract]);

  // Auto-refresh current round data
  useEffect(() => {
    if (!contract) return;

    const refreshData = async () => {
      const epoch = await fetchCurrentEpoch();
      if (epoch) {
        const round = await fetchRound(epoch);
        setCurrentRound(round);

        if (account) {
          const bet = await fetchUserBet(epoch, account);
          setUserBet(bet);
        }
      }
    };

    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [contract, account, fetchCurrentEpoch, fetchRound, fetchUserBet]);

  return {
    currentEpoch,
    currentRound,
    userBet,
    isLoading,
    betBull,
    betBear,
    claim,
    getCurrentPrice,
    canClaim,
    getUserRounds,
    fetchRound,
    fetchUserBet,
  };
}
