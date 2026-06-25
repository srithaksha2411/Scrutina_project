const axios = require('axios');

// Real-time Business Discovery Service
// Uses Google Places API and SerpAPI for live business data

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

/**
 * Search businesses using Google Places API
 */
const searchGooglePlaces = async (query, location) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    // Text Search API - finds businesses by query
    const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    
    const params = {
      query: location ? `${query} in ${location}` : query,
      key: GOOGLE_PLACES_API_KEY
    };

    const response = await axios.get(searchUrl, { params });

    if (response.data.status === 'OK' && response.data.results) {
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error('Google Places API Error:', error.message);
    throw error;
  }
};

/**
 * Get detailed business information from Google Places
 */
const getPlaceDetails = async (placeId) => {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    
    const params = {
      place_id: placeId,
      fields: 'name,formatted_phone_number,website,formatted_address,rating,types,business_status',
      key: GOOGLE_PLACES_API_KEY
    };

    const response = await axios.get(detailsUrl, { params });

    if (response.data.status === 'OK' && response.data.result) {
      return response.data.result;
    }

    return null;
  } catch (error) {
    console.error('Google Places Details Error:', error.message);
    return null;
  }
};

/**
 * Search businesses using SerpAPI (Google Search results) with pagination
 */
const searchSerpAPI = async (query, maxResults = 100) => {
  try {
    if (!SERPAPI_KEY) {
      console.log('SerpAPI key not configured, skipping...');
      return [];
    }

    console.log(`🔎 Starting SerpAPI search with pagination (target: ${maxResults} results)...`);
    
    const allResults = [];
    let page = 1;
    let hasMoreResults = true;
    
    // Continue fetching until we have enough results or no more available
    while (allResults.length < maxResults && hasMoreResults) {
      const start = (page - 1) * 100;
      
      console.log(`   Fetching page ${page} (start: ${start})...`);
      
      const params = {
        engine: 'google',
        q: query,
        api_key: SERPAPI_KEY,
        num: 100,  // Maximum results per request
        start: start
      };

      try {
        const response = await axios.get('https://serpapi.com/search', { 
          params,
          timeout: 10000 // 10 second timeout
        });

        // Check if we have local_results
        if (response.data.local_results && response.data.local_results.length > 0) {
          const pageResults = response.data.local_results;
          console.log(`   ✓ Page ${page}: Found ${pageResults.length} results`);
          
          allResults.push(...pageResults);
          
          // If we got fewer than 100 results, no more pages available
          if (pageResults.length < 100) {
            hasMoreResults = false;
            console.log(`   ℹ️ Last page reached (< 100 results)`);
          }
        } else {
          // No more results available
          hasMoreResults = false;
          console.log(`   ℹ️ No more results available on page ${page}`);
        }
        
        page++;
        
        // Small delay to respect rate limits (avoid 429 errors)
        if (hasMoreResults && allResults.length < maxResults) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (pageError) {
        console.error(`   ✗ Error fetching page ${page}:`, pageError.message);
        hasMoreResults = false; // Stop on error
      }
    }

    console.log(`✅ SerpAPI pagination complete: ${allResults.length} total results fetched`);
    return allResults;

  } catch (error) {
    console.error('SerpAPI Error:', error.message);
    return [];
  }
};

/**
 * Format Google Places result into standardized business object with validation
 */
const formatGooglePlacesBusiness = async (place) => {
  try {
    // Validate business name first
    const businessName = place.name || 'Unknown Business';
    
    if (!isValidBusinessName(businessName)) {
      console.log(`   ⊘ Rejected (invalid name): "${businessName}"`);
      return null;
    }
    
    // Get detailed information
    const details = await getPlaceDetails(place.place_id);
    
    const business = {
      name: place.name || 'Unknown Business',
      website: details?.website || null,
      phone: details?.formatted_phone_number || null,
      email: null, // Google Places doesn't provide email
      address: place.formatted_address || details?.formatted_address || null,
      rating: place.rating ? place.rating.toString() : null,
      industry: place.types?.[0]?.replace(/_/g, ' ') || 'General Business',
      sources: ['Google Places'],
      businessStatus: details?.business_status || 'OPERATIONAL',
      placeId: place.place_id
    };

    return business;
  } catch (error) {
    console.error('Error formatting business:', error.message);
    return null;
  }
};

/**
 * Check if a business name is actually a valid business (not an article/list/directory)
 */
const isValidBusinessName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const nameLower = name.toLowerCase().trim();
  
  // Reject empty or very short names
  if (nameLower.length < 2) return false;
  
  // List of patterns that indicate this is NOT a business
  const invalidPatterns = [
    // Article titles
    /^\d+\s+(best|top|leading|biggest|largest|popular|successful)/i,
    /^(best|top|leading)\s+\d+/i,
    /(companies|businesses|startups|firms)\s+(to|you|in|for|that)/i,
    /(list|directory|listing)\s+of/i,
    
    // Blog/article indicators
    /^how\s+to/i,
    /^why\s+/i,
    /^what\s+/i,
    /^the\s+(ultimate|complete|definitive|comprehensive)\s+(guide|list)/i,
    /guide\s+to/i,
    /everything\s+you\s+need/i,
    
    // Number-based lists
    /^\d+\s+(ways|reasons|tips|strategies|ideas)/i,
    /^\d+.*\s+you\s+(should|need|must)/i,
    
    // Common article formats
    /^(a|an|the)\s+(complete|ultimate|comprehensive|definitive)\s+/i,
    /\s+you\s+(should|need|must|can)\s+know/i,
    /worth\s+knowing/i,
    /to\s+(watch|follow|consider|explore)/i,
    
    // Directory/listing indicators
    /^companies\s+in/i,
    /^businesses\s+in/i,
    /^startups\s+in/i,
    /company\s+(directory|database|list|listing)/i,
    /business\s+(directory|database|list|listing)/i,
    
    // Year-based lists
    /in\s+\d{4}/i,
    /for\s+\d{4}/i,
    
    // Search result pages
    /search\s+results/i,
    /showing\s+results/i,
    /results\s+for/i,
    
    // Generic phrases
    /^explore\s+/i,
    /^discover\s+/i,
    /^find\s+(the|a)/i,
    /^browse\s+/i,
    /^view\s+all/i,
    /^see\s+(all|more)/i,
    
    // Date patterns
    /updated\s+on/i,
    /published\s+on/i,
    /posted\s+on/i,
    
    // Question formats
    /^which\s+/i,
    /^where\s+/i,
    /\?$/,  // Ends with question mark
  ];
  
  // Check against all invalid patterns
  for (const pattern of invalidPatterns) {
    if (pattern.test(nameLower)) {
      return false;
    }
  }
  
  // Additional checks for specific invalid formats
  
  // Reject if contains "X companies" where X is a number
  if (/\d+\s+(companies|businesses|startups|firms)/i.test(nameLower)) {
    return false;
  }
  
  // Reject if starts with a number followed by a space (likely a list)
  if (/^\d+\s+/.test(nameLower)) {
    return false;
  }
  
  // Reject very long names (likely article titles)
  if (name.length > 150) {
    return false;
  }
  
  // Reject if contains multiple consecutive "to" or "in" (article pattern)
  if (/\s+to\s+.*\s+to\s+/i.test(nameLower) || /\s+in\s+.*\s+in\s+/i.test(nameLower)) {
    return false;
  }
  
  return true;
};

