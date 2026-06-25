/**
 * Business Scraper Service
 * 
 * Extracts contact information and business details from websites
 * Uses cheerio for HTML parsing
 */

const axios = require('axios');
const cheerio = require('cheerio');

class BusinessScraperService {
  constructor() {
    this.timeout = 10000; // 10 seconds timeout
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  /**
   * Scrape business website for contact information
   * @param {string} url - Website URL
   * @param {string} businessName - Business name for logging
   * @returns {Object} - Extracted business data
   */
  async scrapeWebsite(url, businessName = 'Unknown') {
    console.log(`[Scraper] Scraping: ${businessName} - ${url}`);

    const result = {
      businessName: null,
      phone: null,
      email: null,
      address: null,
      description: null,
      industry: null,
      socialProfiles: {
        linkedin: null,
        facebook: null,
        instagram: null
      }
    };

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract business name
      result.businessName = this.extractBusinessName($);
      console.log(`[Scraper] Business Name: ${result.businessName || 'not found'}`);

      // Extract phone numbers
      result.phone = this.extractPhone(html, $);
      console.log(`[Scraper] Phone: ${result.phone || 'not found'}`);

      // Extract emails
      result.email = this.extractEmail(html, $);
      console.log(`[Scraper] Email: ${result.email || 'not found'}`);

      // Extract address
      result.address = this.extractAddress($);
      console.log(`[Scraper] Address: ${result.address || 'not found'}`);

      // Extract description and infer industry
      result.description = this.extractDescription($);
      result.industry = this.inferIndustry(result.description, $);
      console.log(`[Scraper] Industry: ${result.industry || 'not found'}`);

      // Extract social media profiles
      result.socialProfiles = this.extractSocialProfiles($, url);

      console.log(`[Scraper] ✓ Completed scraping ${businessName}`);

    } catch (error) {
      console.log(`[Scraper] ✗ Failed to scrape ${url}: ${error.message}`);
    }

    return result;
  }

  /**
   * Extract phone number from website
   */
  extractPhone(html, $) {
    // Try tel: links first
    const telLinks = $('a[href^="tel:"]');
    for (let i = 0; i < telLinks.length; i++) {
      const href = $(telLinks[i]).attr('href');
      const phone = href.replace('tel:', '').trim();
      if (this.isValidPhone(phone)) {
        return this.formatPhone(phone);
      }
    }

    // Phone patterns for India
    const phonePatterns = [
      /\+91[\s-]?\d{10}/g,  // +91 xxxxxxxxxx
      /\+91\d{10}/g,         // +91xxxxxxxxxx
      /\(?0\d{2,4}\)?[\s-]?\d{6,8}/g,  // (0422) xxxxxx or 0422-xxxxxx
      /\d{10}/g  // 10 digit numbers
    ];

    // Try to find phone in specific elements
    const phoneElements = [
      '[class*="phone"]',
      '[id*="phone"]',
      '[class*="contact"]',
      '[class*="call"]',
      'footer'
    ];

    for (const selector of phoneElements) {
      const elements = $(selector);
      elements.each((i, elem) => {
        const text = $(elem).text();
        for (const pattern of phonePatterns) {
          const matches = text.match(pattern);
          if (matches) {
            for (const match of matches) {
              const cleaned = match.replace(/[^\d+]/g, '');
              if (this.isValidPhone(cleaned)) {
                return this.formatPhone(cleaned);
              }
            }
          }
        }
      });
    }

    return null;
  }

  /**
   * Validate phone number
   */
  isValidPhone(phone) {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Remove + for length check
    const digitsOnly = cleaned.replace('+', '');
    
    // Must be between 10-15 digits
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return false;
    }

    // Ignore invalid patterns (all same digits, sequential)
    if (/^(\d)\1+$/.test(digitsOnly)) {
      return false;
    }

    // Ignore numbers that look like IDs (very large numbers)
    if (digitsOnly.length > 12 && !cleaned.startsWith('+')) {
      return false;
    }

