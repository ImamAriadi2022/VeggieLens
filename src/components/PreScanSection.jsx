import { Camera, ArrowLeft, ShieldAlert, Cpu, Lightbulb, RefreshCw, CheckCircle2 } from 'lucide-react';

function PreScanSection({ onRequestPermission, onBack, error, permissionState, isModelReady }) {
  const isDenied = permissionState === 'denied' || Boolean(error);

  return (
    <div className="prescan-container view-transition">
      <div className="prescan-card">
        {isDenied ? (
          /* Error / Permission Denied State */
          <div className="prescan-content error-state">
            <div className="prescan-icon-wrapper error">
              <ShieldAlert size={48} />
            </div>

            <h2 className="prescan-title">Akses Kamera Diperlukan</h2>
            <p className="prescan-desc">
              {error || 'VeggieLens membutuhkan izin akses kamera perangkat Anda untuk dapat memindai dan mengenali sayuran.'}
            </p>

            <div className="prescan-tips">
              <p className="tips-title">Langkah penyelesaian:</p>
              <ul>
                <li>Klik ikon gembok / izin di sebelah URL browser Anda.</li>
                <li>Ubah izin Kamera menjadi <strong>&quot;Izinkan&quot; (Allow)</strong>.</li>
                <li>Klik tombol <strong>Coba Lagi</strong> di bawah ini.</li>
              </ul>
            </div>

            <div className="prescan-actions">
              <button className="primary-cta-btn" onClick={onRequestPermission}>
                <RefreshCw size={18} />
                <span>Coba Lagi</span>
              </button>

              <button className="secondary-btn" onClick={onBack}>
                <ArrowLeft size={18} />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>
        ) : (
          /* Initial Preparation State */
          <div className="prescan-content">
            <div className="prescan-icon-wrapper">
              <Camera size={44} />
            </div>

            <h2 className="prescan-title">Siap Mengenali Sayuran?</h2>
            <p className="prescan-desc">
              VeggieLens membutuhkan akses kamera perangkat Anda untuk dapat mengenali jenis sayuran dan menyajikan fakta unik secara langsung.
            </p>

            <div className="prescan-flow-steps">
              <div className="flow-step">
                <div className="flow-icon">
                  <Camera size={20} />
                </div>
                <span>1. Kamera</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <div className="flow-icon">
                  <Cpu size={20} />
                </div>
                <span>2. AI Vision</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <div className="flow-icon">
                  <Lightbulb size={20} />
                </div>
                <span>3. Fakta Unik</span>
              </div>
            </div>

            <div className="privacy-note">
              <CheckCircle2 size={16} className="check-icon" />
              <span>Privasi Anda terjamin. Gambar kamera diproses 100% di browser lokal Anda tanpa diunggah ke server.</span>
            </div>

            <div className="prescan-actions">
              <button
                className="primary-cta-btn"
                onClick={onRequestPermission}
                disabled={!isModelReady}
                style={{ opacity: isModelReady ? 1 : 0.7 }}
              >
                <span>{isModelReady ? 'Izinkan Kamera & Mulai' : 'Menyiapkan Model AI...'}</span>
              </button>

              <button className="secondary-btn" onClick={onBack}>
                <ArrowLeft size={18} />
                <span>Kembali</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreScanSection;
