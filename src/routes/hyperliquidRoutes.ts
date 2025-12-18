import express from 'express';
import { z } from 'zod';
import { getWalletPnL } from '@controllers/hyperliquidController';
import { validateSchema } from '@middleware/validate';

const router = express.Router();

const hyperliquidQuerySchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be in YYYY-MM-DD format'),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be in YYYY-MM-DD format')
});

const hyperliquidParamsSchema = z.object({
  wallet: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'wallet must be a valid 0x-prefixed address')
});

router.get(
  '/:wallet/pnl',
  validateSchema(hyperliquidParamsSchema, 'params'),
  validateSchema(hyperliquidQuerySchema, 'query'),
  getWalletPnL
);

export default router;


