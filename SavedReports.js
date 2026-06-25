import React from 'react';
import { FileText, Download, Star } from 'lucide-react';

function SavedReports() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Saved Reports</h2>
        <p className="page-subtitle">Export and manage your research reports</p>
      </div>

      <div className="empty-state-card">
        <Star size={48} />
        <h3>No Saved Reports</h3>
        <p>Save your research results as PDF reports for easy sharing</p>
        <div className="feature-coming-soon">
          <FileText size={20} />
          <span>PDF Export Feature Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

export default SavedReports;
