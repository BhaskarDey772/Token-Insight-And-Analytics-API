# Quick Start Guide

## Prerequisites
- Node.js 18+ OR Docker & Docker Compose
- MongoDB (if running locally)

## Fastest Way to Get Started (Docker)

1. **Create `.env` file:**
```bash
cat > .env << EOF
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/token_analytics
OPENAI_API_KEY=your_key_here
COINGECKO_API_URL=https://api.coingecko.com/api/v3
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
EOF
```

2. **Start services:**
```bash
docker-compose up -d
```

3. **Test the API:**
```bash
curl http://localhost:3000/health
```

## Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start MongoDB** (if not using Docker):
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

3. **Create `.env` file** (see above)

4. **Start the server:**
```bash
npm run dev
```

## Test Endpoints

### Token Insight
```bash
curl -X POST http://localhost:3000/api/token/bitcoin/insight \
  -H "Content-Type: application/json" \
  -d '{"vs_currency": "usd", "history_days": 30}'
```

### HyperLiquid PnL
```bash
curl "http://localhost:3000/api/hyperliquid/0x020ca66c30bec2c4fe3861a94e4db4a498a35872/pnl?start=2025-08-01&end=2025-08-03"
```

## Run Tests
```bash
npm test
```

## Import Postman Collection
Import `postman_collection.json` into Postman for easy API testing.




