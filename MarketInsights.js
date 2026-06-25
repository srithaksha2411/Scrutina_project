import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, PieChart, BarChart3, Activity, Globe, Award, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

function MarketInsights() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatedStats, setAnimatedStats] = useState({
    totalBusinesses: 0,
    verifiedBusinesses: 0,
    averageTrustScore: 0,
    researchSessions: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Animate statistics count-up
  useEffect(() => {
    if (!analytics) return;

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedStats({
        totalBusinesses: Math.floor(analytics.totalBusinesses * easeOutQuart),
        verifiedBusinesses: Math.floor(analytics.verifiedBusinesses * easeOutQuart),
        averageTrustScore: Math.floor(analytics.averageTrustScore * easeOutQuart),
        researchSessions: Math.floor(analytics.researchSessions * easeOutQuart)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats({
          totalBusinesses: analytics.totalBusinesses,
          verifiedBusinesses: analytics.verifiedBusinesses,
          averageTrustScore: analytics.averageTrustScore,
          researchSessions: analytics.researchSessions
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [analytics]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('scrutinaToken');
      const response = await fetch('http://localhost:5000/api/analytics/market-insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.message || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to connect to analytics service');
    } finally {
      setLoading(false);
    }
  };

  // Color palette for charts
  const chartColors = [
    '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444',
    '#F97316', '#14B8A6', '#6366F1', '#EC4899', '#84CC16'
  ];

  const renderIndustryChart = () => {
    if (!analytics?.industryDistribution || analytics.industryDistribution.length === 0) {
      return <div className="empty-chart">No industry data available</div>;
    }

    const total = analytics.industryDistribution.reduce((sum, item) => sum + item.count, 0);
    // Show only top 5 industries
    const topIndustries = analytics.industryDistribution.slice(0, 5);

    return (
      <div className="chart-container compact">
        <div className="compact-chart">
          {topIndustries.map((item, index) => {
            const percentage = (item.count / total) * 100;
            return (
              <div key={index} className="compact-chart-item">
                <div className="compact-label">
                  <span className="label-text">{item.industry}</span>
                  <span className="label-count">{item.count}</span>
                </div>
                <div className="compact-bar">
                  <motion.div 
                    className="compact-bar-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    style={{ 
                      backgroundColor: chartColors[index % chartColors.length]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderServicesChart = () => {
    if (!analytics?.topServices || analytics.topServices.length === 0) {
      return <div className="empty-chart">No services data available</div>;
    }

    const maxCount = Math.max(...analytics.topServices.map(s => s.count));
    // Show only top 5 services
    const topServices = analytics.topServices.slice(0, 5);

    return (
      <div className="chart-container compact">
        <div className="compact-chart">
          {topServices.map((service, index) => {
            const percentage = (service.count / maxCount) * 100;
            return (
              <div key={index} className="compact-chart-item">
                <div className="compact-label">
                  <span className="label-text">{service.service}</span>
                  <span className="label-count">{service.count}</span>
                </div>
                <div className="compact-bar">
                  <motion.div 
                    className="compact-bar-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    style={{ 
                      backgroundColor: chartColors[index % chartColors.length]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrustScoreChart = () => {
    if (!analytics?.trustScoreDistribution || analytics.trustScoreDistribution.length === 0) {
      return <div className="empty-chart">No trust score data available</div>;
    }

    const total = analytics.trustScoreDistribution.reduce((sum, item) => sum + item.count, 0);
    const rangeColors = {
      0: '#EF4444',
      40: '#F97316',
      60: '#F59E0B',
      80: '#10B981',
      90: '#059669'
    };

    return (
      <div className="chart-container">
        <div className="score-distribution">
          {analytics.trustScoreDistribution.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={index} className="score-range-item">
                <div className="score-range-header">
                  <span className="score-range-label">{item.range}</span>
                  <span className="score-range-count">{item.count} businesses</span>
                </div>
                <div className="score-range-bar">
                  <motion.div 
                    className="score-range-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    style={{ 
                      backgroundColor: rangeColors[item.rangeKey] || '#6B7280'
                    }}
                  >
                    <span className="score-range-percentage">{percentage}%</span>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVerificationChart = () => {
    if (!analytics?.verificationAnalytics) {
      return <div className="empty-chart">No verification data available</div>;
    }

    const { verified, total, verifiedPercentage } = analytics.verificationAnalytics;
    const unverified = total - verified;

    return (
      <div className="chart-container">
        <div className="donut-chart-wrapper">
          <div className="donut-chart">
            <svg viewBox="0 0 200 200" className="donut-svg">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#F3F4F6" strokeWidth="40" />
              <circle 
                cx="100" 
                cy="100" 
                r="80" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="40"
                strokeDasharray={`${verifiedPercentage * 5.03} 503`}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
            </svg>
            <div className="donut-center">
              <div className="donut-percentage">{verifiedPercentage}%</div>
              <div className="donut-label">Verified</div>
            </div>
          </div>
          <div className="donut-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10B981' }} />
              <span className="legend-text">Verified: {verified}</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#F3F4F6' }} />
              <span className="legend-text">Unverified: {unverified}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGeographicChart = () => {
    if (!analytics?.geographicDistribution || analytics.geographicDistribution.length === 0) {
      return <div className="empty-chart">No geographic data available</div>;
    }

    const maxCount = Math.max(...analytics.geographicDistribution.map(l => l.count));

    return (
      <div className="chart-container">
        <div className="geographic-list">
          {analytics.geographicDistribution.map((location, index) => {
            const percentage = (location.count / maxCount) * 100;
            return (
              <div key={index} className="geographic-item">
                <div className="geographic-header">
                  <div className="geographic-rank">{index + 1}</div>
                  <div className="geographic-info">
                    <span className="geographic-name">{location.location}</span>
                    <span className="geographic-count">{location.count} businesses</span>
                  </div>
                </div>
                <div className="geographic-bar">
                  <motion.div 
                    className="geographic-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                    style={{ 
                      backgroundColor: chartColors[index % chartColors.length]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          <Activity className="spinner" size={32} />
          <p>Loading market insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-state">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchAnalytics}>Retry</button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalBusinesses === 0) {
    return (
      <div className="page-content">
        <div className="empty-state-card">
          <PieChart size={48} />
          <h3>No Data Available</h3>
          <p>Start researching businesses to see market insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Market Insights</h2>
        <p className="page-subtitle">Analytics and insights from your research data</p>
      </div>

      {/* Overview Stats */}
      <div className="insights-grid">
        <motion.div 
          className="insight-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="insight-icon blue">
            <Building2 size={32} />
          </div>
          <div className="insight-content">
            <h3>{animatedStats.totalBusinesses}</h3>
            <p>Total Businesses</p>
            <span className="insight-trend">Across all research sessions</span>
          </div>
        </motion.div>

        <motion.div 
          className="insight-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="insight-icon green">
            <CheckCircle2 size={32} />
          </div>
          <div className="insight-content">
            <h3>{animatedStats.verifiedBusinesses}</h3>
            <p>Verified Businesses</p>
            <span className="insight-trend">High quality data</span>
          </div>
        </motion.div>

        <motion.div 
          className="insight-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="insight-icon yellow">
            <Shield size={32} />
          </div>
          <div className="insight-content">
            <h3>{animatedStats.averageTrustScore}%</h3>
            <p>Average Trust Score</p>
            <span className="insight-trend">Data reliability index</span>
          </div>
        </motion.div>

        <motion.div 
          className="insight-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="insight-icon purple">
            <BarChart3 size={32} />
          </div>
          <div className="insight-content">
            <h3>{animatedStats.researchSessions}</h3>
            <p>Research Sessions</p>
            <span className="insight-trend">Total queries executed</span>
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="analytics-grid">
        {/* Industry Distribution */}
        <div className="analytics-card">
          <div className="analytics-header">
            <PieChart size={20} />
            <h3>Industry Distribution</h3>
          </div>
          <div className="analytics-body">
            {renderIndustryChart()}
          </div>
        </div>

        {/* Top Services */}
        <div className="analytics-card">
          <div className="analytics-header">
            <BarChart3 size={20} />
            <h3>Top Services</h3>
          </div>
          <div className="analytics-body">
            {renderServicesChart()}
          </div>
        </div>

        {/* Trust Score Distribution */}
        <div className="analytics-card full-width">
          <div className="analytics-header">
            <Shield size={20} />
            <h3>Trust Score Distribution</h3>
          </div>
          <div className="analytics-body">
            {renderTrustScoreChart()}
          </div>
        </div>

        {/* Verification Analytics */}
        <div className="analytics-card">
          <div className="analytics-header">
            <Award size={20} />
            <h3>Verification Status</h3>
          </div>
          <div className="analytics-body">
            {renderVerificationChart()}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="analytics-card">
          <div className="analytics-header">
            <Globe size={20} />
            <h3>Geographic Distribution</h3>
          </div>
          <div className="analytics-body">
            {renderGeographicChart()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketInsights;
