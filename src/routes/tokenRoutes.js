const express = require('express');
const router = express.Router();
const { getTokenInsight } = require('../controllers/tokenController');
const { body, validationResult } = require('express-validator');

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/token/:id/insight
 * Get token insight with AI analysis
 */
router.post(
  '/:id/insight',
  [
    body('vs_currency').optional().isString().isLength({ min: 2, max: 10 }),
    body('history_days').optional().isInt({ min: 1, max: 365 }),
    validate,
  ],
  getTokenInsight
);

module.exports = router;

