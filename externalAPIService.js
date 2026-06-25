/**
 * Business Discovery Service - Phase 1
 * 
 * Returns raw SerpAPI results directly
 * No AI processing, verification, or deduplication in this phase
 */

class ExternalAPIService {
  constructor() {
    this.serpAPIKey = process.env.SERP_API_KEY;
  }

  /**
   * Search using SerpAPI
   */
  async searchSerpAPI(query) {
    console.log(`[SerpAPI] Searching for: ${query}`);
    
    if (!this.serpAPIKey) {
      console.warn('SerpAPI key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${this.serpAPIKey}&engine=google&num=30`
      );
      
      if (!response.ok) {
        console.error(`SerpAPI error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      const results = this.extractBusinessResults(data, query);
      
      console.log(`[SerpAPI] Extracted ${results.length} results`);
      return results;
      
    } catch (error) {
      console.error('SerpAPI error:', error);
      return [];
    }
  }

  /**
   * Extract business results from SerpAPI response
   */
  extractBusinessResults(data, query) {
    const businesses = [];
    
    // Extract from local results (best for business queries)
    if (data.local_results && Array.isArray(data.local_results)) {
      data.local_results.forEach(result => {
        businesses.push({
          name: result.title || 'N/A',
          industry: this.extractIndustry(query),
          address: result.address || 'N/A',
          website: result.link || result.website || '',
          phone: result.phone || '',
          verificationScore: 70,
          source: 'serp_api_local'
        });
      });
    }
    
    // Extract from organic results as fallback
    if (data.organic_results && Array.isArray(data.organic_results)) {
      data.organic_results.forEach(result => {
        // Skip obvious non-business results
        const title = result.title || '';
        if (this.isLikelyBusiness(title)) {
          businesses.push({
            name: this.cleanBusinessName(title),
            industry: this.extractIndustry(query),
            address: this.extractLocation(query),
            website: result.link || '',
            phone: '',
            verificationScore: 50,
            source: 'serp_api_organic'
          });
        }
      });
    }
    
    return businesses;
  }

  /**
   * Check if title is likely a business (basic filter)
   */
  isLikelyBusiness(title) {
    const lowerTitle = title.toLowerCase();
    
    // Exclude obvious non-business patterns
    const excludePatterns = [
      'top 10', 'top 5', 'best', 'near me', 
      'list of', 'how to', 'what is', 'wikipedia'
    ];
    
    for (const pattern of excludePatterns) {
      if (lowerTitle.includes(pattern)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Clean business name from title
   */
  cleanBusinessName(title) {
    // Remove common suffixes and extra text
    return title
      .replace(/\s*[-–|].*$/, '')
      .replace(/\s*\(.*\)\s*/g, '')
      .trim();
  }

  /**
   * Extract industry from query
   */
  extractIndustry(query) {
    const industries = [
      { keywords: ['hospital', 'clinic', 'medical', 'doctor', 'cardio'], name: 'Healthcare' },
      { keywords: ['cyber security', 'security', 'it'], name: 'Cybersecurity' },
      { keywords: ['software', 'tech', 'startup'], name: 'Technology' },
      { keywords: ['fintech', 'finance', 'bank'], name: 'Financial Services' },
      { keywords: ['hotel', 'restaurant', 'cafe'], name: 'Hospitality' },
      { keywords: ['school', 'college', 'education'], name: 'Education' }
    ];
    
    const queryLower = query.toLowerCase();
    
    for (const industry of industries) {
      for (const keyword of industry.keywords) {
        if (queryLower.includes(keyword)) {
          return industry.name;
        }
      }
    }
    
    return 'Business';
  }

  /**
   * Extract location from query
   */
  extractLocation(query) {
    const cities = [
      'Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune',
      'Kolkata', 'Ahmedabad', 'Coimbatore', 'Kochi', 'Trivandrum'
    ];
    
    for (const city of cities) {
      if (query.includes(city)) {
        return city;
      }
    }
    
    // Try to extract "in [Location]" pattern
    const match = query.match(/in\s+([A-Z][a-z]+)/i);
    if (match) {
      return match[1];
    }
    
    return 'N/A';
  }

  /**
   * Remove duplicate businesses (simple name-based dedup)
   */
  removeDuplicates(businesses) {
    const seen = new Map();
    const unique = [];
    let duplicatesCount = 0;
    
    businesses.forEach(business => {
      const key = business.name.toLowerCase().trim();
      
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(business);
      } else {
        duplicatesCount++;
      }
    });
    
    return { unique, duplicatesCount };
  }

  /**
   * Calculate basic verification score
   */
  calculateVerificationScore(business) {
    let score = business.verificationScore || 50;
    
    // Adjust based on data availability
    if (business.phone) score += 10;
    if (business.website) score += 10;
    if (business.address !== 'N/A') score += 10;
    
    return Math.min(score, 100);
  }
}

module.exports = new ExternalAPIService();
