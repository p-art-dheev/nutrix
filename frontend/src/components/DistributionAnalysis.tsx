import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Analysis.css'; // Reusing some base styles
import './DistributionAnalysis.css';
import { apiUrl } from '../services/dataApi';

interface DistributionData {
  range: string;
  count: number;
}

interface DistributionStats {
  mean: number | null;
  median: number | null;
  std: number | null;
}

export const DistributionAnalysis: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedBins, setSelectedBins] = useState<number>(5);
  const [distribution, setDistribution] = useState<DistributionData[] | null>(null);
  const [stats, setStats] = useState<DistributionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available columns on mount
    fetch(apiUrl('/api/data/columns'))
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch columns');
        return res.json();
      })
      .then(data => {
        if (data.columns && data.columns.length > 0) {
          setColumns(data.columns);
          setSelectedColumn(data.columns[0]); // Default to first column
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load columns. Please ensure a dataset is uploaded.');
      });
  }, []);

  const handleGenerateDistribution = async () => {
    if (!selectedColumn) return;
    setLoading(true);
    setError(null);
    setDistribution(null);
    setStats(null);

    try {
      const response = await fetch(apiUrl(`/api/data/distribution/${encodeURIComponent(selectedColumn)}`, { bins: selectedBins }));
      if (!response.ok) {
        throw new Error('Failed to fetch distribution data');
      }
      const data = await response.json();
      setDistribution(data.distribution);
      setStats(data.statistics);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating distribution.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'N/A';
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  return (
    <div className="distribution-container">
      {error && <div className="error-message">{error}</div>}

      <div className="analysis-controls">
        <div className="control-group">
          <label htmlFor="dist-attribute-select">Analyze</label>
          <div className="select-wrapper">
            <select 
              id="dist-attribute-select" 
              value={selectedColumn} 
              onChange={e => setSelectedColumn(e.target.value)}
            >
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="dist-bins-select">Bins</label>
          <div className="select-wrapper">
            <select 
              id="dist-bins-select" 
              value={selectedBins} 
              onChange={e => setSelectedBins(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleGenerateDistribution}
          disabled={loading || columns.length === 0}
        >
          {loading ? 'Generating...' : 'Generate Distribution'}
        </button>
      </div>

      {distribution && stats && (
        <div className="distribution-results">
          <h3>{selectedColumn} — Distribution</h3>
          
          <div className="distribution-layout">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={distribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="side-stats-container">
               <div className="stat-card">
                  <span className="stat-label">Mean</span>
                  <span className="stat-value">{formatNumber(stats.mean)}</span>
               </div>
               <div className="stat-card">
                  <span className="stat-label">Median</span>
                  <span className="stat-value">{formatNumber(stats.median)}</span>
               </div>
               <div className="stat-card">
                  <span className="stat-label">Std Dev</span>
                  <span className="stat-value">{formatNumber(stats.std)}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
