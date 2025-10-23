"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "../contexts/WalletContext";

export default function ConnectWallet() {
  const {
    address,
    balance,
    isConnected,
    connect,
    disconnect,
    network,
    switchNetwork,
    chainId,
  } = useWallet();
  const [showFundingOptions, setShowFundingOptions] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getNetworkName = () => {
    return network === "mainnet" ? "Base Mainnet" : "Base Sepolia";
  };

  const getNetworkColor = () => {
    return network === "mainnet" ? "bg-green-500" : "bg-yellow-500";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowFundingOptions(false);
      }
    };

    if (showFundingOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFundingOptions]);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCoinbaseOnramp = () => {
    // Open Coinbase Onramp
    const onrampURL = `https://pay.coinbase.com/buy/select-asset?appId=your-app-id&addresses={"${address}":["base"]}&assets=["ETH","USDC"]`;
    window.open(onrampURL, "_blank", "width=460,height=730");
    setShowFundingOptions(false);
  };

  const handleOpenCoinbaseWallet = () => {
    // Open Coinbase Wallet app to funding section
    window.open("https://go.cb-w.com/funding", "_blank");
    setShowFundingOptions(false);
  };

  if (isConnected && address && balance) {
    return (
      <div ref={dropdownRef} className="relative flex items-center gap-3">
        {/* Network Badge */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
          <div
            className={`w-2 h-2 rounded-full ${getNetworkColor()} animate-pulse`}
          ></div>
          <span className="text-xs text-gray-300 font-medium">
            {getNetworkName()}
          </span>
          <button
            onClick={() =>
              switchNetwork(network === "mainnet" ? "sepolia" : "mainnet")
            }
            className="ml-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            title="Switch network"
          >
            ⇄
          </button>
        </div>

        {/* Wallet Info */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 border border-gray-700">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Universal Account:</span>
              <button
                onClick={handleCopyAddress}
                className="text-xs text-gray-300 hover:text-white font-mono transition-colors flex items-center gap-1"
                title="Click to copy address"
              >
                {address}
                <span className="text-gray-500 hover:text-gray-300">
                  {copied ? "✓" : "📋"}
                </span>
              </button>
            </div>
            <span className="text-sm font-semibold text-white">
              Balance: {balance} ETH
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowFundingOptions(!showFundingOptions)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          type="button"
        >
          Add Funds
        </button>

        {showFundingOptions && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
            <button
              onClick={handleCoinbaseOnramp}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700"
              type="button"
            >
              <div className="text-white font-medium text-sm">
                Coinbase Onramp
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Buy crypto with card or bank
              </div>
            </button>
            <button
              onClick={handleOpenCoinbaseWallet}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors"
              type="button"
            >
              <div className="text-white font-medium text-sm">
                Open Coinbase Wallet
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Fund via Coinbase app
              </div>
            </button>
          </div>
        )}

        <button
          onClick={disconnect}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          type="button"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
      type="button"
    >
      Connect Wallet
    </button>
  );
}
