"use client";

import { useRouter } from "next/navigation";

export default function ConnectWallet() {
  const router = useRouter();

  const handleConnectClick = () => {
    // Redirect to homepage when Connect Wallet is clicked
    router.push("/");
  };

  return (
    <button
      onClick={handleConnectClick}
      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
      type="button"
    >
      Connect Wallet
    </button>
  );
}
