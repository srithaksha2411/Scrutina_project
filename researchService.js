const Research = require('../models/Research');
const Business = require('../models/Business');
const businessResearchService = require('./businessResearchService');
const businessScraperService = require('./businessScraperService');
const deduplicationService = require('./deduplicationService');
const verificationService = require('./verificationService');
const emailExtractionService = require('./emailExtractionService');
const sourceUrlTrackingService = require('./sourceUrlTrackingService');

class ResearchService {
  /**
   * Get user research statistics
   */
  async getUserStats(userId) {
    try {
      const researches = await Research.find({ userId });

      let totalBusinessesFound = 0;
      let totalVerified = 0;
      let totalDuplicatesRemoved = 0;

      researches.forEach(research => {
        totalBusinessesFound += research.summary.totalFound || 0;
        totalVerified += research.summary.verifiedCount || 0;
        totalDuplicatesRemoved += research.summary.duplicatesRemoved || 0;
      });

      return {
        totalBusinessesFound,
        totalVerified,
        totalDuplicatesRemoved,
        totalResearches: researches.length
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  /**
   * COMPLETE BUSINESS RESEARCH PIPELINE
   */
  async performResearch(userId, query) {
    const startTime = Date.now();
    console.log(`\n========== BUSINESS RESEARCH STARTED ==========`);
    console.log(`Query: ${query}`);
    console.log(`===============================================\n`);

    try {
      const research = await Research.create({
        userId,
        query,
        status: 'processing'
      });

      // PHASE 1: Get SerpAPI data
      console.log('[Phase 1] Fetching SerpAPI results...');
      const serpAPIData = await this.getSerpAPIData(query);
      
      if (!serpAPIData) {
        return this.completeResearch(research, [], startTime, 'No SerpAPI results');
      }

      // PHASE 2: Extract business records
      console.log('[Phase 2] Extracting business records...');
      let businesses = businessResearchService.extractBusinessRecords(serpAPIData, query);
      
      if (businesses.length === 0) {
        return this.completeResearch(research, [], startTime, 'No businesses extracted');
      }

      console.log(`[Phase 2] Extracted ${businesses.length} businesses`);

      // PHASE 2.5: Initialize source tracking
      console.log('[Phase 2.5] Initializing source tracking...');
      businesses = businesses.map(business => {
        sourceUrlTrackingService.initializeTracking(business);
        
        // Add SerpAPI source
        if (business.website) {
          sourceUrlTrackingService.addSource(business, business.website);
        }
        
        return business;
      });
      console.log('[Phase 2.5] Source tracking initialized');

      // PHASE 3: Remove duplicates
      console.log('[Phase 3] Removing duplicates...');
      const dedupResult = await deduplicationService.removeDuplicates(businesses);
      businesses = dedupResult.unique;
      const duplicatesRemoved = dedupResult.duplicatesFound;

      console.log(`[Phase 3] ${duplicatesRemoved} duplicates removed`);

      // PHASE 4: Scrape websites
      console.log('[Phase 4] Scraping business websites...');
      const websitesToScrape = businesses
        .filter(b => b.website)
        .slice(0, 10)
        .map(b => ({ url: b.website, businessName: b.businessName }));

      if (websitesToScrape.length > 0) {
        const scrapedData = await businessScraperService.batchScrape(websitesToScrape);
        businesses = this.mergeScrapedData(businesses, scrapedData);
        
        // Track scraped pages as sources
        businesses.forEach(business => {
          if (business.website) {
            sourceUrlTrackingService.trackWebsiteSources(business, business.website, [
              business.website + '/contact',
              business.website + '/about'
            ]);
          }
          
          // Track social media sources
          if (business.socialProfiles) {
            sourceUrlTrackingService.trackSocialSources(business, business.socialProfiles);
          }
        });
      }

      console.log('[Phase 4] Scraping complete');

      // PHASE 4.5: Extract emails from websites
      console.log('[Phase 4.5] Extracting emails...');
      businesses = await emailExtractionService.extractEmailsForBusinesses(businesses);
      console.log('[Phase 4.5] Email extraction complete');

      // PHASE 5: Verify businesses
      console.log('[Phase 5] Verifying businesses...');
      businesses = verificationService.batchVerify(businesses);
      const verificationSummary = verificationService.getVerificationSummary(businesses);

      // PHASE 5.5: Finalize source tracking
      console.log('[Phase 5.5] Finalizing source tracking...');
      businesses = sourceUrlTrackingService.batchProcess(businesses);
      console.log('[Phase 5.5] Source tracking complete');

      // PHASE 6: Save to MongoDB
      console.log('[Phase 6] Saving to MongoDB...');
      const saveResult = await deduplicationService.batchSave(businesses);

      // PHASE 7: Update research record
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
      
      research.businesses = businesses.map(b => ({
        name: b.businessName,
        industry: b.industry || null,
        website: b.website,
        phone: b.phone || null,
        email: b.email || null,
        address: b.address || null,
        verificationScore: b.trustScore,
        source: b.dataSource || 'serp_api',
        sourceUrls: b.sourceUrls || []
      }));

      research.summary = {
        totalFound: businesses.length,
        verifiedCount: verificationSummary.verified,
        duplicatesRemoved
      };
      research.status = 'completed';
      await research.save();

      const summary = {
        query,
        businessesFound: businesses.length,
        verifiedBusinesses: verificationSummary.verified,
        duplicatesRemoved,
        sourcesSearched: 1,
        durationSeconds: parseFloat(durationSeconds)
      };

      console.log(`\n========== COMPLETE ==========`);
      console.log(`Found: ${summary.businessesFound}`);
      console.log(`Verified: ${summary.verifiedBusinesses}`);
      console.log(`Duration: ${summary.durationSeconds}s`);
      console.log(`==============================\n`);

      return {
        success: true,
        message: `Found ${businesses.length} businesses`,
        businesses,
        summary,
        researchId: research._id
      };

    } catch (error) {
      console.error('Research error:', error);
      throw error;
    }
  }

  /**
   * Get SerpAPI data
   */
  async getSerpAPIData(query) {
    try {
      const serpAPIKey = process.env.SERP_API_KEY;
      if (!serpAPIKey) {
        console.error('[SerpAPI] Key not configured');
        return null;
      }

      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpAPIKey}&engine=google&num=30`
      );
      
      if (!response.ok) {
        console.error(`[SerpAPI] Error: ${response.status}`);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('[SerpAPI] Failed:', error.message);
      return null;
    }
  }

  /**
   * Merge scraped data with businesses
   */
  mergeScrapedData(businesses, scrapedData) {
    const scrapedMap = new Map();
    scrapedData.forEach(data => scrapedMap.set(data.url, data));

    return businesses.map(business => {
      const scraped = scrapedMap.get(business.website);
      if (scraped) {
        return {
          ...business,
          businessName: scraped.businessName || business.businessName,
          phone: scraped.phone || business.phone,
          email: scraped.email || business.email,
          address: scraped.address || business.address,
          description: scraped.description || business.description,
          industry: scraped.industry || business.industry,
          socialProfiles: scraped.socialProfiles || business.socialProfiles
        };
      }
      return business;
    });
  }

  /**
   * Complete research with empty results
   */
  async completeResearch(research, businesses, startTime, message) {
    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    
    research.status = 'completed';
    research.summary = {
      totalFound: 0,
      verifiedCount: 0,
      duplicatesRemoved: 0
    };
    await research.save();

    return {
      success: true,
      message,
      businesses: [],
      summary: {
        query: research.query,
        businessesFound: 0,
        verifiedBusinesses: 0,
        duplicatesRemoved: 0,
        sourcesSearched: 1,
        durationSeconds: parseFloat(durationSeconds)
      },
      researchId: research._id
    };
  }

  /**
   * Get research history
   */
  async getResearchHistory(userId, limit = 10) {
    try {
      const researches = await Research.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('query summary status createdAt');

      return researches;
    } catch (error) {
      console.error('Error fetching research history:', error);
      throw error;
    }
  }

  /**
   * Get research by ID
   */
  async getResearchById(researchId, userId) {
    try {
      const research = await Research.findOne({ 
        _id: researchId, 
        userId 
      });

      if (!research) {
        throw new Error('Research not found');
      }

      return research;
    } catch (error) {
      console.error('Error fetching research:', error);
      throw error;
    }
  }
}

module.exports = new ResearchService();
