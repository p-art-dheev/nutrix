import React, { useState } from 'react';
import { DescriptiveStats } from './DescriptiveStats';
import { DistributionAnalysis } from './DistributionAnalysis';
import { CorrelationAnalysis } from './CorrelationAnalysis';
import './StatisticsPage.css';

interface StatisticsPageProps {
  hasData: boolean;
  onNavigateToData: () => void;
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ hasData, onNavigateToData }) => {
  const [activeTab, setActiveTab] = useState<'descriptive' | 'distribution' | 'correlation'>('descriptive');

  if (!hasData) {
    return (
      <div className="analysis-wrapper">
        <div className="analysis-page-header">
          <h1>Analysis</h1>
          <p>Explore descriptive statistics, distributions and correlations for your dataset.</p>
        </div>
        <div className="analysis-empty surface-card">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <h2>No dataset loaded</h2>
          <p>Upload your nutrition data first to view statistics and analysis.</p>
          <button className="btn-primary" onClick={onNavigateToData}>
            Go to Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-wrapper">
      <div className="analysis-page-header">
        <h1>Analysis</h1>
        <p>Explore descriptive statistics, distributions and correlations for your dataset.</p>
      </div>

      <div className="analysis-tabs">
        <button 
          className={`tab-button ${activeTab === 'descriptive' ? 'active' : ''}`}
          onClick={() => setActiveTab('descriptive')}
        >
          Descriptive Statistics
        </button>
        <button 
          className={`tab-button ${activeTab === 'distribution' ? 'active' : ''}`}
          onClick={() => setActiveTab('distribution')}
        >
          Distribution Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'correlation' ? 'active' : ''}`}
          onClick={() => setActiveTab('correlation')}
        >
          Correlation
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'descriptive' && <DescriptiveStats />}
        {activeTab === 'distribution' && <DistributionAnalysis />}
        {activeTab === 'correlation' && <CorrelationAnalysis />}
      </div>
    </div>
  );
};
