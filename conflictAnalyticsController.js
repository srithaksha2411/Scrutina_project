/**
 * CONFLICT ANALYTICS CONTROLLER
 * Provides conflict detection analytics and summaries
 */

const Business = require('../models/Business');
const conflictDetector = require('../utils/conflictDetector');

class ConflictAnalyticsController {
  /**
   * GET /api/conflicts/summary
   * Get conflict summary for user's businesses
   */
  async getConflictSummary(req, res) {
    try {
      const userId = req.user._id;
      
      // Get all businesses for user
      const businesses = await Business.find({ userId });
      
      // Calculate conflict summary
      const summary = conflictDetector.getConflictSummary(businesses);
      
      return res.json({
        success: true,
        summary
      });
      
    } catch (error) {
      console.error('[Conflicts] Error generating summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate conflict summary',
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/conflicts/businesses
   * Get businesses with conflicts
   */
  async getBusinessesWithConflicts(req, res) {
    try {
      const userId = req.user._id;
      const limit = parseInt(req.query.limit) || 50;
      
      // Get businesses with conflicts
      const businesses = await Business.find({
        userId,
        'conflictMetadata.hasConflicts': true
      })
      .sort({ 'conflictMetadata.totalConflicts': -1 })
      .limit(limit);
      
      return res.json({
        success: true,
        count: businesses.length,
        businesses
      });
      
    } catch (error) {
      console.error('[Conflicts] Error fetching businesses with conflicts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch businesses with conflicts',
        error: error.message
      });
    }
  }
  
  /**
   * GET /api/conflicts/business/:businessId
   * Get detailed conflict information for a specific business
   */
  async getBusinessConflicts(req, res) {
    try {
      const userId = req.user._id;
      const businessId = req.params.businessId;
      
      const business = await Business.findOne({
        _id: businessId,
        userId
      });
      
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }
      
      return res.json({
        success: true,
        business: {
          id: business._id,
          name: business.businessName,
          conflicts: business.conflicts,
          conflictMetadata: business.conflictMetadata
        }
      });
      
    } catch (error) {
      console.error('[Conflicts] Error fetching business conflicts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch business conflicts',
        error: error.message
      });
    }
  }
}

module.exports = new ConflictAnalyticsController();
