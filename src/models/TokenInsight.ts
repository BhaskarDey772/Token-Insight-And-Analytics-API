import mongoose, { Document, Model } from 'mongoose';

export interface TokenMarketData {
  currentPriceUsd: number;
  marketCapUsd: number;
  totalVolumeUsd: number;
  priceChangePercentage24h: number;
}

export type TokenInsightDocument = Document & {
  tokenId: string;
  vsCurrency: string;
  historyDays: number;
  tokenData: {
    id: string;
    symbol: string;
    name: string;
    marketData: TokenMarketData;
  };
  insight: any;
  modelInfo: {
    provider: string;
    model: string;
  };
  source?: string;
  createdAt?: Date;
};

const TokenInsightSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    index: true
  },
  vsCurrency: {
    type: String,
    default: 'usd'
  },
  historyDays: {
    type: Number,
    default: 30
  },
  tokenData: {
    id: String,
    symbol: String,
    name: String,
    marketData: {
      currentPriceUsd: Number,
      marketCapUsd: Number,
      totalVolumeUsd: Number,
      priceChangePercentage24h: Number
    }
  },
  insight: {
    reasoning: String,
    sentiment: String
  },
  modelInfo: {
    provider: String,
    model: String
  },
  source: {
    type: String,
    default: 'coingecko'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
});

const TokenInsight: Model<TokenInsightDocument> =
  mongoose.model<TokenInsightDocument>('TokenInsight', TokenInsightSchema);

export default TokenInsight;