    return true;
  }

  /**
   * Format phone number
   */
  formatPhone(phone) {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Extract email from website
   */
  extractEmail(html, $) {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Try mailto links first
    const mailtoLink = $('a[href^="mailto:"]').first().attr('href');
    if (mailtoLink) {
      const email = mailtoLink.replace('mailto:', '').split('?')[0];
      if (this.isValidEmail(email)) {
        return email;
      }
    }

    // Try contact sections
    const contactSections = $('[class*="contact"], [id*="contact"], footer');
    const contactText = contactSections.text();
    const emailMatch = contactText.match(emailPattern);
    if (emailMatch) {
      const email = emailMatch[0];
      if (this.isValidEmail(email)) {
        return email;
      }
    }

    // Fallback: search entire HTML
    const matches = html.match(emailPattern);
    if (matches) {
      for (const email of matches) {
        if (this.isValidEmail(email) && !this.isIgnoredEmail(email)) {
          return email;
        }
      }
    }

    return null;
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email should be ignored (generic/placeholder)
   */
  isIgnoredEmail(email) {
    const ignoredPatterns = [
      'example.com', 'test.com', 'placeholder', 'yourdomain',
      'sentry.io', 'gravatar.com', 'schema.org', 'wix.com',
      'wordpress.com', 'cloudflare.com'
    ];
    
    const lowerEmail = email.toLowerCase();
    return ignoredPatterns.some(pattern => lowerEmail.includes(pattern));
  }

  /**
   * Extract address from website
   */
  extractAddress($) {
    const addressSelectors = [
      '[itemprop="address"]',
      'address',
      '[class*="address"]',
      '[id*="address"]',
      '[class*="location"]'
    ];

    for (const selector of addressSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let address = element.text().trim();
        
        // Clean up whitespace
        address = address.replace(/\s+/g, ' ');
        
        // Filter out distance text
        if (this.isDistanceText(address)) {
          continue;
        }
        
        // Valid address should be 15-300 characters
        if (address.length >= 15 && address.length <= 300) {
          return address;
        }
      }
    }

    return null;
  }

  /**
   * Check if text is distance information
   */
  isDistanceText(text) {
    const distancePatterns = [
      /\d+\.?\d*\s*(km|mi|miles|kilometers?)\s+(to|from|away)/i,
      /^\d+\.?\d*\s*(km|mi|miles)$/i
    ];
    
    return distancePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract business name
   */
  extractBusinessName($) {
    // Try og:site_name first
    const ogSiteName = $('meta[property="og:site_name"]').attr('content');
    if (ogSiteName && ogSiteName.length > 0 && ogSiteName.length < 100) {
      return ogSiteName.trim();
    }

    // Try title tag (remove common suffixes)
    const title = $('title').text();
    if (title) {
      const cleaned = title
        .replace(/[-–|].*$/g, '') // Remove everything after dash/pipe
        .replace(/\s*[–-]\s*Home\s*$/i, '')
        .replace(/\s*[–-]\s*Official\s*$/i, '')
        .trim();
      
      if (cleaned.length > 0 && cleaned.length < 100) {
        return cleaned;
      }
    }

    // Try schema.org markup
    const schemaName = $('[itemtype*="schema.org/Organization"] [itemprop="name"]').text().trim();
    if (schemaName && schemaName.length > 0 && schemaName.length < 100) {
      return schemaName;
    }

    return null;
  }

  /**
   * Extract company description
   */
  extractDescription($) {
    // Try meta description first
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.length > 20) {
      return metaDesc.substring(0, 500);
    }

    // Try Open Graph description
    const ogDesc = $('meta[property="og:description"]').attr('content');
    if (ogDesc && ogDesc.length > 20) {
      return ogDesc.substring(0, 500);
    }

    // Try about section
    const aboutSection = $('[class*="about"], [id*="about"]').first().text().trim();
    if (aboutSection && aboutSection.length > 20) {
      return aboutSection.substring(0, 500);
    }

    return null;
  }

  /**
   * Infer industry from description and content
   */
  inferIndustry(description, $) {
    if (!description) return null;

    const industries = {
      'Hotel': ['hotel', 'resort', 'accommodation', 'lodging', 'stay'],
      'Restaurant': ['restaurant', 'cafe', 'dining', 'food', 'cuisine'],
      'IT Services': ['software', 'it services', 'technology', 'development', 'consulting'],
      'Healthcare': ['hospital', 'clinic', 'medical', 'healthcare', 'doctor'],
      'Retail': ['shop', 'store', 'retail', 'shopping', 'mart'],
      'Education': ['school', 'college', 'university', 'education', 'training'],
      'Finance': ['bank', 'finance', 'insurance', 'investment'],
      'Real Estate': ['real estate', 'property', 'builder', 'construction'],
      'Manufacturing': ['manufacturer', 'factory', 'production', 'industrial']
    };

    const text = (description + ' ' + $('h1, h2').text()).toLowerCase();

    for (const [industry, keywords] of Object.entries(industries)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return industry;
        }
      }
    }

    return null;
  }

  /**
   * Extract social media profiles
   */
  extractSocialProfiles($, baseUrl) {
    const profiles = {
      linkedin: null,
      facebook: null,
      instagram: null
    };

    // Find all links
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (!href) return;

      const lowerHref = href.toLowerCase();

      if (!profiles.linkedin && lowerHref.includes('linkedin.com/company')) {
        profiles.linkedin = href;
      } else if (!profiles.facebook && lowerHref.includes('facebook.com') && !lowerHref.includes('sharer')) {
        profiles.facebook = href;
      } else if (!profiles.instagram && lowerHref.includes('instagram.com')) {
        profiles.instagram = href;
      }
    });

    return profiles;
  }

  /**
   * Batch scrape multiple websites
   * @param {Array} websites - Array of {url, businessName}
   * @returns {Array} - Array of scraped data
   */
  async batchScrape(websites) {
    console.log(`[Scraper] Starting batch scrape for ${websites.length} websites...`);
    
    const results = [];
    
    for (const site of websites) {
      const data = await this.scrapeWebsite(site.url, site.businessName);
      results.push({
        url: site.url,
        businessName: site.businessName,
        ...data
      });
      
      // Respectful delay between requests
      await this.delay(1000);
    }

    console.log(`[Scraper] Batch scrape completed: ${results.length} websites processed`);
    return results;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new BusinessScraperService();
