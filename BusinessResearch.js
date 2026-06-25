import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// eslint-disable-next-line no-unused-vars
import { Search, Loader, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, MapPin, FileText, Award, Link as LinkIcon, Shield, Globe, Mail, Phone as PhoneIcon, Linkedin, Facebook, Twitter, Instagram, Youtube, Check, X, Download, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTrustScore, getTrustScoreLevel } from '../utils/trustScoreCalculator';
import BusinessDetailsCard from '../components/BusinessDetailsCard';
import ReportTemplate from '../components/ReportTemplate';
import { calculatePdfAnalytics, generatePdfReport } from '../utils/pdfGenerator';
import '../styles/BusinessDetailsCard.css';

function BusinessResearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [trustScoreModal, setTrustScoreModal] = useState({ open: false, business: null });
  const [loadingHistory] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [currentResearch, setCurrentResearch] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  useEffect(() => {
    // Check sessionStorage for history data
    const historyData = sessionStorage.getItem('researchHistoryData');
    if (historyData) {
      try {
        const data = JSON.parse(historyData);
        console.log('[BusinessResearch] Loading history data:', data);
        loadHistoryData(data);
        sessionStorage.removeItem('researchHistoryData');
      } catch (error) {
        console.error('[BusinessResearch] Error parsing history data:', error);
      }
    }

    // Listen for history load events
    const handleLoadHistory = (event) => {
      console.log('[BusinessResearch] History event received:', event.detail);
      loadHistoryData(event.detail);
    };

    window.addEventListener('loadResearchHistory', handleLoadHistory);
    return () => window.removeEventListener('loadResearchHistory', handleLoadHistory);
  }, []);

  const loadHistoryData = (data) => {
    if (data.success && data.businesses) {
      console.log('[BusinessResearch] Setting results with', data.businesses.length, 'businesses');
      setQuery(data.research.query);
      setCurrentResearch(data.research);
      setResults({
        success: true,
        businesses: data.businesses,
        summary: data.summary,
        fromHistory: true,
        historyMessage: data.message
      });
    }
  };

  const handleResearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setCacheInfo(null);
    try {
      const token = localStorage.getItem('scrutinaToken');
      const response = await fetch('http://localhost:5000/api/research/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentResearch({ _id: data.researchId, query: query, status: 'completed', summary: data.summary, createdAt: new Date() });
        setResults(data);
        
        // Set cache info if response is cached
        if (data.cached) {
          setCacheInfo({
            cached: true,
            cacheAge: data.cacheAge,
            cachedAt: data.cachedAt,
            accessCount: data.accessCount
          });
        } else {
          setCacheInfo({ cached: false });
        }
      } else {
        alert(data.message || 'Research failed');
      }
    } catch (error) {
      console.error('Research error:', error);
      alert('Failed to process research request');
    } finally {
      setLoading(false);
    }
  };

  const handlePopularSearch = (searchQuery) => {
    setQuery(searchQuery);
  };

  const handleExportPDF = async () => {
    if (!results || !results.businesses || results.businesses.length === 0) {
      alert('No research data available to export');
      return;
    }

    setGeneratingPDF(true);
    setPdfProgress('Preparing Executive Report...');

    try {
      // Get user info
      const user = {
        email: localStorage.getItem('userEmail') || 'User',
        fullName: localStorage.getItem('userName') || 'User'
      };

      // Calculate analytics
      const analytics = calculatePdfAnalytics(results.businesses);

      // Create hidden container for report
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // Render ReportTemplate
      const root = ReactDOM.createRoot(container);
      root.render(
        <ReportTemplate
          research={currentResearch}
          businesses={results.businesses}
          user={user}
          analytics={analytics}
        />
      );

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF
      await generatePdfReport(container.firstChild, query, (progress) => {
        setPdfProgress(progress);
      });

      // Cleanup
      root.unmount();
      document.body.removeChild(container);

      console.log('[BusinessResearch] PDF generated successfully');
    } catch (error) {
      console.error('[BusinessResearch] PDF generation error:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPDF(false);
      setPdfProgress('');
    }
  };

  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getSocialIcon = (platform) => {
    const platformLower = platform.toLowerCase();
    const icons = {
      linkedin: <Linkedin size={16} />,
      facebook: <Facebook size={16} />,
      twitter: <Twitter size={16} />,
      instagram: <Instagram size={16} />,
      youtube: <Youtube size={16} />
    };
    return icons[platformLower] || <Globe size={16} />;
  };

  const getSocialPlatformName = (platform) => {
    const names = {
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      twitter: 'Twitter/X',
      instagram: 'Instagram',
      youtube: 'YouTube'
    };
    return names[platform.toLowerCase()] || platform;
  };

  const getValidSocialProfiles = (socialProfiles) => {
    if (!socialProfiles || typeof socialProfiles !== 'object') return [];
    
    const profiles = [];
    const platforms = ['linkedin', 'facebook', 'instagram', 'twitter', 'youtube'];
    
    platforms.forEach(platform => {
      const url = socialProfiles[platform];
      if (url && typeof url === 'string' && url.trim() !== '') {
        profiles.push({ platform, url: url.trim() });
      }
    });
    
    return profiles;
  };

  const getAllDataSources = (business) => {
    const sources = [];
    const sourceUrls = business?.sourceUrls || [];
    sourceUrls.forEach((url, idx) => {
      if (url && typeof url === 'string' && url.trim()) {
        sources.push({
          id: `su-${idx}`,
          name: 'Source URL',
          type: 'External',
          url: url
        });
      }
    });
    return sources;
  };

  const formatCacheAge = (ageMs) => {
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  const formatCacheDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diffHours < 48) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="page-content">
      <div className="analysis-section">
        <h2>Research Businesses</h2>
        <p className="section-subtitle-hero">AI-Powered Business Intelligence</p>
        <p className="section-description">
          Discover companies, verify authenticity, analyze cybersecurity posture and generate executive business reports in seconds.
        </p>
        
        <div className="feature-badges">
          <div className="feature-badge">
            <CheckCircle2 size={14} />
            <span>AI Verification</span>
          </div>
          <div className="feature-badge">
            <Shield size={14} />
            <span>Trust Score</span>
          </div>
          <div className="feature-badge">
            <Shield size={14} />
            <span>Security Analysis</span>
          </div>
          <div className="feature-badge">
            <FileText size={14} />
            <span>Executive Summary</span>
          </div>
        </div>
        
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search businesses, industries, professionals, or locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
            disabled={loading}
          />
        </div>
        <button 
          className="analyze-btn"
          onClick={handleResearch}
          disabled={!query.trim() || loading || loadingHistory}
        >
          {loading || loadingHistory ? (
            <>
              <Loader size={20} className="spinner" />
              {loadingHistory ? 'Loading history...' : 'Researching...'}
            </>
          ) : (
            'Start Research'
          )}
        </button>

        <div className="popular-searches">
          <span className="popular-label">Examples:</span>
          <div className="chip-container">
            <button className="chip" onClick={() => handlePopularSearch('Cardiologists in Birmingham')}>Cardiologists in Birmingham</button>
            <button className="chip" onClick={() => handlePopularSearch('Cyber Security Companies in Chennai')}>Cyber Security Companies in Chennai</button>
            <button className="chip" onClick={() => handlePopularSearch('FinTech Startups in Bangalore')}>FinTech Startups in Bangalore</button>
          </div>
        </div>
      </div>

      {results && (
        <div className="recent-analyses">
          <div className="results-header">
            <h2>Research Results</h2>
            <div className="result-summary">
              {cacheInfo && cacheInfo.cached && (
                <span className="summary-badge cache-badge" title={`Loaded from cache. Accessed ${cacheInfo.accessCount} times`}>
                  <CheckCircle2 size={14} />
                  Loaded from Cache
                </span>
              )}
              {cacheInfo && !cacheInfo.cached && (
                <span className="summary-badge fresh-badge">
                  <CheckCircle2 size={14} />
                  Fresh Research
                </span>
              )}
              {results.fromHistory && (
                <span className="summary-badge purple">From History</span>
              )}
              <span className="summary-badge blue">{results.summary.totalFound || results.summary.totalBusinesses} Found</span>
              <span className="summary-badge green">{results.summary.verifiedCount} Verified</span>
              <span className="summary-badge red">{results.summary.duplicatesRemoved} Duplicates</span>
              <button 
                className="export-pdf-btn"
                onClick={handleExportPDF}
                disabled={generatingPDF}
                title="Export results as PDF report"
              >
                {generatingPDF ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
          
          {cacheInfo && cacheInfo.cached && (
            <div className="cache-info-banner">
              <div className="cache-info-content">
                <CheckCircle2 size={16} className="cache-icon" />
                <div className="cache-info-text">
                  <strong>Cache Hit:</strong> Results loaded instantly from cache.
                  <span className="cache-meta">
                    Cache Age: {formatCacheAge(cacheInfo.cacheAge)} | 
                    Last Updated: {formatCacheDate(cacheInfo.cachedAt)} | 
                    Accessed: {cacheInfo.accessCount} time{cacheInfo.accessCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {results.fromHistory && results.historyMessage && (
            <div className="history-notice">
              <AlertTriangle size={16} />
              <span>{results.historyMessage}</span>
            </div>
          )}
          
          <div className="businesses-list">
            {results.businesses.map((business, index) => (
              <div key={index} className="business-card">
                <div className="business-main-row">
                  <div className="business-info-grid">
                    <div className="info-cell">
                      <span className="cell-label">Business</span>
                      <span className="cell-value company-name">{business.name || business.businessName}</span>
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">Industry</span>
                      <span className="cell-value">{business.industry || 'N/A'}</span>
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">Email</span>
                      {business.email && business.email !== 'N/A' ? (
                        <a href={`mailto:${business.email}`} className="cell-value cell-link">
                          <Mail size={14} />
                          {business.email}
                        </a>
                      ) : (
                        <span className="cell-value na-text">Not Available</span>
                      )}
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">Phone</span>
                      {business.phone && business.phone !== 'N/A' ? (
                        <a href={`tel:${business.phone}`} className="cell-value cell-link">
                          <PhoneIcon size={14} />
                          {business.phone}
                        </a>
                      ) : (
                        <span className="cell-value na-text">Not Available</span>
                      )}
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">Website</span>
                      {business.website ? (
                        <a href={business.website} target="_blank" rel="noopener noreferrer" className="cell-value cell-link">
                          <Globe size={14} />
                          Visit Site
                        </a>
                      ) : (
                        <span className="cell-value na-text">Not Available</span>
                      )}
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">Trust Score</span>
                      {(() => {
                        const { percentage } = calculateTrustScore(business);
                        const level = getTrustScoreLevel(percentage);
                        return (
                          <button 
                            className={`trust-badge clickable ${level.className}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrustScoreModal({ open: true, business });
                            }}
                            title="Click to view breakdown"
                          >
                            <Shield size={14} />
                            {percentage}%
                          </button>
                        );
                      })()}
                    </div>
                    <div className="info-cell">
                      <span className="cell-label">Actions</span>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[ViewDetails] Button clicked, business:', business);
                          setSelectedBusiness(business);
                        }}
                        title="View full details"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </div>
                  <button 
                    className="expand-btn"
                    onClick={() => toggleRowExpansion(index)}
                  >
                    {expandedRows.has(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedRows.has(index) && (
                    <motion.div
                      className="business-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="details-grid">
                        <div className="detail-section">
                          <div className="section-header">
                            <MapPin size={18} />
                            <h4>Address</h4>
                          </div>
                          <p className="section-content">{business.address || 'Not Available'}</p>
                        </div>

                        {business.description && (
                          <div className="detail-section full-width">
                            <div className="section-header">
                              <FileText size={18} />
                              <h4>Description</h4>
                            </div>
                            <p className="section-content">{business.description}</p>
                          </div>
                        )}

                        {business.services && business.services.length > 0 && (
                          <div className="detail-section">
                            <div className="section-header">
                              <CheckCircle2 size={18} />
                              <h4>Services</h4>
                            </div>
                            <div className="badges-container">
                              {business.services.map((service, idx) => (
                                <span key={idx} className="badge service-badge">{service}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {business.certifications && business.certifications.length > 0 && (
                          <div className="detail-section">
                            <div className="section-header">
                              <Award size={18} />
                              <h4>Certifications</h4>
                            </div>
                            <div className="badges-container">
                              {business.certifications.map((cert, idx) => (
                                <span key={idx} className="badge cert-badge">{cert}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {(() => {
                          const socialProfiles = business?.socialProfiles || {};
                          const validProfiles = getValidSocialProfiles(socialProfiles);
                          const profileCount = validProfiles.length;

                          return (
                            <div className="detail-section">
                              <div className="section-header">
                                <LinkIcon size={18} />
                                <h4>Social Profiles ({profileCount})</h4>
                              </div>
                              {profileCount > 0 ? (
                                <div className="social-links">
                                  {validProfiles.map(({ platform, url }) => (
                                    <a 
                                      key={platform} 
                                      href={url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="social-link"
                                    >
                                      {getSocialIcon(platform)}
                                      <span>{getSocialPlatformName(platform)}</span>
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <p className="section-content no-social-text">No social profiles found</p>
                              )}
                            </div>
                          );
                        })()}

                        {(() => {
                          const allSources = getAllDataSources(business);
                          const sourceCount = allSources.length;

                          return (
                            <div className="detail-section full-width">
                              <div className="section-header">
                                <LinkIcon size={18} />
                                <h4>Data Sources ({sourceCount})</h4>
                              </div>
                              {sourceCount > 0 ? (
                                <div className="data-sources-list">
                                  {allSources.map((source) => (
                                    <div key={source.id} className="data-source-item">
                                      <div className="source-info">
                                        <span className="source-name">{source.name}</span>
                                        <span className="source-type">{source.type}</span>
                                      </div>
                                      {source.url && source.url.trim() && (
                                        <a 
                                          href={source.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="source-url"
                                        >
                                          <Globe size={14} />
                                          <span className="source-url-text">{source.url}</span>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="section-content no-sources-text">No data sources available</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust Score Modal */}
      <AnimatePresence>
        {trustScoreModal.open && trustScoreModal.business && (() => {
          const { score, breakdown, maxScore, percentage } = calculateTrustScore(trustScoreModal.business);
          const level = getTrustScoreLevel(percentage);

          return (
            <motion.div 
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTrustScoreModal({ open: false, business: null })}
            >
              <motion.div 
                className="modal-content trust-score-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>
                    <Shield size={20} />
                    Trust Score Breakdown
                  </h3>
                  <button 
                    className="modal-close"
                    onClick={() => setTrustScoreModal({ open: false, business: null })}
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <div className="trust-score-summary">
                    <div className="trust-score-circle">
                      <div className={`score-ring ${level.className}`}>
                        <span className="score-value">{percentage}%</span>
                        <span className="score-label">{level.label}</span>
                      </div>
                    </div>
                    <div className="trust-score-info">
                      <p className="trust-score-text">
                        <strong>{score}/{maxScore}</strong> points earned
                      </p>
                      <p className="trust-score-subtext">
                        Based on {breakdown.filter(b => b.passed).length} of {breakdown.length} criteria
                      </p>
                    </div>
                  </div>

                  <div className="trust-breakdown-list">
                    {breakdown.map((item, idx) => (
                      <div key={idx} className={`trust-breakdown-item ${item.passed ? 'passed' : 'failed'}`}>
                        <div className="breakdown-icon">
                          {item.passed ? (
                            <Check size={16} className="icon-check" />
                          ) : (
                            <X size={16} className="icon-cross" />
                          )}
                        </div>
                        <div className="breakdown-content">
                          <span className="breakdown-label">{item.label}</span>
                          {item.passed && (
                            <span className="breakdown-points">+{item.points}</span>
                          )}
                        </div>
                        {!item.passed && (
                          <span className="breakdown-missing">Missing</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Business Details Modal */}
      {selectedBusiness && (
        <>
          {console.log('[Render] Showing BusinessDetailsCard for:', selectedBusiness)}
          <BusinessDetailsCard 
            business={selectedBusiness} 
            onClose={() => {
              console.log('[Render] Closing BusinessDetailsCard');
              setSelectedBusiness(null);
            }} 
          />
        </>
      )}

      {/* PDF Generation Progress Modal */}
      {generatingPDF && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ zIndex: 10000 }}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px' }}
          >
            <Loader size={48} className="spinner" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ marginBottom: '12px', color: '#111827' }}>{pdfProgress}</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>Please wait while we prepare your executive report...</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default BusinessResearch;
