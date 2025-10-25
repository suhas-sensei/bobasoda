import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CURRENT_CONTRACT_ADDRESS, NETWORK_CONFIG, CURRENT_NETWORK } from '../contracts/config';

const PREDICTION_ABI = [
  'function currentEpoch() view returns (uint256)',
  'function genesisStartOnce() view returns (bool)',
  'function genesisLockOnce() view returns (bool)',
  'function rounds(uint256) view returns (uint256 epoch, uint256 startTimestamp, uint256 lockTimestamp, uint256 closeTimestamp, int256 lockPrice, int256 closePrice, uint256 totalAmount, uint256 bullAmount, uint256 bearAmount, uint256 rewardBaseCalAmount, uint256 rewardAmount, bool oracleCalled)',
  'function ledger(uint256, address) view returns (uint8 position, uint256 amount, bool claimed)',
  'function claimable(uint256, address) view returns (bool)',
];

export interface RoundInfo {
  epoch: number;
  startTimestamp: number;
  lockTimestamp: number;
  closeTimestamp: number;
  lockPrice: string;
  closePrice: string;
  totalAmount: string;
  bullAmount: string;
  bearAmount: string;
  rewardBaseCalAmount: string;
  rewardAmount: string;
  oracleCalled: boolean;
}

export function useContractRounds() {
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<RoundInfo | null>(null);
  const [nextRound, setNextRound] = useState<RoundInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const rpcUrl = NETWORK_CONFIG[CURRENT_NETWORK].rpcUrl;
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(CURRENT_CONTRACT_ADDRESS, PREDICTION_ABI, provider);

        // Get current epoch
        const epoch = await contract.currentEpoch();
        const epochNum = Number(epoch);
        setCurrentEpoch(epochNum);

        if (epochNum === 0) {
          setIsLoading(false);
          return;
        }

        // Fetch current round (betting round)
        const current = await contract.rounds(epochNum);
        setCurrentRound({
          epoch: epochNum,
          startTimestamp: Number(current.startTimestamp),
          lockTimestamp: Number(current.lockTimestamp),
          closeTimestamp: Number(current.closeTimestamp),
          lockPrice: ethers.formatUnits(current.lockPrice, 8),
          closePrice: ethers.formatUnits(current.closePrice, 8),
          totalAmount: ethers.formatEther(current.totalAmount),
          bullAmount: ethers.formatEther(current.bullAmount),
          bearAmount: ethers.formatEther(current.bearAmount),
          rewardBaseCalAmount: ethers.formatEther(current.rewardBaseCalAmount),
          rewardAmount: ethers.formatEther(current.rewardAmount),
          oracleCalled: current.oracleCalled,
        });

        // Fetch next round if it exists
        if (epochNum > 0) {
          const next = await contract.rounds(epochNum + 1);
          if (Number(next.startTimestamp) > 0) {
            setNextRound({
              epoch: epochNum + 1,
              startTimestamp: Number(next.startTimestamp),
              lockTimestamp: Number(next.lockTimestamp),
              closeTimestamp: Number(next.closeTimestamp),
              lockPrice: ethers.formatUnits(next.lockPrice, 8),
              closePrice: ethers.formatUnits(next.closePrice, 8),
              totalAmount: ethers.formatEther(next.totalAmount),
              bullAmount: ethers.formatEther(next.bullAmount),
              bearAmount: ethers.formatEther(next.bearAmount),
              rewardBaseCalAmount: ethers.formatEther(next.rewardBaseCalAmount),
              rewardAmount: ethers.formatEther(next.rewardAmount),
              oracleCalled: next.oracleCalled,
            });
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching rounds:', error);
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchRounds();

    // Refresh every 5 seconds
    const interval = setInterval(fetchRounds, 5000);
    return () => clearInterval(interval);
  }, []);

  return { currentEpoch, currentRound, nextRound, isLoading };
}

export function useUserBet(epoch: number, userAddress?: string) {
  const [position, setPosition] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('0');
  const [claimed, setClaimed] = useState(false);
  const [isClaimable, setIsClaimable] = useState(false);

  useEffect(() => {
    if (!userAddress || epoch === 0) return;

    const fetchUserBet = async () => {
      try {
        const rpcUrl = NETWORK_CONFIG[CURRENT_NETWORK].rpcUrl;
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(CURRENT_CONTRACT_ADDRESS, PREDICTION_ABI, provider);

        const bet = await contract.ledger(epoch, userAddress);
        setPosition(Number(bet.position));
        setAmount(ethers.formatEther(bet.amount));
        setClaimed(bet.claimed);

        // Check if claimable
        if (Number(bet.amount) > 0 && !bet.claimed) {
          const canClaim = await contract.claimable(epoch, userAddress);
          setIsClaimable(canClaim);
        }
      } catch (error) {
        console.error('Error fetching user bet:', error);
      }
    };

    fetchUserBet();

    // Refresh every 10 seconds
    const interval = setInterval(fetchUserBet, 10000);
    return () => clearInterval(interval);
  }, [epoch, userAddress]);

  return { position, amount, claimed, isClaimable };
}
