const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getStats,
  searchBusinesses,
  getHistory,
  getResearchById,
  getResearchHistory,
  generatePDFReport,
  generateExecutiveSummary
} = require('../controllers/researchController');

// All routes are protected (require authentication)

// Get user statistics
router.get('/stats', protect, getStats);

// Perform business research
router.post('/search', protect, searchBusinesses);

// Get research history list
router.get('/history', protect, getHistory);

// Get specific research history with full business details
router.get('/history/:researchId', protect, getResearchHistory);

// Generate PDF report for specific research
router.get('/report/:researchId', protect, generatePDFReport);

// Generate AI Executive Summary for a business
router.post('/executive-summary', protect, generateExecutiveSummary);

// Get specific research by ID
router.get('/:id', protect, getResearchById);

module.exports = router;
