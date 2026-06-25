/**
 * PHASE 5 - VERIFICATION ENGINE
 * 
 * Calculates verification scores and status based on data completeness:
 * UPDATED: Now includes conflict detection and penalty
 * 
 * SCORING:
 * Website found = +20
 * Phone found = +15
 * Address found = +15
 * Email found = +15
 * LinkedIn found = +10
 * Google Business Profile found = +10
 * Reviews found = +10
 * Certifications found = +5
 * Awards found = +5
 * 
 * CONFLICT PENALTIES:
 * Phone conflict = -10
 * Email conflict = -10
 * Address conflict = -5
 * Website conflict = -8
 * Working Hours conflict = -3
 * 
 * STATUS:
 * 90-100 = VERIFIED
 * 70-89 = HIGH_CONFIDENCE
 * 50-69 = MEDIUM_CONFIDENCE
 * 0-49 = LOW_CONFIDENCE
 */

const conflictDetectionService = require('./conflictDetectionService');

class VerificationEngine {
  /**
   * MAIN VERIFICATION ENTRY POINT
   * Verifies and scores all businesses
   * NOW INCLUDES CONFLICT DETECTION
   */
  async verifyBusinesses(businesses) {
    console.log(`\n========== PHASE 5: VERIFICATION ENGINE ==========`);
    console.log(`Verifying ${businesses.length} businesses...`);
    console.log(`==================================================\n`);

    const verified = businesses.map(business => {
      // Step 1: Detect conflicts
      const conflictResult = conflictDetectionService.processBusinessConflicts(business);
      
      // Step 2: Calculate verification score
      const verification = this.calculateVerificationScore(business);
      
      // Step 3: Adjust score for conflicts
      const finalScore = Math.max(0, verification.score - conflictResult.conflictMetadata.conflictPenalty);
      const finalStatus = this.getVerificationStatus(finalScore);
      
      return {
        ...business,
        verificationScore: finalScore,
        verificationStatus: finalStatus,
        verificationBreakdown: verification.breakdown,
        conflicts: conflictResult.conflicts,
        conflictMetadata: conflictResult.conflictMetadata
      };
    });

    // Log verification summary
    this.logVerificationSummary(verified);

    console.log(`[Verification] ✓ Verification complete\n`);

    return verified;
  }

  /**
   * Calculate comprehensive verification score
   */
  calculateVerificationScore(business) {
    let score = 0;
    const breakdown = {};

    // Business name present = +15 (base signal)
    if (business.businessName) {
      score += 15;
      breakdown.businessName = 15;
    } else {
      breakdown.businessName = 0;
    }

    // Website found = +20
    if (business.website && this.isValidURL(business.website)) {
      score += 20;
      breakdown.website = 20;
    } else {
      breakdown.website = 0;
    }

    // Phone found = +15
    if (business.phone) {
      score += 15;
      breakdown.phone = 15;
    } else {
      breakdown.phone = 0;
    }

    // Address found = +15
    if (business.address) {
      score += 15;
      breakdown.address = 15;
    } else {
      breakdown.address = 0;
    }

    // Email found = +10
    if (business.email && this.isValidEmail(business.email)) {
      score += 10;
      breakdown.email = 10;
    } else {
      breakdown.email = 0;
    }

    // LinkedIn found = +5
    if (business.socialProfiles?.linkedin) {
      score += 5;
      breakdown.linkedin = 5;
    } else {
      breakdown.linkedin = 0;
    }

    // Google Business Profile found = +10
    const hasGoogleProfile = business.sourceTypes?.some(type =>
      type.includes('google_local') || type.includes('google_maps')
    );
    if (hasGoogleProfile) {
      score += 10;
      breakdown.googleBusiness = 10;
    } else {
      breakdown.googleBusiness = 0;
    }

    // Reviews found = +5
    if (business.reviewCount && business.reviewCount > 0) {
      score += 5;
      breakdown.reviews = 5;
    } else {
      breakdown.reviews = 0;
    }

    // Certifications found = +3
    if (business.certifications && business.certifications.length > 0) {
      score += 3;
      breakdown.certifications = 3;
    } else {
      breakdown.certifications = 0;
    }

    // Awards found = +2
    if (business.awards && business.awards.length > 0) {
      score += 2;
      breakdown.awards = 2;
    } else {
      breakdown.awards = 0;
    }

    // Cap at 100
    score = Math.min(score, 100);

    const status = this.getVerificationStatus(score);
    console.log(`[Verification] ${business.businessName}: ${score}/100 - ${status}`);

    return { score, status, breakdown };
  }

  /**
   * Get verification status based on score
   */
  getVerificationStatus(score) {
    if (score >= 90) return 'VERIFIED';
    if (score >= 70) return 'HIGH_CONFIDENCE';
    if (score >= 50) return 'MEDIUM_CONFIDENCE';
    return 'LOW_CONFIDENCE';
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
   * Validate email
   */
  isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  /**
   * Log verification summary
   */
  logVerificationSummary(businesses) {
    const summary = {
      total: businesses.length,
      verified: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      averageScore: 0
    };

    businesses.forEach(b => {
      summary.averageScore += b.verificationScore;
      
      switch (b.verificationStatus) {
        case 'VERIFIED':
          summary.verified++;
          break;
        case 'HIGH_CONFIDENCE':
          summary.highConfidence++;
          break;
        case 'MEDIUM_CONFIDENCE':
          summary.mediumConfidence++;
          break;
        case 'LOW_CONFIDENCE':
          summary.lowConfidence++;
          break;
      }
    });

    summary.averageScore = Math.round(summary.averageScore / summary.total);

    console.log(`\n[Verification Summary]`);
    console.log(`Total: ${summary.total}`);
    console.log(`VERIFIED (90-100): ${summary.verified}`);
    console.log(`HIGH_CONFIDENCE (70-89): ${summary.highConfidence}`);
    console.log(`MEDIUM_CONFIDENCE (50-69): ${summary.mediumConfidence}`);
    console.log(`LOW_CONFIDENCE (0-49): ${summary.lowConfidence}`);
    console.log(`Average Score: ${summary.averageScore}/100\n`);
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(businesses) {
    const stats = {
      total: businesses.length,
      statusCounts: {
        VERIFIED: 0,
        HIGH_CONFIDENCE: 0,
        MEDIUM_CONFIDENCE: 0,
        LOW_CONFIDENCE: 0
      },
      averageScore: 0,
      scoreDistribution: {
        '90-100': 0,
        '70-89': 0,
        '50-69': 0,
        '0-49': 0
      }
    };

    businesses.forEach(b => {
      stats.statusCounts[b.verificationStatus]++;
      stats.averageScore += b.verificationScore;
      
      if (b.verificationScore >= 90) stats.scoreDistribution['90-100']++;
      else if (b.verificationScore >= 70) stats.scoreDistribution['70-89']++;
      else if (b.verificationScore >= 50) stats.scoreDistribution['50-69']++;
      else stats.scoreDistribution['0-49']++;
    });

    stats.averageScore = Math.round(stats.averageScore / stats.total);

    return stats;
  }
}

module.exports = new VerificationEngine();
