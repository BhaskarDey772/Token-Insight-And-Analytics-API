import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .transform((v) => parseInt(v, 10))
    .default('3000'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required'),
  COINGECKO_API_URL: z
    .string()
    .url()
    .default('https://api.coingecko.com/api/v3'),
  HYPERLIQUID_API_URL: z
    .string()
    .url()
    .default('https://api.hyperliquid.xyz'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment configuration:',
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

if (!env.OPENAI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ OPENAI_API_KEY is not set; falling back to rule-based insights for token insight API.'
  );
}