import express from 'express';
import { z } from 'zod';
import { getTokenInsight } from '../controllers/tokenController';
import { validateSchema } from '../middleware/validate';

const router = express.Router();

const tokenInsightBodySchema = z.object({
  vs_currency: z.string().min(2).max(10).optional().default('usd'),
  history_days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .or(
      z
        .string()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v, 10))
        .optional()
    )
});

router.post('/:id/insight', validateSchema(tokenInsightBodySchema, 'body'), getTokenInsight);

export default router;


