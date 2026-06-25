/**
 * Verification Service
 * 
 * Calculates trust scores and verification status for businesses
 * Based on data completeness and quality
 */

class VerificationService {
  /**
   * Verify business and calculate trust score
   * @param {Object} business - Business data
   * @returns {Object} - {verified, trustScore}
   */
  verifyBusiness(business) {
    let trustScore = 0;

    // Website exists = +20
    if (business.website && this.isValidURL(business.website)) {
      trustScore += 20;
    }

    // Phone exists = +20
    if (business.phone) {
      trustScore += 20;
    }

    // Email exists = +20
    if (business.email && this.isValidEmail(business.email)) {
      trustScore += 20;
    }

    // Address exists = +20
    if (business.address) {
      trustScore += 20;
    }

    // Social profile exists = +20
    if (business.socialProfiles) {
      if (business.socialProfiles.linkedin || 
          business.socialProfiles.facebook || 
          business.socialProfiles.instagram) {
        trustScore += 20;
      }
    }

    // Cap at 100
    trustScore = Math.min(trustScore, 100);

    // Consider verified if trust score >= 60
    const verified = trustScore >= 60;

    return {
      verified,
      trustScore
    };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
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
   * Batch verify businesses
   * @param {Array} businesses - Array of business objects
   * @returns {Array} - Businesses with verification data
   */
  batchVerify(businesses) {
    console.log(`[Verification] Verifying ${businesses.length} businesses...`);
    
    let verifiedCount = 0;

    const verifiedBusinesses = businesses.map(business => {
      const verification = this.verifyBusiness(business);
      
      business.verified = verification.verified;
      business.trustScore = verification.trustScore;

      if (verification.verified) {
        verifiedCount++;
      }

      console.log(`[Verification] ${business.businessName}: Score=${verification.trustScore}, Verified=${verification.verified}`);
      
      return business;
    });

    console.log(`[Verification] Complete: ${verifiedCount}/${businesses.length} verified`);
    
    return verifiedBusinesses;
  }

  /**
   * Get verification summary
   * @param {Array} businesses - Array of businesses
   * @returns {Object} - Verification statistics
   */
  getVerificationSummary(businesses) {
    const total = businesses.length;
    const verified = businesses.filter(b => b.verified).length;
    const avgTrustScore = businesses.reduce((sum, b) => sum + (b.trustScore || 0), 0) / total;

    return {
      total,
      verified,
      unverified: total - verified,
      verificationRate: ((verified / total) * 100).toFixed(1),
      averageTrustScore: Math.round(avgTrustScore)
    };
  }
}

module.exports = new VerificationService();
