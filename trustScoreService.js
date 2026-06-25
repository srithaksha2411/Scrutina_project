// Trust Score Calculation Engine
// Dynamically calculates trust scores based on business data quality

/**
 * Calculate trust score for a business (0-100)
 * Based on multiple factors:
 * - Data completeness
 * - Business status
 * - Rating quality
 * - Information sources
 * - Contact availability
 */
const calculateTrustScore = (business) => {
  let score = 0;
  const weights = {
    hasName: 10,
    hasWebsite: 20,
    hasPhone: 20,
    hasAddress: 15,
    hasRating: 10,
    hasIndustry: 5,
    businessStatus: 10,
    multipleSourcesBonus: 10
  };

  // 1. Name exists (baseline)
  if (business.name && business.name !== 'Unknown Business') {
    score += weights.hasName;
  }

  // 2. Website exists and is valid
  if (business.website) {
    score += weights.hasWebsite;
  }

  // 3. Phone number exists
  if (business.phone) {
    score += weights.hasPhone;
  }

  // 4. Address exists
  if (business.address) {
    score += weights.hasAddress;
  }

  // 5. Rating exists (higher rating = better)
  if (business.rating) {
    const rating = parseFloat(business.rating);
    if (!isNaN(rating)) {
      score += weights.hasRating;
      // Bonus for high ratings (4.0+)
      if (rating >= 4.0) {
        score += 5;
      }
    }
  }

  // 6. Industry/Type information
  if (business.industry && business.industry !== 'General Business') {
    score += weights.hasIndustry;
  }

  // 7. Business status (operational = good)
  if (business.businessStatus === 'OPERATIONAL') {
    score += weights.businessStatus;
  }

  // 8. Multiple sources bonus
  if (business.sources && business.sources.length >= 2) {
    score += weights.multipleSourcesBonus;
  }

  // Ensure score is between 0 and 100
  score = Math.min(100, Math.max(0, score));

  return Math.round(score);
};

/**
 * Calculate overall statistics for a set of businesses
 */
const calculateStatistics = (businesses) => {
  const scores = businesses.map(b => calculateTrustScore(b));
  
  return {
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highScoreCount: scores.filter(s => s >= 80).length,
    mediumScoreCount: scores.filter(s => s >= 60 && s < 80).length,
    lowScoreCount: scores.filter(s => s < 60).length,
    totalBusinesses: businesses.length
  };
};

/**
 * Classify business by trust score
 */
const getTrustLevel = (score) => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

/**
 * Get trust score color for UI
 */
const getTrustScoreColor = (score) => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
};

module.exports = {
  calculateTrustScore,
  calculateStatistics,
  getTrustLevel,
  getTrustScoreColor
};
