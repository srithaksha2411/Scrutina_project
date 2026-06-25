/**
 * PHASE 6 - MONGODB STORAGE SERVICE
 * 
 * Handles storage and retrieval of business data in MongoDB:
 * - Saves enriched business profiles
 * - Handles duplicates intelligently
 * - Updates existing records
 * - Maintains data integrity
 */

const Business = require('../models/Business');

class MongoDBStorageService {
  /**
   * MAIN STORAGE ENTRY POINT
   * Saves businesses to MongoDB
   */
  async saveBusinesses(businesses, userId, researchId) {
    console.log(`\n========== PHASE 6: MONGODB STORAGE ==========`);
    console.log(`Saving ${businesses.length} businesses to MongoDB...`);
    console.log(`User ID: ${userId}`);
    console.log(`Research ID: ${researchId}`);
    console.log(`==============================================\n`);

    const results = {
      saved: 0,
      updated: 0,
      failed: 0,
      businessIds: []
    };

    for (const business of businesses) {
      try {
        const result = await this.saveBusiness(business, userId, researchId);
        
        if (result.isNew) {
          results.saved++;
          console.log(`[Storage] ✓ Saved: ${business.businessName}`);
        } else {
          results.updated++;
          console.log(`[Storage] ✓ Updated: ${business.businessName}`);
        }
        
        results.businessIds.push(result.businessId);

      } catch (error) {
        results.failed++;
        console.log(`[Storage] ✗ Failed: ${business.businessName} - ${error.message}`);
      }
    }

    console.log(`\n[Storage Summary]`);
    console.log(`Saved: ${results.saved}`);
    console.log(`Updated: ${results.updated}`);
    console.log(`Failed: ${results.failed}\n`);

    return results;
  }

  /**
   * Save or update a single business
   */
  async saveBusiness(business, userId, researchId) {
    // CRITICAL VALIDATION: Skip businesses without names
    if (!business.businessName || business.businessName.trim() === '') {
      console.warn(`[Storage] ⚠️  Skipping business without name. Website: ${business.website || 'unknown'}`);
      throw new Error('Business name is required');
    }
    
    // ALWAYS CREATE NEW BUSINESS FOR EACH RESEARCH SESSION
    // Each user's research should have its own separate business records
    const newBusiness = await Business.create({
      userId,
      researchId,
      businessName: business.businessName,
      website: business.website,
      phone: business.phone,
      email: business.email,
      address: business.address,
      location: business.location,
      description: business.description,
      workingHours: business.workingHours,
      rating: business.rating || 0,
      reviewCount: business.reviewCount || 0,
      services: business.services || [],
      specialties: business.specialties || [],
      licenseInformation: business.licenseInformation,
      certifications: business.certifications || [],
      awards: business.awards || [],
      socialProfiles: business.socialProfiles || {},
      imageUrls: business.imageUrls || [],
      sourceUrls: business.sourceUrls || [],
      verificationScore: business.verificationScore || 0,
      verificationStatus: business.verificationStatus || 'LOW_CONFIDENCE',
      duplicateCount: business.duplicateCount || 0,
      dataSources: this.buildDataSources(business),
      industry: business.industry,
      securityScore: business.securityScore || 0,
      verified: business.verificationStatus === 'VERIFIED'
    });

    return {
      isNew: true,
      businessId: newBusiness._id,
      business: newBusiness
    };
  }

