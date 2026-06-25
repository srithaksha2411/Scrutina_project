import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, Activity, ChevronRight } from 'lucide-react';

function ResearchHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      console.log('[ResearchHistory] Fetching history...');
      const token = localStorage.getItem('scrutinaToken');
      console.log('[ResearchHistory] Token exists:', !!token);
      
      const response = await fetch('http://localhost:5000/api/research/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[ResearchHistory] Response status:', response.status);
      const data = await response.json();
      console.log('[ResearchHistory] Response data:', data);
      
      if (data.success) {
        console.log('[ResearchHistory] History count:', data.history.length);
        setHistory(data.history);
      } else {
        console.error('[ResearchHistory] API returned success: false');
      }
    } catch (error) {
      console.error('[ResearchHistory] Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResearch = async (researchId) => {
    console.log('[ResearchHistory] Loading research:', researchId);
    
    try {
      const token = localStorage.getItem('scrutinaToken');
      const response = await fetch(`http://localhost:5000/api/research/history/${researchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('[ResearchHistory] Research data:', data);
      
      if (data.success) {
        console.log('[ResearchHistory] Dispatching event with', data.businesses.length, 'businesses');
        // Store in sessionStorage to pass to BusinessResearch component
        sessionStorage.setItem('researchHistoryData', JSON.stringify(data));
        // Trigger event to switch tab and load data
        const event = new CustomEvent('loadResearchHistory', { detail: data });
        window.dispatchEvent(event);
      } else {
        alert(data.message || 'Failed to load research');
      }
    } catch (error) {
      console.error('[ResearchHistory] Error loading research:', error);
      alert('Failed to load research history');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', className: 'status-completed' },
      processing: { label: 'Processing', className: 'status-processing' },
      failed: { label: 'Failed', className: 'status-failed' },
      pending: { label: 'Pending', className: 'status-pending' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Research History</h2>
        <p className="page-subtitle">View and reopen previous research sessions</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <Activity className="spinner" size={32} />
          <p>Loading history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state-card">
          <Search size={48} />
          <h3>No Research History</h3>
          <p>Your previous searches will appear here</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div 
              key={item._id} 
              className="history-card clickable"
              onClick={() => handleViewResearch(item._id)}
            >
              <div className="history-icon">
                <FileText size={24} />
              </div>
              <div className="history-content">
                <div className="history-header">
                  <h3 className="history-query">{item.query}</h3>
                  {getStatusBadge(item.status)}
                </div>
                <div className="history-meta">
                  <span className="meta-item">
                    <Calendar size={14} />
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                {item.summary && (
                  <div className="history-stats">
                    <span className="stat-pill blue">{item.summary.totalFound || 0} Found</span>
                    <span className="stat-pill green">{item.summary.verifiedCount || 0} Verified</span>
                    {item.summary.duplicatesRemoved > 0 && (
                      <span className="stat-pill red">{item.summary.duplicatesRemoved} Duplicates</span>
                    )}
                  </div>
                )}
              </div>
              <div className="history-action">
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResearchHistory;
