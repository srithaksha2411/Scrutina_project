const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Email Extraction Service
 * Visits business websites and extracts contact emails and social media profiles
 */

class EmailExtractionService {
  constructor() {
    // Social media domain patterns
    this.socialDomains = {
      linkedin: ['linkedin.com'],
      facebook: ['facebook.com', 'fb.com'],
      instagram: ['instagram.com'],
      twitter: ['twitter.com', 'x.com'],
      youtube: ['youtube.com', 'youtu.be']
    };
    
    // Email regex pattern
    this.emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    
    // Common contact page paths
    this.contactPaths = [
      '/contact',
      '/contact-us',
      '/contactus',
      '/about',
      '/about-us',
      '/aboutus',
      '/get-in-touch',
      '/reach-us',
      '/support'
    ];
    
    // Email patterns to ignore (generic/spam)
    this.ignorePatterns = [
      'example@',
      'test@',
      'noreply@',
      'no-reply@',
      'donotreply@',
      'webmaster@',
      'admin@example',
      'info@example',
      'support@example',
      'sales@example',
      '@example.com',
      '@test.com',
      '@domain.com',
      '@yourcompany.com',
      '@yourdomain.com',
      'privacy@',
      'legal@'
    ];
  }

  /**
   * Extract email and social profiles from a business website
   * @param {string} websiteUrl - Business website URL
   * @param {string} businessName - Business name for logging
   * @returns {Promise<{email: string|null, socialProfiles: object}>} - Extracted data
   */
  async extractData(websiteUrl, businessName = 'Unknown') {
    if (!websiteUrl || websiteUrl === 'N/A') {
      return { email: null, socialProfiles: {} };
    }

    try {
      console.log(`📧 [${businessName}] Extracting data from: ${websiteUrl}`);
      
      // Normalize URL
      const baseUrl = this.normalizeUrl(websiteUrl);
      if (!baseUrl) {
        return { email: null, socialProfiles: {} };
      }

      // Try homepage first
      let result = await this.extractFromPage(baseUrl, businessName);
      
      if (result.email) {
        console.log(`✅ [${businessName}] Found email on homepage: ${result.email}`);
      }

      // Try contact pages if no email yet
      if (!result.email) {
        for (const path of this.contactPaths) {
          const contactUrl = baseUrl + path;
          const contactResult = await this.extractFromPage(contactUrl, businessName, true);
          
          if (contactResult.email) {
            console.log(`✅ [${businessName}] Found email on ${path}: ${contactResult.email}`);
            result.email = contactResult.email;
          }

          // Merge social profiles
          result.socialProfiles = { ...result.socialProfiles, ...contactResult.socialProfiles };

          if (result.email) break;
        }
      }

      const socialCount = Object.keys(result.socialProfiles).length;
      if (socialCount > 0) {
        console.log(`🔗 [${businessName}] Found ${socialCount} social profiles`);
      }

      if (!result.email) {
        console.log(`⚠️ [${businessName}] No email found`);
      }

      return result;

    } catch (error) {
      console.error(`❌ [${businessName}] Data extraction error:`, error.message);
      return { email: null, socialProfiles: {} };
    }
  }

  /**
   * LEGACY: Extract email only (for backwards compatibility)
   * @param {string} websiteUrl - Business website URL
   * @param {string} businessName - Business name for logging
   * @returns {Promise<string|null>} - Extracted email or null
   */
  async extractEmail(websiteUrl, businessName = 'Unknown') {
    if (!websiteUrl || websiteUrl === 'N/A') {
      return null;
    }

    const result = await this.extractData(websiteUrl, businessName);
    return result.email;
  }

  /**
   * Extract email and social profiles from a specific page
   * @param {string} url - Page URL
   * @param {string} businessName - Business name for logging
   * @param {boolean} isContactPage - Whether this is a contact page
   * @returns {Promise<{email: string|null, socialProfiles: object}>} - Extracted data
   */
  async extractFromPage(url, businessName, isContactPage = false) {
    try {
      // Fetch page with timeout
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        maxRedirects: 3,
        validateStatus: (status) => status < 400
      });

