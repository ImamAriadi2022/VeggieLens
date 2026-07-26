import { useState } from 'react';
import { Sparkles, Search, CheckCircle, Lightbulb, Copy, Share2, Check, RefreshCw } from 'lucide-react';

function InfoPanel({ appState, detectionResult, funFactData, error, onCopyFact, onRetryFact }) {
  const [copied, setCopied] = useState(false);
  const isIdle = appState === 'idle';
  const isAnalyzing = appState === 'analyzing';
  const isResult = appState === 'result';

  const handleCopy = (e) => {
    if (onCopyFact) {
      onCopyFact(e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderIdleState = () => (
    <div id="state-idle" className="result-card idle-card">
      <div className="panel-badge">Hasil Deteksi</div>
      <div className="idle-content">
        <div className="idle-icon">
          <Sparkles size={36} />
        </div>
        <h3 className="panel-state-title">Belum Ada Hasil</h3>
        <p className="panel-state-desc">
          Arahkan kamera ke sayuran dan tekan tombol <strong>Scan</strong> untuk mengenali sayuran dan melihat fakta unik.
        </p>
        {error && (
          <p className="panel-error-text">
            {error}
          </p>
        )}
      </div>
    </div>
  );

  const renderAnalyzingState = () => (
    <div id="state-loading" className="result-card loading-card">
      <div className="panel-badge">Hasil Deteksi</div>
      <div className="loading-content">
        <div className="loading-animation">
          <div className="loading-ring"></div>
          <div className="loading-icon">
            <Search size={22} />
          </div>
        </div>
        <h3 className="panel-state-title">Mengenali Sayuran...</h3>
        <p className="panel-state-desc">Sedang menganalisis gambar pada frame kamera.</p>
      </div>
    </div>
  );

  const renderResultState = () => {
    if (!detectionResult) return null;

    const confidence = Math.round(detectionResult.score * 100);

    const renderFunFactContent = () => {
      if (funFactData === null) {
        return (
          <div id="fun-fact-loading" className="fun-fact-loading">
            <div className="fun-fact-loading-spinner"></div>
            <span>Membuat fakta menarik...</span>
          </div>
        );
      }

      if (funFactData === 'error') {
        return (
          <div className="fun-fact-error-box">
            <p>Fakta menarik belum berhasil dibuat. Coba lagi.</p>
            {onRetryFact && (
              <button
                className="retry-fact-btn"
                onClick={onRetryFact}
                style={{
                  marginTop: '0.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.75rem',
                  background: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
                <span>Buat Fakta Lagi</span>
              </button>
            )}
          </div>
        );
      }

      return funFactData;
    };

    return (
      <div id="state-result" className="result-card result-main">
        <div className="result-header">
          <span className="panel-badge">Hasil Deteksi</span>
          <div className="detected-badge">
            <CheckCircle size={14} />
            <span id="detected-name">{detectionResult.className}</span>
          </div>
        </div>

        <div className="confidence-section">
          <div className="confidence-header">
            <span className="confidence-label">Tingkat Kepercayaan</span>
            <span id="detected-confidence" className="confidence-value">{confidence}%</span>
          </div>
          <div className="confidence-track">
            <div
              id="confidence-fill"
              className="confidence-fill"
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>

        <div className="fun-fact-card">
          <div className="fun-fact-header">
            <div className="fun-fact-title-group">
              <div className="fun-fact-icon">
                <Lightbulb size={20} />
              </div>
              <h4 className="fun-fact-title">Fakta Unik</h4>
            </div>
            {funFactData && funFactData !== 'error' && (
              <button
                id="btn-copy"
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title={copied ? 'Tersalin!' : 'Salin fakta'}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            )}
          </div>
          <div id="fun-fact-content">
            <div id="fun-fact-text" className="fun-fact-text">
              {renderFunFactContent()}
            </div>
          </div>
        </div>

        <div className="share-hint">
          <Share2 size={13} />
          <span>Salin dan bagikan fakta menarik ini!</span>
        </div>
      </div>
    );
  };

  return (
    <section className="results-section" aria-live="polite">
      {isIdle && renderIdleState()}
      {isAnalyzing && renderAnalyzingState()}
      {isResult && renderResultState()}
    </section>
  );
}

export default InfoPanel;
