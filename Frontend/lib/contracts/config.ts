// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  baseSepolia: '0x93b07e384dA57399AF517C6492840CA8d70BD11A', // Deployed on Base Sepolia (TEST MODE - 5min intervals)
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
  intervalSeconds: 300, // 5 minutes for betting
  resolveSeconds: 600, // 10 minutes total (betting + resolution)
  minBetAmount: '0.001', // in ETH
  chainlinkOracleAddress: '0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1', // ETH/USD on Base Sepolia
} as const;

export const CURRENT_NETWORK = 'baseSepolia' as const;
export const CURRENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[CURRENT_NETWORK];
