import { OpenAI } from 'openai';
import { TokenData } from '@services/coingeckoService';
import { env } from '@config/env';

export interface InsightResult {
  insight: {
    reasoning: string;
    sentiment: string;
    [key: string]: any;
  };
  model: {
    provider: string;
    model: string;
  };
}

export const generateInsight = async (
  tokenData: TokenData,
  marketChart: any | null = null
): Promise<InsightResult> => {
  if (process.env.OPENAI_API_KEY) {
    return await generateOpenAIInsight(tokenData, marketChart);
  }
  return generateFallbackInsight(tokenData);
};

const generateOpenAIInsight = async (
  tokenData: TokenData,
  marketChart: any | null
): Promise<InsightResult> => {
  try {
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    const prompt = buildPrompt(tokenData, marketChart);

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a cryptocurrency market analyst. Provide insights in valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(content);

    return {
      insight: {
        reasoning: parsed.reasoning || 'Analysis based on current market data',
        sentiment: parsed.sentiment || 'Neutral',
        ...parsed
      },
      model: {
        provider: 'openai',
        model: env.OPENAI_MODEL
      }
    };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('OpenAI API error while generating insight:', error.message);
    return generateFallbackInsight(tokenData);
  }
};

const buildPrompt = (tokenData: TokenData, marketChart: any | null): string => {
  const { name, symbol, marketData } = tokenData;
  const priceChange = marketData.priceChangePercentage24h;
  const currency = marketData.vsCurrency.toUpperCase();

  let prompt = `Analyze the following cryptocurrency token and provide insights in JSON format with "reasoning" and "sentiment" fields:

Token: ${name} (${symbol.toUpperCase()})
Current Price: ${marketData.currentPrice} ${currency}
Market Cap: ${marketData.marketCap.toLocaleString()} ${currency}
24h Volume: ${marketData.totalVolume.toLocaleString()} ${currency}
24h Price Change: ${priceChange > 0 ? '+' : ''}${priceChange}%

`;

  if (marketChart && marketChart.prices) {
    const prices: [number, number][] = marketChart.prices;
    const firstPrice = prices[0]?.[1] || marketData.currentPrice;
    const lastPrice = prices[prices.length - 1]?.[1] || marketData.currentPrice;
    const periodChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    prompt += `Historical Trend (${prices.length} days): ${
      periodChange > 0 ? '+' : ''
    }${periodChange.toFixed(2)}%\n\n`;
  }

  prompt += `Provide a brief reasoning (2-3 sentences) and sentiment (Positive, Neutral, or Negative) in JSON format:
{
  "reasoning": "...",
  "sentiment": "..."
}`;

  return prompt;
};

const generateFallbackInsight = (tokenData: TokenData): InsightResult => {
  const { marketData } = tokenData;
  const priceChange = marketData.priceChangePercentage24h || 0;
  const volume = marketData.totalVolume || 0;
  const marketCap = marketData.marketCap || 0;

  let sentiment = 'Neutral';
  let reasoning = '';

  if (priceChange > 5) {
    sentiment = 'Positive';
    reasoning = `Strong positive momentum with ${priceChange.toFixed(
      2
    )}% gain in 24h. High trading volume of $${volume.toLocaleString()} suggests active interest.`;
  } else if (priceChange < -5) {
    sentiment = 'Negative';
    reasoning = `Significant decline of ${Math.abs(
      priceChange
    ).toFixed(2)}% in 24h. Monitor for potential support levels and decreasing liquidity.`;
  } else {
    sentiment = 'Neutral';
    reasoning = `Price movement is relatively stable with ${
      priceChange > 0 ? '+' : ''
    }${priceChange.toFixed(
      2
    )}% change. Market cap of $${(marketCap / 1e9).toFixed(
      2
    )}B indicates ${marketCap > 1e9 ? 'substantial' : 'moderate'} market presence.`;
  }

  return {
    insight: {
      reasoning,
      sentiment
    },
    model: {
      provider: 'rule-based',
      model: 'fallback'
    }
  };
};

export default {
  generateInsight
};


