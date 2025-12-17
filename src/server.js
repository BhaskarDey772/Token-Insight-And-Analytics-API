require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const tokenRoutes = require('./routes/tokenRoutes');
const hyperliquidRoutes = require('./routes/hyperliquidRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Token Insight & Analytics API',
  });
});

// API Routes
app.use('/api/token', tokenRoutes);
app.use('/api/hyperliquid', hyperliquidRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Token Insight & Analytics API',
    version: '1.0.0',
    endpoints: {
      tokenInsight: 'POST /api/token/:id/insight',
      hyperliquidPnL: 'GET /api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

