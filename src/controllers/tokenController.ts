import { Request, Response } from 'express';
import { z } from 'zod';
import { fetchTokenData } from '../services/coingeckoService';
import { generateInsight } from '../services/aiService';
import { TokenDataSource } from '../types';

const tokenInsightBodySchema = z.object({
  vs_currency: z.string().min(2).max(10).optional().default('usd'),
  history_days: z
    .union([
      z.number().int().min(1).max(365),
      z
        .string()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v, 10))
    ])
    .optional()
    .default(30)
});

export const getTokenInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const parseResult = tokenInsightBodySchema.safeParse(req.body ?? {});
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        issues: parseResult.error.format()
      });
      return;
    }

    const { vs_currency, history_days } = parseResult.data;

    const { tokenData, marketChart } = await fetchTokenData(id, vs_currency, history_days);

    const { insight, model } = await generateInsight(tokenData, marketChart);

    const response = {
      source: TokenDataSource.COINGECKO,
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


