import React from 'react';
import logoImg from '../assets/nutrix-logo.webp';
import './HeroSection.css';

interface HeroSectionProps {
  onLoadDatasetClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLoadDatasetClick }) => {
  return (
    <section className="hero-section">
      <div className="hero-left">
        <h1>Build better meals<br />with <span className="text-highlight">optimization.</span></h1>
        <p>Analyze nutritional data and find meal plans that<br />satisfy nutritional requirements and practical constraints.</p>
        
        <div className="hero-actions">
          <button className="btn-load-dataset" onClick={onLoadDatasetClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="btn-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            Load Dataset
          </button>
          <button className="btn-see-how">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
              className="btn-icon play-icon"
            >
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
            See How It Works
          </button>
        </div>
      </div>
      
      <div className="hero-right">
        <div className="optimization-card surface-card">
          <div className="card-header">
            <img src={logoImg} alt="" className="card-logo" width={22} height={22} />
            <span className="card-title">OPTIMIZATION</span>
          </div>
          
          <div className="card-body">
            <div className="metric-row">
              <span className="metric-label">Calories</span>
              <span className="metric-value">2,184 kcal</span>
              <span className="metric-check">✓</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Protein</span>
              <span className="metric-value">142 g</span>
              <span className="metric-check">✓</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Fiber</span>
              <span className="metric-value">31 g</span>
              <span className="metric-check">✓</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Cost</span>
              <span className="metric-value">₹286</span>
              <span className="metric-check">✓</span>
            </div>
          </div>
          
          <div className="card-footer">
            <div className="status-indicator"></div>
            <span>Optimal solution found</span>
          </div>
        </div>
      </div>
    </section>
  );
};
