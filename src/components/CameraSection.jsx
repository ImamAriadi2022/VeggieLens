import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, ScanLine, Sliders } from 'lucide-react';
import { TONE_CONFIG } from '../utils/config';

function CameraSection({
  isRunning,
  onToggleCamera,
  onToneChange,
  services,
  modelStatus,
  error,
  currentTone
}) {
  const [fps, setFps] = useState(30);
  const [cameraType, setCameraType] = useState('default');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const isModelReady = modelStatus === 'Model AI Siap';
  const buttonDisabled = !isModelReady;
  const buttonText = isRunning ? 'Hentikan Scan' : 'Scan Lagi';

  return (
    <section className="camera-section" aria-label="Camera Feed and Controls">
      <div className="workspace-header">
        <h2 className="workspace-title">Kenali Sayuran</h2>
        <p className="workspace-subtitle">
          Arahkan kamera ke sayuran untuk mengidentifikasi dan mendapatkan fakta AI secara langsung.
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
            className={isRunning ? '' : 'hidden'}
          />

          <canvas
            ref={canvasRef}
            id="media-canvas"
            className="hidden"
          />

          <div className={`camera-overlay ${isRunning ? 'active' : ''}`}>
            <div className="overlay-frame"></div>
          </div>

          {!isRunning && (
            <div className="camera-placeholder">
              <div className="camera-placeholder-icon">
                <Camera size={44} />
              </div>
              <p className="placeholder-title">Kamera Dihentikan</p>
              <p className="placeholder-desc">Klik tombol &quot;Scan Lagi&quot; di bawah untuk mengaktifkan kembali kamera.</p>
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
            onClick={onToggleCamera}
            disabled={buttonDisabled}
            aria-label={buttonText}
            style={{ opacity: buttonDisabled ? 0.6 : 1 }}
          >
            <ScanLine size={20} />
            <span>{buttonText}</span>
          </button>
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
