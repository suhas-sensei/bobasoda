import { ethers } from 'ethers';

const PYTH_ABI = [
  'function getPriceUnsafe(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)',
  'function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint publishTime)',
];

export interface PythPrice {
  price: number;
  expo: number;
  formattedPrice: number;
  confidence: number;
  publishTime: number;
}

// Fetch live ETH price from CoinGecko API (free, no API key needed)
export async function fetchPythETHPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from CoinGecko');
    }

    const data = await response.json();
    const price = data.ethereum.usd;

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 📊 Live ETH Price from CoinGecko:`, {
      price: price.toFixed(2),
      source: 'CoinGecko API'
    });

    return price;
  } catch (error) {
    console.error('Failed to fetch ETH price from CoinGecko:', error);

    // Fallback: Try Pyth oracle
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';
      const pythContract = process.env.NEXT_PUBLIC_PYTH_CONTRACT || '0x74f09cb3c7e2A01865f424FD14F6dc9A14E3e94E';
      const ethUsdPriceId = process.env.NEXT_PUBLIC_ETH_USD_PRICE_ID || '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const pyth = new ethers.Contract(pythContract, PYTH_ABI, provider);
      const priceData = await pyth.getPriceUnsafe(ethUsdPriceId);

      const price = Number(BigInt.asIntN(64, BigInt(priceData[0])));
      const expo = Number(BigInt.asIntN(32, BigInt(priceData[2])));
      const formattedPrice = price * Math.pow(10, expo);

      console.log('📊 Fallback: Using Pyth price (may be stale):', formattedPrice.toFixed(2));
      return formattedPrice;
    } catch (fallbackError) {
      console.error('Fallback Pyth price also failed:', fallbackError);
      return 3938.30;
    }
  }
}

export async function fetchDetailedPythPrice(priceId: string): Promise<PythPrice | null> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org';
    const pythContract = process.env.NEXT_PUBLIC_PYTH_CONTRACT || '0x74f09cb3c7e2A01865f424FD14F6dc9A14E3e94E';

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const pyth = new ethers.Contract(pythContract, PYTH_ABI, provider);

    const priceData = await pyth.getPriceUnsafe(priceId);

    // Convert BigInt to number properly
    const price = Number(BigInt.asIntN(64, BigInt(priceData[0])));
    const confidence = Number(BigInt(priceData[1]));
    const expo = Number(BigInt.asIntN(32, BigInt(priceData[2]))); // Signed int32
    const publishTime = Number(BigInt(priceData[3]));

    const formattedPrice = price * Math.pow(10, expo);

    return {
      price,
      expo,
      formattedPrice,
      confidence: confidence * Math.pow(10, expo),
      publishTime,
    };
  } catch (error) {
    console.error('Failed to fetch detailed Pyth price:', error);
    return null;
  }
}
