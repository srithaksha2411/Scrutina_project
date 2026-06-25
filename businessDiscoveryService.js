/**
 * PHASE 1 - BUSINESS DISCOVERY SERVICE
 * 
 * Discovers businesses from multiple sources:
 * - Google Search via SerpAPI
 * - Google Maps Results
 * - LinkedIn pages
 * - Official Websites
 * - Business Directories
 */

const axios = require('axios');

class BusinessDiscoveryService {
  constructor() {
    this.serpAPIKey = process.env.SERP_API_KEY;
    this.timeout = 15000;
  }

  /**
   * MAIN DISCOVERY ENTRY POINT
   * Discovers businesses from all available sources
   */
  async discoverBusinesses(query) {
    console.log(`\n========== PHASE 1: BUSINESS DISCOVERY ==========`);
    console.log(`Query: "${query}"`);
    console.log(`================================================\n`);

    const discovered = [];

    try {
      // Source 1: Google Search + Maps (SerpAPI)
      const serpResults = await this.searchSerpAPI(query);
      discovered.push(...serpResults);

      // Source 2: Google Maps specific search
      const mapsResults = await this.searchGoogleMaps(query);
      discovered.push(...mapsResults);

      console.log(`[Discovery] Total discovered: ${discovered.length} businesses`);
      console.log(`[Discovery] Sources: SerpAPI (${serpResults.length}), Maps (${mapsResults.length})`);

      return discovered;

    } catch (error) {
      console.error('[Discovery] Error:', error.message);
      return discovered;
    }
  }

