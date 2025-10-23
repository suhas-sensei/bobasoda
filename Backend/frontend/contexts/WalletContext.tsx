"use client";

import { createBaseAccountSDK } from "@base-org/account";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { base, baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";

type Network = "mainnet" | "sepolia";
type BaseAccountSDK = ReturnType<typeof createBaseAccountSDK>;

interface WalletContextType {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sdk: BaseAccountSDK | null;
  network: Network;
  switchNetwork: (network: Network) => Promise<void>;
  chainId: number;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const account = useAccount();
  const [sdk, setSdk] = useState<BaseAccountSDK | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>("sepolia");
  const [chainId, setChainId] = useState<number>(baseSepolia.id);

  // Initialize SDK when account connects
  useEffect(() => {
    if (account.isConnected && account.address) {
      const baseAccountSDK = createBaseAccountSDK({
        appName: "EggCake Prediction",
        appLogoUrl: "https://eggcake.app/logo.png",
        appChainIds: [base.id, baseSepolia.id],
        preference: {
          telemetry: false,
        },
        subAccounts: {
          creation: "on-connect",
          defaultAccount: "sub",
          funding: "spend-permissions",
        },
      });
      setSdk(baseAccountSDK);

      // Detect network from chain ID
      if (account.chainId === base.id) {
        setNetwork("mainnet");
      } else {
        setNetwork("sepolia");
      }

      // Fetch balance
      if (account.address) {
        const provider = baseAccountSDK.getProvider();
        provider
          .request({
            method: "eth_getBalance",
            params: [account.address, "latest"],
          })
          .then((balanceHex) => {
            const balanceWei = BigInt(balanceHex as string);
            const balanceEth = Number(balanceWei) / 1e18;
            setBalance(balanceEth.toFixed(4));
          })
          .catch(console.error);
      }
    } else {
      setSdk(null);
      setBalance(null);
    }
  }, [account.isConnected, account.address, account.chainId]);

  const connect = useCallback(async () => {
    // Connection is handled by OnchainKit's Wallet component
    console.log("Connect is handled by OnchainKit Wallet component");
  }, []);

  const disconnect = useCallback(() => {
    // Disconnect is handled by OnchainKit's Wallet component
    console.log("Disconnect is handled by OnchainKit Wallet component");
    setSdk(null);
    setBalance(null);
  }, []);

  const switchNetwork = useCallback(
    async (newNetwork: Network) => {
      if (!sdk) return;

      const targetChainId = newNetwork === "mainnet" ? base.id : baseSepolia.id;
      const targetChainIdHex = `0x${targetChainId.toString(16)}`;

      try {
        const provider = sdk.getProvider();

        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainIdHex }],
        });

        setNetwork(newNetwork);

        // Refresh balance after switch
        if (account.address) {
          const balanceHex = (await provider.request({
            method: "eth_getBalance",
            params: [account.address, "latest"],
          })) as string;

          const balanceWei = BigInt(balanceHex);
          const balanceEth = Number(balanceWei) / 1e18;
          setBalance(balanceEth.toFixed(4));
        }
      } catch (error) {
        console.error("Failed to switch network:", error);
      }
    },
    [sdk, account.address],
  );

  return (
    <WalletContext.Provider
      value={{
        address: account.address || null,
        balance,
        isConnected: account.isConnected,
        connect,
        disconnect,
        sdk,
        network,
        switchNetwork,
        chainId: account.chainId || baseSepolia.id,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
