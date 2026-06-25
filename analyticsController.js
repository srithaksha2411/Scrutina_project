/**
 * MARKET INSIGHTS ANALYTICS CONTROLLER
 * 
 * Provides aggregated analytics data from MongoDB:
 * - Industry Distribution
 * - Top Services
 * - Trust Score Distribution
 * - Verification Analytics
 * - Geographic Distribution
 */

const Business = require('../models/Business');
const Research = require('../models/Research');

class AnalyticsController {
  /**
   * GET /api/analytics/market-insights
   * Returns comprehensive market analytics
   */
  async getMarketInsights(req, res) {
    try {
      console.log('[Analytics] Fetching market insights...');

      // Get user ID from authenticated request
      const userId = req.user._id;

      // Run all analytics queries in parallel for performance
      const [
        totalStats,
        industryData,
        servicesData,
        trustScoreData,
        verificationData,
        locationData,
        researchStats
      ] = await Promise.all([
        this.getTotalStatistics(userId),
        this.getIndustryDistribution(userId),
        this.getTopServices(userId),
        this.getTrustScoreDistribution(userId),
        this.getVerificationAnalytics(userId),
        this.getGeographicDistribution(userId),
        this.getResearchStatistics(userId)
      ]);

      const response = {
        success: true,
        data: {
          // Overview Stats
          totalBusinesses: totalStats.total,
          verifiedBusinesses: totalStats.verified,
          averageTrustScore: totalStats.avgTrustScore,
          researchSessions: researchStats.totalSessions,
          
          // Detailed Analytics
          industryDistribution: industryData,
          topServices: servicesData,
          trustScoreDistribution: trustScoreData,
          verificationAnalytics: verificationData,
          geographicDistribution: locationData
        }
      };

      console.log('[Analytics] Market insights generated successfully');
      return res.json(response);

    } catch (error) {
      console.error('[Analytics] Error generating market insights:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate market insights',
        error: error.message
      });
    }
  }

  /**
   * Get total business statistics
   */
  async getTotalStatistics(userId) {
    const result = await Business.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: {
            $sum: {
              $cond: [
                { $in: ['$verificationStatus', ['VERIFIED', 'HIGH_CONFIDENCE']] },
                1,
                0
              ]
            }
          },
          avgTrustScore: { $avg: '$verificationScore' }
        }
      }
    ]);

    if (result.length === 0) {
      return { total: 0, verified: 0, avgTrustScore: 0 };
    }

    return {
      total: result[0].total,
      verified: result[0].verified,
      avgTrustScore: Math.round(result[0].avgTrustScore || 0)
    };
  }

  /**
   * Get industry distribution with percentages
   */
  async getIndustryDistribution(userId) {
    const result = await Business.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $ifNull: ['$industry', 'Other'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Calculate total for percentages
    const total = result.reduce((sum, item) => sum + item.count, 0);

    return result.map(item => ({
      industry: item._id || 'Other',
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));
  }

  /**
   * Get top services across all businesses
   * Filters out common navigation/menu labels
   */
  async getTopServices(userId) {
    // Common website navigation/menu labels to exclude
    const excludedLabels = [
      // Navigation
      'home', 'about', 'about us', 'about us', 'contact', 'contact us',
      'careers', 'career', 'jobs', 'login', 'register', 'sign in', 'sign up',
      
      // Generic labels
      'services', 'service', 'products', 'product', 'solutions', 'solution',
      
      // Legal/Policy
      'privacy policy', 'privacy', 'terms', 'terms and conditions', 'terms of service',
      'cookie policy', 'disclaimer', 'legal', 'sitemap',
      
      // Social/Footer
      'blog', 'news', 'faq', 'faqs', 'help', 'support', 'support center',
      'testimonials', 'reviews', 'portfolio', 'gallery',
      
      // Other common noise
      'more', 'learn more', 'get started', 'download', 'pricing',
      'partners', 'clients', 'team', 'our team', 'company',
      
      // Single words that are too generic
      'resources', 'resource', 'industries', 'industry'
    ];

    const result = await Business.aggregate([
      // Filter by userId first
      { $match: { userId } },
      // Unwind services array
      { $unwind: '$services' },
      
      // Clean and normalize service names
      {
        $project: {
          service: {
            $trim: {
              input: { $toLower: '$services' }
            }
          }
        }
      },
      
      // Filter out excluded labels and too short/long services
      {
        $match: {
          service: {
            $nin: excludedLabels,
            $exists: true,
            $ne: '',
            // Service name length between 3 and 100 characters
            $regex: /^.{3,100}$/
          },
          // Exclude single words unless they're substantial (min 5 chars)
          $expr: {
            $or: [
              { $gte: [{ $strLenCP: '$service' }, 5] },
              { $gte: [{ $size: { $split: ['$service', ' '] } }, 2] }
            ]
          }
        }
      },
      
      // Group by service name
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      },
      
      // Only include services mentioned at least 2 times (reduces noise)
      {
        $match: {
          count: { $gte: 2 }
        }
      },
      
      // Sort by count descending
      { $sort: { count: -1 } },
      
      // Top 10 only
      { $limit: 10 },
      
      // Format output with proper capitalization
      {
        $project: {
          _id: 0,
          service: {
            $reduce: {
              input: { $split: ['$_id', ' '] },
              initialValue: '',
              in: {
                $concat: [
                  '$$value',
                  { $cond: [{ $eq: ['$$value', ''] }, '', ' '] },
                  { $toUpper: { $substrCP: ['$$this', 0, 1] } },
                  { $substrCP: ['$$this', 1, { $strLenCP: '$$this' }] }
                ]
              }
            }
          },
          count: 1
        }
      }
    ]);

    console.log(`[Analytics] Top Services: Found ${result.length} valid services after filtering`);
    return result;
  }

  /**
   * Get trust score distribution by ranges
   */
  async getTrustScoreDistribution(userId) {
    const result = await Business.aggregate([
      { $match: { userId } },
      {
        $bucket: {
          groupBy: '$verificationScore',
          boundaries: [0, 40, 60, 80, 90, 101],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            businesses: { $push: '$businessName' }
          }
        }
      }
    ]);

    // Map ranges to readable labels
    const rangeLabels = {
      0: 'Critical (0-39)',
      40: 'Low (40-59)',
      60: 'Medium (60-79)',
      80: 'High (80-89)',
      90: 'Excellent (90-100)'
    };

    return result.map(item => ({
      range: rangeLabels[item._id] || 'Unknown',
      rangeKey: item._id,
      count: item.count
    }));
  }

  /**
   * Get verification analytics
   */
  async getVerificationAnalytics(userId) {
    const result = await Business.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          verified: {
            $sum: {
              $cond: [
                { $in: ['$verificationStatus', ['VERIFIED', 'HIGH_CONFIDENCE']] },
                1,
                0
              ]
            }
          },
          highConfidence: {
            $sum: {
              $cond: [{ $eq: ['$verificationStatus', 'HIGH_CONFIDENCE'] }, 1, 0]
            }
          },
          mediumConfidence: {
            $sum: {
              $cond: [{ $eq: ['$verificationStatus', 'MEDIUM_CONFIDENCE'] }, 1, 0]
            }
          },
          lowConfidence: {
            $sum: {
              $cond: [{ $eq: ['$verificationStatus', 'LOW_CONFIDENCE'] }, 1, 0]
            }
          },
          unverified: {
            $sum: {
              $cond: [{ $eq: ['$verificationStatus', 'UNVERIFIED'] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    if (result.length === 0) {
      return {
        verified: 0,
        unverified: 0,
        total: 0,
        verifiedPercentage: 0,
        breakdown: []
      };
    }

    const data = result[0];
    const total = data.total;

    return {
      verified: data.verified,
      unverified: data.unverified + data.lowConfidence + data.mediumConfidence,
      total: total,
      verifiedPercentage: total > 0 ? Math.round((data.verified / total) * 100) : 0,
      breakdown: [
        { status: 'Verified', count: data.verified },
        { status: 'High Confidence', count: data.highConfidence },
        { status: 'Medium Confidence', count: data.mediumConfidence },
        { status: 'Low Confidence', count: data.lowConfidence },
        { status: 'Unverified', count: data.unverified }
      ]
    };
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(userId) {
    // Extract location from address field using aggregation
    const result = await Business.aggregate([
      // Filter by userId and only process businesses with addresses
      { $match: { userId, address: { $exists: true, $ne: null } } },
      // Extract country/city from address
      {
        $project: {
          location: {
            $cond: [
              { $regexMatch: { input: '$address', regex: /India/i } },
              'India',
              {
                $cond: [
                  { $regexMatch: { input: '$address', regex: /USA|United States/i } },
                  'USA',
                  {
                    $cond: [
                      { $regexMatch: { input: '$address', regex: /UK|United Kingdom/i } },
                      'UK',
                      {
                        $cond: [
                          { $regexMatch: { input: '$address', regex: /Germany/i } },
                          'Germany',
                          {
                            $cond: [
                              { $regexMatch: { input: '$address', regex: /UAE|Dubai/i } },
                              'UAE',
                              {
                                $cond: [
                                  { $regexMatch: { input: '$address', regex: /Canada/i } },
                                  'Canada',
                                  {
                                    $cond: [
                                      { $regexMatch: { input: '$address', regex: /Australia/i } },
                                      'Australia',
                                      {
                                        $cond: [
                                          { $regexMatch: { input: '$address', regex: /Singapore/i } },
                                          'Singapore',
                                          'Other'
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      // Group by location
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      // Sort by count
      { $sort: { count: -1 } },
      // Top 10
      { $limit: 10 },
      // Format
      {
        $project: {
          _id: 0,
          location: '$_id',
          count: 1
        }
      }
    ]);

    return result;
  }

  /**
   * Get research statistics for user
   */
  async getResearchStatistics(userId) {
    const count = await Research.countDocuments({ userId });
    return { totalSessions: count };
  }
}

module.exports = new AnalyticsController();
