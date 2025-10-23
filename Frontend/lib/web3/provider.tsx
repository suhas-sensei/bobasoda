'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import { CURRENT_CONTRACT_ADDRESS, NETWORK_CONFIG, CURRENT_NETWORK } from '../contracts/config';
import PancakePredictionV2ABI from '../contracts/PancakePredictionV2.json';

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  contract: Contract | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: number | null;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  contract: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  chainId: null,
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Ensure client-side only
  useEffect(() => {
    setMounted(true);
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window === 'undefined') {
        console.error('Window is undefined - cannot connect wallet');
        return;
      }

      const ethereum = (window as any).ethereum;

      if (!ethereum) {
        alert('Please install MetaMask or another Web3 wallet to use this app');
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      // Request account access
      const browserProvider = new BrowserProvider(ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        alert('No accounts found. Please unlock your wallet.');
        return;
      }

      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      const walletSigner = await browserProvider.getSigner();
      setSigner(walletSigner);

      // Initialize contract - check if address is set
      if (CURRENT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('⚠️ Contract address not set. Please deploy the contract and update lib/contracts/config.ts');
        alert('Warning: Contract not deployed yet. Some features may not work.');
        // Still set a contract instance for development, but it won't work
      }

      const predictionContract = new Contract(
        CURRENT_CONTRACT_ADDRESS,
        PancakePredictionV2ABI,
        walletSigner
      );
      setContract(predictionContract);

      // Check if on correct network
      const targetChainId = NETWORK_CONFIG[CURRENT_NETWORK].chainId;
      if (Number(network.chainId) !== targetChainId) {
        console.log(`Switching to ${NETWORK_CONFIG[CURRENT_NETWORK].name}...`);
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${targetChainId.toString(16)}` }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: NETWORK_CONFIG[CURRENT_NETWORK].name,
                  rpcUrls: [NETWORK_CONFIG[CURRENT_NETWORK].rpcUrl],
                  nativeCurrency: NETWORK_CONFIG[CURRENT_NETWORK].nativeCurrency,
                  blockExplorerUrls: [NETWORK_CONFIG[CURRENT_NETWORK].blockExplorer],
                }],
              });
            } catch (addError) {
              console.error('Error adding network:', addError);
              alert('Failed to add network. Please add it manually in your wallet settings.');
            }
          } else {
            console.error('Error switching network:', switchError);
            alert(`Please switch to ${NETWORK_CONFIG[CURRENT_NETWORK].name} in your wallet.`);
          }
        }
      }

      console.log('✅ Wallet connected successfully:', accounts[0]);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);

      if (error.code === 4001) {
        alert('Connection request rejected. Please try again.');
      } else if (error.code === -32002) {
        alert('A connection request is already pending. Please check your wallet.');
      } else {
        alert(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContract(null);
    setChainId(null);
  };

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [mounted]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Web3Context.Provider
        value={{
          provider: null,
          signer: null,
          account: null,
          contract: null,
          isConnected: false,
          connectWallet: async () => {},
          disconnectWallet: () => {},
          chainId: null,
        }}
      >
        {children}
      </Web3Context.Provider>
    );
  }

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        contract,
        isConnected: !!account,
        connectWallet,
        disconnectWallet,
        chainId,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
