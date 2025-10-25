// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  baseSepolia: '0xFbdcDBc17Fd692B4D4b0c73AC50c0c9A7a6e0C71', // Deployed on Base Sepolia (Pyth - 20s intervals, no notContract modifier)
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
  intervalSeconds: 20, // 20 seconds for betting
  resolveSeconds: 40, // 40 seconds total (betting + resolution)
  minBetAmount: '0.001', // in ETH
  pythOracleAddress: '0xA2aa501b19aff244D90cc15a4Cf739D2725B5729', // Pyth on Base Sepolia
  pythPriceId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
} as const;

export const CURRENT_NETWORK = 'baseSepolia' as const;
export const CURRENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[CURRENT_NETWORK];
