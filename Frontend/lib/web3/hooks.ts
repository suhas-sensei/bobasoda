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
      console.log('Placing bull bet:', { epoch: currentEpoch, amount });
      const tx = await contract.betBull(currentEpoch, {
        value: ethers.parseEther(amount),
      });
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed!');
      return tx;
    } catch (error: any) {
      console.error('Error placing bull bet:', error);

      // Try to get readable error message
      if (error.reason) {
        console.error('Revert reason:', error.reason);
        alert(`Bet failed: ${error.reason}`);
      } else if (error.message) {
        console.error('Error message:', error.message);
        alert(`Bet failed: ${error.message}`);
      } else {
        alert('Bet failed. Check console for details.');
      }

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
      console.log('Placing bear bet:', { epoch: currentEpoch, amount });
      const tx = await contract.betBear(currentEpoch, {
        value: ethers.parseEther(amount),
      });
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed!');
      return tx;
    } catch (error: any) {
      console.error('Error placing bear bet:', error);

      // Try to get readable error message
      if (error.reason) {
        console.error('Revert reason:', error.reason);
        alert(`Bet failed: ${error.reason}`);
      } else if (error.message) {
        console.error('Error message:', error.message);
        alert(`Bet failed: ${error.message}`);
      } else {
        alert('Bet failed. Check console for details.');
      }

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

  // Get current price from Pyth oracle directly
  const getCurrentPrice = useCallback(async () => {
    if (!contract) return null;
    try {
      // Get the pyth contract address from the prediction contract
      const pythAddress = await contract.pyth();
      const priceId = await contract.priceId();

      // Create Pyth contract instance
      const pythAbi = [
        'function getPriceUnsafe(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)'
      ];
      const provider = contract.runner?.provider;
      if (!provider) return null;

      const pythContract = new ethers.Contract(pythAddress, pythAbi, provider);

      // Get latest price from Pyth
      const priceData = await pythContract.getPriceUnsafe(priceId);

      // Pyth returns price with expo (usually -8 for ETH/USD)
      // price * 10^expo = actual price
      const price = Number(priceData[0]); // int64 price
      const expo = Number(priceData[2]); // int32 expo (signed)
      const actualPrice = price * Math.pow(10, expo);

      console.log('Pyth price data:', { price, expo, actualPrice });

      return actualPrice;
    } catch (error) {
      console.error('Error fetching current price from Pyth oracle:', error);
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