      if (response.status !== 200) {
        return { email: null, socialProfiles: {} };
      }

      // Parse HTML
      const $ = cheerio.load(response.data);
      
      // Extract social profiles from anchor tags
      const socialProfiles = this.extractSocialProfiles($);
      
      // Remove script and style tags
      $('script, style, noscript').remove();
      
      // Get page text
      const pageText = $('body').text();
      
      // Extract all emails
      const emails = this.extractEmailsFromText(pageText);
      
      // Return the best email and social profiles
      return {
        email: emails.length > 0 ? this.selectBestEmail(emails, businessName) : null,
        socialProfiles
      };

    } catch (error) {
      // Silently fail for contact pages (they might not exist)
      if (!isContactPage) {
        console.error(`❌ [${businessName}] Error fetching ${url}:`, error.message);
      }
      return { email: null, socialProfiles: {} };
    }
  }

  /**
   * Extract social media profiles from anchor tags
   * @param {object} $ - Cheerio instance
   * @returns {object} - Social profiles object
   */
  extractSocialProfiles($) {
    const profiles = {
      linkedin: null,
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null
    };

    // Scan all anchor tags
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      if (!href) return;

      try {
        const url = new URL(href, 'https://example.com');
        const hostname = url.hostname.toLowerCase().replace('www.', '');

        // Check each social platform
        for (const [platform, domains] of Object.entries(this.socialDomains)) {
          if (domains.some(domain => hostname.includes(domain))) {
            // Only save if not already found (first occurrence wins)
            if (!profiles[platform]) {
              const cleanUrl = this.cleanSocialUrl(href, platform);
              if (cleanUrl && this.isValidSocialUrl(cleanUrl, platform)) {
                profiles[platform] = cleanUrl;
              }
            }
          }
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });

    // Remove null values
    Object.keys(profiles).forEach(key => {
      if (!profiles[key]) delete profiles[key];
    });

    return profiles;
  }

  /**
   * Clean and normalize social media URL
   * @param {string} url - Social media URL
   * @param {string} platform - Platform name
   * @returns {string|null} - Cleaned URL
   */
  cleanSocialUrl(url, platform) {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      
      // Remove tracking parameters
      urlObj.search = '';
      urlObj.hash = '';

      // Normalize hostname
      let hostname = urlObj.hostname.toLowerCase();
      if (!hostname.startsWith('www.')) {
        // Add www for consistency (except for x.com)
        if (platform !== 'twitter' || !hostname.includes('x.com')) {
          hostname = 'www.' + hostname;
        }
      }

      urlObj.hostname = hostname;

      return urlObj.toString().replace(/\/$/, ''); // Remove trailing slash

    } catch (error) {
      return null;
    }
  }

  /**
   * Validate social media URL
   * @param {string} url - Social media URL
   * @param {string} platform - Platform name
   * @returns {boolean} - Is valid
   */
  isValidSocialUrl(url, platform) {
    if (!url) return false;

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      // Ignore generic/invalid paths
      const invalidPaths = [
        '/share',
        '/intent',
        '/sharer',
        '/plugins',
        '/widgets',
        '/embed',
        '/watch?v=',
        '/hashtag',
        '/search'
      ];

      for (const invalid of invalidPaths) {
        if (pathname.includes(invalid)) return false;
      }

      // Must have a meaningful path
      if (pathname === '/' || pathname === '') return false;

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Extract all valid emails from text
   * @param {string} text - Text to search
   * @returns {Array<string>} - Array of valid emails
   */
  extractEmailsFromText(text) {
    if (!text) return [];

    // Find all email matches
    const matches = text.match(this.emailRegex) || [];
    
    // Validate and filter emails
    const validEmails = matches
      .map(email => email.toLowerCase().trim())
      .filter(email => this.isValidEmail(email))
      .filter(email => !this.shouldIgnoreEmail(email));
    
    // Remove duplicates
    return [...new Set(validEmails)];
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} - Is valid
   */
  isValidEmail(email) {
    if (!email || email.length < 5) return false;
    
    // Basic validation
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domain] = parts;
    
    // Check local part
    if (localPart.length === 0 || localPart.length > 64) return false;
    
    // Check domain
    if (domain.length === 0 || domain.length > 255) return false;
    if (!domain.includes('.')) return false;
    
    // Check TLD
    const tld = domain.split('.').pop();
    if (tld.length < 2) return false;
    
    return true;
  }

  /**
   * Check if email should be ignored
   * @param {string} email - Email to check
   * @returns {boolean} - Should ignore
   */
  shouldIgnoreEmail(email) {
    const emailLower = email.toLowerCase();
    
    // Check against ignore patterns
    for (const pattern of this.ignorePatterns) {
      if (emailLower.includes(pattern)) {
        return true;
      }
    }
    
    // Ignore emails with suspicious patterns
    if (emailLower.includes('png') || emailLower.includes('jpg') || emailLower.includes('gif')) {
      return true;
    }
    
    // Ignore very long local parts (likely spam)
    const localPart = emailLower.split('@')[0];
    if (localPart.length > 30) {
      return true;
    }
    
    return false;
  }

  /**
   * Select the best email from multiple options
   * @param {Array<string>} emails - Array of emails
   * @param {string} businessName - Business name
   * @returns {string} - Best email
   */
  selectBestEmail(emails, businessName) {
    if (emails.length === 0) return null;
    if (emails.length === 1) return emails[0];

    // Prioritize common business email prefixes
    const priorities = [
      'info@',
      'contact@',
      'hello@',
      'support@',
      'sales@',
      'enquiry@',
      'inquiry@',
      'admin@',
      'office@'
    ];

    // Check for priority emails
    for (const prefix of priorities) {
      const priorityEmail = emails.find(e => e.startsWith(prefix));
      if (priorityEmail) {
        return priorityEmail;
      }
    }

    // Try to match business name
    if (businessName && businessName !== 'Unknown') {
      const nameParts = businessName.toLowerCase().split(' ');
      for (const part of nameParts) {
        if (part.length > 3) {
          const matchedEmail = emails.find(e => e.includes(part));
          if (matchedEmail) {
            return matchedEmail;
          }
        }
      }
    }

    // Return first valid email
    return emails[0];
  }

  /**
   * Normalize URL
   * @param {string} url - URL to normalize
   * @returns {string|null} - Normalized URL
   */
  normalizeUrl(url) {
    try {
      if (!url) return null;
      
      // Add https:// if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Parse URL
      const urlObj = new URL(url);
      
      // Return base URL without path
      return `${urlObj.protocol}//${urlObj.hostname}`;
      
    } catch (error) {
      console.error('Invalid URL:', url);
      return null;
    }
  }

  /**
   * Extract emails and social profiles for multiple businesses
   * @param {Array} businesses - Array of business objects
   * @returns {Promise<Array>} - Businesses with emails and social profiles
   */
  async extractEmailsForBusinesses(businesses) {
    console.log(`\n📧 Starting data extraction for ${businesses.length} businesses...\n`);
    
    const results = [];
    let emailCount = 0;
    let socialCount = 0;
    
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      
      console.log(`[${i + 1}/${businesses.length}] Processing: ${business.name}`);
      
      // Extract email and social profiles
      const data = await this.extractData(business.website, business.name);
      
      // Add email to business object
      business.email = data.email || 'N/A';
      
      // Add social profiles to business object
      business.socialProfiles = data.socialProfiles;
      
      if (data.email) emailCount++;
      if (Object.keys(data.socialProfiles).length > 0) socialCount++;
      
      results.push(business);
      
      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Data extraction complete: ${emailCount}/${businesses.length} emails, ${socialCount}/${businesses.length} with social profiles\n`);
    
    return results;
  }
}

module.exports = new EmailExtractionService();
