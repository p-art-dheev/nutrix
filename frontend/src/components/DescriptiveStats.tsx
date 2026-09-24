import React, { useState, useEffect } from 'react';
import './Analysis.css';
import { apiUrl } from '../services/dataApi';

interface Stats {
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  q1: number;
  q3: number;
  max: number;
}

export const DescriptiveStats: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
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

  const handleGenerateStats = async () => {
    if (!selectedColumn) return;
    setLoading(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch(apiUrl(`/api/data/stats/${encodeURIComponent(selectedColumn)}`));
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      setStats(data.statistics);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating statistics.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'N/A';
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h2>Descriptive Statistics</h2>
        <p>Select a nutritional attribute to view its statistical properties across the dataset.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="analysis-controls">
        <div className="control-group">
          <label htmlFor="attribute-select">Select Nutritional Attribute</label>
          <div className="select-wrapper">
            <select 
              id="attribute-select" 
              value={selectedColumn} 
              onChange={e => setSelectedColumn(e.target.value)}
            >
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleGenerateStats}
          disabled={loading || columns.length === 0}
        >
          {loading ? 'Generating...' : 'Generate Statistics'}
        </button>
      </div>

      {stats && (
        <div className="stats-results">
          <h3>{selectedColumn} — Descriptive Statistics</h3>
          
          <div className="stats-table-container">
            <table className="stats-table">
              <tbody>
                <tr>
                  <th>Count</th>
                  <td>{formatNumber(stats.count)}</td>
                </tr>
                <tr>
                  <th>Mean</th>
                  <td>{formatNumber(stats.mean)}</td>
                </tr>
                <tr>
                  <th>Median</th>
                  <td>{formatNumber(stats.median)}</td>
                </tr>
                <tr>
                  <th>Standard deviation</th>
                  <td>{formatNumber(stats.std)}</td>
                </tr>
                <tr>
                  <th>Minimum</th>
                  <td>{formatNumber(stats.min)}</td>
                </tr>
                <tr>
                  <th>Q1</th>
                  <td>{formatNumber(stats.q1)}</td>
                </tr>
                <tr>
                  <th>Q3</th>
                  <td>{formatNumber(stats.q3)}</td>
                </tr>
                <tr>
                  <th>Maximum</th>
                  <td>{formatNumber(stats.max)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
