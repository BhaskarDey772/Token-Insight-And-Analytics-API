import axios from 'axios';
import HyperLiquidPnL, {
  DailyPnL,
  HyperLiquidPnLAttrs,
  HyperLiquidSummary
} from '../models/HyperLiquidPnL';
import {
  hyperliquidUserFillsRequestSchema,
  hyperliquidUserId
} from '../types/hyperliquid';

const HYPERLIQUID_API_URL =
  process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';

export interface HyperliquidTrade {
  time?: number;
  timestamp?: number;
  closedPnL?: string | number;
  pnl?: string | number;
  fee?: string | number;
  [key: string]: any;
}

export interface HyperliquidFunding {
  time?: number;
  timestamp?: number;
  amount?: string | number;
  [key: string]: any;
}

export interface HyperliquidUserState {
  positions?: Array<{
    positionValue?: string | number;
    entryPrice?: string | number;
    markPrice?: string | number;
  }>;
  [key: string]: any;
}

export interface WalletPnLResponse extends HyperLiquidPnLAttrs {}

export const fetchWalletPnL = async (
  wallet: string,
  startDate: string,
  endDate: string
): Promise<WalletPnLResponse> => {
  try {
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();

    const fillsRequestBody = hyperliquidUserFillsRequestSchema.parse({
      type: 'userFillsByTime',
      user: hyperliquidUserId,
      startTime,
      endTime,
      aggregateByTime: false
    });

    let userState: HyperliquidUserState | null = null;
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'clearinghouseState',
        user: hyperliquidUserId
      });
      userState = response.data;
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(
        `Could not fetch user state for static user ${hyperliquidUserId}:`,
        error.message
      );
    }

    let fundingHistory: HyperliquidFunding[] = [];
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'userFunding',
        user: hyperliquidUserId,
        startTime,
        endTime
      });
      fundingHistory = (response.data || []) as HyperliquidFunding[];
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(`Could not fetch funding history:`, error.message);
    }

    let trades: HyperliquidTrade[] = [];
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, fillsRequestBody);
      trades = (response.data || []) as HyperliquidTrade[];
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(`Could not fetch trades:`, error.message);
    }

    const dailyPnL = calculateDailyPnL(wallet, startDate, endDate, trades, fundingHistory, userState);

    return dailyPnL;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Wallet '${wallet}' not found or has no activity`);
    }
    throw new Error(`Failed to fetch HyperLiquid data: ${error.message}`);
  }
};

const calculateDailyPnL = (
  wallet: string,
  startDate: string,
  endDate: string,
  trades: HyperliquidTrade[],
  fundingHistory: HyperliquidFunding[],
  userState: HyperliquidUserState | null
): WalletPnLResponse => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daily: DailyPnL[] = [];

  const tradesByDate: Record<string, HyperliquidTrade[]> = {};
  trades.forEach((trade) => {
    const tradeDate = new Date(trade.time || trade.timestamp || 0);
    const dateKey = tradeDate.toISOString().split('T')[0];
    if (!tradesByDate[dateKey]) {
      tradesByDate[dateKey] = [];
    }
    tradesByDate[dateKey].push(trade);
  });

  const fundingByDate: Record<string, HyperliquidFunding[]> = {};
  fundingHistory.forEach((funding) => {
    const fundingDate = new Date(funding.time || funding.timestamp || 0);
    const dateKey = fundingDate.toISOString().split('T')[0];
    if (!fundingByDate[dateKey]) {
      fundingByDate[dateKey] = [];
    }
    fundingByDate[dateKey].push(funding);
  });

  let currentEquity = 10000;
  let runningRealized = 0;
  let runningUnrealized = 0;
  let runningFees = 0;
  let runningFunding = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const dayTrades = tradesByDate[dateKey] || [];
    const dayFunding = fundingByDate[dateKey] || [];

    let realizedPnl = 0;
    let fees = 0;
    dayTrades.forEach((trade) => {
      realizedPnl += parseFloat(String(trade.closedPnL ?? trade.pnl ?? 0));
      fees += parseFloat(String(trade.fee ?? 0));
    });

    let funding = 0;
    dayFunding.forEach((fund) => {
      funding += parseFloat(String(fund.amount ?? 0));
    });

    let unrealizedPnl = 0;
    if (userState && userState.positions) {
      userState.positions.forEach((position) => {
        const positionValue = parseFloat(String(position.positionValue ?? 0));
        const entryPrice = parseFloat(String(position.entryPrice ?? 0));
        const currentPrice = parseFloat(
          String(position.markPrice ?? position.entryPrice ?? 0)
        );
        if (positionValue !== 0 && entryPrice !== 0) {
          unrealizedPnl +=
            ((currentPrice - entryPrice) * Math.abs(positionValue)) / entryPrice;
        }
      });
    }

    const netPnl = realizedPnl + unrealizedPnl - fees + funding;
    currentEquity += netPnl;

    runningRealized += realizedPnl;
    runningUnrealized += unrealizedPnl;
    runningFees += fees;
    runningFunding += funding;

    daily.push({
      date: dateKey,
      realizedPnlUsd: parseFloat(realizedPnl.toFixed(2)),
      unrealizedPnlUsd: parseFloat(unrealizedPnl.toFixed(2)),
      feesUsd: parseFloat(fees.toFixed(2)),
      fundingUsd: parseFloat(funding.toFixed(2)),
      netPnlUsd: parseFloat(netPnl.toFixed(2)),
      equityUsd: parseFloat(currentEquity.toFixed(2))
    });
  }

  const summary: HyperLiquidSummary = {
    totalRealizedUsd: parseFloat(runningRealized.toFixed(2)),
    totalUnrealizedUsd: parseFloat(runningUnrealized.toFixed(2)),
    totalFeesUsd: parseFloat(runningFees.toFixed(2)),
    totalFundingUsd: parseFloat(runningFunding.toFixed(2)),
    netPnlUsd: parseFloat(
      (runningRealized + runningUnrealized - runningFees + runningFunding).toFixed(2)
    )
  };

  return {
    wallet,
    start: startDate,
    end: endDate,
    daily,
    summary,
    diagnostics: {
      dataSource: 'hyperliquid_api',
      lastApiCall: new Date(),
      notes:
        'PnL calculated using aggregated user fills and funding. Unrealized PnL is approximated from user state.'
    }
  };
};

export default {
  fetchWalletPnL
};


