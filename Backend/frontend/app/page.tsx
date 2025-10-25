import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Phone screen container */}
      <div className="relative w-full max-w-[550px] h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] shadow-2xl overflow-y-auto">
        <main className="flex flex-col items-center justify-center p-8 pb-32 min-h-screen">
          <div className="w-full text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">Boba Soda</h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Predict price movements and compete with others in decentralized
          prediction markets.
        </p>

        <div className="flex gap-4 justify-center flex-wrap mt-12">
          <Link
            href="/prediction"
            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 transition-colors"
          >
            View Markets
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Decentralized</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Built on smart contracts for transparent and trustless predictions
            </p>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Real-time</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Live price feeds and instant settlement of prediction rounds
            </p>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold mb-2">Competitive</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Compete with others and earn rewards for accurate predictions
            </p>
          </div>
        </div>
        </div>
        </main>

        {/* Bottom Navbar */}
        <div className="absolute bottom-6 left-0 right-0 px-6 z-50">
          <div className="w-full max-w-md mx-auto">
            {/* Navbar Image */}
            <div className="relative w-full h-20 flex items-center justify-center">
              <Image
                src="/image.png"
                alt="Navigation Bar"
                width={500}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
