const request = require('supertest');
const appModule = require('../../dist/server.js');
const app = appModule.default || appModule;

// Mock services (compiled)
jest.mock('../../dist/services/coingeckoService.js');
jest.mock('../../dist/services/aiService.js');

const { fetchTokenData } = require('../../dist/services/coingeckoService.js');
const { generateInsight } = require('../../dist/services/aiService.js');

describe('Token Insight API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return token insight for valid token ID', async () => {
    const mockTokenData = {
      tokenData: {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        marketData: {
          currentPriceUsd: 50000,
          marketCapUsd: 1000000000000,
          totalVolumeUsd: 50000000000,
          priceChangePercentage24h: 2.5,
        },
      },
      marketChart: null,
    };

    const mockInsight = {
      insight: {
        reasoning: 'Bitcoin shows positive momentum',
        sentiment: 'Positive',
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
      },
    };

    fetchTokenData.mockResolvedValue(mockTokenData);
    generateInsight.mockResolvedValue(mockInsight);

    const response = await request(app)
      .post('/api/token/bitcoin/insight')
      .send({ vs_currency: 'usd', history_days: 30 })
      .expect(200);

    expect(response.body).toHaveProperty('source', 'coingecko');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('insight');
    expect(response.body).toHaveProperty('model');
    expect(response.body.token.id).toBe('bitcoin');
    expect(response.body.insight.sentiment).toBe('Positive');
  });

  it('should handle invalid token ID', async () => {
    fetchTokenData.mockRejectedValue(new Error("Token 'invalid-token' not found on CoinGecko"));

    const response = await request(app)
      .post('/api/token/invalid-token/insight')
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });

  it('should use default parameters when body is empty', async () => {
    const mockTokenData = {
      tokenData: {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        marketData: {
          currentPriceUsd: 3000,
          marketCapUsd: 360000000000,
          totalVolumeUsd: 15000000000,
          priceChangePercentage24h: -1.5,
        },
      },
      marketChart: null,
    };

    const mockInsight = {
      insight: {
        reasoning: 'Ethereum shows neutral movement',
        sentiment: 'Neutral',
      },
      model: {
        provider: 'rule-based',
        model: 'fallback',
      },
    };

    fetchTokenData.mockResolvedValue(mockTokenData);
    generateInsight.mockResolvedValue(mockInsight);

    const response = await request(app)
      .post('/api/token/ethereum/insight')
      .expect(200);

    expect(response.body.token.id).toBe('ethereum');
    expect(fetchTokenData).toHaveBeenCalledWith('ethereum', 'usd', 30);
  });
});




