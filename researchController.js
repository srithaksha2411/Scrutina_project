const businessIntelligenceOrchestrator = require('../services/businessIntelligenceOrchestrator');
const aiExecutiveSummary = require('../services/aiExecutiveSummary');
const { calculateTrustScore } = require('../utils/trustScoreCalculator');
const { calculateSecurityScore } = require('../utils/securityScoreCalculator');
const CacheService = require('../services/cacheService');

/**
 * @desc    Get user research statistics
 * @route   GET /api/research/stats
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await businessIntelligenceOrchestrator.getResearchStats(userId);

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
};

/**
 * @desc    Perform business research
 * @route   POST /api/research/search
 * @access  Private
 */
const searchBusinesses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query } = req.body;

    // Validation
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    if (query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters'
      });
    }

    const trimmedQuery = query.trim();
    
    // Parse query to extract category and location
    const { category, location } = CacheService.parseQuery(trimmedQuery);
    
    // Check cache first
    console.log('[ResearchController] Checking cache for query:', trimmedQuery);
    const cachedResult = await CacheService.getCachedResults(
      trimmedQuery,
      category,
      location,
      userId.toString()
    );
    
    if (cachedResult) {
      console.log('[ResearchController] Cache hit! Returning cached results');
      return res.status(200).json({
        success: true,
        cached: true,
        cacheAge: cachedResult.cacheAge,
        cachedAt: cachedResult.cachedAt,
        businessCount: cachedResult.businessCount,
        accessCount: cachedResult.accessCount,
        researchId: cachedResult.researchId,
        businesses: cachedResult.businesses,
        summary: cachedResult.summary || {
          totalFound: cachedResult.businessCount,
          verifiedCount: cachedResult.statistics?.verifiedCount || 0,
          duplicatesRemoved: cachedResult.statistics?.duplicatesRemoved || 0
        }
      });
    }
    
    console.log('[ResearchController] Cache miss. Executing fresh research...');

    // Execute business intelligence pipeline
    const result = await businessIntelligenceOrchestrator.executeResearch(userId, trimmedQuery);
    
    // Store results in cache if successful
    if (result.success && result.businesses && result.businesses.length > 0) {
      console.log('[ResearchController] Storing results in cache');
      try {
        await CacheService.setCachedResults({
          query: trimmedQuery,
          category,
          location,
          userId: userId.toString(),
          researchId: result.researchId,
          searchResults: result.businesses,
          aiSummary: result.summary || {},
          statistics: {
            totalFound: result.summary?.totalFound || result.businesses.length,
            verifiedCount: result.summary?.verifiedCount || 0,
            duplicatesRemoved: result.summary?.duplicatesRemoved || 0
          },
          trustScores: {},
          verificationResults: {},
          expirationHours: 24
        });
        console.log('[ResearchController] Cache stored successfully');
      } catch (cacheError) {
        console.error('[ResearchController] Failed to store cache:', cacheError);
        // Continue without caching - don't break the flow
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Search businesses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform research. Please try again.'
    });
  }
};

/**
 * @desc    Get research history
 * @route   GET /api/research/history
 * @access  Private
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const history = await businessIntelligenceOrchestrator.getResearchHistory(userId, limit);

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research history'
    });
  }
};

/**
 * @desc    Get specific research by ID
 * @route   GET /api/research/:id
 * @access  Private
 */
const getResearchById = async (req, res) => {
  try {
    const userId = req.user._id;
    const researchId = req.params.id;

    const research = await businessIntelligenceOrchestrator.getResearchById(researchId, userId);

    res.status(200).json({
      success: true,
      research
    });
  } catch (error) {
    console.error('Get research error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Research not found'
    });
  }
};

/**
 * @desc    Get specific research by ID with full business details
 * @route   GET /api/research/history/:researchId
 * @access  Private
 */
const getResearchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const researchId = req.params.researchId;

    const result = await businessIntelligenceOrchestrator.getResearchWithBusinesses(researchId, userId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get research history error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Research not found'
    });
  }
};

/**
 * @desc    Generate PDF report for specific research
 * @route   GET /api/research/report/:researchId
 * @access  Private
 */
const generatePDFReport = async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      message: 'PDF generation temporarily unavailable. Feature will be restored soon.'
    });
  } catch (error) {
    console.error('[PDF] Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report'
    });
  }
};

/**
 * @desc    Generate AI Executive Summary for a business
 * @route   POST /api/research/executive-summary
 * @access  Private
 */
const generateExecutiveSummary = async (req, res) => {
  try {
    const { business } = req.body;

    if (!business) {
      return res.status(400).json({
        success: false,
        message: 'Business data is required'
      });
    }

    // Calculate scores
    const trustScoreData = calculateTrustScore(business);
    const securityScoreData = calculateSecurityScore(business);

    // Generate summary
    const summary = aiExecutiveSummary.generateExecutiveSummary(
      business,
      trustScoreData.percentage,
      securityScoreData
    );

    // Calculate credibility
    const credibility = aiExecutiveSummary.calculateBusinessCredibility(trustScoreData.percentage);

    // Get security outlook
    const securityOutlook = aiExecutiveSummary.getSecurityOutlook(securityScoreData);

    // Generate recommendations
    const recommendations = aiExecutiveSummary.generateRecommendations(
      business,
      trustScoreData.percentage,
      securityScoreData
    );

    res.status(200).json({
      success: true,
      executiveSummary: {
        summary,
        credibility,
        securityOutlook,
        recommendations
      }
    });
  } catch (error) {
    console.error('Generate executive summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate executive summary'
    });
  }
};

module.exports = {
  getStats,
  searchBusinesses,
  getHistory,
  getResearchById,
  getResearchHistory,
  generatePDFReport,
  generateExecutiveSummary
};
