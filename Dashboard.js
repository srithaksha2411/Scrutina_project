import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User, Zap, LayoutDashboard, Building2, TrendingUp, Clock, Settings, CheckCircle2, AlertTriangle } from 'lucide-react';
import BusinessResearch from './BusinessResearch';
import MarketInsights from './MarketInsights';
import ResearchHistory from './ResearchHistory';
import SettingsPage from './Settings';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [stats, setStats] = useState({
    totalBusinessesFound: 0,
    totalVerified: 0,
    totalDuplicatesRemoved: 0,
    totalResearches: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('scrutinaToken');
    const userData = localStorage.getItem('scrutinaUser');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchStats();

    // Listen for history load events
    const handleLoadHistory = (event) => {
      console.log('[Dashboard] Switching to research tab for history');
      setActiveMenu('research');
    };

    window.addEventListener('loadResearchHistory', handleLoadHistory);
    return () => window.removeEventListener('loadResearchHistory', handleLoadHistory);
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('scrutinaToken');
      const response = await fetch('http://localhost:5000/api/research/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('scrutinaToken');
    localStorage.removeItem('scrutinaUser');
    navigate('/');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <motion.div 
            className="content-area"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <Building2 size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalBusinessesFound}</div>
                  <div className="stat-label">Businesses Found</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">
                  <CheckCircle2 size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalVerified}</div>
                  <div className="stat-label">Verified Records</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon red">
                  <AlertTriangle size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalDuplicatesRemoved}</div>
                  <div className="stat-label">Duplicates Removed</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon yellow">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalResearches}</div>
                  <div className="stat-label">Research Sessions</div>
                </div>
              </div>
            </div>

            <div className="dashboard-welcome">
              <h2>Welcome to SCRUTINA</h2>
              <p>Your AI-powered business intelligence platform</p>
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => setActiveMenu('research')}>
                  <Building2 size={20} />
                  <span>Start New Research</span>
                </button>
                <button className="quick-action-btn secondary" onClick={() => setActiveMenu('history')}>
                  <Clock size={20} />
                  <span>View History</span>
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'research':
        return <BusinessResearch key={Date.now()} />;
      case 'insights':
        return <MarketInsights />;
      case 'history':
        return <ResearchHistory />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Zap size={24} />
          <span>SCRUTINA</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'research' ? 'active' : ''}`}
            onClick={() => setActiveMenu('research')}
          >
            <Building2 size={20} />
            <span>Business Research</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveMenu('insights')}
          >
            <TrendingUp size={20} />
            <span>Market Insights</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'history' ? 'active' : ''}`}
            onClick={() => setActiveMenu('history')}
          >
            <Clock size={20} />
            <span>Research History</span>
          </button>
          <button 
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="top-header">
          {activeMenu === 'dashboard' && (
            <>
              <div className="header-left">
                <h1>Welcome Back, {user.fullName}</h1>
                <p>Research businesses with AI-powered business intelligence.</p>
              </div>
              <div className="header-right">
                <div className="user-profile">
                  <div className="user-avatar">
                    {user.photo ? (
                      <img src={user.photo} alt={user.fullName} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <span className="user-name">{user.fullName}</span>
                </div>
              </div>
            </>
          )}
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
