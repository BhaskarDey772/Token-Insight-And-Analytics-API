# Token Insight & Analytics API

A backend service that provides token insights using AI analysis and HyperLiquid wallet PnL tracking.

## Features

- **Token Insight API**: Fetches token data from CoinGecko and generates AI-powered insights
- **HyperLiquid PnL API**: Tracks daily Profit and Loss for HyperLiquid wallets
- **MongoDB Integration**: Stores insights and PnL data for caching and analytics
- **Docker Support**: Easy deployment with Docker Compose

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **External APIs**: 
  - CoinGecko API (for token data)
  - HyperLiquid API (for wallet PnL)
  - OpenAI or Hugging Face (for AI insights)

## Prerequisites

- Node.js 18+ (or Docker)
- MongoDB (or use Docker Compose)
- OpenAI API key (optional, falls back to rule-based insights)

## Setup Instructions

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd "Dapplooker Solutions"
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Edit `.env` and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
# OR
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

4. Start the services:
```bash
docker-compose up -d
```

5. The API will be available at `http://localhost:3000`

### Option 2: Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB:
   - Install MongoDB locally, or
   - Use MongoDB Atlas (cloud), or
   - Run MongoDB in Docker: `docker run -d -p 27017:27017 mongo:7`

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/token_analytics
OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### 1. Token Insight API

**POST** `/api/token/:id/insight`

Get AI-powered insights for a cryptocurrency token.

**Parameters:**
- `id` (path): CoinGecko token ID (e.g., `bitcoin`, `ethereum`, `chainlink`)

**Request Body (optional):**
```json
{
  "vs_currency": "usd",
  "history_days": 30
}
```

**Response:**
```json
{
  "source": "coingecko",
  "token": {
    "id": "chainlink",
    "symbol": "link",
    "name": "Chainlink",
    "market_data": {
      "current_price_usd": 7.23,
      "market_cap_usd": 3500000000,
      "total_volume_usd": 120000000,
      "price_change_percentage_24h": -1.2
    }
  },
  "insight": {
    "reasoning": "Generic market comment",
    "sentiment": "Neutral"
  },
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/token/bitcoin/insight \
  -H "Content-Type: application/json" \
  -d '{"vs_currency": "usd", "history_days": 30}'
```

### 2. HyperLiquid Wallet PnL API

**GET** `/api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD`

Get daily Profit and Loss for a HyperLiquid wallet.

**Parameters:**
- `wallet` (path): Wallet address
- `start` (query): Start date in YYYY-MM-DD format
- `end` (query): End date in YYYY-MM-DD format

**Response:**
```json
{
  "wallet": "0xabc123...",
  "start": "2025-08-01",
  "end": "2025-08-03",
  "daily": [
    {
      "date": "2025-08-01",
      "realized_pnl_usd": 120.5,
      "unrealized_pnl_usd": -15.3,
      "fees_usd": 2.1,
      "funding_usd": -0.5,
      "net_pnl_usd": 102.6,
      "equity_usd": 10102.6
    }
  ],
  "summary": {
    "total_realized_usd": 120.5,
    "total_unrealized_usd": -25.3,
    "total_fees_usd": 3.3,
    "total_funding_usd": -0.8,
    "net_pnl_usd": 91.1
  },
  "diagnostics": {
    "data_source": "hyperliquid_api",
    "last_api_call": "2025-09-22T12:00:00Z",
    "notes": "PnL calculated using daily close prices"
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/hyperliquid/0xabc123/pnl?start=2025-08-01&end=2025-08-03"
```

### Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "service": "Token Insight & Analytics API"
}
```

## AI Configuration

### OpenAI (Recommended)

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to `.env`:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

### Hugging Face (Alternative)

1. Get an API key from [Hugging Face](https://huggingface.co/settings/tokens)
2. Add to `.env`:
```env
HUGGINGFACE_API_KEY=hf_...
```

### Fallback Mode

If no AI API key is configured, the service will use rule-based insights based on price movements and market data.

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Development

### Project Structure

```
.
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/     # Express middleware
│   └── server.js        # Application entry point
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile          # Docker image definition
├── package.json        # Dependencies
└── README.md          # This file
```

### Environment Variables

See `.env.example` for all available configuration options.

## Error Handling

The API includes comprehensive error handling:
- Validation errors return 400 status
- Not found errors return 404 status
- Server errors return 500 status
- All errors include descriptive messages

## Rate Limiting

CoinGecko API has rate limits:
- Free tier: 10-50 calls/minute
- Consider implementing caching for production use

## Notes

- **HyperLiquid API**: The HyperLiquid API structure may vary. The current implementation is a prototype that can be adapted based on the actual API documentation.
- **Caching**: Token insights are cached in MongoDB for 24 hours to reduce API calls.
- **Security**: Never commit `.env` files with API keys. Use `.env.example` as a template.

## License

ISC

## Support

For issues or questions, please open an issue in the repository.



