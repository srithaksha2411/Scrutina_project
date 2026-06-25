/**
 * PHASE 2 - DATA ENRICHMENT SERVICE
 * 
 * Enriches business data by scraping websites and collecting:
 * - Contact information (phone, email, address)
 * - Business details (services, specialties, certifications)
 * - Social media profiles
 * - Images and reviews
 * - Working hours
 */

const axios = require('axios');
const cheerio = require('cheerio');

class DataEnrichmentService {
  constructor() {
    this.timeout = 15000; // Increased to 15 seconds
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * MAIN ENRICHMENT ENTRY POINT
   * Enriches business data from website
   */
  async enrichBusiness(business) {
    console.log(`[Enrichment] Processing: ${business.businessName || 'Unknown'}`);
    console.log(`[Enrichment] DEBUG - Input businessName: "${business.businessName}"`);
    console.log(`[Enrichment] DEBUG - Input sourceUrl: "${business.sourceUrl}"`);
    console.log(`[Enrichment] DEBUG - Input website: "${business.website}"`);

    const enrichedData = {
      ...business,
      businessName: business.businessName || null,  // Preserve original business name
      phone: business.phone || null,
      email: business.email || null,
      address: business.address || null,
      workingHours: business.workingHours || null,
      services: business.services || [],
      specialties: business.specialties || [],
      certifications: business.certifications || [],
      awards: business.awards || [],
      socialProfiles: business.socialProfiles || {},
      imageUrls: business.imageUrls || [],
      sourceUrls: business.sourceUrl ? [business.sourceUrl] : (business.website ? [business.website] : [])
    };

    console.log(`[Enrichment] DEBUG - Initial sourceUrls: ${JSON.stringify(enrichedData.sourceUrls)}`);
    console.log(`[Enrichment] DEBUG - After spread businessName: "${enrichedData.businessName}"`);

    // If website exists, scrape it
    if (business.website && this.isValidURL(business.website)) {
      try {
        const scrapedData = await this.scrapeWebsite(business.website);
        console.log(`[Enrichment] DEBUG - Scraped businessName: "${scrapedData.businessName}"`);
        console.log(`[Enrichment] DEBUG - Scraped socialProfiles: ${JSON.stringify(scrapedData.socialProfiles)}`);
        
        // CRITICAL: NEVER overwrite existing businessName with null/empty
        // Only update businessName if:
        // 1. We don't have one yet, OR
        // 2. Scraped name is better (longer/more complete)
        if (scrapedData.businessName) {
          if (!enrichedData.businessName || scrapedData.businessName.length > enrichedData.businessName.length) {
            console.log(`[Enrichment] Updated business name: "${enrichedData.businessName}" -> "${scrapedData.businessName}"`);
            enrichedData.businessName = scrapedData.businessName;
          }
        }
        
        console.log(`[Enrichment] DEBUG - Final businessName after scraping: "${enrichedData.businessName}"`);
        
        // Merge other data (prefer enrichedData, then scrapedData)
        enrichedData.phone = enrichedData.phone || scrapedData.phone;
        enrichedData.email = enrichedData.email || scrapedData.email;
        enrichedData.address = enrichedData.address || scrapedData.address;
        enrichedData.description = enrichedData.description || scrapedData.description;
        enrichedData.workingHours = enrichedData.workingHours || scrapedData.workingHours;
        enrichedData.services = [...new Set([...enrichedData.services, ...scrapedData.services])];
        enrichedData.specialties = [...new Set([...enrichedData.specialties, ...scrapedData.specialties])];
        enrichedData.certifications = [...new Set([...enrichedData.certifications, ...scrapedData.certifications])];
        enrichedData.awards = [...new Set([...enrichedData.awards, ...scrapedData.awards])];
        enrichedData.imageUrls = [...new Set([...enrichedData.imageUrls, ...scrapedData.imageUrls])];
        
        // Merge social profiles
        enrichedData.socialProfiles = {
          linkedin: enrichedData.socialProfiles.linkedin || scrapedData.socialProfiles.linkedin,
          facebook: enrichedData.socialProfiles.facebook || scrapedData.socialProfiles.facebook,
          instagram: enrichedData.socialProfiles.instagram || scrapedData.socialProfiles.instagram,
          twitter: enrichedData.socialProfiles.twitter || scrapedData.socialProfiles.twitter,
          youtube: enrichedData.socialProfiles.youtube || scrapedData.socialProfiles.youtube
        };

        // Add website to source URLs
        if (!enrichedData.sourceUrls.includes(business.website)) {
          enrichedData.sourceUrls.push(business.website);
        }

        console.log(`[Enrichment] DEBUG - Final sourceUrls: ${JSON.stringify(enrichedData.sourceUrls)}`);
        console.log(`[Enrichment] DEBUG - Final socialProfiles: ${JSON.stringify(enrichedData.socialProfiles)}`);
        console.log(`[Enrichment] ✓ Enriched: ${enrichedData.businessName || 'Unknown'}`);

      } catch (error) {
        console.log(`[Enrichment] ✗ Failed to scrape: ${error.message}`);
      }
    }

    // Validation: Log if business name is missing
    if (!enrichedData.businessName) {
      console.warn(`[Enrichment] ⚠️  CRITICAL - Missing business name after enrichment!`);
      console.warn(`[Enrichment] Website: ${business.website}`);
      console.warn(`[Enrichment] Address: ${business.address}`);
    } else {
      console.log(`[Enrichment] ✓ FINAL businessName: "${enrichedData.businessName}"`);
    }

    return enrichedData;
  }

  /**
   * Batch enrich multiple businesses
   */
  async batchEnrich(businesses, maxConcurrent = 5) {
    console.log(`\n========== PHASE 2: DATA ENRICHMENT ==========`);
    console.log(`Enriching ${businesses.length} businesses...`);
    console.log(`==============================================\n`);

    const enriched = [];
    
    for (let i = 0; i < businesses.length; i += maxConcurrent) {
      const batch = businesses.slice(i, i + maxConcurrent);
      const promises = batch.map(b => this.enrichBusiness(b));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          enriched.push(result.value);
        } else {
          enriched.push(batch[idx]); // Keep original on failure
        }
      });

