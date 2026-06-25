import html2pdf from 'html2pdf.js';

/**
 * Calculate analytics for PDF report
 */
export const calculatePdfAnalytics = (businesses) => {
  const totalBusinesses = businesses.length;
  
  // Verified businesses
  const verifiedBusinesses = businesses.filter(b => 
    b.verificationStatus === 'VERIFIED' || b.verificationStatus === 'HIGH_CONFIDENCE'
  ).length;
  
  // Average scores
  const avgTrustScore = totalBusinesses > 0
    ? Math.round(businesses.reduce((sum, b) => sum + (b.verificationScore || 0), 0) / totalBusinesses)
    : 0;
  
  const avgSecurityScore = totalBusinesses > 0
    ? Math.round(businesses.reduce((sum, b) => sum + (b.securityScore || 0), 0) / totalBusinesses)
    : 0;
  
  // Industry distribution
  const industries = {};
  businesses.forEach(b => {
    const industry = b.industry || 'Other';
    industries[industry] = (industries[industry] || 0) + 1;
  });
  
  const industryDistribution = Object.entries(industries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([industry, count]) => ({
      industry,
      count,
      percentage: Math.round((count / totalBusinesses) * 100)
    }));
  
  // Trust score distribution
  const trustScoreRanges = {
    'Excellent (90-100%)': 0,
    'High (80-89%)': 0,
    'Good (60-79%)': 0,
    'Fair (40-59%)': 0,
    'Poor (0-39%)': 0
  };
  
  businesses.forEach(b => {
    const score = b.verificationScore || 0;
    if (score >= 90) trustScoreRanges['Excellent (90-100%)']++;
    else if (score >= 80) trustScoreRanges['High (80-89%)']++;
    else if (score >= 60) trustScoreRanges['Good (60-79%)']++;
    else if (score >= 40) trustScoreRanges['Fair (40-59%)']++;
    else trustScoreRanges['Poor (0-39%)']++;
  });
  
  const trustScoreDistribution = Object.entries(trustScoreRanges)
    .map(([range, count]) => ({
      range,
      count,
      percentage: totalBusinesses > 0 ? Math.round((count / totalBusinesses) * 100) : 0
    }))
    .filter(item => item.count > 0);
  
  // Verification stats
  const verifiedTotal = verifiedBusinesses;
  const verifiedPercentage = totalBusinesses > 0 ? Math.round((verifiedTotal / totalBusinesses) * 100) : 0;
  
  // Top services
  const servicesMap = {};
  businesses.forEach(b => {
    if (b.services && Array.isArray(b.services)) {
      b.services.slice(0, 5).forEach(service => {
        if (service && service.length > 3) {
          servicesMap[service] = (servicesMap[service] || 0) + 1;
        }
      });
    }
  });
  
  const topServices = Object.entries(servicesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([service, count]) => ({ service, count }));
  
  // Find best businesses
  const mostTrusted = businesses.reduce((max, b) => 
    (b.verificationScore || 0) > (max.verificationScore || 0) ? b : max
  , businesses[0] || {});
  
  const highestSecurity = businesses.reduce((max, b) => 
    (b.securityScore || 0) > (max.securityScore || 0) ? b : max
  , businesses[0] || {});
  
  const mostCommonIndustry = industryDistribution[0] || { industry: 'N/A', count: 0 };
  const mostCommonService = topServices[0] || { service: 'N/A', count: 0 };
  
  return {
    totalBusinesses,
    verifiedBusinesses,
    avgTrustScore,
    avgSecurityScore,
    verifiedPercentage,
    industryDistribution,
    trustScoreDistribution,
    topServices,
    insights: {
      mostTrusted,
      highestSecurity,
      mostCommonIndustry,
      mostCommonService
    }
  };
};

/**
 * Generate PDF report from HTML element
 */
export const generatePdfReport = async (element, query, onProgress) => {
  try {
    // Update progress
    if (onProgress) onProgress('Preparing Executive Report...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Configure html2pdf options
    const opt = {
      margin: 0,
      filename: `SCRUTINA_Report_${query.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy']
      }
    };
    
    // Update progress
    if (onProgress) onProgress('Rendering Business Intelligence Dashboard...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update progress
    if (onProgress) onProgress('Generating PDF...');
    
    // Generate PDF
    await html2pdf().set(opt).from(element).save();
    
    // Update progress
    if (onProgress) onProgress('Download Starting...');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
    
  } catch (error) {
    console.error('[PDF] Generation error:', error);
    throw error;
  }
};
