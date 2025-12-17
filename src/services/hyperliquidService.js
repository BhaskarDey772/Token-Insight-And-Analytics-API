const axios = require('axios');

const HYPERLIQUID_API_URL = process.env.HYPERLIQUID_API_URL || 'https://api.hyperliquid.xyz';

/**
 * Fetch wallet PnL data from HyperLiquid
 * Note: HyperLiquid API structure may vary, this is a prototype implementation
 */
const fetchWalletPnL = async (wallet, startDate, endDate) => {
  try {
    // HyperLiquid API endpoints (these may need to be adjusted based on actual API)
    // Since the exact API structure isn't documented, we'll create a mock structure
    // that can be adapted to the real API when available

    // Try to fetch user state/info
    let userState = null;
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'clearinghouseState',
        user: wallet,
      }, {
        timeout: 10000,
      });
      userState = response.data;
    } catch (error) {
      console.warn(`Could not fetch user state for ${wallet}:`, error.message);
    }

    // Fetch user funding history
    let fundingHistory = [];
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'userFunding',
        user: wallet,
        startTime: new Date(startDate).getTime(),
        endTime: new Date(endDate).getTime(),
      }, {
        timeout: 10000,
      });
      fundingHistory = response.data || [];
    } catch (error) {
      console.warn(`Could not fetch funding history:`, error.message);
    }

    // Fetch user trades
    let trades = [];
    try {
      const response = await axios.post(`${HYPERLIQUID_API_URL}/info`, {
        type: 'userTrades',
        user: wallet,
        startTime: new Date(startDate).getTime(),
        endTime: new Date(endDate).getTime(),
      }, {
        timeout: 10000,
      });
      trades = response.data || [];
    } catch (error) {
      console.warn(`Could not fetch trades:`, error.message);
    }

    // Calculate daily PnL
    const dailyPnL = calculateDailyPnL(wallet, startDate, endDate, trades, fundingHistory, userState);

    return dailyPnL;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Wallet '${wallet}' not found or has no activity`);
    }
    throw new Error(`Failed to fetch HyperLiquid data: ${error.message}`);
  }
};

/**
 * Calculate daily PnL from trades, funding, and positions
 */
const calculateDailyPnL = (wallet, startDate, endDate, trades, fundingHistory, userState) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daily = [];

  // Group trades by date
  const tradesByDate = {};
  trades.forEach((trade) => {
    const tradeDate = new Date(trade.time || trade.timestamp);
    const dateKey = tradeDate.toISOString().split('T')[0];
    if (!tradesByDate[dateKey]) {
      tradesByDate[dateKey] = [];
    }
    tradesByDate[dateKey].push(trade);
  });

  // Group funding by date
  const fundingByDate = {};
  fundingHistory.forEach((funding) => {
    const fundingDate = new Date(funding.time || funding.timestamp);
    const dateKey = fundingDate.toISOString().split('T')[0];
    if (!fundingByDate[dateKey]) {
      fundingByDate[dateKey] = [];
    }
    fundingByDate[dateKey].push(funding);
  });

  // Calculate for each day
  let currentEquity = 10000; // Starting equity (this should come from API)
  let runningRealized = 0;
  let runningUnrealized = 0;
  let runningFees = 0;
  let runningFunding = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    const dayTrades = tradesByDate[dateKey] || [];
    const dayFunding = fundingByDate[dateKey] || [];

    // Calculate realized PnL from closed trades
    let realizedPnl = 0;
    let fees = 0;
    dayTrades.forEach((trade) => {
      // Assuming trade structure has closedPnL and fee fields
      realizedPnl += parseFloat(trade.closedPnL || trade.pnl || 0);
      fees += parseFloat(trade.fee || 0);
    });

    // Calculate funding
    let funding = 0;
    dayFunding.forEach((fund) => {
      funding += parseFloat(fund.amount || 0);
    });

    // Calculate unrealized PnL (from open positions)
    // This would require position data and daily close prices
    // For now, we'll estimate based on user state
    let unrealizedPnl = 0;
    if (userState && userState.positions) {
      userState.positions.forEach((position) => {
        // This is simplified - real calculation needs daily close prices
        const positionValue = parseFloat(position.positionValue || 0);
        const entryPrice = parseFloat(position.entryPrice || 0);
        const currentPrice = parseFloat(position.markPrice || entryPrice);
        if (positionValue !== 0) {
          unrealizedPnl += (currentPrice - entryPrice) * Math.abs(positionValue) / entryPrice;
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
      realized_pnl_usd: parseFloat(realizedPnl.toFixed(2)),
      unrealized_pnl_usd: parseFloat(unrealizedPnl.toFixed(2)),
      fees_usd: parseFloat(fees.toFixed(2)),
      funding_usd: parseFloat(funding.toFixed(2)),
      net_pnl_usd: parseFloat(netPnl.toFixed(2)),
      equity_usd: parseFloat(currentEquity.toFixed(2)),
    });
  }

  const summary = {
    total_realized_usd: parseFloat(runningRealized.toFixed(2)),
    total_unrealized_usd: parseFloat(runningUnrealized.toFixed(2)),
    total_fees_usd: parseFloat(runningFees.toFixed(2)),
    total_funding_usd: parseFloat(runningFunding.toFixed(2)),
    net_pnl_usd: parseFloat((runningRealized + runningUnrealized - runningFees + runningFunding).toFixed(2)),
  };

  return {
    wallet,
    start: startDate,
    end: endDate,
    daily,
    summary,
    diagnostics: {
      data_source: 'hyperliquid_api',
      last_api_call: new Date().toISOString(),
      notes: 'PnL calculated using daily close prices. Note: Unrealized PnL calculation may vary based on actual API response structure.',
    },
  };
};

module.exports = {
  fetchWalletPnL,
};

