import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import connectDB from './config/database';
import tokenRoutes from './routes/tokenRoutes';
import hyperliquidRoutes from './routes/hyperliquidRoutes';
import errorHandler from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

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

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      // eslint-disable-next-line no-console
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;


