import axios from 'axios';
import { env } from '../config/env';
import { FetchTokenDataResult, TokenData } from '../types';

const COINGECKO_API_URL = env.COINGECKO_API_URL;

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
    const currencyKey = vsCurrency.toLowerCase();
    const tokenData: TokenData = {
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      marketData: {
        currentPrice:
          marketData.current_price?.[currencyKey] ??
          marketData.current_price?.usd ??
          0,
        marketCap:
          marketData.market_cap?.[currencyKey] ??
          marketData.market_cap?.usd ??
          0,
        totalVolume:
          marketData.total_volume?.[currencyKey] ??
          marketData.total_volume?.usd ??
          0,
        priceChangePercentage24h: marketData.price_change_percentage_24h || 0,
        vsCurrency
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


