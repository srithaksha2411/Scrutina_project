/**
 * CONFLICT DETECTION SERVICE
 * Integrates conflict detection into the business intelligence pipeline
 */

const conflictDetector = require('../utils/conflictDetector');

class ConflictDetectionService {
  /**
   * Process business data and detect conflicts
   */
  processBusinessConflicts(rawBusinessData) {
    console.log('[ConflictDetection] Processing business:', rawBusinessData.businessName);
    
    // Prepare data structure for conflict detection
    const businessData = this.prepareBusinessData(rawBusinessData);
    
    // Detect conflicts
    const conflictResult = conflictDetector.detectConflicts(businessData);
    
    // Calculate penalty
    const conflictPenalty = conflictDetector.calculateConflictPenalty(conflictResult.conflicts);
    
    console.log(`[ConflictDetection] Found ${conflictResult.totalConflicts} conflicts, penalty: ${conflictPenalty}`);
    
    return {
      conflicts: conflictResult.conflicts,
      conflictMetadata: {
        totalConflicts: conflictResult.totalConflicts,
        hasConflicts: conflictResult.hasConflicts,
        conflictPenalty: conflictPenalty
      }
    };
  }
  
  /**
   * Prepare business data from multiple sources for conflict detection
   */
  prepareBusinessData(rawData) {
    const businessData = {
      phoneData: [],
      emailData: [],
      addressData: [],
      websiteData: [],
      workingHoursData: []
    };
    
    // Extract data from different sources
    // The rawData should contain sourceUrls and dataSources with the actual scraped data
    
    // Primary fields (usually from main website or first source)
    if (rawData.phone) {
      businessData.phoneData.push({
        source: 'Primary Source',
        value: rawData.phone
      });
    }
    
    if (rawData.email) {
      businessData.emailData.push({
        source: 'Primary Source',
        value: rawData.email
      });
    }
    
    if (rawData.address) {
      businessData.addressData.push({
        source: 'Primary Source',
        value: rawData.address
      });
    }
    
    if (rawData.website) {
      businessData.websiteData.push({
        source: 'Primary Source',
        value: rawData.website
      });
    }
    
    if (rawData.workingHours) {
      businessData.workingHoursData.push({
        source: 'Primary Source',
        value: rawData.workingHours
      });
    }
    
    // Extract from data sources if available
    if (rawData.dataSources && Array.isArray(rawData.dataSources)) {
      rawData.dataSources.forEach(source => {
        const sourceName = this.getSourceName(source.source);
        
        // If the source has additional data, add it
        if (source.data) {
          if (source.data.phone) {
            businessData.phoneData.push({
              source: sourceName,
              value: source.data.phone
            });
          }
          
          if (source.data.email) {
            businessData.emailData.push({
              source: sourceName,
              value: source.data.email
            });
          }
          
          if (source.data.address) {
            businessData.addressData.push({
              source: sourceName,
              value: source.data.address
            });
          }
          
          if (source.data.website) {
            businessData.websiteData.push({
              source: sourceName,
              value: source.data.website
            });
          }
          
          if (source.data.workingHours) {
            businessData.workingHoursData.push({
              source: sourceName,
              value: source.data.workingHours
            });
          }
        }
      });
    }
    
    // Extract from social profiles
    if (rawData.socialProfiles) {
      const socialSources = ['linkedin', 'facebook', 'instagram', 'twitter'];
      
      socialSources.forEach(platform => {
        if (rawData.socialProfiles[platform]) {
          businessData.websiteData.push({
            source: platform.charAt(0).toUpperCase() + platform.slice(1),
            value: rawData.socialProfiles[platform]
          });
        }
      });
    }
    
    return businessData;
  }
  
  /**
   * Get friendly source name
   */
  getSourceName(source) {
    const sourceMap = {
      'google_maps': 'Google Maps',
      'linkedin': 'LinkedIn',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'twitter': 'Twitter',
      'website': 'Official Website',
      'yelp': 'Yelp',
      'yellowpages': 'Yellow Pages'
    };
    
    return sourceMap[source] || source;
  }
  
  /**
   * Adjust trust score based on conflicts
   */
  adjustTrustScoreForConflicts(originalScore, conflictPenalty) {
    const adjustedScore = Math.max(0, originalScore - conflictPenalty);
    
    console.log(`[ConflictDetection] Trust score adjusted: ${originalScore} - ${conflictPenalty} = ${adjustedScore}`);
    
    return adjustedScore;
  }
}

module.exports = new ConflictDetectionService();
