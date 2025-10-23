"use client";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import type { ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
import { WalletProvider } from "../contexts/WalletContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      chain={baseSepolia}
      config={{
        appearance: {
          name: "Prediction Market",
          theme: "dark",
        },
        wallet: {
          display: "modal",
          preference: "smartWalletOnly",
        },
      }}
    >
      <WalletProvider>{children}</WalletProvider>
    </OnchainKitProvider>
  );
}
