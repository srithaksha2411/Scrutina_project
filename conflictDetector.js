/**
 * CONFLICT DETECTION UTILITY
 * Compares business data from multiple sources and detects conflicts
 */

/**
 * Normalize phone numbers for comparison
 * Removes spaces, dashes, parentheses, and country codes
 */
const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all non-numeric characters
  let normalized = phone.replace(/[^\d]/g, '');
  
  // Remove leading 1 for US numbers (country code)
  if (normalized.length === 11 && normalized.startsWith('1')) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
};

/**
 * Normalize email addresses for comparison
 * Converts to lowercase and trims whitespace
 */
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

/**
 * Normalize addresses for comparison
 * Removes extra spaces, converts to lowercase, removes punctuation
 */
const normalizeAddress = (address) => {
  if (!address || typeof address !== 'string') return '';
  
  return address
    .toLowerCase()
    .replace(/[.,]/g, '') // Remove commas and periods
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
};

/**
 * Normalize website URLs for comparison
 */
const normalizeWebsite = (website) => {
  if (!website || typeof website !== 'string') return '';
  
  let normalized = website.toLowerCase().trim();
  
  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Remove www.
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
};

/**
 * Compare two values after normalization
 */
const compareValues = (value1, value2, type) => {
  if (!value1 || !value2) return false;
  
  let normalized1, normalized2;
  
  switch (type) {
    case 'phone':
      normalized1 = normalizePhone(value1);
      normalized2 = normalizePhone(value2);
      break;
    case 'email':
      normalized1 = normalizeEmail(value1);
      normalized2 = normalizeEmail(value2);
      break;
    case 'address':
      normalized1 = normalizeAddress(value1);
      normalized2 = normalizeAddress(value2);
      break;
    case 'website':
      normalized1 = normalizeWebsite(value1);
      normalized2 = normalizeWebsite(value2);
      break;
    default:
      normalized1 = String(value1).toLowerCase().trim();
      normalized2 = String(value2).toLowerCase().trim();
  }
  
  return normalized1 === normalized2;
};

/**
 * Detect conflicts for a specific field across multiple sources
 */
const detectFieldConflicts = (fieldData, fieldType) => {
  if (!fieldData || fieldData.length === 0) {
    return {
      detected: false,
      values: []
    };
  }
  
  // Filter out null/undefined/empty values
  const validData = fieldData.filter(item => 
    item.value && 
    item.value !== 'N/A' && 
    item.value.toString().trim() !== ''
  );
  
  if (validData.length === 0) {
    return {
      detected: false,
      values: []
    };
  }
  
  // If only one source, no conflict
  if (validData.length === 1) {
    return {
      detected: false,
      values: validData
    };
  }
  
  // Group values by normalized form
  const groupedValues = {};
  
  validData.forEach(item => {
    let normalizedKey;
    
    switch (fieldType) {
      case 'phone':
        normalizedKey = normalizePhone(item.value);
        break;
      case 'email':
        normalizedKey = normalizeEmail(item.value);
        break;
      case 'address':
        normalizedKey = normalizeAddress(item.value);
        break;
      case 'website':
        normalizedKey = normalizeWebsite(item.value);
        break;
      default:
        normalizedKey = String(item.value).toLowerCase().trim();
    }
    
    if (!groupedValues[normalizedKey]) {
      groupedValues[normalizedKey] = [];
    }
    
    groupedValues[normalizedKey].push(item);
  });
  
  // Get unique normalized values
  const uniqueKeys = Object.keys(groupedValues);
  
  // If all values normalize to the same thing, no conflict
  if (uniqueKeys.length === 1) {
    return {
      detected: false,
      values: validData
    };
  }
  
  // Conflict detected - return all unique values with their sources
  const conflictValues = [];
  
  uniqueKeys.forEach(key => {
    const sources = groupedValues[key];
    
    // For each unique value, include one representative with all its sources
    const representative = sources[0];
    const allSources = sources.map(s => s.source);
    
    conflictValues.push({
      value: representative.value,
      source: allSources.join(', '),
      count: sources.length
    });
  });
  
  return {
    detected: true,
    values: conflictValues,
    uniqueCount: uniqueKeys.length
  };
};

