import axios from 'axios';
import { TokenMarketData } from '../models/TokenInsight';

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  marketData: TokenMarketData;
}

export interface FetchTokenDataResult {
  tokenData: TokenData;
  marketChart: any | null;
  rawData: any;
}

export const fetchTokenData = async (
  tokenId: string,
  vsCurrency = 'usd',
  historyDays = 30
): Promise<FetchTokenDataResult> => {
  try {
    const tokenResponse = await axios.get(`${COINGECKO_API_URL}/coins/${tokenId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      },
      timeout: 10000
    });

    const token = tokenResponse.data;

    let marketChart: any | null = null;
    try {
      const chartResponse = await axios.get(
        `${COINGECKO_API_URL}/coins/${tokenId}/market_chart`,
        {
          params: {
            vs_currency: vsCurrency,
            days: historyDays
          },
          timeout: 10000
        }
      );
      marketChart = chartResponse.data;
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(`Could not fetch market chart for ${tokenId}:`, error.message);
    }

    const marketData = token.market_data || {};
    const tokenData: TokenData = {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      marketData: {
        currentPriceUsd: marketData.current_price?.usd || 0,
        marketCapUsd: marketData.market_cap?.usd || 0,
        totalVolumeUsd: marketData.total_volume?.usd || 0,
        priceChangePercentage24h: marketData.price_change_percentage_24h || 0
      }
    };

    return {
      tokenData,
      marketChart,
      rawData: token
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Token '${tokenId}' not found on CoinGecko`);
    }
    throw new Error(`Failed to fetch token data: ${error.message}`);
  }
};

export default {
  fetchTokenData
};


