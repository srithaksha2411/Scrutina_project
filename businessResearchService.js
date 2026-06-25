/**
 * Business Research Service
 * 
 * Extracts structured business records from SerpAPI results
 * Builds comprehensive business profiles from search data
 */

class BusinessResearchService {
  /**
   * Process SerpAPI results and extract business records
   * @param {Object} serpAPIData - Raw SerpAPI response
   * @param {string} query - Original search query
   * @returns {Array} - Structured business records
   */
  extractBusinessRecords(serpAPIData, query) {
    console.log('[Business Research] Starting business extraction...');
    const businesses = [];

    // Extract from local results (highest quality)
    if (serpAPIData.local_results && Array.isArray(serpAPIData.local_results)) {
      serpAPIData.local_results.forEach(result => {
        const business = {
          businessName: result.title || '',
          website: result.link || result.website || '',
          location: result.address || this.extractLocationFromQuery(query),
          sourceUrl: result.link || '',
          phone: result.phone || '',
          rating: result.rating || 0,
          reviews: result.reviews || 0,
          dataSource: 'serp_api_local'
        };

        if (business.businessName) {
          businesses.push(business);
          console.log(`[Business Research] Extracted: ${business.businessName}`);
        }
      });
    }

    // Extract from organic results
    if (serpAPIData.organic_results && Array.isArray(serpAPIData.organic_results)) {
      serpAPIData.organic_results.forEach(result => {
        // Filter out non-business results
        if (this.isBusinessResult(result.title)) {
          const business = {
            businessName: this.cleanBusinessName(result.title),
            website: result.link || '',
            location: this.extractLocationFromQuery(query),
            sourceUrl: result.link || '',
            phone: '',
            description: result.snippet || '',
            dataSource: 'serp_api_organic'
          };

          if (business.businessName && business.website) {
            businesses.push(business);
            console.log(`[Business Research] Extracted: ${business.businessName}`);
          }
        }
      });
    }

    // Extract from knowledge graph
    if (serpAPIData.knowledge_graph) {
      const kg = serpAPIData.knowledge_graph;
      const business = {
        businessName: kg.title || '',
        website: kg.website || '',
        location: kg.location || this.extractLocationFromQuery(query),
        sourceUrl: kg.website || '',
        phone: kg.phone || '',
        description: kg.description || '',
        dataSource: 'serp_api'
      };

      if (business.businessName) {
        businesses.push(business);
        console.log(`[Business Research] Extracted from KG: ${business.businessName}`);
      }
    }

    console.log(`[Business Research] Total businesses extracted: ${businesses.length}`);
    return businesses;
  }

  /**
   * Check if search result is a business (not an article/blog)
   */
  isBusinessResult(title) {
    if (!title) return false;

    const lowerTitle = title.toLowerCase();
    const excludePatterns = [
      'top 10', 'top 5', 'best', 'near me', 'list of',
      'how to', 'what is', 'guide to', 'wikipedia',
      'blog', 'article', 'news'
    ];

    for (const pattern of excludePatterns) {
      if (lowerTitle.includes(pattern)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clean business name from search result title
   */
  cleanBusinessName(title) {
    return title
      .replace(/\s*[-–|].*$/, '')  // Remove everything after dash/pipe
      .replace(/\s*\(.*\)\s*/g, '') // Remove parentheses
      .trim();
  }

  /**
   * Extract location from search query
   */
  extractLocationFromQuery(query) {
    const cities = [
      'Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune',
      'Kolkata', 'Ahmedabad', 'Coimbatore', 'Kochi', 'Trivandrum',
      'Madurai', 'Trichy', 'Salem'
    ];

    for (const city of cities) {
      if (query.includes(city)) {
        return city;
      }
    }

    // Try "in [Location]" pattern
    const match = query.match(/in\s+([A-Z][a-z]+)/i);
    if (match) {
      return match[1];
    }

    return 'India';
  }

  /**
   * Extract all unique websites from business records
   */
  extractWebsites(businesses) {
    const websites = new Set();
    
    businesses.forEach(business => {
      if (business.website && this.isValidURL(business.website)) {
        websites.add(business.website);
      }
    });

    return Array.from(websites);
  }

  /**
   * Validate URL format
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new BusinessResearchService();