      // Respectful delay between batches
      if (i + maxConcurrent < businesses.length) {
        await this.delay(2000);
      }
    }

    console.log(`[Enrichment] ✓ Completed: ${enriched.length} businesses enriched\n`);
    return enriched;
  }

  /**
   * Scrape website for business information
   */
  async scrapeWebsite(url) {
    console.log(`[Enrichment] Starting scrape of: ${url}`);
    
    const data = {
      businessName: null,
      phone: null,
      email: null,
      address: null,
      description: null,
      workingHours: null,
      services: [],
      specialties: [],
      certifications: [],
      awards: [],
      socialProfiles: {},
      imageUrls: []
    };

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: { 
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });

      console.log(`[Enrichment] Successfully fetched ${url} (status: ${response.status})`);

      const $ = cheerio.load(response.data);

      // Extract business name
      data.businessName = this.extractBusinessName($);
      console.log(`[Enrichment] Extracted name: ${data.businessName}`);

      // Extract contact information
      data.phone = this.extractPhone(response.data, $);
      console.log(`[Enrichment] Extracted phone: ${data.phone}`);
      
      data.email = this.extractEmail(response.data, $);
      console.log(`[Enrichment] Extracted email: ${data.email}`);
      
      data.address = this.extractAddress($);

      // Extract business details
      data.description = this.extractDescription($);
      data.workingHours = this.extractWorkingHours($);
      data.services = this.extractServices($);
      data.specialties = this.extractSpecialties($);
      data.certifications = this.extractCertifications($);
      data.awards = this.extractAwards($);

      // Extract social profiles
      data.socialProfiles = this.extractSocialProfiles($);

      // Extract images
      data.imageUrls = this.extractImages($, url);

      console.log(`[Enrichment] Scrape complete for ${url}`);

    } catch (error) {
      console.error(`[Enrichment] Scrape failed for ${url}: ${error.message}`);
      if (error.code) console.error(`[Enrichment] Error code: ${error.code}`);
      if (error.response) console.error(`[Enrichment] Response status: ${error.response.status}`);
    }

    return data;
  }

  /**
   * Extract business name from website
   */
  extractBusinessName($) {
    // Try og:site_name
    let name = $('meta[property="og:site_name"]').attr('content');
    if (name && name.length < 100) return name.trim();

    // Try title
    name = $('title').text()
      .replace(/[-–|].*$/, '')
      .trim();
    if (name && name.length < 100) return name;

    // Try schema.org
    name = $('[itemtype*="schema.org/Organization"] [itemprop="name"]').text().trim();
    if (name && name.length < 100) return name;

    return null;
  }

  /**
   * Extract phone with strict validation
   */
  extractPhone(html, $) {
    // Try tel: links first
    const telLinks = $('a[href^="tel:"]');
    for (let i = 0; i < telLinks.length; i++) {
      const phone = $(telLinks[i]).attr('href').replace('tel:', '').trim();
      if (this.isValidPhone(phone)) {
        return phone.replace(/[^\d+]/g, '');
      }
    }

    // Search in specific elements
    const phoneElements = ['[class*="phone"]', '[id*="phone"]', '[class*="contact"]', 'footer'];
    
    for (const selector of phoneElements) {
      const text = $(selector).text();
      const phone = this.findPhoneInText(text);
      if (phone) return phone;
    }

    return null;
  }

  /**
   * Find valid phone in text
   */
  findPhoneInText(text) {
    const patterns = [
      /\+91[\s-]?\d{10}/g,
      /\+91\d{10}/g,
      /\(?\d{3,4}\)?[\s-]?\d{6,8}/g
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = match.replace(/[^\d+]/g, '');
          if (this.isValidPhone(cleaned)) {
            return cleaned;
          }
        }
      }
    }

    return null;
  }

  /**
   * Validate phone number
   */
  isValidPhone(phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    const digitsOnly = cleaned.replace('+', '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
    if (/^(\d)\1+$/.test(digitsOnly)) return false;
    if (digitsOnly.length > 12 && !cleaned.startsWith('+')) return false;
    
    return true;
  }

  /**
   * Extract email
   */
  extractEmail(html, $) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Try mailto links
    const mailtoLink = $('a[href^="mailto:"]').first().attr('href');
    if (mailtoLink) {
      const email = mailtoLink.replace('mailto:', '').split('?')[0];
      if (this.isValidEmail(email) && !this.isIgnoredEmail(email)) {
        return email;
      }
    }

    // Try contact sections
    const contactText = $('[class*="contact"], footer').text();
    const matches = contactText.match(emailPattern);
    if (matches) {
      for (const email of matches) {
        if (this.isValidEmail(email) && !this.isIgnoredEmail(email)) {
          return email;
        }
      }
    }

    return null;
  }

  isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  isIgnoredEmail(email) {
    const ignored = ['example.com', 'test.com', 'placeholder', 'wix.com', 'wordpress.com'];
    return ignored.some(pattern => email.toLowerCase().includes(pattern));
  }

  /**
   * Extract address
   */
  extractAddress($) {
    const selectors = ['[itemprop="address"]', 'address', '[class*="address"]'];
    
    for (const selector of selectors) {
      let text = $(selector).first().text().trim().replace(/\s+/g, ' ');
      
      // Check if address is valid length and not distance text
      if (text.length >= 15 && text.length <= 300 && !this.isDistanceText(text)) {
        // Extract business name from address if present
        text = this.cleanAddressFromBusinessName(text);
        
        // Validate cleaned address
        if (text.length >= 10) {
          return text;
        }
      }
    }
    
    return null;
  }

  /**
   * Clean address by removing business name prefix
   * Example: "TIDEL Park Coimbatore Ltd, 3rd Floor..." -> "3rd Floor..."
   */
  cleanAddressFromBusinessName(address) {
    if (!address) return address;
    
    // Pattern 1: "Company Name, Address" or "Company Name Ltd, Address"
    // Look for company suffix patterns followed by comma
    const companySuffixes = [
      'Ltd', 'Limited', 'Pvt Ltd', 'Private Limited', 'LLC', 'Inc', 
      'Corporation', 'Corp', 'Co', 'Company', 'Enterprises', 'Industries',
      'Solutions', 'Services', 'Group', 'Technologies', 'Tech'
    ];
    
    for (const suffix of companySuffixes) {
      // Case insensitive pattern: "Name [Suffix],"
      const pattern = new RegExp(`^.+?\\b${suffix}\\b\\s*,\\s*`, 'i');
      if (pattern.test(address)) {
        const cleaned = address.replace(pattern, '').trim();
        if (cleaned.length >= 10) {
          console.log(`[Address] Removed company name prefix: "${address.substring(0, 50)}..." -> "${cleaned.substring(0, 50)}..."`);
          return cleaned;
        }
      }
    }
    
    // Pattern 2: Remove everything before first floor/building indicator
    const addressStarters = [
      /,\s*(\d+(?:st|nd|rd|th)?\s+(?:Floor|floor))/i,
      /,\s*(Building|Block|Plot|Suite|Unit|Shop|Office)/i,
      /,\s*(\d+[A-Z]?\s+[A-Z])/  // "123A Main St"
    ];
    
    for (const pattern of addressStarters) {
      const match = address.match(pattern);
      if (match) {
        const cleaned = address.substring(address.indexOf(match[1]));
        if (cleaned.length >= 10) {
          console.log(`[Address] Extracted from delimiter: "${cleaned.substring(0, 50)}..."`);
          return cleaned;
        }
      }
    }
    
    return address;
  }

  isDistanceText(text) {
    return /\d+\.?\d*\s*(km|mi|miles|kilometers?)\s+(to|from|away)/i.test(text);
  }

  /**
   * Extract description
   */
  extractDescription($) {
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.length > 20) return metaDesc.substring(0, 500);

    const ogDesc = $('meta[property="og:description"]').attr('content');
    if (ogDesc && ogDesc.length > 20) return ogDesc.substring(0, 500);

    return null;
  }

  /**
   * Extract working hours
   */
  extractWorkingHours($) {
    const selectors = ['[class*="hours"]', '[id*="hours"]', '[class*="timing"]'];
    
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text.length > 10 && text.length < 200) {
        return text.replace(/\s+/g, ' ');
      }
    }
    
    return null;
  }

  /**
   * Extract services
   */
  extractServices($) {
    const services = [];
    const selectors = ['[class*="service"]', '[id*="service"]', 'ul li'];
    
    $(selectors.join(', ')).each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 5 && text.length < 100) {
        services.push(text);
      }
    });
    
    return services.slice(0, 10); // Limit to 10
  }

  /**
   * Extract specialties
   */
  extractSpecialties($) {
    const specialties = [];
    const keywords = ['specialt', 'expert', 'focus'];
    
    $('h2, h3, strong').each((i, elem) => {
      const text = $(elem).text().toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        const parent = $(elem).parent();
        parent.find('li, p').each((j, item) => {
          const specialty = $(item).text().trim();
          if (specialty.length > 5 && specialty.length < 100) {
            specialties.push(specialty);
          }
        });
      }
    });
    
    return specialties.slice(0, 10);
  }

  /**
   * Extract certifications
   */
  extractCertifications($) {
    const certs = [];
    const keywords = ['certifi', 'accredit', 'license'];
    
    $('body').text().split('\n').forEach(line => {
      if (keywords.some(k => line.toLowerCase().includes(k))) {
        const cleaned = line.trim();
        if (cleaned.length > 10 && cleaned.length < 150) {
          certs.push(cleaned);
        }
      }
    });
    
    return certs.slice(0, 5);
  }

  /**
   * Extract awards
   */
  extractAwards($) {
    const awards = [];
    const keywords = ['award', 'recognit', 'achievement'];
    
    $('h2, h3, strong').each((i, elem) => {
      const text = $(elem).text().toLowerCase();
      if (keywords.some(k => text.includes(k))) {
        const parent = $(elem).parent();
        parent.find('li, p').each((j, item) => {
          const award = $(item).text().trim();
          if (award.length > 5 && award.length < 150) {
            awards.push(award);
          }
        });
      }
    });
    
    return awards.slice(0, 5);
  }

  /**
   * Extract social profiles
   */
  extractSocialProfiles($) {
    const profiles = {};
    
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (!href) return;
      
      const lower = href.toLowerCase();
      
      // LinkedIn - look for company pages
      if (!profiles.linkedin && (lower.includes('linkedin.com/company') || lower.includes('linkedin.com/in'))) {
        profiles.linkedin = href;
      }
      
      // Facebook - exclude sharer/share links
      if (!profiles.facebook && lower.includes('facebook.com') && !lower.includes('sharer') && !lower.includes('/share')) {
        profiles.facebook = href;
      }
      
      // Instagram
      if (!profiles.instagram && lower.includes('instagram.com')) {
        profiles.instagram = href;
      }
      
      // Twitter/X - exclude intent/share links
      if (!profiles.twitter && (lower.includes('twitter.com') || lower.includes('x.com')) && !lower.includes('intent') && !lower.includes('/share')) {
        profiles.twitter = href;
      }
      
      // YouTube
      if (!profiles.youtube && (lower.includes('youtube.com') || lower.includes('youtu.be'))) {
        profiles.youtube = href;
      }
    });
    
    console.log(`[Enrichment] Extracted social profiles: ${JSON.stringify(profiles)}`);
    return profiles;
  }

  /**
   * Extract images
   */
  extractImages($, baseUrl) {
    const images = [];
    
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        images.push(src.startsWith('//') ? 'https:' + src : src);
      }
    });
    
    return images.slice(0, 5); // Limit to 5
  }

  /**
   * Validate URL
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new DataEnrichmentService();
