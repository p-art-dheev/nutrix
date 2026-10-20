import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage/LandingPage';
import { AnalysisPage } from './pages/AnalysisPage/AnalysisPage';
import { DataPage } from './pages/DataPage/DataPage';
import { OptimizePage } from './pages/OptimizePage/OptimizePage';
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

  const renderContent = () => {
    switch (view) {
      case 'landing':
        return (
          <div className="landing-page">
            <LandingPage onLoadDatasetClick={() => handleNavigate('data')} />
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
        return <AnalysisPage hasData={uploadData !== null} onNavigateToData={() => handleNavigate('data')} />;
      case 'optimize':
        return <OptimizePage hasData={uploadData !== null} onNavigateToData={() => handleNavigate('data')} />;
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
