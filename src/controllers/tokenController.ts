import { Request, Response } from 'express';
import { fetchTokenData } from '@services/coingeckoService';
import { generateInsight } from '@services/aiService';
import TokenInsight from '@models/TokenInsight';
import { env } from '@config/env';

export const getTokenInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { vs_currency = 'usd', history_days = 30 } = (req.body || {}) as {
      vs_currency?: string;
      history_days?: number;
    };

    const { tokenData, marketChart } = await fetchTokenData(id, vs_currency, history_days);

    const { insight, model } = await generateInsight(tokenData, marketChart);

    const response = {
      source: 'coingecko',
      token: {
        id: tokenData.id,
        symbol: tokenData.symbol,
        name: tokenData.name,
        market_data: {
          current_price: tokenData.marketData.currentPrice,
          market_cap: tokenData.marketData.marketCap,
          total_volume: tokenData.marketData.totalVolume,
          price_change_percentage_24h: tokenData.marketData.priceChangePercentage24h
        },
        vs_currency: tokenData.marketData.vsCurrency
      },
      insight: {
        reasoning: insight.reasoning,
        sentiment: insight.sentiment
      },
      model: {
        provider: model.provider,
        model: model.model
      }
    };

    if (env.NODE_ENV !== 'test') {
      try {
        await TokenInsight.create({
          tokenId: id,
          vsCurrency: vs_currency,
          historyDays: history_days,
          tokenData: {
            id: tokenData.id,
            symbol: tokenData.symbol,
            name: tokenData.name,
            marketData: tokenData.marketData
          },
          insight,
          modelInfo: {
            provider: model.provider,
            model: model.model
          }
        });
      } catch (dbError: any) {
        console.warn('Failed to save to database:', dbError.message);
      }
    }

    res.json(response);
  } catch (error: any) {
    console.error('Error in getTokenInsight:', error);
    res.status(500).json({
      error: 'Failed to fetch token insight',
      message: error.message
    });
  }
};

export default {
  getTokenInsight
};


