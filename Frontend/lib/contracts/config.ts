// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  baseSepolia: '0x0000000000000000000000000000000000000000', // Not deployed on Base Sepolia
  celoTestnet: '0x93b07e384dA57399AF517C6492840CA8d70BD11A', // Celo Alfajores (Pyth - 30s intervals)
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
  baseSepolia: {
    intervalSeconds: 30, // 30 seconds per round
    lockSeconds: 25, // Lock price at 25 seconds
    resolveSeconds: 30, // Resolve at 30 seconds
    minBetAmount: '0.001', // in ETH
    pythOracleAddress: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729', // Pyth on Base Sepolia
  },
  celoTestnet: {
    intervalSeconds: 30, // 30 seconds per round
    lockSeconds: 25, // Lock price at 25 seconds
    resolveSeconds: 30, // Resolve at 30 seconds
    minBetAmount: '0.001', // in CELO
    pythOracleAddress: '0x74f09cb3c7e2A01865f424FD14F6dc9A14E3e94E', // Pyth on Celo Alfajores
  },
} as const;

export const CURRENT_NETWORK = 'celoTestnet' as const;
export const CURRENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[CURRENT_NETWORK];
