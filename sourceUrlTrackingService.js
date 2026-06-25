/**
 * Source URL Tracking Service
 * Tracks and manages all data source URLs for each business
 */

class SourceUrlTrackingService {
  constructor() {
    this.sourceTypes = {
      SERP_API: 'serp_api',
      WEBSITE: 'website',
      GOOGLE_MAPS: 'google_maps',
      LINKEDIN: 'linkedin',
      FACEBOOK: 'facebook',
      TWITTER: 'twitter',
      INSTAGRAM: 'instagram',
      CONTACT_PAGE: 'contact_page',
      ABOUT_PAGE: 'about_page'
    };
  }

  /**
   * Initialize source tracking for a business
   * @param {Object} business - Business object
   * @returns {Object} - Business with sourceUrls array
   */
  initializeTracking(business) {
    if (!business.sourceUrls) {
      business.sourceUrls = [];
    }
    return business;
  }

  /**
   * Add source URL to business
   * @param {Object} business - Business object
   * @param {string} url - Source URL
   * @param {string} type - Source type
   * @returns {Object} - Updated business
   */
  addSource(business, url, type = null) {
    if (!business || !url) return business;

    // Initialize if needed
    this.initializeTracking(business);

    // Normalize URL
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl) return business;

    // Check if URL already exists
    if (!business.sourceUrls.includes(normalizedUrl)) {
      business.sourceUrls.push(normalizedUrl);
      console.log(`✅ Added source: ${normalizedUrl}`);
    }

