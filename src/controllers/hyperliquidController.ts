import { Request, Response } from "express";
import { fetchWalletPnL } from "@services/hyperliquidService";

export async function getWalletPnL(req: Request, res: Response) {
  try {
    const { wallet } = req.params as { wallet: string };
    const { start, end } = req.query as {
      start?: string;
      end?: string;
    };

    if (!start || !end) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "start and end dates are required"
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'start and end must be valid dates'
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before or equal to end date'
      });
    }

    const result = await fetchWalletPnL(wallet, start, end);
    res.json(result);
  } catch (err: any) {
    if (err?.message && err.message.includes('not found')) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: err.message
      });
    }

    res.status(500).json({
      error: "Failed to fetch wallet PnL",
      message: err.message
    });
  }
}
