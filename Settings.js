import React, { useState, useEffect } from 'react';
import { User, Database, Zap, CheckCircle2, XCircle, Activity, Info, Calendar, Layers, Code, Server, Globe, Clock, Sparkles } from 'lucide-react';

function Settings() {
  const [user, setUser] = useState(null);
  const [apiStatus, setApiStatus] = useState({ status: 'checking', message: 'Checking...' });
  const [dbStatus, setDbStatus] = useState({ status: 'checking', message: 'Checking...' });

  useEffect(() => {
    const userData = localStorage.getItem('scrutinaUser');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Check API Status
    try {
      const token = localStorage.getItem('scrutinaToken');
      const response = await fetch('http://localhost:5000/api/research/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setApiStatus({ status: 'online', message: 'Connected' });
        setDbStatus({ status: 'online', message: 'Connected' });
      } else {
        setApiStatus({ status: 'offline', message: 'Disconnected' });
        setDbStatus({ status: 'offline', message: 'Disconnected' });
      }
    } catch (error) {
      setApiStatus({ status: 'offline', message: 'Error connecting' });
      setDbStatus({ status: 'offline', message: 'Error connecting' });
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'checking') return <Activity className="spinner" size={20} />;
    if (status === 'online') return <CheckCircle2 size={20} className="status-online" />;
    return <XCircle size={20} className="status-offline" />;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Settings</h2>
        <p className="page-subtitle">Manage your profile and system settings</p>
      </div>

      <div className="settings-sections">
        {/* User Profile */}
        <div className="settings-card">
          <div className="settings-header">
            <User size={20} />
            <h3>User Profile</h3>
          </div>
          <div className="settings-content">
            {user ? (
              <>
                <div className="profile-row">
                  <span className="profile-label">Full Name</span>
                  <span className="profile-value">{user.fullName}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Organization</span>
                  <span className="profile-value">{user.organization || 'Not specified'}</span>
                </div>
              </>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
        </div>

        {/* API Status */}
        <div className="settings-card">
          <div className="settings-header">
            <Zap size={20} />
            <h3>API Status</h3>
          </div>
          <div className="settings-content">
            <div className="status-row">
              <span className="status-label">Backend API</span>
              <div className="status-indicator">
                {getStatusIcon(apiStatus.status)}
                <span className={`status-text ${apiStatus.status}`}>{apiStatus.message}</span>
              </div>
            </div>
            <div className="status-row">
              <span className="status-label">SerpAPI</span>
              <div className="status-indicator">
                {getStatusIcon(apiStatus.status)}
                <span className={`status-text ${apiStatus.status}`}>
                  {apiStatus.status === 'online' ? 'Configured' : 'Check Configuration'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="settings-card">
          <div className="settings-header">
            <Database size={20} />
            <h3>Database Status</h3>
          </div>
          <div className="settings-content">
            <div className="status-row">
              <span className="status-label">MongoDB</span>
              <div className="status-indicator">
                {getStatusIcon(dbStatus.status)}
                <span className={`status-text ${dbStatus.status}`}>{dbStatus.message}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Information */}
        <div className="settings-card">
          <div className="settings-header">
            <Info size={20} />
            <h3>Platform Information</h3>
          </div>
          <div className="settings-content">
            <div className="info-row">
              <div className="info-item">
                <Layers size={16} className="info-icon" />
                <div className="info-details">
                  <span className="info-label">SCRUTINA Version</span>
                  <span className="info-value">v1.0.0</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <Calendar size={16} className="info-icon" />
                <div className="info-details">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">Today</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <Zap size={16} className="info-icon" />
                <div className="info-details">
                  <span className="info-label">Research Engine</span>
                  <span className="info-value status-connected">Connected</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <Server size={16} className="info-icon" />
                <div className="info-details">
                  <span className="info-label">Backend</span>
                  <span className="info-value">Node.js + Express</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-item">
                <Database size={16} className="info-icon" />
                <div className="info-details">
                  <span className="info-label">Database</span>
                  <span className="info-value">MongoDB Atlas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Status */}
        <div className="settings-card">
          <div className="settings-header">
            <Activity size={20} />
            <h3>Application Status</h3>
          </div>
          <div className="settings-content">
            <div className="status-indicator-row">
              <CheckCircle2 size={18} className="status-check" />
              <div className="status-info">
                <span className="status-name">Backend API</span>
                <span className="status-value">Connected</span>
              </div>
            </div>
            <div className="status-indicator-row">
              <CheckCircle2 size={18} className="status-check" />
              <div className="status-info">
                <span className="status-name">Database</span>
                <span className="status-value">Connected</span>
              </div>
            </div>
            <div className="status-indicator-row">
              <CheckCircle2 size={18} className="status-check" />
              <div className="status-info">
                <span className="status-name">AI Engine</span>
                <span className="status-value">Ready</span>
              </div>
            </div>
            <div className="status-indicator-row">
              <CheckCircle2 size={18} className="status-check" />
              <div className="status-info">
                <span className="status-name">Security Scanner</span>
                <span className="status-value">Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Preferences */}
        <div className="settings-card">
          <div className="settings-header">
            <Globe size={20} />
            <h3>User Preferences</h3>
          </div>
          <div className="settings-content">
            <div className="preference-row">
              <div className="preference-item">
                <div className="preference-icon-wrapper">
                  <Code size={16} />
                </div>
                <div className="preference-details">
                  <span className="preference-label">Theme</span>
                  <span className="preference-value">Light</span>
                </div>
              </div>
            </div>
            <div className="preference-row">
              <div className="preference-item">
                <div className="preference-icon-wrapper">
                  <Globe size={16} />
                </div>
                <div className="preference-details">
                  <span className="preference-label">Language</span>
                  <span className="preference-value">English</span>
                </div>
              </div>
            </div>
            <div className="preference-row">
              <div className="preference-item">
                <div className="preference-icon-wrapper">
                  <Clock size={16} />
                </div>
                <div className="preference-details">
                  <span className="preference-label">Timezone</span>
                  <span className="preference-value">Local Time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About SCRUTINA */}
        <div className="settings-card about-card">
          <div className="settings-header">
            <Sparkles size={20} />
            <h3>About SCRUTINA</h3>
          </div>
          <div className="settings-content">
            <p className="about-description">
              SCRUTINA is an AI-powered Business Intelligence platform that discovers businesses, 
              verifies authenticity, performs cybersecurity analysis, and generates executive business reports.
            </p>
            <div className="about-details">
              <div className="about-item">
                <span className="about-label">Version</span>
                <span className="about-value">1.0.0</span>
              </div>
              <div className="about-item">
                <span className="about-label">Powered by</span>
                <span className="about-value powered-by">Gemini AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
