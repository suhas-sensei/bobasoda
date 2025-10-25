'use client';

import { useRouter } from 'next/navigation';

export function LoginScreen() {
  const router = useRouter();

  const handleConnectClick = () => {
    // Redirect to homepage when Connect Wallet is clicked
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative">
      {/* Background gradient for desktop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Phone screen container */}
      <div className="relative w-full max-w-[550px] h-screen overflow-hidden shadow-2xl">
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

        {/* Overlay for darkening video */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Glassmorphic Login Card */}
        <div className="relative z-10 h-full flex items-center justify-center px-4">
        {/* Glass container with blur effect */}
        <div className="relative backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Gradient overlay for glass effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {/* Logo/Title */}
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-white drop-shadow-lg">
                Prediction Reels
              </h1>
              <p className="text-white/90 text-lg font-semibold drop-shadow">
                Fast-Paced Crypto Predictions
              </p>
            </div>

            {/* Description */}
            <p className="text-white/80 text-sm font-medium">
              Start predicting crypto price movements
            </p>

            {/* Connect Button Container with Glass Effect */}
            <div className="pt-4">
              <div className="backdrop-blur-xl bg-white/5 border border-white/30 rounded-2xl p-1 inline-block shadow-xl">
                <button
                  onClick={handleConnectClick}
                  type="button"
                  className="px-12 py-4 bg-gradient-to-r from-[#7645d9] to-[#9d4edd] hover:from-[#633bb5] hover:to-[#8438c9] text-white rounded-xl font-black text-lg transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
                >
                  Connect Wallet
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-4 text-white/70 text-xs space-y-1">
              <p>Powered by Celo Network</p>
              <p className="text-white/50">Swipe. Predict. Win.</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
