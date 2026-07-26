import { ArrowRight, Camera, Cpu, Lightbulb, ShieldCheck, WifiOff, Sparkles } from 'lucide-react';

function LandingPage({ onStart }) {
  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page view-transition">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={16} className="hero-badge-icon" />
            <span>Pengenal Sayuran AI Berbasis Browser</span>
          </div>

          <h1 className="hero-headline">
            Kenali Sayuran <br />
            <span className="hero-highlight">Lebih Cerdas</span> dengan AI.
          </h1>

          <p className="hero-subtext">
            Arahkan kamera ke sayuran, biarkan AI mengenalinya secara instan, dan temukan fakta unik menarik dalam hitungan detik.
          </p>

          <div className="hero-actions">
            <button className="primary-cta-btn" onClick={onStart}>
              <span>Mulai Mengenali</span>
              <ArrowRight size={20} />
            </button>
            <a href="#how-it-works" className="secondary-link" onClick={scrollToHowItWorks}>
              Lihat Cara Kerja ↓
            </a>
          </div>

          <div className="hero-feature-pills">
            <div className="feature-pill">
              <Cpu size={16} className="pill-icon" />
              <span>AI Berbasis Browser (WebGPU/WebGL)</span>
            </div>
            <div className="feature-pill">
              <WifiOff size={16} className="pill-icon" />
              <span>Dapat Digunakan Secara Offline*</span>
            </div>
            <div className="feature-pill">
              <ShieldCheck size={16} className="pill-icon" />
              <span>Privasi Terjaga Tanpa Kirim Gambar</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card-preview">
            <div className="visual-card-header">
              <span className="visual-dot red"></span>
              <span className="visual-dot yellow"></span>
              <span className="visual-dot green"></span>
              <span className="visual-title">VeggieLens AI Scanner</span>
            </div>
            <div className="visual-card-body">
              <div className="visual-scanner-demo">
                <div className="visual-scanner-frame">
                  <div className="visual-scanner-line"></div>
                  <div className="demo-veggie-icon">🥕</div>
                </div>
                <div className="visual-ai-pill">
                  <span className="ai-dot active"></span>
                  <span>Wortel Terdeteksi (98%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <span className="section-badge">PANDUAN</span>
          <h2 className="section-title">Cara Kerjanya</h2>
          <p className="section-subtitle">Tiga langkah mudah untuk mengenali sayuran dan mempelajari nutrisinya.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon-wrapper">
              <Camera size={32} />
            </div>
            <h3 className="step-title">Arahkan Kamera</h3>
            <p className="step-desc">
              Arahkan kamera perangkat Anda ke sayuran segar yang ingin diidentifikasi.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon-wrapper">
              <Cpu size={32} />
            </div>
            <h3 className="step-title">AI Mengenali</h3>
            <p className="step-desc">
              VeggieLens menggunakan Computer Vision berbasis browser untuk mengenali jenis sayuran secara langsung.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon-wrapper">
              <Lightbulb size={32} />
            </div>
            <h3 className="step-title">Temukan Fakta</h3>
            <p className="step-desc">
              Dapatkan fakta unik menarik dan edukatif yang dibuat oleh Generative AI lokal.
            </p>
          </div>
        </div>

        <div className="bottom-cta-box">
          <h3>Siap Mencoba VeggieLens?</h3>
          <p>Tanpa pendaftaran, langsung gunakan di browser Anda.</p>
          <button className="primary-cta-btn" onClick={onStart}>
            <span>Mulai Mengenali Sekarang</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
