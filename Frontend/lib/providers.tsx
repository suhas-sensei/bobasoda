'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { privyConfig, celoSepoliaTestnet } from './privy-config';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { ReactNode } from 'react';
import { defineChain } from 'viem';

const queryClient = new QueryClient();

// Define Celo Sepolia as a proper viem chain
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: {
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
});

export const wagmiConfig = createConfig({
  chains: [celoSepolia],
  transports: {
    [celoSepolia.id]: http('https://rpc.ankr.com/celo_sepolia'),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  // If no app ID is set, show error message
  if (!appId) {
    return (
      <div className="min-h-screen bg-[#08060b] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Configuration Required</h1>
          <p className="text-[#b8add2] mb-2">Please set your Privy App ID in the .env.local file</p>
          <p className="text-[#b8add2] text-sm">Get your App ID from https://dashboard.privy.io/</p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
