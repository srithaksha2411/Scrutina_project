/**
 * AI EXECUTIVE SUMMARY GENERATOR
 * Generates professional business summaries from existing business data
 * WITHOUT calling external AI APIs
 */

const generateExecutiveSummary = (business, trustScore, securityScore) => {
  const sentences = [];
  
  // Opening sentence with basic info
  const verificationStatus = business.verificationStatus === 'VERIFIED' ? 'verified' : 'registered';
  const industryText = business.industry ? `${business.industry.toLowerCase()} organization` : 'business';
  const locationText = business.address ? ` operating in ${extractLocation(business.address)}` : '';
  
  sentences.push(
    `${business.name || business.businessName} is a ${verificationStatus} ${industryText}${locationText} with a Trust Score of ${trustScore}%.`
  );

  // Website and contact credibility
  if (business.website || business.email || business.phone) {
    const hasWebsite = business.website ? 'an official website' : '';
    const hasContact = (business.email || business.phone) ? 'verified contact information' : '';
    
    if (hasWebsite && hasContact) {
      sentences.push(
        `The business maintains ${hasWebsite} and ${hasContact}, indicating a ${getCredibilityLevel(trustScore)} level of credibility.`
      );
    } else if (hasWebsite) {
      sentences.push(`The business maintains ${hasWebsite}.`);
    } else if (hasContact) {
      sentences.push(`The business provides ${hasContact}.`);
    }
  }

  // Services offering
  if (business.services && business.services.length > 0) {
    const serviceCount = business.services.length;
    const serviceText = serviceCount === 1 ? 'service is' : `${serviceCount} services are`;
    sentences.push(`Multiple ${business.industry?.toLowerCase() || 'business'} ${serviceText} offered.`);
  }

  // Social presence
  const socialCount = countSocialProfiles(business.socialProfiles);
  if (socialCount > 0) {
    sentences.push(`The organization has an active online presence with ${socialCount} social media ${socialCount === 1 ? 'profile' : 'profiles'}.`);
  } else if (socialCount === 0 && business.website) {
    sentences.push('Limited online social presence detected.');
  }

  // Security assessment
  const secScore = securityScore.score || 0;
  if (secScore >= 80) {
    sentences.push(
      `From a cyber security perspective, the website scores ${secScore}/100, demonstrating strong security practices.`
    );
  } else if (secScore >= 60) {
    sentences.push(
      `From a cyber security perspective, the website currently scores ${secScore}/100, suggesting that some recommended security headers and best practices are still missing.`
    );
  } else if (secScore >= 40) {
    sentences.push(
      `The website's security score of ${secScore}/100 indicates significant gaps in security implementation.`
    );
  } else {
    sentences.push(
      `Critical security improvements are needed, with the website scoring only ${secScore}/100.`
    );
  }

  // Conclusion
  const businessType = business.industry ? `${business.industry.toLowerCase()} provider` : 'business entity';
  const credibilityVerdict = trustScore >= 75 ? 'good' : trustScore >= 50 ? 'moderate' : 'developing';
  const securityVerdict = secScore >= 70 ? 'while maintaining adequate' : 'while there is room to improve its';
  
  sentences.push(
    `Overall, this organization appears to be a legitimate ${businessType} with ${credibilityVerdict} business credibility, ${securityVerdict} web security posture.`
  );

  return sentences.join(' ');
};

const extractLocation = (address) => {
  if (!address) return '';
  
  // Extract city or key location from address
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  
  // Fallback: get last meaningful part
  const words = address.trim().split(' ');
  return words.length > 2 ? words.slice(-2).join(' ') : address;
};

const getCredibilityLevel = (trustScore) => {
  if (trustScore >= 80) return 'high';
  if (trustScore >= 60) return 'moderate';
  return 'developing';
};

const countSocialProfiles = (socialProfiles) => {
  if (!socialProfiles || typeof socialProfiles !== 'object') return 0;
  
  let count = 0;
  const platforms = ['linkedin', 'facebook', 'instagram', 'twitter', 'youtube'];
  
  platforms.forEach(platform => {
    const url = socialProfiles[platform];
    if (url && typeof url === 'string' && url.trim() !== '') {
      count++;
    }
  });
  
  return count;
};

const calculateBusinessCredibility = (trustScore) => {
  if (trustScore >= 80) return { stars: 5, label: 'Excellent' };
  if (trustScore >= 70) return { stars: 4, label: 'Good' };
  if (trustScore >= 50) return { stars: 3, label: 'Fair' };
  if (trustScore >= 30) return { stars: 2, label: 'Developing' };
  return { stars: 1, label: 'Limited' };
};

const getSecurityOutlook = (securityScore) => {
  const score = securityScore.score || 0;
  
  if (score >= 85) {
    return { level: 'Low Risk', color: 'green', description: 'Strong security implementation' };
  } else if (score >= 70) {
    return { level: 'Moderate Risk', color: 'yellow', description: 'Security improvements recommended' };
  } else if (score >= 50) {
    return { level: 'Elevated Risk', color: 'orange', description: 'Important security gaps detected' };
  } else {
    return { level: 'High Risk', color: 'red', description: 'Critical security improvements needed' };
  }
};

const generateRecommendations = (business, trustScore, securityScore) => {
  const recommendations = [];
  
  // Email verification
  if (!business.email || business.email === 'N/A') {
    recommendations.push('Verify business email address');
  }
  
  // Security improvements
  const secScore = securityScore.score || 0;
  if (secScore < 80) {
    if (!business.website?.startsWith('https://')) {
      recommendations.push('Migrate website to HTTPS protocol');
    }
    recommendations.push('Improve website security headers');
    recommendations.push('Enable additional security policies');
  }
  
  // Phone verification
  if (!business.phone || business.phone === 'N/A') {
    recommendations.push('Add verified phone contact');
  }
  
  // Social presence
  const socialCount = countSocialProfiles(business.socialProfiles);
  if (socialCount === 0) {
    recommendations.push('Establish professional social media presence');
  }
  
  // Website
  if (!business.website) {
    recommendations.push('Create official business website');
  }
  
  // Certifications
  if (!business.certifications || business.certifications.length === 0) {
    recommendations.push('Add relevant industry certifications');
  }
  
  // Always maintain verified info
  if (business.verificationStatus === 'VERIFIED') {
    recommendations.push('Continue maintaining verified business information');
  }
  
  // Limit to 4-5 most important recommendations
  return recommendations.slice(0, 5);
};

module.exports = {
  generateExecutiveSummary,
  calculateBusinessCredibility,
  getSecurityOutlook,
  generateRecommendations
};
