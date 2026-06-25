const SearchCache = require('../models/SearchCache');

/**
 * Cache Service
 * Handles intelligent search result caching with 24-hour expiration
 */

class CacheService {
  /**
   * Get cached search results
   * @param {String} query - Search query
   * @param {String} category - Business category
   * @param {String} location - Location
   * @param {String} userId - User ID
   * @returns {Object|null} - Cached data or null
   */
  static async getCachedResults(query, category = '', location = '', userId) {
    try {
      console.log('[CacheService] Checking cache for:', { query, category, location, userId });
      
      const cache = await SearchCache.findValidCache(query, category, location, userId);
      
      if (!cache) {
        console.log('[CacheService] No valid cache found');
        return null;
      }
      
      if (!cache.isValid()) {
        console.log('[CacheService] Cache expired, removing...');
        await cache.deleteOne();
        return null;
      }
      
      console.log('[CacheService] Valid cache found, age:', this.formatCacheAge(cache.getCacheAge()));
      
      // Record cache access
      await cache.recordAccess();
      
      return {
        cached: true,
        cacheAge: cache.getCacheAge(),
        cachedAt: cache.createdAt,
        lastAccessed: cache.lastAccessed,
        accessCount: cache.accessCount,
        businessCount: cache.statistics.totalBusinesses || cache.searchResults?.length || 0,
        businesses: cache.searchResults,
        summary: cache.aiSummary || {},
        statistics: cache.statistics,
        trustScores: cache.trustScores,
        verificationResults: cache.verificationResults,
        researchId: cache.researchId
      };
    } catch (error) {
      console.error('[CacheService] Error getting cached results:', error);
      return null;
    }
  }

  /**
   * Store search results in cache
   * @param {Object} params - Cache parameters
   * @returns {Object} - Created cache document
   */
  static async setCachedResults({
    query,
    category = '',
    location = '',
    userId,
    researchId,
    searchResults,
    aiSummary = {},
    statistics = {},
    trustScores = {},
    verificationResults = {},
    expirationHours = 24
  }) {
    try {
      console.log('[CacheService] Storing cache for:', { query, category, location, userId });
      
      const normalizedQuery = SearchCache.normalizeQuery(query, category, location);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);
      
      // Remove old cache for the same query
      await SearchCache.deleteMany({
        normalizedQuery,
        userId
      });
      
      // Create new cache entry
      const cache = await SearchCache.create({
        query,
        category,
        location,
        normalizedQuery,
        userId,
        researchId,
        searchResults,
        aiSummary,
        statistics: {
          totalBusinesses: searchResults?.length || 0,
          verifiedCount: statistics.verifiedCount || 0,
          duplicatesRemoved: statistics.duplicatesRemoved || 0,
          totalFound: statistics.totalFound || searchResults?.length || 0
        },
        trustScores,
        verificationResults,
        createdAt: now,
        expiresAt,
        lastAccessed: now,
        accessCount: 0
      });
      
      console.log('[CacheService] Cache stored successfully, expires at:', expiresAt);
      
      return cache;
    } catch (error) {
      console.error('[CacheService] Error storing cache:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific query
   * @param {String} query - Search query
   * @param {String} category - Business category
   * @param {String} location - Location
   * @param {String} userId - User ID
   */
  static async invalidateCache(query, category = '', location = '', userId) {
    try {
      const normalizedQuery = SearchCache.normalizeQuery(query, category, location);
      
      const result = await SearchCache.deleteMany({
        normalizedQuery,
        userId
      });
      
      console.log('[CacheService] Invalidated cache:', result.deletedCount, 'documents');
      return result;
    } catch (error) {
      console.error('[CacheService] Error invalidating cache:', error);
      throw error;
    }
  }

  /**
   * Clear all expired cache entries
   * Note: MongoDB TTL index handles this automatically, but this is for manual cleanup
   */
  static async clearExpiredCache() {
    try {
      const now = new Date();
      
      const result = await SearchCache.deleteMany({
        expiresAt: { $lt: now }
      });
      
      console.log('[CacheService] Cleared expired cache:', result.deletedCount, 'documents');
      return result;
    } catch (error) {
      console.error('[CacheService] Error clearing expired cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for a user
   * @param {String} userId - User ID
   */
  static async getCacheStats(userId) {
    try {
      const totalCached = await SearchCache.countDocuments({ userId });
      const validCached = await SearchCache.countDocuments({
        userId,
        expiresAt: { $gt: new Date() }
      });
      
      const cacheHitRate = await SearchCache.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalAccesses: { $sum: '$accessCount' },
            totalCaches: { $sum: 1 }
          }
        }
      ]);
      
      return {
        totalCached,
        validCached,
        expiredCached: totalCached - validCached,
        totalAccesses: cacheHitRate[0]?.totalAccesses || 0,
        avgAccessesPerCache: cacheHitRate[0]?.totalAccesses / cacheHitRate[0]?.totalCaches || 0
      };
    } catch (error) {
      console.error('[CacheService] Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Format cache age for display
   * @param {Number} ageMs - Age in milliseconds
   * @returns {String} - Formatted age
   */
  static formatCacheAge(ageMs) {
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  /**
   * Extract category and location from query using simple heuristics
   * @param {String} query - Search query
   * @returns {Object} - { category, location }
   */
  static parseQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Common location indicators
    const locationKeywords = ['in', 'at', 'near', 'around'];
    let location = '';
    let category = query;
    
    for (const keyword of locationKeywords) {
      const index = lowerQuery.indexOf(` ${keyword} `);
      if (index !== -1) {
        category = query.substring(0, index).trim();
        location = query.substring(index + keyword.length + 2).trim();
        break;
      }
    }
    
    return { category, location };
  }
}

module.exports = CacheService;
