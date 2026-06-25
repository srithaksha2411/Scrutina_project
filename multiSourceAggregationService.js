/**
 * PHASE 3 - MULTI-SOURCE AGGREGATION SERVICE
 * 
 * Aggregates business data from multiple sources:
 * - Combines duplicate businesses found across sources
 * - Merges data fields intelligently
 * - Tracks all source URLs
 * - Creates unified business profiles
 */

class MultiSourceAggregationService {
  /**
   * MAIN AGGREGATION ENTRY POINT
   * Aggregates businesses from multiple sources into unified profiles
   */
  async aggregateBusinesses(businesses) {
    console.log(`\n========== PHASE 3: MULTI-SOURCE AGGREGATION ==========`);
    console.log(`Input: ${businesses.length} business records`);
    console.log(`======================================================\n`);

    // Group businesses by similarity
    const grouped = this.groupSimilarBusinesses(businesses);
    
    console.log(`[Aggregation] Grouped into ${grouped.length} unique businesses`);

    // Merge data from multiple sources
    const aggregated = grouped.map(group => this.mergeBusinessData(group));

    console.log(`[Aggregation] ✓ Aggregation complete\n`);

    return aggregated;
  }

  /**
   * Group similar businesses together
   * Uses multiple criteria: name, website, phone, address
   */
  groupSimilarBusinesses(businesses) {
    const groups = [];
    const processed = new Set();

    businesses.forEach((business, index) => {
      if (processed.has(index)) return;

      const group = [business];
      processed.add(index);

      // Find similar businesses
      businesses.forEach((other, otherIndex) => {
        if (otherIndex <= index || processed.has(otherIndex)) return;

        if (this.areBusinessesSimilar(business, other)) {
          group.push(other);
          processed.add(otherIndex);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Check if two businesses are the same entity
   * Uses multiple matching criteria
   */
  areBusinessesSimilar(b1, b2) {
    // Match by website (most reliable)
    if (b1.website && b2.website) {
      const domain1 = this.extractDomain(b1.website);
      const domain2 = this.extractDomain(b2.website);
      if (domain1 === domain2) {
        console.log(`[Aggregation] Match by website: ${b1.businessName} = ${b2.businessName}`);
        return true;
      }
    }

    // Match by phone (very reliable)
    if (b1.phone && b2.phone) {
      const phone1 = this.normalizePhone(b1.phone);
      const phone2 = this.normalizePhone(b2.phone);
      if (phone1 === phone2) {
        console.log(`[Aggregation] Match by phone: ${b1.businessName} = ${b2.businessName}`);
        return true;
      }
    }

    // Match by business name similarity (fuzzy)
    const nameSimilarity = this.calculateNameSimilarity(b1.businessName, b2.businessName);
    if (nameSimilarity > 0.85) {
      // Additional check: same location or address similarity
      if (this.isSameLocation(b1, b2)) {
        console.log(`[Aggregation] Match by name+location: ${b1.businessName} = ${b2.businessName}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch {
      return (url || '').toLowerCase();
    }
  }

  /**
   * Normalize phone number for comparison
   */
  normalizePhone(phone) {
    return phone.replace(/[^\d]/g, '').slice(-10); // Last 10 digits
  }

  /**
   * Calculate name similarity using Levenshtein distance
   */
  calculateNameSimilarity(name1, name2) {
    const s1 = this.normalizeName(name1);
    const s2 = this.normalizeName(name2);

    if (s1 === s2) return 1.0;

    const maxLength = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);
    
    return 1 - (distance / maxLength);
  }

  /**
   * Normalize business name for comparison
   */
  normalizeName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove special chars
      .replace(/\b(inc|ltd|llc|pvt|private|limited|corp|corporation)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Levenshtein distance algorithm
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Check if businesses are in same location
   */
  isSameLocation(b1, b2) {
    // Check address similarity
    if (b1.address && b2.address) {
      const addr1 = (b1.address || '').toLowerCase();
      const addr2 = (b2.address || '').toLowerCase();
      
      // Check if addresses share significant overlap
      const words1 = new Set(addr1.split(/\s+/));
      const words2 = new Set(addr2.split(/\s+/));
      const intersection = new Set([...words1].filter(x => words2.has(x)));
      
      if (intersection.size >= 3) return true;
    }

    // Check location field
    if (b1.location && b2.location) {
      return (b1.location || '').toLowerCase() === (b2.location || '').toLowerCase();
    }

    return false;
  }

  /**
   * Merge data from multiple business records
   * Prioritizes most complete and reliable data
   */
  mergeBusinessData(businessGroup) {
    console.log(`[Aggregation] Merging ${businessGroup.length} records for: ${businessGroup[0].businessName}`);
    console.log(`[Aggregation] DEBUG - Group business names:`);
    businessGroup.forEach((b, i) => {
      console.log(`[Aggregation]   ${i + 1}. "${b.businessName}"`);
    });

    const merged = {
      businessName: this.selectBestValue(businessGroup, 'businessName'),
      website: this.selectBestValue(businessGroup, 'website'),
      phone: this.selectBestValue(businessGroup, 'phone'),
      email: this.selectBestValue(businessGroup, 'email'),
      address: this.selectBestValue(businessGroup, 'address'),
      location: this.selectBestValue(businessGroup, 'location'),
      description: this.selectLongestValue(businessGroup, 'description'),
      workingHours: this.selectBestValue(businessGroup, 'workingHours'),
      rating: this.calculateAverageRating(businessGroup),
      reviewCount: this.sumReviews(businessGroup),
      services: this.mergeArrays(businessGroup, 'services'),
      specialties: this.mergeArrays(businessGroup, 'specialties'),
      certifications: this.mergeArrays(businessGroup, 'certifications'),
      awards: this.mergeArrays(businessGroup, 'awards'),
      licenseInformation: this.selectBestValue(businessGroup, 'licenseInformation'),
      socialProfiles: this.mergeSocialProfiles(businessGroup),
      imageUrls: this.mergeArrays(businessGroup, 'imageUrls'),
      sourceUrls: this.collectSourceUrls(businessGroup),
      sourceTypes: this.collectSourceTypes(businessGroup),
      industry: this.selectBestValue(businessGroup, 'industry'),
      industryConfidence: this.selectBestValue(businessGroup, 'industryConfidence'),
      searchQuery: this.selectBestValue(businessGroup, 'searchQuery'),
      duplicateCount: businessGroup.length - 1
    };

    console.log(`[Aggregation] DEBUG - Merged businessName: "${merged.businessName}"`);

    return merged;
  }

  /**
   * Select best (most complete) value from group
   */
  selectBestValue(group, field) {
    for (const business of group) {
      const value = business[field];
      if (value && value !== null && value !== 'N/A' && value.toString().trim().length > 0) {
        return value;
      }
    }
    return null;
  }

  /**
   * Select longest value (useful for descriptions)
   */
  selectLongestValue(group, field) {
    let longest = null;
    let maxLength = 0;

    group.forEach(business => {
      const value = business[field];
      if (value && value.length > maxLength) {
        longest = value;
        maxLength = value.length;
      }
    });

    return longest;
  }

  /**
   * Calculate average rating
   */
  calculateAverageRating(group) {
    const ratings = group
      .map(b => b.rating)
      .filter(r => r && r > 0);

    if (ratings.length === 0) return 0;

    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    return Math.round(avg * 10) / 10; // Round to 1 decimal
  }

  /**
   * Sum review counts
   */
  sumReviews(group) {
    return group.reduce((sum, b) => sum + (b.reviewCount || 0), 0);
  }

  /**
   * Merge arrays and remove duplicates
   */
  mergeArrays(group, field) {
    const merged = new Set();

    group.forEach(business => {
      const arr = business[field];
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item && item.trim()) {
            merged.add(item.trim());
          }
        });
      }
    });

    return Array.from(merged);
  }

  /**
   * Merge social profiles from all sources
   */
  mergeSocialProfiles(group) {
    const merged = {
      linkedin: null,
      facebook: null,
      instagram: null,
      twitter: null,
      youtube: null
    };

    group.forEach(business => {
      if (business.socialProfiles) {
        Object.keys(merged).forEach(platform => {
          if (!merged[platform] && business.socialProfiles[platform]) {
            merged[platform] = business.socialProfiles[platform];
          }
        });
      }
    });

    return merged;
  }

  /**
   * Collect all source URLs
   */
  collectSourceUrls(group) {
    const urls = new Set();

    group.forEach(business => {
      if (business.sourceUrl) {
        urls.add(business.sourceUrl);
      }
      if (business.website) {
        urls.add(business.website);
      }
      if (Array.isArray(business.sourceUrls)) {
        business.sourceUrls.forEach(url => urls.add(url));
      }
    });

    return Array.from(urls);
  }

  /**
   * Collect all source types
   */
  collectSourceTypes(group) {
    const types = new Set();

    group.forEach(business => {
      if (business.sourceType) {
        types.add(business.sourceType);
      }
    });

    return Array.from(types);
  }
}

module.exports = new MultiSourceAggregationService();
