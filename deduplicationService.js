/**
 * Deduplication Service
 * 
 * Detects and removes duplicate business records
 * Merges information from multiple sources
 */

const Business = require('../models/Business');

class DeduplicationService {
  /**
   * Remove duplicates from business array
   * @param {Array} businesses - Array of business records
   * @returns {Object} - {unique, duplicates}
   */
  async removeDuplicates(businesses) {
    console.log(`[Dedup] Processing ${businesses.length} businesses...`);
    
    const seenWebsites = new Map();
    const unique = [];
    const duplicates = [];

    for (const business of businesses) {
      const normalizedWebsite = this.normalizeWebsite(business.website);
      
      if (!normalizedWebsite) {
        continue; // Skip if no valid website
      }

      if (seenWebsites.has(normalizedWebsite)) {
        // Duplicate found - merge data
        const existingBusiness = seenWebsites.get(normalizedWebsite);
        this.mergeBusinessData(existingBusiness, business);
        duplicates.push(business);
        console.log(`[Dedup] Duplicate detected: ${business.businessName}`);
      } else {
        seenWebsites.set(normalizedWebsite, business);
        unique.push(business);
      }
    }

    console.log(`[Dedup] Result: ${unique.length} unique, ${duplicates.length} duplicates removed`);
    
    return {
      unique,
      duplicatesFound: duplicates.length
    };
  }

  /**
   * Normalize website URL for comparison
   */
  normalizeWebsite(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      let hostname = (urlObj.hostname || '').toLowerCase();
      
      // Remove www prefix
      hostname = hostname.replace(/^www\./, '');
      
      return hostname;
    } catch {
      return (url || '').toLowerCase().replace(/^www\./, '');
    }
  }

  /**
   * Merge business data from multiple sources
   */
  mergeBusinessData(existing, newData) {
    // Merge only if new data has better information
    if (!existing.phone && newData.phone) {
      existing.phone = newData.phone;
    }
    if (!existing.email && newData.email) {
      existing.email = newData.email;
    }
    if (!existing.address && newData.address) {
      existing.address = newData.address;
    }
    if (!existing.description && newData.description) {
      existing.description = newData.description;
    }
    
    // Merge social profiles
    if (newData.socialProfiles) {
      if (!existing.socialProfiles) {
        existing.socialProfiles = {};
      }
      if (!existing.socialProfiles.linkedin && newData.socialProfiles.linkedin) {
        existing.socialProfiles.linkedin = newData.socialProfiles.linkedin;
      }
      if (!existing.socialProfiles.facebook && newData.socialProfiles.facebook) {
        existing.socialProfiles.facebook = newData.socialProfiles.facebook;
      }
      if (!existing.socialProfiles.instagram && newData.socialProfiles.instagram) {
        existing.socialProfiles.instagram = newData.socialProfiles.instagram;
      }
    }

    // Add source URLs
    if (!existing.sourceUrls) {
      existing.sourceUrls = [];
    }
    if (newData.sourceUrl && !existing.sourceUrls.includes(newData.sourceUrl)) {
      existing.sourceUrls.push(newData.sourceUrl);
    }
  }

  /**
   * Check if business already exists in database
   * @param {string} website - Business website
   * @returns {Object|null} - Existing business or null
   */
  async findExistingBusiness(website) {
    const normalizedWebsite = this.normalizeWebsite(website);
    
    try {
      const existing = await Business.findOne({
        website: new RegExp(normalizedWebsite, 'i')
      });
      
      return existing;
    } catch (error) {
      console.error('[Dedup] Database lookup error:', error);
      return null;
    }
  }

  /**
   * Save or update business in database
   * @param {Object} businessData - Business data to save
   * @returns {Object} - Saved business document
   */
  async saveOrUpdateBusiness(businessData) {
    try {
      const normalizedWebsite = this.normalizeWebsite(businessData.website);
      
      // Check if business already exists
      const existing = await this.findExistingBusiness(normalizedWebsite);
      
      if (existing) {
        // Update existing business with new data
        console.log(`[Dedup] Updating existing business: ${existing.businessName}`);
        
        // Merge data
        if (businessData.phone && !existing.phone) existing.phone = businessData.phone;
        if (businessData.email && !existing.email) existing.email = businessData.email;
        if (businessData.address && !existing.address) existing.address = businessData.address;
        if (businessData.description && !existing.description) existing.description = businessData.description;
        
        // Save updated business
        await existing.save();
        return existing;
      } else {
        // Create new business
        console.log(`[Dedup] Creating new business: ${businessData.businessName}`);
        const business = new Business(businessData);
        await business.save();
        return business;
      }
    } catch (error) {
      console.error('[Dedup] Save error:', error.message);
      throw error;
    }
  }

  /**
   * Batch save businesses to database
   * @param {Array} businesses - Array of business records
   * @returns {Object} - {saved, updated, errors}
   */
  async batchSave(businesses) {
    console.log(`[Dedup] Batch saving ${businesses.length} businesses...`);
    
    let saved = 0;
    let updated = 0;
    let errors = 0;

    for (const business of businesses) {
      try {
        const existing = await this.findExistingBusiness(business.website);
        
        if (existing) {
          await this.saveOrUpdateBusiness(business);
          updated++;
        } else {
          await this.saveOrUpdateBusiness(business);
          saved++;
        }
      } catch (error) {
        console.error(`[Dedup] Error saving ${business.businessName}:`, error.message);
        errors++;
      }
    }

    console.log(`[Dedup] Batch save complete: ${saved} new, ${updated} updated, ${errors} errors`);
    
    return { saved, updated, errors };
  }
}

module.exports = new DeduplicationService();