  /**
   * Update existing business with new data
   * Merges data intelligently, keeping best values
   */
  async updateBusiness(existing, newData) {
    // Update only if new data is better
    const updates = {};

    // Update basic fields if missing or new data is better
    if (!existing.phone && newData.phone) updates.phone = newData.phone;
    if (!existing.email && newData.email) updates.email = newData.email;
    if (!existing.address && newData.address) updates.address = newData.address;
    if (!existing.description && newData.description) updates.description = newData.description;
    if (!existing.workingHours && newData.workingHours) updates.workingHours = newData.workingHours;

    // Update rating and reviews (take higher values)
    if (newData.rating > existing.rating) updates.rating = newData.rating;
    if (newData.reviewCount > existing.reviewCount) updates.reviewCount = newData.reviewCount;

    // Merge arrays (add unique values)
    if (newData.services && newData.services.length > 0) {
      updates.services = [...new Set([...existing.services, ...newData.services])];
    }
    if (newData.specialties && newData.specialties.length > 0) {
      updates.specialties = [...new Set([...existing.specialties, ...newData.specialties])];
    }
    if (newData.certifications && newData.certifications.length > 0) {
      updates.certifications = [...new Set([...existing.certifications, ...newData.certifications])];
    }
    if (newData.awards && newData.awards.length > 0) {
      updates.awards = [...new Set([...existing.awards, ...newData.awards])];
    }
    if (newData.imageUrls && newData.imageUrls.length > 0) {
      updates.imageUrls = [...new Set([...existing.imageUrls, ...newData.imageUrls])];
    }
    if (newData.sourceUrls && newData.sourceUrls.length > 0) {
      updates.sourceUrls = [...new Set([...existing.sourceUrls, ...newData.sourceUrls])];
    }

    // Merge social profiles
    if (newData.socialProfiles) {
      updates.socialProfiles = {
        linkedin: existing.socialProfiles.linkedin || newData.socialProfiles.linkedin,
        facebook: existing.socialProfiles.facebook || newData.socialProfiles.facebook,
        instagram: existing.socialProfiles.instagram || newData.socialProfiles.instagram,
        twitter: existing.socialProfiles.twitter || newData.socialProfiles.twitter,
        youtube: existing.socialProfiles.youtube || newData.socialProfiles.youtube
      };
    }

    // Update verification score if better
    if (newData.verificationScore > existing.verificationScore) {
      updates.verificationScore = newData.verificationScore;
      updates.verificationStatus = newData.verificationStatus;
      updates.verified = newData.verificationStatus === 'VERIFIED';
    }

    // Update duplicate count
    if (newData.duplicateCount > existing.duplicateCount) {
      updates.duplicateCount = newData.duplicateCount;
    }

    // Update timestamp
    updates.updatedAt = new Date();

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await Business.findByIdAndUpdate(existing._id, updates, { new: true });
    }

    return await Business.findById(existing._id);
  }

  /**
   * Build data sources array
   */
  buildDataSources(business) {
    const sources = [];

    if (business.sourceUrls) {
      business.sourceUrls.forEach(url => {
        sources.push({
          source: this.extractSourceName(url),
          url: url,
          type: this.determineSourceType(url),
          scrapedAt: new Date()
        });
      });
    }

    return sources;
  }

  /**
   * Extract source name from URL
   */
  extractSourceName(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Determine source type
   */
  determineSourceType(url) {
    const lower = url.toLowerCase();
    
    if (lower.includes('google.com/maps')) return 'google_maps';
    if (lower.includes('linkedin.com')) return 'linkedin';
    if (lower.includes('facebook.com')) return 'facebook';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    
    return 'website';
  }

  /**
   * Get business by ID
   */
  async getBusinessById(businessId) {
    try {
      const business = await Business.findById(businessId);
      return business;
    } catch (error) {
      console.error('[Storage] Error fetching business:', error.message);
      return null;
    }
  }

  /**
   * Search businesses
   */
  async searchBusinesses(query, filters = {}) {
    try {
      const searchQuery = {
        $or: [
          { businessName: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } }
        ]
      };

      // Apply filters
      if (filters.industry) {
        searchQuery.industry = filters.industry;
      }
      if (filters.verificationStatus) {
        searchQuery.verificationStatus = filters.verificationStatus;
      }
      if (filters.minScore) {
        searchQuery.verificationScore = { $gte: filters.minScore };
      }

      const businesses = await Business.find(searchQuery)
        .sort({ verificationScore: -1, reviewCount: -1 })
        .limit(filters.limit || 50);

      return businesses;

    } catch (error) {
      console.error('[Storage] Error searching businesses:', error.message);
      return [];
    }
  }

  /**
   * Get businesses by location
   */
  async getBusinessesByLocation(location) {
    try {
      const businesses = await Business.find({
        location: { $regex: location, $options: 'i' }
      }).sort({ verificationScore: -1 });

      return businesses;
    } catch (error) {
      console.error('[Storage] Error fetching by location:', error.message);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        totalBusinesses: await Business.countDocuments(),
        verified: await Business.countDocuments({ verificationStatus: 'VERIFIED' }),
        highConfidence: await Business.countDocuments({ verificationStatus: 'HIGH_CONFIDENCE' }),
        mediumConfidence: await Business.countDocuments({ verificationStatus: 'MEDIUM_CONFIDENCE' }),
        lowConfidence: await Business.countDocuments({ verificationStatus: 'LOW_CONFIDENCE' }),
        withPhone: await Business.countDocuments({ phone: { $ne: null, $exists: true } }),
        withEmail: await Business.countDocuments({ email: { $ne: null, $exists: true } }),
        withAddress: await Business.countDocuments({ address: { $ne: null, $exists: true } })
      };

      return stats;
    } catch (error) {
      console.error('[Storage] Error fetching stats:', error.message);
      return null;
    }
  }
}

module.exports = new MongoDBStorageService();
