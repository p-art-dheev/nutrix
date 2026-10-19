import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Analysis.css'; // Reusing some base styles
import './DistributionAnalysis.css';
import { apiUrl } from '../services/dataApi';

interface Point {
  x: number;
  y: number;
}

interface CorrelationResult {
  x: string;
  y: string;
  pearson_r: number | null;
  pair_count: number;
  points: Point[];
}

// Common rule of thumb for reading |r|
const describeStrength = (r: number | null) => {
  if (r === null) return 'Undefined';
  const size = Math.abs(r);
  const direction = r > 0 ? 'positive' : 'negative';
  if (size >= 0.7) return `Strong ${direction}`;
  if (size >= 0.4) return `Moderate ${direction}`;
  if (size >= 0.2) return `Weak ${direction}`;
  return 'Little or none';
};

export const CorrelationAnalysis: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');
  const [result, setResult] = useState<CorrelationResult | null>(null);
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
          setXColumn(data.columns[0]);
          setYColumn(data.columns[1] ?? data.columns[0]);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load columns. Please ensure a dataset is uploaded.');
      });
  }, []);

  const handleGenerateCorrelation = async () => {
    if (!xColumn || !yColumn) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(apiUrl('/api/data/correlation', { x: xColumn, y: yColumn }));
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to fetch correlation');
      }
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating correlation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="distribution-container">
      {error && <div className="error-message">{error}</div>}

      <div className="analysis-controls">
        <div className="control-group">
          <label htmlFor="corr-x-select">X attribute</label>
          <div className="select-wrapper">
            <select id="corr-x-select" value={xColumn} onChange={e => setXColumn(e.target.value)}>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="corr-y-select">Y attribute</label>
          <div className="select-wrapper">
            <select id="corr-y-select" value={yColumn} onChange={e => setYColumn(e.target.value)}>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleGenerateCorrelation}
          disabled={loading || columns.length === 0}
        >
          {loading ? 'Generating...' : 'Generate Correlation'}
        </button>
      </div>

      {result && (
        <div className="distribution-results">
          <h3>{result.x} vs {result.y} — Correlation</h3>

          <div className="distribution-layout">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name={result.x} tick={{ fontSize: 12 }}
                    label={{ value: result.x, position: 'insideBottom', offset: -10, fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" name={result.y} tick={{ fontSize: 12 }}
                    label={{ value: result.y, angle: -90, position: 'insideLeft', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Scatter data={result.points} fill="#3b82f6" fillOpacity={0.5} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="side-stats-container">
              <div className="stat-card">
                <span className="stat-label">Pearson r</span>
                <span className="stat-value">{result.pearson_r === null ? 'N/A' : result.pearson_r.toFixed(3)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Strength</span>
                <span className="stat-value">{describeStrength(result.pearson_r)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Foods used</span>
                <span className="stat-value">{result.pair_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
