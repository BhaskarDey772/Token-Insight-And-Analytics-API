import { Request, Response } from "express";
import { fetchWalletPnL } from "../services/hyperliquidService";
import { hyperliquidUserId } from "../types/hyperliquid";

export async function getWalletPnL(req: Request, res: Response) {
  try {
    const { wallet } = req.params;
    const { start, end } = req.query as {
      start?: string;
      end?: string;
    };

    if (!wallet || wallet.toLowerCase() !== hyperliquidUserId) {
      return res.status(400).json({
        error: "Unsupported wallet",
        message: "Only configured HyperLiquid wallet is supported"
      });
    }

    if (!start || !end) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "start and end dates are required"
      });
    }

    const result = await fetchWalletPnL(start, end);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to fetch wallet PnL",
      message: err.message
    });
  }
}
