import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import pkg from '../package.json';
import tokenRoutes from './routes/tokenRoutes';
import hyperliquidRoutes from './routes/hyperliquidRoutes';
import errorHandler from './middleware/errorHandler';
import { env } from './config/env';

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
    name: pkg.name,
    version: pkg.version,
    message: 'Token Insight & Analytics API',
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
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (env.NODE_ENV !== 'test') {
  startServer();
}

export default app;


