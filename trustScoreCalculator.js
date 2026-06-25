/**
 * Trust Score Calculator Utility
 * Calculates business trust score based on data completeness
 */

/**
 * Calculate trust score with detailed breakdown
 * @param {Object} business - Business data object
 * @returns {Object} - { score, breakdown, maxScore }
 */
export const calculateTrustScore = (business) => {
  if (!business) {
    return {
      score: 0,
      breakdown: [],
      maxScore: 100,
      percentage: 0
    };
  }

  // Define scoring criteria
  const criteria = [
    {
      label: 'Website Available',
      points: 20,
      check: () => {
        const website = business?.website || business?.businessWebsite;
        return website && website.trim() !== '' && website !== 'N/A';
      }
    },
    {
      label: 'Email Available',
      points: 15,
      check: () => {
        const email = business?.email;
        return email && email.trim() !== '' && email !== 'N/A';
      }
    },
    {
      label: 'Phone Available',
      points: 15,
      check: () => {
        const phone = business?.phone;
        return phone && phone.trim() !== '' && phone !== 'N/A';
      }
    },
    {
      label: 'Address Available',
      points: 15,
      check: () => {
        const address = business?.address;
        return address && address.trim() !== '' && address !== 'N/A';
      }
    },
    {
      label: 'Industry Available',
      points: 10,
      check: () => {
        const industry = business?.industry;
        return industry && industry.trim() !== '' && industry !== 'N/A';
      }
    },
    {
      label: 'Social Profile Available',
      points: 10,
      check: () => {
        const socialProfiles = business?.socialProfiles;
        if (!socialProfiles || typeof socialProfiles !== 'object') return false;
        
        // Check if at least 1 social profile exists
        return Object.values(socialProfiles).some(
          url => url && typeof url === 'string' && url.trim() !== ''
        );
      }
    },
    {
      label: 'Multiple Data Sources',
      points: 10,
      check: () => {
        const dataSources = business?.dataSources || [];
        const sourceUrls = business?.sourceUrls || [];
        const totalSources = dataSources.length + sourceUrls.length;
        return totalSources >= 2;
      }
    },
    {
      label: 'Description Available',
      points: 5,
      check: () => {
        const description = business?.description;
        return description && description.trim() !== '' && description !== 'N/A';
      }
    }
  ];

  // Calculate score and build breakdown
  let totalScore = 0;
  const breakdown = criteria.map(criterion => {
    const passed = criterion.check();
    const earnedPoints = passed ? criterion.points : 0;
    totalScore += earnedPoints;

    return {
      label: criterion.label,
      points: criterion.points,
      passed: passed,
      earnedPoints: earnedPoints
    };
  });

  // Calculate max possible score
  const maxScore = criteria.reduce((sum, criterion) => sum + criterion.points, 0);

  // Calculate percentage
  const percentage = Math.round((totalScore / maxScore) * 100);

  return {
    score: totalScore,
    breakdown: breakdown,
    maxScore: maxScore,
    percentage: percentage
  };
};

/**
 * Get trust score level based on percentage
 * @param {number} percentage - Trust score percentage (0-100)
 * @returns {Object} - { level, color, label }
 */
export const getTrustScoreLevel = (percentage) => {
  if (percentage >= 80) {
    return {
      level: 'high',
      color: 'green',
      label: 'Excellent',
      className: 'trust-high'
    };
  } else if (percentage >= 60) {
    return {
      level: 'medium',
      color: 'yellow',
      label: 'Good',
      className: 'trust-medium'
    };
  } else if (percentage >= 40) {
    return {
      level: 'low',
      color: 'orange',
      label: 'Fair',
      className: 'trust-low'
    };
  } else {
    return {
      level: 'very-low',
      color: 'red',
      label: 'Poor',
      className: 'trust-very-low'
    };
  }
};

const trustScoreUtils = {
  calculateTrustScore,
  getTrustScoreLevel
};

export default trustScoreUtils;
