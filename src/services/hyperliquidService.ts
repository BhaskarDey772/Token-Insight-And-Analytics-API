import axios from "axios";
import { env } from "../config/env";
import { groupByDate, round } from "../utils";
import {
  HyperliquidTrade,
  HyperliquidFunding,
  HyperliquidAssetPosition,
  WalletPnLResponse,
  DailyPnL
} from "../types";

const HYPERLIQUID_API_URL = env.HYPERLIQUID_API_URL;

export async function fetchWalletPnL(
  wallet: string,
  startDate: string,
  endDate: string
): Promise<WalletPnLResponse> {
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();

  /* -------- Fetch Trades -------- */
  const tradesResp = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
    type: "userFillsByTime",
    user: wallet,
    startTime,
    endTime,
    aggregateByTime: false
  });

  const trades = (tradesResp.data || []) as HyperliquidTrade[];

  /* -------- Fetch Funding -------- */
  const fundingResp = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
    type: "userFunding",
    user: wallet,
    startTime,
    endTime
  });

  const funding = (fundingResp.data || []) as HyperliquidFunding[];

  /* -------- Fetch Account State -------- */
  const stateResp = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
    type: "clearinghouseState",
    user: wallet
  });

  const assetPositions =
    (stateResp.data?.assetPositions || []) as HyperliquidAssetPosition[];

  const startingEquity = Number(
    stateResp.data?.marginSummary?.accountValue || 0
  );

  return calculateDailyPnL(
    startDate,
    endDate,
    trades,
    funding,
    assetPositions,
    startingEquity,
    wallet
  );
}

function calculateDailyPnL(
  startDate: string,
  endDate: string,
  trades: HyperliquidTrade[],
  funding: HyperliquidFunding[],
  assetPositions: HyperliquidAssetPosition[],
  startingEquity: number,
  wallet: string
): WalletPnLResponse {
  const daily: DailyPnL[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  const tradeMap = groupByDate(trades);
  const fundingMap = groupByDate(funding);

  let equity = startingEquity;
  let totalRealized = 0;
  let totalFees = 0;
  let totalFunding = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10);

    const dayTrades = tradeMap[dateKey] || [];
    const dayFunding = fundingMap[dateKey] || [];

    let realized = 0;
    let fees = 0;
    let fundingUsd = 0;

    /* ---- Realized & Fees ---- */
    for (const t of dayTrades) {
      realized += Number(t.closedPnl || 0);
      fees += Number(t.fee || 0);
    }

    /* ---- Funding ---- */
    for (const f of dayFunding) {
      fundingUsd += Number(f.delta?.usdc || 0);
    }

    /* ---- Unrealized (only last day) ---- */
    let unrealized = 0;
    if (dateKey === endDate) {
      for (const ap of assetPositions) {
        const p = ap.position;
        unrealized +=
          (Number(p.markPx) - Number(p.entryPx)) *
          Number(p.szi);
      }
    }

    const net = realized + unrealized - fees + fundingUsd;
    equity += net;

    totalRealized += realized;
    totalFees += fees;
    totalFunding += fundingUsd;

    daily.push({
      date: dateKey,
      realized_pnl_usd: round(realized),
      unrealized_pnl_usd: round(unrealized),
      fees_usd: round(fees),
      funding_usd: round(fundingUsd),
      net_pnl_usd: round(net),
      equity_usd: round(equity)
    });
  }

  return {
    wallet,
    start: startDate,
    end: endDate,
    daily,
    summary: {
      total_realized_usd: round(totalRealized),
      total_unrealized_usd: round(
        daily.reduce((a, d) => a + d.unrealized_pnl_usd, 0)
      ),
      total_fees_usd: round(totalFees),
      total_funding_usd: round(totalFunding),
      net_pnl_usd: round(
        totalRealized -
          totalFees +
          totalFunding +
          daily[daily.length - 1]?.unrealized_pnl_usd
      )
    },
    diagnostics: {
      data_source: "hyperliquid_api",
      last_api_call: new Date().toISOString(),
      notes:
        "Funding parsed from delta.usdc; unrealized PnL calculated from current mark price and applied on final day only"
    }
  };
}