    return business;
  }

  /**
   * Add multiple source URLs
   * @param {Object} business - Business object
   * @param {Array<string>} urls - Array of URLs
   * @returns {Object} - Updated business
   */
  addMultipleSources(business, urls) {
    if (!business || !urls || !Array.isArray(urls)) return business;

    urls.forEach(url => {
      this.addSource(business, url);
    });

    return business;
  }

  /**
   * Track SerpAPI source
   * @param {Object} business - Business object
   * @param {Object} serpResult - SerpAPI result object
   * @returns {Object} - Updated business
   */
  trackSerpSource(business, serpResult) {
    if (!serpResult) return business;

    // Add main link
    if (serpResult.link) {
      this.addSource(business, serpResult.link, this.sourceTypes.SERP_API);
    }

    // Add Google Maps link if available
    if (serpResult.gps_coordinates) {
      const mapsUrl = `https://maps.google.com/?q=${serpResult.gps_coordinates.latitude},${serpResult.gps_coordinates.longitude}`;
      this.addSource(business, mapsUrl, this.sourceTypes.GOOGLE_MAPS);
    }

    // Add place ID link if available
    if (serpResult.place_id) {
      const placeUrl = `https://www.google.com/maps/place/?q=place_id:${serpResult.place_id}`;
      this.addSource(business, placeUrl, this.sourceTypes.GOOGLE_MAPS);
    }

    return business;
  }

  /**
   * Track website sources
   * @param {Object} business - Business object
   * @param {string} websiteUrl - Main website URL
   * @param {Array<string>} scrapedPages - Pages that were scraped
   * @returns {Object} - Updated business
   */
  trackWebsiteSources(business, websiteUrl, scrapedPages = []) {
    if (!business) return business;

    // Add main website
    if (websiteUrl) {
      this.addSource(business, websiteUrl, this.sourceTypes.WEBSITE);
    }

    // Add scraped pages
    scrapedPages.forEach(pageUrl => {
      this.addSource(business, pageUrl);
    });

    return business;
  }

  /**
   * Track social media sources
   * @param {Object} business - Business object
   * @param {Object} socialProfiles - Social media profiles
   * @returns {Object} - Updated business
   */
  trackSocialSources(business, socialProfiles) {
    if (!business || !socialProfiles) return business;

    // LinkedIn
    if (socialProfiles.linkedin) {
      this.addSource(business, socialProfiles.linkedin, this.sourceTypes.LINKEDIN);
    }

    // Facebook
    if (socialProfiles.facebook) {
      this.addSource(business, socialProfiles.facebook, this.sourceTypes.FACEBOOK);
    }

    // Twitter
    if (socialProfiles.twitter) {
      this.addSource(business, socialProfiles.twitter, this.sourceTypes.TWITTER);
    }

    // Instagram
    if (socialProfiles.instagram) {
      this.addSource(business, socialProfiles.instagram, this.sourceTypes.INSTAGRAM);
    }

    return business;
  }

  /**
   * Get source count
   * @param {Object} business - Business object
   * @returns {number} - Number of sources
   */
  getSourceCount(business) {
    if (!business || !business.sourceUrls) return 0;
    return business.sourceUrls.length;
  }

  /**
   * Get all sources
   * @param {Object} business - Business object
   * @returns {Array<string>} - Array of source URLs
   */
  getAllSources(business) {
    if (!business || !business.sourceUrls) return [];
    return [...business.sourceUrls];
  }

  /**
   * Categorize sources by type
   * @param {Array<string>} urls - Array of URLs
   * @returns {Object} - Categorized sources
   */
  categorizeSources(urls) {
    const categorized = {
      websites: [],
      googleMaps: [],
      socialMedia: [],
      other: []
    };

    urls.forEach(url => {
      const urlLower = url.toLowerCase();

      if (urlLower.includes('maps.google.com') || urlLower.includes('google.com/maps')) {
        categorized.googleMaps.push(url);
      } else if (urlLower.includes('linkedin.com')) {
        categorized.socialMedia.push({ platform: 'LinkedIn', url });
      } else if (urlLower.includes('facebook.com')) {
        categorized.socialMedia.push({ platform: 'Facebook', url });
      } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        categorized.socialMedia.push({ platform: 'Twitter', url });
      } else if (urlLower.includes('instagram.com')) {
        categorized.socialMedia.push({ platform: 'Instagram', url });
      } else {
        categorized.websites.push(url);
      }
    });

    return categorized;
  }

  /**
   * Normalize URL
   * @param {string} url - URL to normalize
   * @returns {string|null} - Normalized URL or null
   */
  normalizeUrl(url) {
    try {
      if (!url || typeof url !== 'string') return null;

      // Remove whitespace
      url = url.trim();
      
      // Add https:// if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Parse URL
      const urlObj = new URL(url);
      
      // Return normalized URL (lowercase hostname, preserve path)
      return `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}${urlObj.pathname}${urlObj.search}`;
      
    } catch (error) {
      console.error('Invalid URL:', url);
      return null;
    }
  }

  /**
   * Remove duplicate URLs
   * @param {Array<string>} urls - Array of URLs
   * @returns {Array<string>} - Unique URLs
   */
  removeDuplicates(urls) {
    if (!Array.isArray(urls)) return [];
    return [...new Set(urls.map(url => this.normalizeUrl(url)).filter(Boolean))];
  }

  /**
   * Merge sources from multiple businesses (deduplication)
   * @param {Array<Object>} businesses - Array of business objects
   * @returns {Array<Object>} - Businesses with merged sources
   */
  mergeDuplicateBusinessSources(businesses) {
    const businessMap = new Map();

    businesses.forEach(business => {
      const key = business.businessName.toLowerCase().trim();
      
      if (businessMap.has(key)) {
        // Merge sources
        const existing = businessMap.get(key);
        const allSources = [...existing.sourceUrls, ...business.sourceUrls];
        existing.sourceUrls = this.removeDuplicates(allSources);
      } else {
        this.initializeTracking(business);
        business.sourceUrls = this.removeDuplicates(business.sourceUrls);
        businessMap.set(key, business);
      }
    });

    return Array.from(businessMap.values());
  }

  /**
   * Generate source summary
   * @param {Object} business - Business object
   * @returns {Object} - Source summary
   */
  generateSourceSummary(business) {
    if (!business || !business.sourceUrls) {
      return {
        totalSources: 0,
        categories: {
          websites: 0,
          googleMaps: 0,
          socialMedia: 0,
          other: 0
        }
      };
    }

    const categorized = this.categorizeSources(business.sourceUrls);

    return {
      totalSources: business.sourceUrls.length,
      categories: {
        websites: categorized.websites.length,
        googleMaps: categorized.googleMaps.length,
        socialMedia: categorized.socialMedia.length,
        other: categorized.other.length
      },
      sources: categorized
    };
  }

  /**
   * Batch process businesses with source tracking
   * @param {Array<Object>} businesses - Array of businesses
   * @returns {Array<Object>} - Processed businesses
   */
  batchProcess(businesses) {
    console.log(`\n📊 Processing source tracking for ${businesses.length} businesses...`);
    
    let totalSources = 0;
    
    businesses.forEach((business, index) => {
      this.initializeTracking(business);
      
      // Ensure no duplicates
      business.sourceUrls = this.removeDuplicates(business.sourceUrls);
      
      totalSources += business.sourceUrls.length;
      
      console.log(`[${index + 1}/${businesses.length}] ${business.businessName}: ${business.sourceUrls.length} sources`);
    });
    
    const avgSources = (totalSources / businesses.length).toFixed(1);
    console.log(`✅ Total sources tracked: ${totalSources} (avg: ${avgSources} per business)\n`);
    
    return businesses;
  }
}

module.exports = new SourceUrlTrackingService();
