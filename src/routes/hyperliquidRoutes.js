const express = require('express');
const router = express.Router();
const { getWalletPnL } = require('../controllers/hyperliquidController');

/**
 * GET /api/hyperliquid/:wallet/pnl
 * Get daily PnL for a HyperLiquid wallet
 * Note: Validation is handled in the controller
 */
router.get('/:wallet/pnl', getWalletPnL);

module.exports = router;

