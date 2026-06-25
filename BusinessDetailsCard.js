import React, { useState } from 'react';
import { Shield, X as XIcon, Check, AlertCircle, Lock, Brain, TrendingUp, Activity } from 'lucide-react';
import { calculateSecurityScore } from '../utils/securityScoreCalculator';
import { calculateTrustScore } from '../utils/trustScoreCalculator';
import '../styles/BusinessDetailsCard.css';

const BusinessDetailsCard = ({ business, onClose }) => {
  const securityScore = calculateSecurityScore(business);
  const trustScoreData = calculateTrustScore(business);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'security'

  const getBusinessHealth = (trustScore) => {
    if (trustScore >= 80) return { label: 'Excellent', color: 'green' };
    if (trustScore >= 60) return { label: 'Good', color: 'yellow' };
    if (trustScore >= 40) return { label: 'Moderate', color: 'orange' };
    return { label: 'Poor', color: 'red' };
  };

  const calculateAIConfidence = (business) => {
    let dataPoints = 0;
    let availablePoints = 0;
    
    const fields = [
      business.website,
      business.email,
      business.phone,
      business.address,
      business.industry,
      business.description,
      business.services?.length > 0,
      business.certifications?.length > 0,
      business.socialProfiles && Object.values(business.socialProfiles).some(v => v)
    ];
    
    fields.forEach(field => {
      availablePoints++;
      if (field && field !== 'N/A') dataPoints++;
    });
    
    return Math.round((dataPoints / availablePoints) * 100);
  };

  const generateKeyInsights = (business, trustScore, secScore) => {
    const insights = [];
    
    if (business.website && business.website !== 'N/A') {
      if (business.website.startsWith('https://')) {
        insights.push({ text: 'Official website verified with HTTPS', color: 'green' });
      } else {
        insights.push({ text: 'Website available but not secure', color: 'orange' });
      }
    }
    
    if (business.email && business.email !== 'N/A' && business.phone && business.phone !== 'N/A') {
      insights.push({ text: 'Complete contact information available', color: 'green' });
    } else if (business.email || business.phone) {
      insights.push({ text: 'Partial contact information available', color: 'yellow' });
    }
    
    const socialCount = business.socialProfiles ? Object.values(business.socialProfiles).filter(v => v && v !== '').length : 0;
    if (socialCount >= 3) {
      insights.push({ text: 'Active social media presence detected', color: 'green' });
    } else if (socialCount > 0) {
      insights.push({ text: 'Limited social media presence', color: 'yellow' });
    }
    
    if (trustScore >= 75) {
      insights.push({ text: 'Strong trust score and credibility', color: 'green' });
    } else if (trustScore >= 50) {
      insights.push({ text: 'Moderate trust score', color: 'yellow' });
    } else {
      insights.push({ text: 'Limited business credibility data', color: 'red' });
    }
    
    if (secScore < 70) {
      insights.push({ text: 'Security improvements required', color: 'red' });
    } else if (secScore < 85) {
      insights.push({ text: 'Security posture needs enhancement', color: 'yellow' });
    } else {
      insights.push({ text: 'Strong security implementation', color: 'green' });
    }
    
    if (business.certifications && business.certifications.length > 0) {
      insights.push({ text: `${business.certifications.length} professional certification(s) listed`, color: 'green' });
    }
    
    return insights.slice(0, 5);
  };

  const generateAIRecommendations = (business, secScore) => {
    const recommendations = [];
    
    if (!business.website?.startsWith('https://')) {
      recommendations.push('Migrate website to HTTPS for secure communications');
    }
    
    if (secScore < 80) {
      recommendations.push('Implement recommended security headers and policies');
    }
    
    if (!business.email || business.email === 'N/A') {
      recommendations.push('Add verified email contact for business inquiries');
    }
    
    if (!business.phone || business.phone === 'N/A') {
      recommendations.push('Provide direct phone contact for customer support');
    }
    
    const socialCount = business.socialProfiles ? Object.values(business.socialProfiles).filter(v => v && v !== '').length : 0;
    if (socialCount === 0) {
      recommendations.push('Establish professional social media presence');
    }
    
    if (!business.description || business.description === 'N/A') {
      recommendations.push('Add detailed business description for transparency');
    }
    
    if (secScore >= 80 && business.email && business.phone) {
      recommendations.push('Maintain current security posture and business transparency');
    }
    
    return recommendations.slice(0, 4);
  };

  const generateOverallAssessment = (business, trustScore, secScore) => {
    const businessType = business.industry || 'business';
    
    if (trustScore >= 75 && secScore >= 75) {
      return `${business.name || business.businessName} demonstrates strong business credibility with comprehensive data verification and robust security implementation. This ${businessType.toLowerCase()} organization appears to be a legitimate and trustworthy entity.`;
    } else if (trustScore >= 60 && secScore >= 60) {
      return `${business.name || business.businessName} shows good business credentials with moderate data completeness. Security posture is adequate but could benefit from additional hardening measures for enhanced protection.`;
    } else if (trustScore < 50 || secScore < 50) {
      return `${business.name || business.businessName} has limited verifiable business information available. Significant improvements in data transparency and security implementation are recommended before conducting business transactions.`;
    } else {
      return `${business.name || business.businessName} presents a mixed profile with moderate credibility indicators. Additional verification and security enhancements would strengthen the overall business trustworthiness.`;
    }
  };

  const businessHealth = getBusinessHealth(trustScoreData.percentage);
  const aiConfidence = calculateAIConfidence(business);
  const keyInsights = generateKeyInsights(business, trustScoreData.percentage, securityScore.score);
  const aiRecommendations = generateAIRecommendations(business, securityScore.score);
  const overallAssessment = generateOverallAssessment(business, trustScoreData.percentage, securityScore.score);

  return (
    <div className="business-details-modal-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
        <button className="premium-modal-close" onClick={onClose}>
          <XIcon size={24} />
        </button>

        {/* Header */}
        <div className="premium-modal-header">
          <h2 className="business-name">{business.name || business.businessName}</h2>
          {business.industry && (
            <span className="industry-badge">{business.industry}</span>
          )}
        </div>

        {/* Tabs */}
        <div className="intelligence-tabs">
          <button 
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Brain size={18} />
            AI Summary
          </button>
          <button 
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            Security
          </button>
        </div>

        {/* Modal Body - Tab Content */}
        <div className="premium-modal-body">
          {activeTab === 'ai' && (
            <div className="ai-intelligence-panel">
              {/* Business Health & AI Confidence */}
              <div className="intelligence-metrics">
                <div className="intel-metric">
                  <div className="intel-metric-icon green">
                    <TrendingUp size={20} />
                  </div>
                  <div className="intel-metric-content">
                    <div className="intel-metric-label">Business Health</div>
                    <div className={`intel-metric-value ${businessHealth.color}`}>
                      {businessHealth.label}
                    </div>
                  </div>
                </div>

                <div className="intel-metric">
                  <div className="intel-metric-icon blue">
                    <Activity size={20} />
                  </div>
                  <div className="intel-metric-content">
                    <div className="intel-metric-label">AI Confidence</div>
                    <div className="intel-metric-value">{aiConfidence}%</div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="intel-section">
                <h4 className="intel-section-title">Key Insights</h4>
                <div className="insights-list">
                  {keyInsights.map((insight, idx) => (
                    <div key={idx} className={`insight-item ${insight.color}`}>
                      <div className="insight-indicator"></div>
                      <span>{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="intel-section">
                <h4 className="intel-section-title">AI Recommendation</h4>
                <ul className="ai-recommendations-list">
                  {aiRecommendations.map((rec, idx) => (
                    <li key={idx}>
                      <Check size={14} />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Overall Assessment */}
              <div className="intel-section overall-assessment">
                <h4 className="intel-section-title">Overall Assessment</h4>
                <p className="assessment-text">{overallAssessment}</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-intelligence-panel">
              {/* Security Summary */}
              <div className="security-summary-compact">
                <div className="security-stat">
                  <div className="stat-label">Risk Level</div>
                  <div className={`stat-value ${securityScore.riskLevel.className}`}>
                    {securityScore.riskLevel.level}
                  </div>
                </div>
                <div className="security-stat">
                  <div className="stat-label">Checks Passed</div>
                  <div className="stat-value">
                    {securityScore.checks.filter(c => c.passed).length}/{securityScore.checks.length}
                  </div>
                </div>
                <div className="security-stat">
                  <div className="stat-label">Security Score</div>
                  <div className="stat-value">{securityScore.score}/100</div>
                </div>
              </div>

              {/* Security Findings Summary */}
              <div className="intel-section">
                <h4 className="intel-section-title">Security Findings</h4>
                <div className="security-findings-list">
                  {securityScore.checks.slice(0, 5).map((check, idx) => (
                    <div key={idx} className={`security-finding-item ${check.passed ? 'passed' : 'failed'}`}>
                      <div className="finding-indicator">
                        {check.passed ? <Check size={14} /> : <AlertCircle size={14} />}
                      </div>
                      <div className="finding-content">
                        <span className="finding-name">{check.label || check.name}</span>
                        <span className="finding-status">{check.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Recommendations */}
              {securityScore.recommendations && securityScore.recommendations.length > 0 && (
                <div className="intel-section">
                  <h4 className="intel-section-title">Security Recommendations</h4>
                  <ul className="security-recommendations-list">
                    {securityScore.recommendations.slice(0, 4).map((rec, idx) => (
                      <li key={idx}>
                        <AlertCircle size={14} />
                        <span>{rec.title || rec}: {rec.description || ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PDF Export Note */}
              <div className="security-note">
                <AlertCircle size={16} />
                <p>Detailed technical analysis and comprehensive security recommendations are available in the exported PDF report.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="premium-modal-footer">
          <Shield size={14} />
          <span>Powered by SCRUTINA Intelligence</span>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailsCard;
