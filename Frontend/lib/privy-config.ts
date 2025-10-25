import type { PrivyClientConfig } from '@privy-io/react-auth';

export const celoAlfajoresTestnet = {
  id: 44787,
  name: 'Celo Alfajores Testnet',
  network: 'celo-alfajores',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://alfajores-forno.celo-testnet.org'],
    },
    public: {
      http: ['https://alfajores-forno.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Explorer',
      url: 'https://alfajores.celoscan.io',
    },
  },
  testnet: true,
};

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'all-users',
  },
  loginMethods: ['email', 'wallet'], // Only email and wallet - Google not enabled in dashboard
  defaultChain: celoAlfajoresTestnet,
  supportedChains: [celoAlfajoresTestnet],
  appearance: {
    theme: 'dark',
    accentColor: '#7645d9',
    logo: undefined,
    walletList: ['coinbase_wallet', 'metamask'],
  },
};
