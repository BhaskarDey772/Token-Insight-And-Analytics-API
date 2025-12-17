const { fetchWalletPnL } = require('../services/hyperliquidService');
const HyperLiquidPnL = require('../models/HyperLiquidPnL');

/**
 * GET /api/hyperliquid/:wallet/pnl
 * Get daily PnL for a HyperLiquid wallet
 */
const getWalletPnL = async (req, res) => {
  try {
    const { wallet } = req.params;
    const { start, end } = req.query;

    // Validate inputs
    if (!start || !end) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both start and end date parameters are required (format: YYYY-MM-DD)',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format',
      });
    }

    // Validate date range
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Please provide valid dates',
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before or equal to end date',
      });
    }

    // Check if date range is too large (optional limit)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum date range is 365 days',
      });
    }

    // Fetch PnL data
    const pnlData = await fetchWalletPnL(wallet, start, end);

    // Save to database
    try {
      await HyperLiquidPnL.create({
        wallet: wallet.toLowerCase(),
        start,
        end,
        daily: pnlData.daily,
        summary: pnlData.summary,
        diagnostics: pnlData.diagnostics,
      });
    } catch (dbError) {
      console.warn('Failed to save to database:', dbError.message);
      // Continue even if DB save fails
    }

    res.json(pnlData);
  } catch (error) {
    console.error('Error in getWalletPnL:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to fetch wallet PnL',
      message: error.message,
    });
  }
};

module.exports = {
  getWalletPnL,
};

