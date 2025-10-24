// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  baseSepolia: '0x2193622E5797C9D4C6cD8b486814453F4b2530B4', // Deployed on Base Sepolia (Pyth - 60s intervals)
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

// Contract configuration
export const PREDICTION_CONFIG = {
  intervalSeconds: 60, // 60 seconds for betting
  resolveSeconds: 120, // 2 minutes total (betting + resolution)
  minBetAmount: '0.001', // in ETH
  chainlinkOracleAddress: '0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1', // ETH/USD on Base Sepolia
} as const;

export const CURRENT_NETWORK = 'baseSepolia' as const;
export const CURRENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[CURRENT_NETWORK];