  /**
   * Search using SerpAPI - Google Search Engine
   */
  async searchSerpAPI(query) {
    console.log(`[SerpAPI] Searching Google for: "${query}"`);
    
    if (!this.serpAPIKey) {
      console.warn('[SerpAPI] API key not configured');
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: query,
          api_key: this.serpAPIKey,
          engine: 'google',
          num: 50,  // Increased from 30 to 50 for more results
          gl: 'in',
          hl: 'en'
        },
        timeout: this.timeout
      });

      const businesses = [];

      // Extract from local results (Google Business Profiles)
      // CRITICAL FIX: SerpAPI returns local_results as object with 'places' array
      const localPlaces = response.data.local_results?.places || [];
      
      if (localPlaces.length > 0) {
        console.log(`[SerpAPI] Processing ${localPlaces.length} local results`);
        
        localPlaces.forEach(result => {
          console.log(`[DEBUG] Local result - title: "${result.title}", address: "${result.address}"`);
          
          const business = {
            businessName: result.title || null,
            website: result.links?.website || null,
            phone: result.phone || null,
            address: result.address || null,
            rating: result.rating || 0,
            reviewCount: result.reviews || 0,
            workingHours: result.hours || null,
            description: result.description || null,
            sourceUrl: result.links?.website || `https://google.com/search?q=${encodeURIComponent(result.title || 'business')}`,
            sourceType: 'google_local',
            position: result.position,
            placeId: result.place_id || null,
            searchQuery: query
          };
          
          console.log(`[DEBUG] Initial businessName: "${business.businessName}"`);
          
          // If we have address but no business name, try to extract name from address
          if (!business.businessName && business.address) {
            business.businessName = this.extractBusinessNameFromAddress(business.address);
            console.log(`[DEBUG] Extracted from address: "${business.businessName}"`);
          }
          
          // Only add if we have at least a business name
          if (business.businessName) {
            console.log(`[DEBUG] ✓ Added business: "${business.businessName}"`);
            businesses.push(business);
          } else {
            console.warn(`[SerpAPI] ⚠️  Skipping result - no business name. Address: ${business.address || 'none'}`);
          }
        });
      }

      // Extract from organic results
      if (response.data.organic_results) {
        console.log(`[SerpAPI] Processing ${response.data.organic_results.length} organic results`);
        
        response.data.organic_results.forEach(result => {
          console.log(`[DEBUG] Organic result - title: "${result.title}"`);
          
          // Filter business-like results
          if (this.isBusinessResult(result.title)) {
            const businessName = this.cleanBusinessName(result.title);
            console.log(`[DEBUG] ✓ Added organic business: "${businessName}"`);
            
            businesses.push({
              businessName: businessName,
              website: result.link,
              phone: null,
              address: null,
              rating: 0,
              reviewCount: 0,
              description: result.snippet || null,
              sourceUrl: result.link,
              sourceType: 'google_organic',
              position: result.position,
              searchQuery: query
            });
          } else {
            console.log(`[DEBUG] ✗ Filtered out non-business: "${result.title}"`);
          }
        });
      }

      // Extract from knowledge graph
      if (response.data.knowledge_graph) {
        const kg = response.data.knowledge_graph;
        console.log(`[DEBUG] Knowledge graph - title: "${kg.title}"`);
        console.log(`[DEBUG] ✓ Added knowledge graph business: "${kg.title}"`);
        
        businesses.push({
          businessName: kg.title,
          website: kg.website || null,
          phone: kg.phone || null,
          address: kg.address || null,
          description: kg.description || null,
          rating: kg.rating || 0,
          reviewCount: kg.reviews || 0,
          sourceUrl: kg.website || kg.source?.link,
          sourceType: 'google_knowledge_graph',
          searchQuery: query
        });
      }

      console.log(`\n[SerpAPI] ========== DISCOVERY SUMMARY ==========`);
      console.log(`[SerpAPI] ✓ Discovered ${businesses.length} businesses`);
      businesses.forEach((b, i) => {
        console.log(`[SerpAPI] ${i + 1}. "${b.businessName}" - ${b.sourceType}`);
      });
      console.log(`[SerpAPI] ==========================================\n`);
      
      return businesses;

    } catch (error) {
      console.error('[SerpAPI] Error:', error.message);
      return [];
    }
  }

  /**
   * Search Google Maps specifically
   */
  async searchGoogleMaps(query) {
    console.log(`[Maps] Searching Google Maps for: "${query}"`);
    
    if (!this.serpAPIKey) {
      return [];
    }

    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: query,
          api_key: this.serpAPIKey,
          engine: 'google_maps',
          type: 'search',
          hl: 'en'
        },
        timeout: this.timeout
      });

      const businesses = [];

      // CRITICAL FIX: Check for both old and new response structures
      const localResults = response.data.local_results?.places || response.data.local_results || [];
      
      if (Array.isArray(localResults) && localResults.length > 0) {
        console.log(`[Maps] Processing ${localResults.length} map results`);
        
        localResults.forEach(result => {
          businesses.push({
            businessName: result.title,
            website: result.links?.website || result.website || null,
            phone: result.phone || null,
            address: result.address || null,
            rating: result.rating || 0,
            reviewCount: result.reviews || 0,
            workingHours: result.hours || null,
            description: result.description || null,
            imageUrls: result.thumbnail ? [result.thumbnail] : [],
            sourceUrl: result.links?.website || result.link || null,
            sourceType: 'google_maps',
            placeId: result.place_id || null,
            gpsCoordinates: result.gps_coordinates || null,
            searchQuery: query
          });
        });
      }

      console.log(`[Maps] ✓ Discovered ${businesses.length} businesses`);
      return businesses;

    } catch (error) {
      console.error('[Maps] Error:', error.message);
      return [];
    }
  }

  /**
   * Check if search result title indicates a business
   */
  isBusinessResult(title) {
    if (!title) return false;

    const lowerTitle = title.toLowerCase();
    
    // Exclude non-business patterns
    const excludePatterns = [
      'top 10', 'top 5', 'top 20', 'top ', 'best', 'near me', 'list of',
      'how to', 'what is', 'why', 'when', 'wikipedia',
      'guide to', 'blog', 'article', 'news', 'review of',
      'compare', 'vs ', 'versus', 'reddit', 'quora',
      'big companies', 'companies in', 'software companies', 
      'category:', 'list:', 'directory', 'ranking'
    ];

    for (const pattern of excludePatterns) {
      if (lowerTitle.includes(pattern)) {
        return false;
      }
    }

    // Must have actual company indicators or be very specific
    const businessIndicators = [
      'ltd', 'limited', 'pvt', 'inc', 'llc', 'corp', 'gmbh', 'ag',
      'company', 'corporation', 'enterprises', 'solutions', 'services',
      'systems', 'technologies', 'group', 'consulting', 'software',
      'capital', 'ventures', 'holdings', 'partners', 'associates'
    ];

    // Check if title contains business indicators
    for (const indicator of businessIndicators) {
      if (lowerTitle.includes(indicator)) {
        return true;
      }
    }

    // If no business indicators, reject (too generic)
    return false;
  }

  /**
   * Clean business name from search title
   */
  cleanBusinessName(title) {
    return title
      .replace(/\s*[-–|].*$/, '')     // Remove after dash/pipe
      .replace(/\s*\(.*\)\s*/g, '')   // Remove parentheses
      .replace(/\s*\[.*\]\s*/g, '')   // Remove brackets
      .trim();
  }

  /**
   * Extract location from query
   */
  extractLocation(query) {
    const locationPatterns = [
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i
    ];

    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract industry from query
   */
  extractIndustry(query) {
    const industries = {
      'Healthcare': ['hospital', 'clinic', 'medical', 'doctor', 'cardiologist', 'dentist', 'pharmacy'],
      'IT Services': ['software', 'it company', 'tech', 'technology', 'web development', 'app development'],
      'Hospitality': ['hotel', 'resort', 'restaurant', 'cafe', 'bar', 'accommodation'],
      'Education': ['school', 'college', 'university', 'training', 'institute', 'academy'],
      'Finance': ['bank', 'finance', 'insurance', 'fintech', 'investment'],
      'Retail': ['shop', 'store', 'retail', 'boutique', 'mart', 'supermarket'],
      'Real Estate': ['real estate', 'property', 'builder', 'construction'],
      'Legal': ['lawyer', 'attorney', 'legal', 'law firm'],
      'Automotive': ['car', 'auto', 'vehicle', 'garage', 'mechanic']
    };

    const queryLower = query.toLowerCase();

    for (const [industry, keywords] of Object.entries(industries)) {
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          return industry;
        }
      }
    }

    return null;
  }

  /**
   * Extract business name from address string
   * Example: "TIDEL Park Coimbatore Ltd, 3rd Floor..." -> "TIDEL Park Coimbatore Ltd"
   */
  extractBusinessNameFromAddress(address) {
    if (!address) return null;
    
    // Pattern: Extract everything before the first comma if it contains company indicators
    const companySuffixes = [
      'Ltd', 'Limited', 'Pvt Ltd', 'Private Limited', 'LLC', 'Inc',
      'Corporation', 'Corp', 'Co', 'Company', 'Enterprises', 'Industries',
      'Solutions', 'Services', 'Group', 'Technologies', 'Tech', 'Park'
    ];
    
    const parts = address.split(',');
    if (parts.length > 1) {
      const firstPart = parts[0].trim();
      
      // Check if first part contains a company suffix
      for (const suffix of companySuffixes) {
        if (new RegExp(`\\b${suffix}\\b`, 'i').test(firstPart)) {
          console.log(`[Discovery] Extracted business name from address: "${firstPart}"`);
          return firstPart;
        }
      }
    }
    
    return null;
  }
}

module.exports = new BusinessDiscoveryService();
