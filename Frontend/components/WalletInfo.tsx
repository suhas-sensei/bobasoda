'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export function WalletInfo() {
  const { user, logout } = usePrivy();
  const { address } = useAccount();
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="text-white">
      <div className="text-xs font-bold text-[#b8add2] mb-1">
        {user?.email?.address ? '📧 Email Login' : 'Connected'}
      </div>

      {/* Wallet Address */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFullAddress(!showFullAddress)}
          className="text-sm font-black truncate max-w-[150px] hover:text-[#7645d9] transition-colors"
        >
          {showFullAddress
            ? address
            : `${address?.slice(0, 6)}...${address?.slice(-4)}`
          }
        </button>

        {/* Copy Button */}
        <button
          onClick={copyAddress}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          title="Copy address"
        >
          {copied ? (
            <span className="text-[#31d0aa] text-xs">✓</span>
          ) : (
            <span className="text-[#b8add2] text-xs">📋</span>
          )}
        </button>
      </div>

      {/* Email if logged in via email */}
      {user?.email?.address && (
        <div className="text-[10px] text-[#b8add2] mt-1 truncate max-w-[180px]">
          {user.email.address}
        </div>
      )}

      {/* Logout button (small) */}
      <button
        onClick={logout}
        className="text-[10px] text-[#ed4b9e] hover:text-[#ff6bb5] mt-1 font-bold"
      >
        Disconnect
      </button>
    </div>
  );
}
