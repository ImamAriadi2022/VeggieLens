import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, ScanLine, Sliders, Image as ImageIcon, Upload } from 'lucide-react';
import { TONE_CONFIG } from '../utils/config';

function CameraSection({
  isRunning,
  onToggleCamera,
  onToneChange,
  onScanSampleImage,
  services,
  modelStatus,
  error,
  currentTone
}) {
  const [fps, setFps] = useState(30);
  const [cameraType, setCameraType] = useState('default');
  const [sampleUrl, setSampleUrl] = useState(null);
  const [activeSampleKey, setActiveSampleKey] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sampleImgRef = useRef(null);

  useEffect(() => {
    if (services.camera) {
      if (videoRef.current && !services.camera.video) {
        services.camera.setVideoElement(videoRef.current);
      }
      if (canvasRef.current && !services.camera.canvas) {
        services.camera.setCanvasElement(canvasRef.current);
      }
    }
  });

  useEffect(() => {
    if (services.camera) {
      services.camera.setFPS(fps);
    }
  }, [fps, services.camera]);

  const handleCameraChange = (newCameraType) => {
    setCameraType(newCameraType);
    if (services.camera && services.camera.isActive()) {
      services.camera.startCamera(newCameraType);
    }
  };

  const handleFpsChange = (newFps) => {
    setFps(Number(newFps));
  };

  const handleToneChange = (e) => {
    const newTone = e.target.value;
    if (onToneChange) {
      onToneChange(newTone);
    }
  };

  const handleSelectSample = (url, key) => {
    if (isRunning) {
      onToggleCamera(); // Stop camera live stream if running
    }
    setSampleUrl(url);
    setActiveSampleKey(key);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (isRunning) {
        onToggleCamera();
      }
      const objectUrl = URL.createObjectURL(file);
      setSampleUrl(objectUrl);
      setActiveSampleKey('custom');
    }
  };

  const handleSampleImgLoad = () => {
    if (sampleImgRef.current && onScanSampleImage) {
      onScanSampleImage(sampleImgRef.current);
    }
  };

  const isModelReady = modelStatus === 'Model AI Siap';
  const buttonDisabled = !isModelReady;
  const buttonText = isRunning ? 'Hentikan Scan' : 'Scan Lagi';

  return (
    <section className="camera-section" aria-label="Camera Feed and Controls">
      <div className="workspace-header">
        <h2 className="workspace-title">Kenali Sayuran</h2>
        <p className="workspace-subtitle">
          Arahkan kamera ke sayuran atau pilih gambar sample di bawah untuk mengidentifikasi dan mendapatkan fakta AI.
        </p>
      </div>

      <div className="camera-container">
        <div className="camera-wrapper">
          <video
            ref={videoRef}
            id="media-video"
            autoPlay
            muted
            playsInline
            className={isRunning && !sampleUrl ? '' : 'hidden'}
          />

          <canvas
            ref={canvasRef}
            id="media-canvas"
            className="hidden"
          />

          {sampleUrl && !isRunning && (
            <img
              ref={sampleImgRef}
              src={sampleUrl}
              alt="Sample Sayuran"
              onLoad={handleSampleImgLoad}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)'
              }}
            />
          )}

          <div className={`camera-overlay ${isRunning ? 'active' : ''}`}>
            <div className="overlay-frame"></div>
          </div>

          {!isRunning && !sampleUrl && (
            <div className="camera-placeholder">
              <div className="camera-placeholder-icon">
                <Camera size={44} />
              </div>
              <p className="placeholder-title">Kamera Dihentikan</p>
              <p className="placeholder-desc">Klik tombol &quot;Scan Lagi&quot; atau pilih gambar sample di bawah.</p>
              {error && (
                <p className="camera-error-text">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="camera-controls">
          <button
            id="btn-toggle"
            className={`capture-btn ${isRunning ? 'scanning' : ''}`}
            onClick={() => {
              setSampleUrl(null);
              setActiveSampleKey(null);
              onToggleCamera();
            }}
            disabled={buttonDisabled}
            aria-label={buttonText}
            style={{ opacity: buttonDisabled ? 0.6 : 1 }}
          >
            <ScanLine size={20} />
            <span>{buttonText}</span>
          </button>
        </div>

        {/* Sample Images & Upload Testing Panel */}
        <div className="sample-test-panel" style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            <ImageIcon size={16} style={{ color: 'var(--primary)' }} />
            <span>Uji dengan Gambar Sample (Tanpa Kamera)</span>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => handleSelectSample('/test-input/carrot.png', 'carrot')}
              disabled={buttonDisabled}
              style={{
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                background: activeSampleKey === 'carrot' ? 'var(--primary-light)' : 'transparent',
                borderColor: activeSampleKey === 'carrot' ? 'var(--primary)' : 'var(--border-medium)',
                color: activeSampleKey === 'carrot' ? 'var(--primary-dark)' : 'var(--text-secondary)'
              }}
            >
              🥕 Wortel (Carrot)
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => handleSelectSample('/test-input/corn.png', 'corn')}
              disabled={buttonDisabled}
              style={{
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                background: activeSampleKey === 'corn' ? 'var(--primary-light)' : 'transparent',
                borderColor: activeSampleKey === 'corn' ? 'var(--primary)' : 'var(--border-medium)',
                color: activeSampleKey === 'corn' ? 'var(--primary-dark)' : 'var(--text-secondary)'
              }}
            >
              🌽 Jagung (Corn)
            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => handleSelectSample('/test-input/spinach.png', 'spinach')}
              disabled={buttonDisabled}
              style={{
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                background: activeSampleKey === 'spinach' ? 'var(--primary-light)' : 'transparent',
                borderColor: activeSampleKey === 'spinach' ? 'var(--primary)' : 'var(--border-medium)',
                color: activeSampleKey === 'spinach' ? 'var(--primary-dark)' : 'var(--text-secondary)'
              }}
            >
              🥬 Bayam (Spinach)
            </button>

            <label
              className="secondary-btn"
              style={{
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: activeSampleKey === 'custom' ? 'var(--primary-light)' : 'transparent',
                borderColor: activeSampleKey === 'custom' ? 'var(--primary)' : 'var(--border-medium)'
              }}
            >
              <Upload size={14} />
              <span>Upload Gambar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={buttonDisabled}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="settings-panel">
          <h3 className="settings-title">Pengaturan</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="camera-select" className="setting-label">
                <Camera size={15} />
                <span>Kamera</span>
              </label>
              <select
                id="camera-select"
                value={cameraType}
                onChange={(e) => handleCameraChange(e.target.value)}
                disabled={isRunning}
              >
                <option value="default">Kamera Belakang</option>
                <option value="front">Kamera Depan</option>
              </select>
            </div>

            <div className="setting-item fps-setting">
              <label htmlFor="fps-slider" className="setting-label">
                <Sliders size={15} />
                <span>Kecepatan (<span id="fps-label">{fps} FPS</span>)</span>
              </label>
              <div className="slider-wrapper">
                <input
                  id="fps-slider"
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={fps}
                  onChange={(e) => handleFpsChange(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="setting-item tone-setting">
              <label htmlFor="tone-select" className="setting-label">
                <Mic size={15} />
                <span>Gaya Bahasa</span>
              </label>
              <select
                id="tone-select"
                value={currentTone || 'normal'}
                onChange={handleToneChange}
                disabled={isRunning}
              >
                {TONE_CONFIG.availableTones.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CameraSection;
