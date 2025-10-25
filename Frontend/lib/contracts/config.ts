// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  baseSepolia: '0x2193622E5797C9D4C6cD8b486814453F4b2530B4', // Deployed on Base Sepolia (Pyth - 30s intervals)
  celoTestnet: '0x0000000000000000000000000000000000000000', // Celo Testnet
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
  celoTestnet: {
    chainId: 44787,
    name: 'Celo Alfajores Testnet',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    blockExplorer: 'https://explorer.celo.org/alfajores',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
  },
} as const;

// Contract configuration
export const PREDICTION_CONFIG = {
  intervalSeconds: 30, // 30 seconds per round
  lockSeconds: 25, // Lock price at 25 seconds
  resolveSeconds: 30, // Resolve at 30 seconds
  minBetAmount: '0.001', // in ETH
  pythOracleAddress: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729', // Pyth on Base Sepolia
} as const;

export const CURRENT_NETWORK = 'baseSepolia' as const;
export const CURRENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[CURRENT_NETWORK];
