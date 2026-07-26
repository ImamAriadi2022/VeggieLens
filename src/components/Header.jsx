import { Sprout, ScanLine } from 'lucide-react';

function Header({ modelStatus, currentView, onNavigateHome, onStartScan }) {
  const isModelReady = modelStatus === 'Model AI Siap';

  const handleBrandClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    if (currentView !== 'landing' && onNavigateHome) {
      onNavigateHome();
      setTimeout(() => {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="brand-group" onClick={handleBrandClick} style={{ cursor: 'pointer' }} role="button" tabIndex={0}>
          <div className="logo">
            <Sprout size={24} className="logo-icon" />
            <h1 className="brand-title">VeggieLens</h1>
          </div>
          <span className="brand-tagline">See it. Know it.</span>
        </div>

        {currentView === 'landing' ? (
          <div className="header-nav">
            <a href="#how-it-works" onClick={handleScrollToHowItWorks} className="nav-link">
              Cara Kerja
            </a>
            <button className="header-cta-btn" onClick={onStartScan}>
              <ScanLine size={16} />
              <span>Mulai Mengenali</span>
            </button>
          </div>
        ) : (
          <div className="status-pill">
            <span className={`status-dot ${isModelReady ? 'active' : ''}`}></span>
            <span className="status-text">{modelStatus}</span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
