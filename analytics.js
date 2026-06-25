/**
 * ANALYTICS ROUTES
 * 
 * API endpoints for market insights and analytics
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/analytics/market-insights
router.get('/market-insights', protect, (req, res) => {
  analyticsController.getMarketInsights(req, res);
});

module.exports = router;
