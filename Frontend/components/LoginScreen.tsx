'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function LoginScreen() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
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
      <div className="relative z-10 w-full max-w-md mx-4">
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
              Connect your wallet to start predicting crypto price movements
            </p>

            {/* Connect Button Container with Glass Effect */}
            <div className="pt-4">
              <div className="backdrop-blur-xl bg-white/5 border border-white/30 rounded-2xl p-1 inline-block shadow-xl">
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                  }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: {
                            opacity: 0,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                type="button"
                                className="px-12 py-4 bg-gradient-to-r from-[#7645d9] to-[#9d4edd] hover:from-[#633bb5] hover:to-[#8438c9] text-white rounded-xl font-black text-lg transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
                              >
                                Connect Wallet
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="px-12 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-black text-lg transition-all duration-300 shadow-2xl"
                              >
                                Wrong network
                              </button>
                            );
                          }

                          return (
                            <div className="flex gap-3">
                              <button
                                onClick={openChainModal}
                                type="button"
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl font-bold transition-all duration-300"
                              >
                                {chain.hasIcon && (
                                  <div
                                    style={{
                                      background: chain.iconBackground,
                                      width: 24,
                                      height: 24,
                                      borderRadius: 999,
                                      overflow: 'hidden',
                                      marginRight: 8,
                                      display: 'inline-block',
                                    }}
                                  >
                                    {chain.iconUrl && (
                                      <img
                                        alt={chain.name ?? 'Chain icon'}
                                        src={chain.iconUrl}
                                        style={{ width: 24, height: 24 }}
                                      />
                                    )}
                                  </div>
                                )}
                                {chain.name}
                              </button>

                              <button
                                onClick={openAccountModal}
                                type="button"
                                className="px-6 py-3 bg-gradient-to-r from-[#7645d9] to-[#9d4edd] hover:from-[#633bb5] hover:to-[#8438c9] text-white rounded-xl font-bold transition-all duration-300"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-4 text-white/70 text-xs space-y-1">
              <p>Powered by Celo Network</p>
              <p className="text-white/50">Swipe. Predict. Win.</p>
            </div>
          </div>
        </div>

        {/* Bottom glow effect */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
