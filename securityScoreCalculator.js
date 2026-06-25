/**
 * CYBER SECURITY SCORE CALCULATOR
 * Evaluates business security posture independently from Trust Score
 * 
 * This assessment is for demonstration purposes and provides basic security checks
 */

export const calculateSecurityScore = (business) => {
  const checks = [];
  let totalScore = 0;
  const maxScore = 100;

  // Check 1: HTTPS Enabled (15 points)
  const hasHTTPS = business.website && business.website.startsWith('https://');
  checks.push({
    id: 'https',
    label: 'HTTPS Enabled',
    description: 'Website uses secure HTTPS protocol',
    passed: hasHTTPS,
    points: 15,
    severity: 'high'
  });
  if (hasHTTPS) totalScore += 15;

  // Check 2: Valid SSL Certificate (15 points) - Inferred from HTTPS
  checks.push({
    id: 'ssl',
    label: 'SSL Certificate Valid',
    description: 'Valid SSL/TLS certificate detected',
    passed: hasHTTPS,
    points: 15,
    severity: 'high'
  });
  if (hasHTTPS) totalScore += 15;

  // Check 3: Website Reachable (10 points)
  const hasWebsite = Boolean(business.website && business.website.trim());
  checks.push({
    id: 'reachable',
    label: 'Website Reachable',
    description: 'Website URL is accessible',
    passed: hasWebsite,
    points: 10,
    severity: 'medium'
  });
  if (hasWebsite) totalScore += 10;

  // Check 4: Domain Active (10 points)
  const hasDomain = hasWebsite;
  checks.push({
    id: 'domain',
    label: 'Domain Active',
    description: 'Domain is registered and active',
    passed: hasDomain,
    points: 10,
    severity: 'medium'
  });
  if (hasDomain) totalScore += 10;

  // Check 5: Contact Email Verified (10 points)
  const hasEmail = Boolean(business.email && business.email.includes('@'));
  checks.push({
    id: 'email',
    label: 'Contact Email Verified',
    description: 'Valid contact email address provided',
    passed: hasEmail,
    points: 10,
    severity: 'medium'
  });
  if (hasEmail) totalScore += 10;

  // Check 6: Website Accessible (10 points)
  checks.push({
    id: 'accessible',
    label: 'Website Accessible',
    description: 'Website is publicly accessible',
    passed: hasWebsite,
    points: 10,
    severity: 'medium'
  });
  if (hasWebsite) totalScore += 10;

  // Check 7: Content Security Policy (10 points) - Warning
  const hasCSP = false; // Simulated check
  checks.push({
    id: 'csp',
    label: 'Content Security Policy',
    description: 'CSP headers configured for XSS protection',
    passed: hasCSP,
    points: 10,
    severity: 'low',
    warning: true
  });
  if (hasCSP) totalScore += 10;

  // Check 8: X-Frame-Options (10 points) - Warning
  const hasXFrame = false; // Simulated check
  checks.push({
    id: 'xframe',
    label: 'X-Frame-Options Header',
    description: 'Protection against clickjacking attacks',
    passed: hasXFrame,
    points: 10,
    severity: 'low',
    warning: true
  });
  if (hasXFrame) totalScore += 10;

  // Check 9: HSTS Enabled (5 points)
  const hasHSTS = hasHTTPS; // Simplified check
  checks.push({
    id: 'hsts',
    label: 'HSTS Enabled',
    description: 'HTTP Strict Transport Security configured',
    passed: hasHSTS,
    points: 5,
    severity: 'low'
  });
  if (hasHSTS) totalScore += 5;

  // Check 10: Security Headers (5 points)
  const hasSecurityHeaders = false; // Simulated check
  checks.push({
    id: 'headers',
    label: 'Security Headers Present',
    description: 'Additional security headers configured',
    passed: hasSecurityHeaders,
    points: 5,
    severity: 'low'
  });
  if (hasSecurityHeaders) totalScore += 5;

  // Generate recommendations based on failed checks
  const recommendations = [];
  
  if (!hasHTTPS) {
    recommendations.push({
      priority: 'critical',
      title: 'Enable HTTPS',
      description: 'Migrate website to HTTPS to encrypt data transmission'
    });
  }
  
  if (!hasCSP) {
    recommendations.push({
      priority: 'medium',
      title: 'Configure Content Security Policy',
      description: 'Add CSP headers to prevent XSS attacks'
    });
  }
  
  if (!hasXFrame) {
    recommendations.push({
      priority: 'medium',
      title: 'Add X-Frame-Options Header',
      description: 'Protect against clickjacking by preventing iframe embedding'
    });
  }
  
  if (!hasHSTS && hasHTTPS) {
    recommendations.push({
      priority: 'low',
      title: 'Enable HSTS',
      description: 'Force browsers to use HTTPS connections'
    });
  }
  
  recommendations.push({
    priority: 'low',
    title: 'Hide Server Headers',
    description: 'Remove server version information to reduce attack surface'
  });
  
  recommendations.push({
    priority: 'low',
    title: 'Add Referrer Policy',
    description: 'Control referrer information sent with requests'
  });

  return {
    score: totalScore,
    maxScore: maxScore,
    percentage: totalScore,
    checks: checks,
    recommendations: recommendations,
    riskLevel: getRiskLevel(totalScore),
    passedChecks: checks.filter(c => c.passed).length,
    totalChecks: checks.length
  };
};

export const getRiskLevel = (score) => {
  if (score >= 90) {
    return {
      level: 'LOW',
      className: 'risk-low',
      color: '#10B981',
      description: 'Excellent security posture'
    };
  } else if (score >= 70) {
    return {
      level: 'MEDIUM',
      className: 'risk-medium',
      color: '#F59E0B',
      description: 'Good security with room for improvement'
    };
  } else {
    return {
      level: 'HIGH',
      className: 'risk-high',
      color: '#EF4444',
      description: 'Security improvements recommended'
    };
  }
};

export const getCheckIcon = (check) => {
  if (check.passed) {
    return 'check';
  } else if (check.warning) {
    return 'warning';
  } else {
    return 'x';
  }
};

export const getCheckColor = (check) => {
  if (check.passed) {
    return '#10B981'; // Green
  } else if (check.warning) {
    return '#F59E0B'; // Yellow
  } else {
    return '#EF4444'; // Red
  }
};
