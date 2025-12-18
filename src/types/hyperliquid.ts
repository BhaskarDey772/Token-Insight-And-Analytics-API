import { z } from "zod";

export const hyperliquidUserId =
  "0x020ca66c30bec2c4fe3861a94e4db4a498a35872" as const;

export const hyperliquidUserFillsRequestSchema = z.object({
  type: z.literal("userFillsByTime"),
  user: z.literal(hyperliquidUserId),
  startTime: z.number().int().nonnegative(),
  endTime: z.number().int().nonnegative(),
  aggregateByTime: z.literal(false)
});

export type HyperliquidUserFillsRequest =
  z.infer<typeof hyperliquidUserFillsRequestSchema>;
