const mongoose = require('mongoose');

const TokenInsightSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    index: true,
  },
  vsCurrency: {
    type: String,
    default: 'usd',
  },
  historyDays: {
    type: Number,
    default: 30,
  },
  tokenData: {
    id: String,
    symbol: String,
    name: String,
    marketData: {
      currentPriceUsd: Number,
      marketCapUsd: Number,
      totalVolumeUsd: Number,
      priceChangePercentage24h: Number,
    },
  },
  insight: {
    reasoning: String,
    sentiment: String,
  },
  model: {
    provider: String,
    model: String,
  },
  source: {
    type: String,
    default: 'coingecko',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Expire after 24 hours (optional caching)
  },
});

module.exports = mongoose.model('TokenInsight', TokenInsightSchema);

