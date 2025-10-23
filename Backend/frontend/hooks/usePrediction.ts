import { useCallback, useEffect, useState } from "react";
import { encodeFunctionData, formatUnits, parseEther } from "viem";
import { useWallet } from "../contexts/WalletContext";
import {
  CONTRACT_ADDRESS,
  ContractRound,
  MIN_BET_WEI,
  PREDICTION_ABI,
} from "../lib/prediction";

// Type definitions
export enum Position {
  Bull,
  Bear,
}

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
  position: Position;
  amount: bigint;
  claimed: boolean;
}

export function usePrediction() {
  const { sdk, address, isConnected, chainId } = useWallet();
  const [currentEpoch, setCurrentEpoch] = useState<bigint>(BigInt(0));
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [userBet, setUserBet] = useState<BetInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read current epoch
  const fetchCurrentEpoch = useCallback(async () => {
    if (!sdk) return;

    try {
      const provider = sdk.getProvider();
      const epoch = (await provider.request({
        method: "eth_call",
        params: [
          {
            to: CONTRACT_ADDRESS,
            data: encodeFunctionData({
              abi: PREDICTION_ABI,
              functionName: "currentEpoch",
            }),
          },
          "latest",
        ],
      })) as string;

      setCurrentEpoch(BigInt(epoch));
    } catch (error) {
      console.error("Failed to fetch current epoch:", error);
    }
  }, [sdk]);

  // Read round data
  const fetchRound = useCallback(
    async (epoch: bigint) => {
      if (!sdk) return null;

      try {
        const provider = sdk.getProvider();
        const data = (await provider.request({
          method: "eth_call",
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: encodeFunctionData({
                abi: PREDICTION_ABI,
                functionName: "rounds",
                args: [epoch],
              }),
            },
            "latest",
          ],
        })) as string;

        // Parse the round data
        // This is a simplified version - you may need to properly decode the tuple
        return data;
      } catch (error) {
        console.error("Failed to fetch round:", error);
        return null;
      }
    },
    [sdk],
  );

  // Read user's bet for a specific epoch
  const fetchUserBet = useCallback(
    async (epoch: bigint, userAddress: string) => {
      if (!sdk) return null;

      try {
        const provider = sdk.getProvider();
        const data = (await provider.request({
          method: "eth_call",
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: encodeFunctionData({
                abi: PREDICTION_ABI,
                functionName: "ledger",
                args: [epoch, userAddress as `0x${string}`],
              }),
            },
            "latest",
          ],
        })) as string;

        // Parse bet info
        return data;
      } catch (error) {
        console.error("Failed to fetch user bet:", error);
        return null;
      }
    },
    [sdk],
  );

  // Place bull bet
  const betBull = useCallback(
    async (epoch: bigint, amount: string) => {
      if (!sdk || !address) throw new Error("Wallet not connected");

      setIsLoading(true);
      try {
        const provider = sdk.getProvider();
        const amountWei = parseEther(amount);

        // Check minimum bet amount
        if (amountWei < MIN_BET_WEI) {
          throw new Error(`Minimum bet is ${formatUnits(MIN_BET_WEI, 18)} ETH`);
        }

        const callsId = await provider.request({
          method: "wallet_sendCalls",
          params: [
            {
              version: "2.0",
              chainId: `0x${chainId.toString(16)}`,
              from: address,
              calls: [
                {
                  to: CONTRACT_ADDRESS,
                  value: `0x${amountWei.toString(16)}`,
                  data: encodeFunctionData({
                    abi: PREDICTION_ABI,
                    functionName: "betBull",
                    args: [epoch],
                  }),
                },
              ],
            },
          ],
        });

        console.log("Bull bet placed:", callsId);
        return callsId;
      } catch (error) {
        console.error("Failed to place bull bet:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, address, chainId],
  );

  // Place bear bet
  const betBear = useCallback(
    async (epoch: bigint, amount: string) => {
      if (!sdk || !address) throw new Error("Wallet not connected");

      setIsLoading(true);
      try {
        const provider = sdk.getProvider();
        const amountWei = parseEther(amount);

        // Check minimum bet amount
        if (amountWei < MIN_BET_WEI) {
          throw new Error(`Minimum bet is ${formatUnits(MIN_BET_WEI, 18)} ETH`);
        }

        const callsId = await provider.request({
          method: "wallet_sendCalls",
          params: [
            {
              version: "2.0",
              chainId: `0x${chainId.toString(16)}`,
              from: address,
              calls: [
                {
                  to: CONTRACT_ADDRESS,
                  value: `0x${amountWei.toString(16)}`,
                  data: encodeFunctionData({
                    abi: PREDICTION_ABI,
                    functionName: "betBear",
                    args: [epoch],
                  }),
                },
              ],
            },
          ],
        });

        console.log("Bear bet placed:", callsId);
        return callsId;
      } catch (error) {
        console.error("Failed to place bear bet:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, address, chainId],
  );

  // Claim rewards
  const claimRewards = useCallback(
    async (epochs: bigint[]) => {
      if (!sdk || !address) throw new Error("Wallet not connected");

      setIsLoading(true);
      try {
        const provider = sdk.getProvider();

        const callsId = await provider.request({
          method: "wallet_sendCalls",
          params: [
            {
              version: "2.0",
              chainId: `0x${chainId.toString(16)}`,
              from: address,
              calls: [
                {
                  to: CONTRACT_ADDRESS,
                  data: encodeFunctionData({
                    abi: PREDICTION_ABI,
                    functionName: "claim",
                    args: [epochs, address as `0x${string}`],
                  }),
                },
              ],
            },
          ],
        });

        console.log("Rewards claimed:", callsId);
        return callsId;
      } catch (error) {
        console.error("Failed to claim rewards:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, address, chainId],
  );

  // Check if claimable
  const isClaimable = useCallback(
    async (epoch: bigint, userAddress: string): Promise<boolean> => {
      if (!sdk) return false;

      try {
        const provider = sdk.getProvider();
        const result = (await provider.request({
          method: "eth_call",
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: encodeFunctionData({
                abi: PREDICTION_ABI,
                functionName: "claimable",
                args: [epoch, userAddress as `0x${string}`],
              }),
            },
            "latest",
          ],
        })) as string;

        return (
          result ===
          "0x0000000000000000000000000000000000000000000000000000000000000001"
        );
      } catch (error) {
        console.error("Failed to check claimable:", error);
        return false;
      }
    },
    [sdk],
  );

  // Auto-refresh current epoch
  useEffect(() => {
    if (isConnected) {
      fetchCurrentEpoch();
      const interval = setInterval(fetchCurrentEpoch, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchCurrentEpoch]);

  return {
    currentEpoch,
    currentRound,
    userBet,
    isLoading,
    betBull,
    betBear,
    claimRewards,
    isClaimable,
    fetchCurrentEpoch,
    fetchRound,
    fetchUserBet,
  };
}
