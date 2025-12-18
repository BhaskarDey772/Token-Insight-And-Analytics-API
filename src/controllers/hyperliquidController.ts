import { Request, Response } from "express";
import { z } from "zod";
import { fetchWalletPnL } from "../services/hyperliquidService";

const hyperliquidRequestSchema = z.object({
  wallet: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "wallet must be a valid 0x-prefixed address"),
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start must be in YYYY-MM-DD format"),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end must be in YYYY-MM-DD format")
});

export async function getWalletPnL(req: Request, res: Response) {
  try {
    const parsed = hyperliquidRequestSchema.safeParse({
      wallet: req.params.wallet,
      start: req.query.start,
      end: req.query.end
    });

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation error",
        issues: parsed.error.format()
      });
    }

    const { wallet, start, end } = parsed.data;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "Start date must be before or equal to end date"
      });
    }

    const result = await fetchWalletPnL(wallet, start, end);
    res.json(result);
  } catch (err: any) {
    if (err?.message && err.message.includes("not found")) {
      return res.status(404).json({
        error: "Wallet not found",
        message: err.message
      });
    }

    res.status(500).json({
      error: "Failed to fetch wallet PnL",
      message: err.message
    });
  }
}
