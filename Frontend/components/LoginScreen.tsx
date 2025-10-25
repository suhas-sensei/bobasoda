'use client';

import { usePrivy } from '@privy-io/react-auth';

export function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/login.mp4" type="video/mp4" />
      </video>

      {/* Overlay for slight darkening */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Glassmorphic Connect Button at Bottom */}
      <div className="absolute bottom-[20%] left-0 right-0 z-10 flex justify-center px-4">
        <button
          onClick={login}
          type="button"
          className="w-full max-w-md px-16 py-5 backdrop-blur-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105 active:scale-95"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
