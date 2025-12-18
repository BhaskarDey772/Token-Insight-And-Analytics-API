import { TokenMarketData } from "@models/TokenInsight";


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


export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  marketData: TokenMarketData;
}

export interface FetchTokenDataResult {
  tokenData: TokenData;
  marketChart: any | null;
  rawData: any;
}


export interface HyperliquidTrade {
  time: number;
  closedPnl?: number | string;
  fee?: number | string;
}

export interface HyperliquidFunding {
  time: number;
  delta?: {
    usdc?: number | string;
  };
}

export interface HyperliquidAssetPosition {
  position: {
    coin: string;
    szi: number | string;
    entryPx: number | string;
    markPx: number | string;
  };
}

export interface DailyPnL {
  date: string;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  fees_usd: number;
  funding_usd: number;
  net_pnl_usd: number;
  equity_usd: number;
}

export interface WalletPnLResponse {
  wallet: string;
  start: string;
  end: string;
  daily: DailyPnL[];
  summary: {
    total_realized_usd: number;
    total_unrealized_usd: number;
    total_fees_usd: number;
    total_funding_usd: number;
    net_pnl_usd: number;
  };
  diagnostics: {
    data_source: string;
    last_api_call: string;
    notes: string;
  };
}