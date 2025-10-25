export interface CryptoPrice {
  id: string;
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  image?: string;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Fallback prices in case API fails
const FALLBACK_PRICES: Record<string, CryptoPrice> = {
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    currentPrice: 67234.56,
    priceChange24h: 2.5,
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    currentPrice: 3456.78,
    priceChange24h: -1.2,
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    currentPrice: 142.34,
    priceChange24h: 5.8,
  },
  cardano: {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    currentPrice: 0.58,
    priceChange24h: -0.5,
  },
  'matic-network': {
    id: 'matic-network',
    name: 'Polygon',
    symbol: 'MATIC',
    currentPrice: 0.87,
    priceChange24h: 3.2,
  },
  ripple: {
    id: 'ripple',
    name: 'XRP',
    symbol: 'XRP',
    currentPrice: 0.52,
    priceChange24h: 1.8,
  },
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    currentPrice: 7.45,
    priceChange24h: -2.1,
  },
  avalanche: {
    id: 'avalanche-2',
    name: 'Avalanche',
    symbol: 'AVAX',
    currentPrice: 38.92,
    priceChange24h: 4.5,
  },
  chainlink: {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    currentPrice: 14.67,
    priceChange24h: 2.3,
  },
  'uniswap': {
    id: 'uniswap',
    name: 'Uniswap',
    symbol: 'UNI',
    currentPrice: 6.89,
    priceChange24h: -1.5,
  },
};

const CRYPTO_IDS = Object.keys(FALLBACK_PRICES);

export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${CRYPTO_IDS.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }

    const data = await response.json();

    return CRYPTO_IDS.map(id => {
      const fallback = FALLBACK_PRICES[id];
      const priceData = data[id];

      if (priceData) {
        return {
          id,
          name: fallback.name,
          symbol: fallback.symbol,
          currentPrice: priceData.usd,
          priceChange24h: priceData.usd_24h_change || 0,
        };
      }

      return fallback;
    });
  } catch (error) {
    console.warn('Failed to fetch crypto prices, using fallback data:', error);
    return Object.values(FALLBACK_PRICES);
  }
}

export function getRandomCryptos(count: number = 5): string[] {
  const shuffled = [...CRYPTO_IDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function simulatePriceChange(currentPrice: number, direction: 'up' | 'down'): number {
  // Simulate a realistic price change (0.1% to 2%)
  const changePercent = (Math.random() * 1.9 + 0.1) / 100;
  const multiplier = direction === 'up' ? (1 + changePercent) : (1 - changePercent);
  return currentPrice * multiplier;
}
