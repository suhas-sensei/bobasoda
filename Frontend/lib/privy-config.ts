import type { PrivyClientConfig } from '@privy-io/react-auth';

export const celoSepoliaTestnet = {
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  network: 'celo-sepolia',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ankr.com/celo_sepolia'],
    },
    public: {
      http: ['https://rpc.ankr.com/celo_sepolia'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Explorer',
      url: 'https://explorer.celo.org/sepolia',
    },
  },
  testnet: true,
};

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
  defaultChain: celoSepoliaTestnet,
  supportedChains: [celoSepoliaTestnet],
  appearance: {
    theme: 'dark',
    accentColor: '#7645d9',
    logo: undefined,
  },
};
