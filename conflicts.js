/**
 * CONFLICT DETECTION ROUTES
 * API endpoints for conflict analytics
 */

const express = require('express');
const router = express.Router();
const conflictAnalyticsController = require('../controllers/conflictAnalyticsController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/conflicts/summary - Get conflict summary
router.get('/summary', protect, (req, res) => {
  conflictAnalyticsController.getConflictSummary(req, res);
});

// GET /api/conflicts/businesses - Get businesses with conflicts
router.get('/businesses', protect, (req, res) => {
  conflictAnalyticsController.getBusinessesWithConflicts(req, res);
});

// GET /api/conflicts/business/:businessId - Get specific business conflicts
router.get('/business/:businessId', protect, (req, res) => {
  conflictAnalyticsController.getBusinessConflicts(req, res);
});

module.exports = router;
