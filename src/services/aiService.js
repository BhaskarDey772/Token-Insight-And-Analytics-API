const { OpenAI } = require('openai');
const axios = require('axios');

/**
 * Generate AI insight for token data
 */
const generateInsight = async (tokenData, marketChart = null) => {
  // Check if OpenAI API key is available
  if (process.env.OPENAI_API_KEY) {
    return await generateOpenAIInsight(tokenData, marketChart);
  } else if (process.env.HUGGINGFACE_API_KEY) {
    return await generateHuggingFaceInsight(tokenData, marketChart);
  } else {
    // Fallback to a simple rule-based insight if no AI service is configured
    return generateFallbackInsight(tokenData);
  }
};

/**
 * Generate insight using OpenAI
 */
const generateOpenAIInsight = async (tokenData, marketChart) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildPrompt(tokenData, marketChart);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a cryptocurrency market analyst. Provide insights in valid JSON format only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    const insight = JSON.parse(content);

    return {
      insight: {
        reasoning: insight.reasoning || 'Analysis based on current market data',
        sentiment: insight.sentiment || 'Neutral',
        ...insight,
      },
      model: {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      },
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    // Fallback to rule-based insight
    return generateFallbackInsight(tokenData);
  }
};

/**
 * Generate insight using Hugging Face
 */
const generateHuggingFaceInsight = async (tokenData, marketChart) => {
  try {
    const prompt = buildPrompt(tokenData, marketChart);

    // Using Hugging Face Inference API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    // Hugging Face returns different format, so we'll parse it
    // For now, fallback to rule-based
    return generateFallbackInsight(tokenData);
  } catch (error) {
    console.error('Hugging Face API error:', error.message);
    return generateFallbackInsight(tokenData);
  }
};

/**
 * Build structured prompt for AI
 */
const buildPrompt = (tokenData, marketChart) => {
  const { name, symbol, marketData } = tokenData;
  const priceChange = marketData.priceChangePercentage24h;

  let prompt = `Analyze the following cryptocurrency token and provide insights in JSON format with "reasoning" and "sentiment" fields:

Token: ${name} (${symbol.toUpperCase()})
Current Price: $${marketData.currentPriceUsd}
Market Cap: $${marketData.marketCapUsd.toLocaleString()}
24h Volume: $${marketData.totalVolumeUsd.toLocaleString()}
24h Price Change: ${priceChange > 0 ? '+' : ''}${priceChange}%

`;

  if (marketChart && marketChart.prices) {
    const prices = marketChart.prices;
    const firstPrice = prices[0]?.[1] || marketData.currentPriceUsd;
    const lastPrice = prices[prices.length - 1]?.[1] || marketData.currentPriceUsd;
    const periodChange = ((lastPrice - firstPrice) / firstPrice) * 100;
    prompt += `Historical Trend (${prices.length} days): ${periodChange > 0 ? '+' : ''}${periodChange.toFixed(2)}%\n\n`;
  }

  prompt += `Provide a brief reasoning (2-3 sentences) and sentiment (Positive, Neutral, or Negative) in JSON format:
{
  "reasoning": "...",
  "sentiment": "..."
}`;

  return prompt;
};

/**
 * Fallback rule-based insight generator
 */
const generateFallbackInsight = (tokenData) => {
  const { marketData } = tokenData;
  const priceChange = marketData.priceChangePercentage24h || 0;
  const volume = marketData.totalVolumeUsd || 0;
  const marketCap = marketData.marketCapUsd || 0;

  let sentiment = 'Neutral';
  let reasoning = '';

  if (priceChange > 5) {
    sentiment = 'Positive';
    reasoning = `Strong positive momentum with ${priceChange.toFixed(2)}% gain in 24h. High trading volume suggests active interest.`;
  } else if (priceChange < -5) {
    sentiment = 'Negative';
    reasoning = `Significant decline of ${Math.abs(priceChange).toFixed(2)}% in 24h. Monitor for potential support levels.`;
  } else {
    sentiment = 'Neutral';
    reasoning = `Price movement is relatively stable with ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% change. Market cap of $${(marketCap / 1e9).toFixed(2)}B indicates ${marketCap > 1e9 ? 'substantial' : 'moderate'} market presence.`;
  }

  return {
    insight: {
      reasoning,
      sentiment,
    },
    model: {
      provider: 'rule-based',
      model: 'fallback',
    },
  };
};

module.exports = {
  generateInsight,
};

