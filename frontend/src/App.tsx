import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { Analysis } from './components/Analysis';
import { DataPage } from './components/DataPage';
import { Optimize } from './components/Optimize';
import { setDatasetId } from './services/session';
import type { AppView, UploadData } from './types/app';

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [uploadData, setUploadData] = useState<UploadData | null>(null);

  const handleNavigate = (target: AppView) => {
    setView(target);
  };

  const handleUploadSuccess = (data: UploadData) => {
    setUploadData(data);
  };

  const handleResetUpload = () => {
    setDatasetId(null); // also empties the pantry
    setUploadData(null);
  };

  const handleGetStarted = () => {
    if (view === 'landing') {
      handleNavigate('data');
    } else {
      handleNavigate('landing');
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return (
          <div className="landing-page">
            <HeroSection onLoadDatasetClick={() => handleNavigate('data')} />
            <FeaturesSection />
          </div>
        );
      case 'data':
        return (
          <DataPage
            uploadData={uploadData}
            onUploadSuccess={handleUploadSuccess}
            onReset={handleResetUpload}
            onNavigateToAnalysis={() => handleNavigate('analysis')}
            onNavigateToOptimize={() => handleNavigate('optimize')}
          />
        );
      case 'analysis':
        return <Analysis hasData={uploadData !== null} onNavigateToData={() => handleNavigate('data')} />;
      case 'optimize':
        return <Optimize hasData={uploadData !== null} onNavigateToData={() => handleNavigate('data')} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Navbar
            activeView={view}
            onNavigate={handleNavigate}
            onGetStartedClick={handleGetStarted}
          />
        </div>
      </header>

      <main className="app-main">
        <div
          className={[
            'app-container',
            view !== 'landing' ? 'page-view' : '',
            view === 'data' && uploadData ? 'app-container--full' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
