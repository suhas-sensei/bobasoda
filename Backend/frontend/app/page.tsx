import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full text-center space-y-8">
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
      </main>
    </div>
  );
}