/**
 * Main conflict detection function
 * Analyzes all business data and detects conflicts
 */
const detectConflicts = (businessData) => {
  const conflicts = {
    phone: { detected: false, values: [] },
    email: { detected: false, values: [] },
    address: { detected: false, values: [] },
    website: { detected: false, values: [] },
    workingHours: { detected: false, values: [] }
  };
  
  let totalConflicts = 0;
  
  // Phone conflicts
  if (businessData.phoneData && businessData.phoneData.length > 0) {
    conflicts.phone = detectFieldConflicts(businessData.phoneData, 'phone');
    if (conflicts.phone.detected) totalConflicts++;
  }
  
  // Email conflicts
  if (businessData.emailData && businessData.emailData.length > 0) {
    conflicts.email = detectFieldConflicts(businessData.emailData, 'email');
    if (conflicts.email.detected) totalConflicts++;
  }
  
  // Address conflicts
  if (businessData.addressData && businessData.addressData.length > 0) {
    conflicts.address = detectFieldConflicts(businessData.addressData, 'address');
    if (conflicts.address.detected) totalConflicts++;
  }
  
  // Website conflicts
  if (businessData.websiteData && businessData.websiteData.length > 0) {
    conflicts.website = detectFieldConflicts(businessData.websiteData, 'website');
    if (conflicts.website.detected) totalConflicts++;
  }
  
  // Working hours conflicts
  if (businessData.workingHoursData && businessData.workingHoursData.length > 0) {
    conflicts.workingHours = detectFieldConflicts(businessData.workingHoursData, 'text');
    if (conflicts.workingHours.detected) totalConflicts++;
  }
  
  return {
    conflicts,
    totalConflicts,
    hasConflicts: totalConflicts > 0
  };
};

/**
 * Calculate conflict penalty for trust score
 */
const calculateConflictPenalty = (conflicts) => {
  let penalty = 0;
  
  const penalties = {
    phone: 10,
    email: 10,
    address: 5,
    website: 8,
    workingHours: 3
  };
  
  Object.keys(penalties).forEach(field => {
    if (conflicts[field] && conflicts[field].detected) {
      penalty += penalties[field];
    }
  });
  
  return penalty;
};

/**
 * Get conflict summary for dashboard
 */
const getConflictSummary = (businesses) => {
  const summary = {
    totalBusinesses: businesses.length,
    businessesWithConflicts: 0,
    phoneConflicts: 0,
    emailConflicts: 0,
    addressConflicts: 0,
    websiteConflicts: 0,
    workingHoursConflicts: 0,
    totalConflicts: 0
  };
  
  businesses.forEach(business => {
    if (business.conflicts && business.conflictMetadata?.hasConflicts) {
      summary.businessesWithConflicts++;
      
      if (business.conflicts.phone?.detected) summary.phoneConflicts++;
      if (business.conflicts.email?.detected) summary.emailConflicts++;
      if (business.conflicts.address?.detected) summary.addressConflicts++;
      if (business.conflicts.website?.detected) summary.websiteConflicts++;
      if (business.conflicts.workingHours?.detected) summary.workingHoursConflicts++;
    }
  });
  
  summary.totalConflicts = 
    summary.phoneConflicts + 
    summary.emailConflicts + 
    summary.addressConflicts + 
    summary.websiteConflicts + 
    summary.workingHoursConflicts;
  
  return summary;
};

module.exports = {
  normalizePhone,
  normalizeEmail,
  normalizeAddress,
  normalizeWebsite,
  compareValues,
  detectFieldConflicts,
  detectConflicts,
  calculateConflictPenalty,
  getConflictSummary
};
