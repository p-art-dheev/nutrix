import React from 'react';
import type { AppView } from '../types/app';
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

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="navbar">
      <button type="button" className="nav-brand" onClick={() => onNavigate('landing')} aria-label="Nutrix home">
        <span className="nav-brand-text">Nutrix</span>
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
      </div>
    </nav>
  );
};
