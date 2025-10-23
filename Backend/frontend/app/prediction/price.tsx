import { createPublicClient, formatUnits, http } from "viem";
import { baseSepolia } from "viem/chains";

// AggregatorV3Interface ABI
const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "roundId", type: "uint80" }],
    name: "getRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ETH/USD Chainlink Oracle on Base Sepolia
const ETH_USD_ORACLE = "0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

export interface PriceData {
  roundId: bigint;
  price: number;
  timestamp: number;
}

export async function getLatestPrice(): Promise<PriceData> {
  const data = await publicClient.readContract({
    address: ETH_USD_ORACLE,
    abi: AGGREGATOR_V3_ABI,
    functionName: "latestRoundData",
  });

  const [roundId, answer, , updatedAt] = data;
  const price = Number(formatUnits(BigInt(answer), 8));

  return {
    roundId,
    price,
    timestamp: Number(updatedAt) * 1000, // Convert to milliseconds
  };
}

export async function getHistoricalPrices(
  rounds: number = 100,
): Promise<PriceData[]> {
  const latest = await publicClient.readContract({
    address: ETH_USD_ORACLE,
    abi: AGGREGATOR_V3_ABI,
    functionName: "latestRoundData",
  });

  const latestRoundId = latest[0];
  const prices: PriceData[] = [];

  // Fetch last N rounds
  for (let i = 0; i < rounds; i++) {
    const roundId = latestRoundId - BigInt(i);

    try {
      const data = await publicClient.readContract({
        address: ETH_USD_ORACLE,
        abi: AGGREGATOR_V3_ABI,
        functionName: "getRoundData",
        args: [roundId],
      });

      const [id, answer, , updatedAt] = data;

      // Skip invalid rounds (updatedAt = 0)
      if (updatedAt === BigInt(0)) continue;

      prices.push({
        roundId: id,
        price: Number(formatUnits(BigInt(answer), 8)),
        timestamp: Number(updatedAt) * 1000,
      });
    } catch (error) {}
  }

  return prices.reverse(); // Return oldest to newest
}
