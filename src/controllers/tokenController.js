const { fetchTokenData } = require('../services/coingeckoService');
const { generateInsight } = require('../services/aiService');
const TokenInsight = require('../models/TokenInsight');

/**
 * POST /api/token/:id/insight
 * Get token insight with AI analysis
 */
const getTokenInsight = async (req, res) => {
  try {
    const { id } = req.params;
    const { vs_currency = 'usd', history_days = 30 } = req.body || {};

    // Fetch token data from CoinGecko
    const { tokenData, marketChart } = await fetchTokenData(id, vs_currency, parseInt(history_days));

    // Generate AI insight
    const { insight, model } = await generateInsight(tokenData, marketChart);

    // Prepare response
    const response = {
      source: 'coingecko',
      token: {
        id: tokenData.id,
        symbol: tokenData.symbol,
        name: tokenData.name,
        market_data: {
          current_price_usd: tokenData.marketData.currentPriceUsd,
          market_cap_usd: tokenData.marketData.marketCapUsd,
          total_volume_usd: tokenData.marketData.totalVolumeUsd,
          price_change_percentage_24h: tokenData.marketData.priceChangePercentage24h,
        },
      },
      insight: {
        reasoning: insight.reasoning,
        sentiment: insight.sentiment,
      },
      model: {
        provider: model.provider,
        model: model.model,
      },
    };

    // Optionally save to database for caching
    try {
      await TokenInsight.create({
        tokenId: id,
        vsCurrency: vs_currency,
        historyDays: parseInt(history_days),
        tokenData: {
          id: tokenData.id,
          symbol: tokenData.symbol,
          name: tokenData.name,
          marketData: tokenData.marketData,
        },
        insight: {
          reasoning: insight.reasoning,
          sentiment: insight.sentiment,
        },
        model: {
          provider: model.provider,
          model: model.model,
        },
      });
    } catch (dbError) {
      console.warn('Failed to save to database:', dbError.message);
      // Continue even if DB save fails
    }

    res.json(response);
  } catch (error) {
    console.error('Error in getTokenInsight:', error);
    res.status(500).json({
      error: 'Failed to fetch token insight',
      message: error.message,
    });
  }
};

module.exports = {
  getTokenInsight,
};