/**
 * Check if a URL indicates a valid business source
 */
const isValidBusinessSource = (url) => {
  if (!url || typeof url !== 'string') return true; // Allow if no URL
  
  const urlLower = url.toLowerCase();
  
  // Valid business sources
  const validSources = [
    'linkedin.com/company/',
    'crunchbase.com/organization/',
    'facebook.com/',
    'instagram.com/',
    'twitter.com/',
    'x.com/',
    'google.com/maps/',
    'yelp.com/biz/',
  ];
  
  // Check if URL is from a known valid source
  for (const source of validSources) {
    if (urlLower.includes(source)) {
      return true;
    }
  }
  
  // Invalid article/blog sources
  const invalidSources = [
    '/blog/',
    '/article/',
    '/news/',
    '/list/',
    '/directory/',
    '/top-',
    '/best-',
    '-companies-',
    '-businesses-',
    '-list',
    '/search',
    '/category/',
    '/tag/',
  ];
  
  // Check if URL contains invalid patterns
  for (const source of invalidSources) {
    if (urlLower.includes(source)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Format SerpAPI result into standardized business object with validation
 */
const formatSerpAPIBusiness = (result) => {
  // Validate business name
  const businessName = result.title || 'Unknown Business';
  
  if (!isValidBusinessName(businessName)) {
    console.log(`   ⊘ Rejected (invalid name): "${businessName}"`);
    return null;
  }
  
  // Validate source URL
  const sourceUrl = result.website || result.link || null;
  
  if (sourceUrl && !isValidBusinessSource(sourceUrl)) {
    console.log(`   ⊘ Rejected (invalid source): "${businessName}" from ${sourceUrl}`);
    return null;
  }
  
  return {
    name: result.title || 'Unknown Business',
    website: result.website || result.link || null,
    phone: result.phone || null,
    email: null,
    address: result.address || null,
    rating: result.rating ? result.rating.toString() : null,
    industry: result.type || 'General Business',
    sources: ['Google Search'],
    placeId: null
  };
};

/**
 * Remove duplicate businesses based on name and website
 */
const removeDuplicateBusinesses = (businesses) => {
  const seen = new Map();
  const unique = [];
  
  for (const business of businesses) {
    // Create unique key based on name + website
    const name = (business.name || '').toLowerCase().trim();
    const website = (business.website || '').toLowerCase().trim();
    const key = `${name}|${website}`;
    
    if (!seen.has(key) && name) {
      seen.set(key, true);
      unique.push(business);
    }
  }
  
  return unique;
};

/**
 * Main search function - searches real businesses with improved coverage
 */
const searchBusinesses = async (query) => {
  try {
    console.log(`\n🔍 Searching for: "${query}"`);
    console.log(`🎯 Target: 100 unique businesses\n`);
    
    let businesses = [];
    
    // 1. Search using Google Places API (Primary source)
    try {
      console.log('📍 Phase 1: Google Places API');
      const placesResults = await searchGooglePlaces(query);
      
      if (placesResults.length > 0) {
        console.log(`   Found ${placesResults.length} results from Google Places`);
        
        // Get detailed info for each place (limit to 20 to avoid quota issues)
        const limitedResults = placesResults.slice(0, 20);
        
        for (const place of limitedResults) {
          const business = await formatGooglePlacesBusiness(place);
          if (business && business.name !== 'Unknown Business') {
            businesses.push(business);
          }
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Phase 1 complete: ${businesses.length} businesses from Google Places\n`);
      }
    } catch (error) {
      console.error('❌ Google Places search failed:', error.message);
    }

    // 2. Search using SerpAPI with pagination (Secondary source)
    try {
      if (SERPAPI_KEY) {
        console.log('🔎 Phase 2: SerpAPI with Pagination');
        
        // Calculate how many more results we need
        const targetTotal = 100;
        const currentCount = businesses.length;
        const needed = targetTotal - currentCount;
        
        console.log(`   Current: ${currentCount} businesses`);
        console.log(`   Target: ${targetTotal} businesses`);
        console.log(`   Fetching up to ${needed} more from SerpAPI...\n`);
        
        // Fetch with pagination (will get up to 100 results or until exhausted)
        const serpResults = await searchSerpAPI(query, needed);
        
        if (serpResults.length > 0) {
          console.log(`\n   Processing ${serpResults.length} SerpAPI results...`);
          
          let addedCount = 0;
          let rejectedCount = 0;
          
          for (const result of serpResults) {
            const business = formatSerpAPIBusiness(result);
            
            // Skip if rejected by validation
            if (!business) {
              rejectedCount++;
              continue;
            }
            
            // Only add if not duplicate (check name)
            const isDuplicate = businesses.some(b => 
              b.name.toLowerCase() === business.name.toLowerCase()
            );
            
            if (!isDuplicate && business.name !== 'Unknown Business') {
              businesses.push(business);
              addedCount++;
              
              // Stop if we reached target
              if (businesses.length >= targetTotal) {
                console.log(`   🎯 Target reached: ${targetTotal} businesses`);
                break;
              }
            }
          }
          
          console.log(`✅ Phase 2 complete: Added ${addedCount} unique businesses from SerpAPI`);
          if (rejectedCount > 0) {
            console.log(`   ⊘ Filtered out ${rejectedCount} non-business results (articles, lists, directories)`);
          }
        }
      }
    } catch (error) {
      console.error('❌ SerpAPI search failed:', error.message);
    }

    // 3. Final deduplication pass
    console.log(`\n🔄 Phase 3: Final Deduplication`);
    const beforeDedup = businesses.length;
    businesses = removeDuplicateBusinesses(businesses);
    const afterDedup = businesses.length;
    const duplicatesRemoved = beforeDedup - afterDedup;
    
    if (duplicatesRemoved > 0) {
      console.log(`   Removed ${duplicatesRemoved} duplicate(s)`);
    } else {
      console.log(`   No duplicates found`);
    }

    // If no results found from APIs
    if (businesses.length === 0) {
      throw new Error('No businesses found. Please check your API keys and try a different query.');
    }

    console.log(`\n✅ Search Complete!`);
    console.log(`   Total unique businesses: ${businesses.length}`);
    console.log(`   Google Places: ${businesses.filter(b => b.sources.includes('Google Places')).length}`);
    console.log(`   SerpAPI: ${businesses.filter(b => b.sources.includes('Google Search')).length}\n`);
    
    return businesses;

  } catch (error) {
    console.error('❌ Search Service Error:', error.message);
    throw error;
  }
};

module.exports = { searchBusinesses };
