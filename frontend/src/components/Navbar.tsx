import React from 'react';
import type { AppView } from '../types/app';
import brandImg from '../assets/nutrix-brand.webp';
import logoImg from '../assets/nutrix-logo.webp';
import './Navbar.css';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onGetStartedClick?: () => void;
}

const NAV_ITEMS: { view: AppView; label: string; icon: React.ReactNode }[] = [
  {
    view: 'data',
    label: 'Data',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
      </svg>
    ),
  },
  {
    view: 'analysis',
    label: 'Analysis',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
  {
    view: 'optimize',
    label: 'Optimize',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate, onGetStartedClick }) => {
  return (
    <nav className="navbar">
      <button type="button" className="nav-brand" onClick={() => onNavigate('landing')} aria-label="Nutrix home">
        {/* Full wordmark on wide screens, leaf mark only on phones */}
        <img src={brandImg} alt="Nutrix" className="nav-brand-full" width={157} height={36} />
        <img src={logoImg} alt="Nutrix" className="nav-brand-mark" width={36} height={36} />
      </button>
      <div className="nav-links">
        {NAV_ITEMS.map(({ view, label, icon }) => (
          <button
            key={view}
            type="button"
            className={`nav-item ${activeView === view ? 'active' : ''}`}
            onClick={() => onNavigate(view)}
          >
            {icon}
            {label}
          </button>
        ))}
        <button className="btn-get-started" onClick={onGetStartedClick}>
          Get Started
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="btn-arrow"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </nav>
  );
};
