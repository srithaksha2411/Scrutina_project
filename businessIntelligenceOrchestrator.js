/**
 * MASTER BUSINESS INTELLIGENCE ORCHESTRATOR
 * 
 * Coordinates all phases of the business intelligence pipeline:
 * Phase 1: Business Discovery
 * Phase 2: Data Enrichment
 * Phase 3: Multi-Source Aggregation
 * Phase 4: Duplicate Detection (integrated in Phase 3)
 * Phase 5: Verification Engine
 * Phase 6: MongoDB Storage
 * Phase 7: Research Record Management
 */

const businessDiscoveryService = require('./businessDiscoveryService');
const dataEnrichmentService = require('./dataEnrichmentService');
const industryClassificationService = require('./industryClassificationService');
const multiSourceAggregationService = require('./multiSourceAggregationService');
const verificationEngine = require('./verificationEngine');
const mongoDBStorageService = require('./mongoDBStorageService');
const Research = require('../models/Research');

class BusinessIntelligenceOrchestrator {
  /**
   * MAIN ORCHESTRATION METHOD
   * Executes complete business intelligence pipeline
   */
  async executeResearch(userId, query) {
    const startTime = Date.now();
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SCRUTINA BUSINESS INTELLIGENCE ENGINE`);
    console.log(`Query: "${query}"`);
    console.log(`User: ${userId}`);
    console.log(`${'='.repeat(60)}\n`);

    let research;

    try {
      // Create research record
      research = await Research.create({
        userId,
        query,
        status: 'processing',
        businesses: [],
        summary: {
          totalFound: 0,
          verifiedCount: 0,
          duplicatesRemoved: 0
        }
      });

      // PHASE 1: BUSINESS DISCOVERY
      const discoveredBusinesses = await businessDiscoveryService.discoverBusinesses(query);
      
      if (discoveredBusinesses.length === 0) {
        return await this.completeResearch(research, [], startTime, 'No businesses discovered');
      }

      console.log(`[Pipeline] Phase 1 Complete: ${discoveredBusinesses.length} businesses discovered\n`);

      // PHASE 2: DATA ENRICHMENT
      const enrichedBusinesses = await dataEnrichmentService.batchEnrich(
        discoveredBusinesses,
        5 // Max 5 concurrent enrichments
      );

      console.log(`[Pipeline] Phase 2 Complete: ${enrichedBusinesses.length} businesses enriched\n`);

      // PHASE 2.5: INDUSTRY CLASSIFICATION
      const classifiedBusinesses = industryClassificationService.batchClassify(enrichedBusinesses);
      console.log(`[Pipeline] Phase 2.5 Complete: industries classified\n`);

      // PHASE 3: MULTI-SOURCE AGGREGATION (includes duplicate detection)
      const aggregatedBusinesses = await multiSourceAggregationService.aggregateBusinesses(classifiedBusinesses);
      
      const duplicatesRemoved = discoveredBusinesses.length - aggregatedBusinesses.length;
      console.log(`[Pipeline] Phase 3 Complete: ${aggregatedBusinesses.length} unique businesses (${duplicatesRemoved} duplicates removed)\n`);

      // PHASE 5: VERIFICATION ENGINE
      const verifiedBusinesses = await verificationEngine.verifyBusinesses(aggregatedBusinesses);
      
      console.log(`[Pipeline] Phase 5 Complete: ${verifiedBusinesses.length} businesses verified\n`);

      // PHASE 6: MONGODB STORAGE
      const storageResult = await mongoDBStorageService.saveBusinesses(verifiedBusinesses, userId, research._id);
      
      console.log(`[Pipeline] Phase 6 Complete: ${storageResult.saved} saved, ${storageResult.updated} updated\n`);

      // PHASE 7: UPDATE RESEARCH RECORD
      const verifiedCount = verifiedBusinesses.filter(
        b => b.verificationStatus === 'VERIFIED' || b.verificationStatus === 'HIGH_CONFIDENCE'
      ).length;

      console.log(`\n[Pipeline] ========== BUSINESS MAPPING ==========`);
      console.log(`[Pipeline] DEBUG - verifiedBusinesses[0] keys:`, Object.keys(verifiedBusinesses[0] || {}));
      console.log(`[Pipeline] DEBUG - verifiedBusinesses[0].socialProfiles:`, verifiedBusinesses[0]?.socialProfiles);
      console.log(`[Pipeline] DEBUG - verifiedBusinesses[0].sourceUrls:`, verifiedBusinesses[0]?.sourceUrls);
      
      // Map BEFORE saving to Mongoose to preserve nested objects
      const mappedBusinesses = verifiedBusinesses.map((b, i) => {
        console.log(`[Pipeline] ${i + 1}. "${b.businessName}" - socialProfiles: ${b.socialProfiles ? Object.keys(b.socialProfiles).filter(k => b.socialProfiles[k]).length : 0}, sourceUrls: ${b.sourceUrls?.length || 0}`);
        
        return {
          name: b.businessName,
          industry: b.industry,
          industryConfidence: b.industryConfidence,
          website: b.website,
          phone: b.phone,
          email: b.email,
          address: b.address,
          description: b.description,
          socialProfiles: b.socialProfiles || {},
          services: b.services || [],
          certifications: b.certifications || [],
          verificationScore: b.verificationScore,
          verificationStatus: b.verificationStatus,
          sourceUrls: Array.isArray(b.sourceUrls) ? b.sourceUrls : [],
          source: b.sourceTypes?.[0] || 'unknown'
        };
      });
      console.log(`[Pipeline] ================================================\n`);
      
      research.businesses = mappedBusinesses;

      research.summary = {
        totalFound: verifiedBusinesses.length,
        verifiedCount: verifiedCount,
        duplicatesRemoved: duplicatesRemoved
      };

      research.status = 'completed';
      await research.save();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Generate final summary
      const summary = this.generateSummary(
        query,
        verifiedBusinesses,
        duplicatesRemoved,
        verifiedCount,
        duration,
        storageResult
      );

      console.log(`\n${'='.repeat(60)}`);
      console.log(`RESEARCH COMPLETE`);
      console.log(`Duration: ${duration}s`);
      console.log(`Businesses: ${verifiedBusinesses.length}`);
      console.log(`Verified: ${verifiedCount}`);
      console.log(`${'='.repeat(60)}\n`);

      // Use the already-mapped businesses (before Mongoose conversion)
      console.log(`[Pipeline] DEBUG - First business socialProfiles: ${JSON.stringify(mappedBusinesses[0]?.socialProfiles)}`);
      console.log(`[Pipeline] DEBUG - First business sourceUrls: ${JSON.stringify(mappedBusinesses[0]?.sourceUrls)}`);

      return {
        success: true,
        researchId: research._id,
        businesses: mappedBusinesses,
        summary,
        stats: {
          totalDiscovered: discoveredBusinesses.length,
          afterEnrichment: enrichedBusinesses.length,
          afterAggregation: aggregatedBusinesses.length,
          duplicatesRemoved: duplicatesRemoved,
          saved: storageResult.saved,
          updated: storageResult.updated,
          duration: parseFloat(duration)
        }
      };

    } catch (error) {
      console.error('\n[Pipeline] ERROR:', error.message);
      console.error(error.stack);

      if (research) {
        research.status = 'failed';
        await research.save();
      }

      throw error;
    }
  }

  /**
   * Generate comprehensive summary
   */
  generateSummary(query, businesses, duplicatesRemoved, verifiedCount, duration, storageResult) {
    const verificationStats = verificationEngine.getVerificationStats(businesses);

    return {
      query,
      totalFound: businesses.length,
      totalBusinesses: businesses.length,
      verifiedCount,
      duplicatesRemoved,
      durationSeconds: parseFloat(duration),
      verificationStats: {
        verified: verificationStats.statusCounts.VERIFIED,
        highConfidence: verificationStats.statusCounts.HIGH_CONFIDENCE,
        mediumConfidence: verificationStats.statusCounts.MEDIUM_CONFIDENCE,
        lowConfidence: verificationStats.statusCounts.LOW_CONFIDENCE,
        averageScore: verificationStats.averageScore
      },
      dataCompleteness: this.calculateDataCompleteness(businesses),
      storage: {
        saved: storageResult.saved,
        updated: storageResult.updated,
        failed: storageResult.failed
      }
    };
  }

  /**
   * Calculate data completeness statistics
   */
  calculateDataCompleteness(businesses) {
    const total = businesses.length;
    
    return {
      withWebsite: businesses.filter(b => b.website).length,
      withPhone: businesses.filter(b => b.phone).length,
      withEmail: businesses.filter(b => b.email).length,
      withAddress: businesses.filter(b => b.address).length,
      withDescription: businesses.filter(b => b.description).length,
      withSocialProfiles: businesses.filter(b => 
        b.socialProfiles?.linkedin || b.socialProfiles?.facebook || b.socialProfiles?.instagram
      ).length,
      withReviews: businesses.filter(b => b.reviewCount > 0).length,
      completeness: Math.round(
        (businesses.reduce((sum, b) => sum + b.verificationScore, 0) / total / 100) * 100
      )
    };
  }

  /**
   * Complete research with no results
   */
  async completeResearch(research, businesses, startTime, message) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    research.status = 'completed';
    research.summary = {
      totalFound: 0,
      verifiedCount: 0,
      duplicatesRemoved: 0
    };
    await research.save();

    console.log(`\n[Pipeline] ${message}`);
    console.log(`[Pipeline] Duration: ${duration}s\n`);

    return {
      success: true,
      message,
      researchId: research._id,
      businesses: [],
      summary: {
        query: research.query,
        totalBusinesses: 0,
        duplicatesRemoved: 0,
        durationSeconds: parseFloat(duration),
        verificationStats: null,
        dataCompleteness: null,
        storage: { saved: 0, updated: 0, failed: 0 }
      },
      stats: {
        totalDiscovered: 0,
        afterEnrichment: 0,
        afterAggregation: 0,
        duplicatesRemoved: 0,
        saved: 0,
        updated: 0,
        duration: parseFloat(duration)
      }
    };
  }

  /**
   * Get research statistics
   */
  async getResearchStats(userId) {
    try {
      const researches = await Research.find({ userId });

      const stats = {
        totalResearches: researches.length,
        totalBusinessesFound: 0,
        totalVerified: 0,
        totalDuplicatesRemoved: 0,
        completedResearches: 0,
        failedResearches: 0
      };

      researches.forEach(research => {
        stats.totalBusinessesFound += research.summary.totalFound || 0;
        stats.totalVerified += research.summary.verifiedCount || 0;
        stats.totalDuplicatesRemoved += research.summary.duplicatesRemoved || 0;
        
        if (research.status === 'completed') stats.completedResearches++;
        if (research.status === 'failed') stats.failedResearches++;
      });

      return stats;

    } catch (error) {
      console.error('[Orchestrator] Error fetching stats:', error.message);
      throw error;
    }
  }

  /**
   * Get research history
   */
  async getResearchHistory(userId, limit = 10) {
    try {
      const history = await Research.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('query summary status createdAt');

      return history;

    } catch (error) {
      console.error('[Orchestrator] Error fetching history:', error.message);
      throw error;
    }
  }

  /**
   * Get research by ID
   */
  async getResearchById(researchId, userId) {
    try {
      const research = await Research.findOne({ _id: researchId, userId });

      if (!research) {
        throw new Error('Research not found');
      }

      return research;

    } catch (error) {
      console.error('[Orchestrator] Error fetching research:', error.message);
      throw error;
    }
  }
  /**
   * Get research by ID with full business details from MongoDB
   */
  async getResearchWithBusinesses(researchId, userId) {
    try {
      console.log(`\n[Orchestrator] Loading research history: ${researchId}`);

      const research = await Research.findOne({ _id: researchId, userId });

      if (!research) {
        throw new Error('Research not found');
      }

      console.log(`[Orchestrator] Found research: "${research.query}"`);
      console.log(`[Orchestrator] Stored businesses: ${research.businesses.length}`);

      // Get Business model
      const Business = require('../models/Business');

      // Map stored businesses and enrich with MongoDB data if available
      const enrichedBusinesses = [];
      let unavailableCount = 0;

      for (const storedBusiness of research.businesses) {
        // Try to find full business data in MongoDB by website
        let fullBusiness = null;
        
        if (storedBusiness.website) {
          fullBusiness = await Business.findOne({ website: storedBusiness.website });
        }

        if (fullBusiness) {
          // Use full MongoDB data
          enrichedBusinesses.push({
            name: fullBusiness.businessName || storedBusiness.name,
            businessName: fullBusiness.businessName || storedBusiness.name,
            industry: fullBusiness.industry || storedBusiness.industry,
            website: fullBusiness.website,
            phone: fullBusiness.phone,
            email: fullBusiness.email,
            address: fullBusiness.address,
            description: fullBusiness.description,
            services: fullBusiness.services || [],
            certifications: fullBusiness.certifications || [],
            socialProfiles: fullBusiness.socialProfiles || {},
            dataSources: fullBusiness.dataSources || [],
            sourceUrls: fullBusiness.sourceUrls || [],
            verificationScore: fullBusiness.verificationScore || storedBusiness.verificationScore,
            verificationStatus: fullBusiness.verificationStatus,
            rating: fullBusiness.rating,
            reviewCount: fullBusiness.reviewCount,
            verified: fullBusiness.verified
          });
        } else {
          // Use stored research data (business may have been deleted)
          unavailableCount++;
          enrichedBusinesses.push({
            name: storedBusiness.name,
            businessName: storedBusiness.name,
            industry: storedBusiness.industry,
            website: storedBusiness.website,
            phone: storedBusiness.phone,
            email: storedBusiness.email,
            address: storedBusiness.address,
            description: storedBusiness.description || null,
            services: storedBusiness.services || [],
            certifications: storedBusiness.certifications || [],
            socialProfiles: storedBusiness.socialProfiles || {},
            dataSources: [],
            sourceUrls: storedBusiness.sourceUrls || [],
            verificationScore: storedBusiness.verificationScore || 0,
            verificationStatus: storedBusiness.verificationStatus || 'MEDIUM_CONFIDENCE',
            rating: null,
            reviewCount: 0,
            verified: false,
            _archived: true // Mark as archived/historical data
          });
        }
      }

      console.log(`[Orchestrator] Enriched businesses: ${enrichedBusinesses.length}`);
      // Suppress warning - using cached data is normal behavior
      // if (unavailableCount > 0) {
      //   console.log(`[Orchestrator] ⚠️  ${unavailableCount} businesses no longer in database (using cached data)`);
      // }

      // Generate summary statistics
      const summary = {
        query: research.query,
        totalFound: enrichedBusinesses.length,
        totalBusinesses: enrichedBusinesses.length,
        verifiedCount: research.summary.verifiedCount || 0,
        duplicatesRemoved: research.summary.duplicatesRemoved || 0,
        unavailableBusinesses: unavailableCount
      };

      return {
        research: {
          _id: research._id,
          query: research.query,
          status: research.status,
          createdAt: research.createdAt
        },
        businesses: enrichedBusinesses,
        summary,
        message: unavailableCount > 0 
          ? `Loaded ${enrichedBusinesses.length} businesses (${unavailableCount} using cached data)`
          : `Loaded ${enrichedBusinesses.length} businesses from history`
      };

    } catch (error) {
      console.error('[Orchestrator] Error loading research history:', error.message);
      throw error;
    }
  }
}

module.exports = new BusinessIntelligenceOrchestrator();
