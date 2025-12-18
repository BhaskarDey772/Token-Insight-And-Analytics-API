import 'module-alias/register';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import connectDB, { disconnectDB } from '@config/database';
import tokenRoutes from '@routes/tokenRoutes';
import hyperliquidRoutes from '@routes/hyperliquidRoutes';
import errorHandler from '@middleware/errorHandler';
import { env } from '@config/env';

const app = express();
const PORT = env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Token Insight & Analytics API'
  });
});

app.use('/api/token', tokenRoutes);
app.use('/api/hyperliquid', hyperliquidRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Token Insight & Analytics API',
    version: '1.0.0',
    endpoints: {
      tokenInsight: 'POST /api/token/:id/insight',
      hyperliquidPnL:
        'GET /api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD (wallet must be the configured HyperLiquid user id)'
    }
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.use(errorHandler);

let server: http.Server | undefined;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Environment: ${env.NODE_ENV}`);
      // eslint-disable-next-line no-console
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully...`);

  try {
    await disconnectDB();
  } catch {
    // ignore disconnect errors
  }

  if (server) {
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('HTTP server closed.');
      process.exit(0);
    });

    // Force exit if close takes too long
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Note: SIGKILL cannot be intercepted by a Node.js process; the OS will terminate immediately.

if (env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
export default app;


