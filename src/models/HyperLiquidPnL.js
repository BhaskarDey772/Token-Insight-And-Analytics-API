const mongoose = require('mongoose');

const DailyPnLSchema = new mongoose.Schema({
  date: String,
  realizedPnlUsd: Number,
  unrealizedPnlUsd: Number,
  feesUsd: Number,
  fundingUsd: Number,
  netPnlUsd: Number,
  equityUsd: Number,
});

const HyperLiquidPnLSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    index: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  daily: [DailyPnLSchema],
  summary: {
    totalRealizedUsd: Number,
    totalUnrealizedUsd: Number,
    totalFeesUsd: Number,
    totalFundingUsd: Number,
    netPnlUsd: Number,
  },
  diagnostics: {
    dataSource: {
      type: String,
      default: 'hyperliquid_api',
    },
    lastApiCall: Date,
    notes: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HyperLiquidPnL', HyperLiquidPnLSchema);

