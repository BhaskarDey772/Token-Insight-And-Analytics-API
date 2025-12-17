const request = require('supertest');
const app = require('../server');

// Mock service
jest.mock('../services/hyperliquidService');

const { fetchWalletPnL } = require('../services/hyperliquidService');

describe('HyperLiquid PnL API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return PnL data for valid wallet and date range', async () => {
    const mockPnLData = {
      wallet: '0xabc123',
      start: '2025-08-01',
      end: '2025-08-03',
      daily: [
        {
          date: '2025-08-01',
          realized_pnl_usd: 120.5,
          unrealized_pnl_usd: -15.3,
          fees_usd: 2.1,
          funding_usd: -0.5,
          net_pnl_usd: 102.6,
          equity_usd: 10102.6,
        },
      ],
      summary: {
        total_realized_usd: 120.5,
        total_unrealized_usd: -25.3,
        total_fees_usd: 3.3,
        total_funding_usd: -0.8,
        net_pnl_usd: 91.1,
      },
      diagnostics: {
        data_source: 'hyperliquid_api',
        last_api_call: '2025-09-22T12:00:00Z',
        notes: 'PnL calculated using daily close prices',
      },
    };

    fetchWalletPnL.mockResolvedValue(mockPnLData);

    const response = await request(app)
      .get('/api/hyperliquid/0xabc123/pnl')
      .query({ start: '2025-08-01', end: '2025-08-03' })
      .expect(200);

    expect(response.body).toHaveProperty('wallet');
    expect(response.body).toHaveProperty('daily');
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('diagnostics');
    expect(response.body.wallet).toBe('0xabc123');
    expect(Array.isArray(response.body.daily)).toBe(true);
  });

  it('should return 400 for missing start parameter', async () => {
    const response = await request(app)
      .get('/api/hyperliquid/0xabc123/pnl')
      .query({ end: '2025-08-03' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.message).toContain('start');
  });

  it('should return 400 for missing end parameter', async () => {
    const response = await request(app)
      .get('/api/hyperliquid/0xabc123/pnl')
      .query({ start: '2025-08-01' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.message).toContain('end');
  });

  it('should return 400 for invalid date format', async () => {
    const response = await request(app)
      .get('/api/hyperliquid/0xabc123/pnl')
      .query({ start: 'invalid-date', end: '2025-08-03' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 when start date is after end date', async () => {
    const response = await request(app)
      .get('/api/hyperliquid/0xabc123/pnl')
      .query({ start: '2025-08-03', end: '2025-08-01' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.message).toContain('Start date must be before');
  });

  it('should handle wallet not found', async () => {
    fetchWalletPnL.mockRejectedValue(new Error("Wallet '0xinvalid' not found or has no activity"));

    const response = await request(app)
      .get('/api/hyperliquid/0xinvalid/pnl')
      .query({ start: '2025-08-01', end: '2025-08-03' })
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Wallet not found');
  });
});

