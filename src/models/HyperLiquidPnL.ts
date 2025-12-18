import mongoose, { Document, Model } from 'mongoose';

export interface DailyPnL {
  date: string;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  feesUsd: number;
  fundingUsd: number;
  netPnlUsd: number;
  equityUsd: number;
}

export interface HyperLiquidSummary {
  totalRealizedUsd: number;
  totalUnrealizedUsd: number;
  totalFeesUsd: number;
  totalFundingUsd: number;
  netPnlUsd: number;
}

export interface HyperLiquidDiagnostics {
  dataSource: string;
  lastApiCall: Date;
  notes?: string;
}

export interface HyperLiquidPnLAttrs {
  wallet: string;
  start: string;
  end: string;
  daily: DailyPnL[];
  summary: HyperLiquidSummary;
  diagnostics: HyperLiquidDiagnostics;
}

export type HyperLiquidPnLDocument = Document & HyperLiquidPnLAttrs & {
  createdAt?: Date;
};

const DailyPnLSchema = new mongoose.Schema(
  {
    date: String,
    realizedPnlUsd: Number,
    unrealizedPnlUsd: Number,
    feesUsd: Number,
    fundingUsd: Number,
    netPnlUsd: Number,
    equityUsd: Number
  },
  { _id: false }
);

const HyperLiquidPnLSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    index: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  daily: [DailyPnLSchema],
  summary: {
    totalRealizedUsd: Number,
    totalUnrealizedUsd: Number,
    totalFeesUsd: Number,
    totalFundingUsd: Number,
    netPnlUsd: Number
  },
  diagnostics: {
    dataSource: {
      type: String,
      default: 'hyperliquid_api'
    },
    lastApiCall: Date,
    notes: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const HyperLiquidPnL: Model<HyperLiquidPnLDocument> =
  mongoose.model<HyperLiquidPnLDocument>('HyperLiquidPnL', HyperLiquidPnLSchema);

export default HyperLiquidPnL;


