import { Request, Response } from 'express';
import { fetchWalletPnL } from '../services/hyperliquidService';
import HyperLiquidPnL from '../models/HyperLiquidPnL';

export const getWalletPnL = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet } = req.params;
    const { start, end } = req.query as { start?: string; end?: string };

    if (!start || !end) {
      res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both start and end date parameters are required (format: YYYY-MM-DD)'
      });
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({
        error: 'Invalid date',
        message: 'Please provide valid dates'
      });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before or equal to end date'
      });
      return;
    }

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 365) {
      res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum date range is 365 days'
      });
      return;
    }

    const pnlData = await fetchWalletPnL(wallet, start, end);

    try {
      await HyperLiquidPnL.create({
        wallet: wallet.toLowerCase(),
        start,
        end,
        daily: pnlData.daily,
        summary: pnlData.summary,
        diagnostics: pnlData.diagnostics
      });
    } catch (dbError: any) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save to database:', dbError.message);
    }

    res.json(pnlData);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error in getWalletPnL:', error);

    if (error.message?.includes('not found')) {
      res.status(404).json({
        error: 'Wallet not found',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to fetch wallet PnL',
      message: error.message
    });
  }
};

export default {
  getWalletPnL
};


