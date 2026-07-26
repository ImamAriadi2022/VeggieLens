import { useEffect, useRef, useState, useCallback } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import PreScanSection from './components/PreScanSection';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG } from './utils/config';
import { translateVegetableName } from './utils/common';

function App() {
  const { state, actions } = useAppState();

  // Service instances persistent across renders (harus dideklarasikan paling atas)
  const cameraServiceRef = useRef(new CameraService());
  const detectionServiceRef = useRef(new DetectionService());
  const rootFactsServiceRef = useRef(new RootFactsService());

  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const isPredictingRef = useRef(false);
  const lastVegetableRef = useRef(null);
  const requestSeqRef = useRef(0);
  const [currentTone, setCurrentTone] = useState('normal');

  // Generate fun fact helper dengan proteksi race condition (sequence ID)
  const generateFunFactForVegetable = useCallback(async (vegRawLabel) => {
    const currentReqId = ++requestSeqRef.current;
    actions.setFunFactData(null);
    try {
      const fact = await rootFactsServiceRef.current.generateFacts(vegRawLabel);
      // Race condition protection: Pastikan hanya request terbaru yang memperbarui UI
      if (currentReqId === requestSeqRef.current) {
        if (fact) {
          actions.setFunFactData(fact);
        } else {
          actions.setFunFactData('error');
        }
      }
    } catch (error) {
      console.error('❌ Fact generation error:', error);
      if (currentReqId === requestSeqRef.current) {
        actions.setFunFactData('error');
      }
    }
  }, [actions]);

  // Manual retry handler for fun fact generation
  const handleRetryFact = () => {
    if (state.detectionResult && (state.detectionResult.rawLabel || state.detectionResult.className)) {
      const label = state.detectionResult.rawLabel || state.detectionResult.className;
      generateFunFactForVegetable(label);
    }
  };

  // Loop deteksi utama terkontrol FPS
  const startDetectionLoop = useCallback(() => {
    if (detectionCleanupRef.current) {
      clearInterval(detectionCleanupRef.current);
    }

    const fps = cameraServiceRef.current.fps || 30;
    const intervalMs = Math.max(100, Math.floor(1000 / fps));

    detectionCleanupRef.current = setInterval(async () => {
      if (!isRunningRef.current) return;
      if (!cameraServiceRef.current.isReady()) return;
      if (isPredictingRef.current) return;

      isPredictingRef.current = true;
      try {
        const result = await detectionServiceRef.current.predict(cameraServiceRef.current.video);
        if (!isRunningRef.current) return;

        if (result && result.isValid) {
          const threshold = APP_CONFIG.detectionConfidenceThreshold || 70;
          if (result.confidence >= threshold) {
            actions.setDetectionResult(result);
            actions.setAppState('result');

            // Gunakan canonical rawLabel untuk deduplikasi dan context AI
            const currentRawLabel = result.rawLabel || result.className;
            if (lastVegetableRef.current !== currentRawLabel) {
              lastVegetableRef.current = currentRawLabel;
              generateFunFactForVegetable(currentRawLabel);
            }
          }
        }
      } catch (err) {
        console.error('❌ Error in detection loop:', err);
      } finally {
        isPredictingRef.current = false;
      }
    }, intervalMs);
  }, [actions, generateFunFactForVegetable]);

  // Inisialisasi layanan deteksi, kamera, dan generator fakta saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;

    const initServices = async () => {
      try {
        actions.setModelStatus('Memuat Model AI...');
        actions.setServices({
          camera: cameraServiceRef.current,
          detector: detectionServiceRef.current,
          generator: rootFactsServiceRef.current
        });

        console.log('🚀 Inisialisasi DetectionService (TFJS)...');
        await detectionServiceRef.current.loadModel();
        if (!isMounted) return;

        console.log('📷 Deteksi peranti kamera...');
        await cameraServiceRef.current.loadCameras();
        if (!isMounted) return;

        actions.setModelStatus('Menyiapkan Generator Facts AI...');
        try {
          await rootFactsServiceRef.current.loadModel();
        } catch (genError) {
          console.warn('⚠️ Generative AI tidak dapat dimuat secara lokal, fallback ke mode dasar:', genError);
        }

        if (isMounted) {
          actions.setModelStatus('Model AI Siap');
        }
      } catch (err) {
        console.error('❌ Gagal menginisialisasi AI Services:', err);
        if (isMounted) {
          actions.setModelStatus('Gagal memuat model');
          actions.setError(err.message || 'Gagal memuat model AI');
        }
      }
    };

    initServices();

    // Bersihkan sumber daya saat komponen ditinggalkan
    return () => {
      isMounted = false;
      isRunningRef.current = false;
      if (detectionCleanupRef.current) {
        clearInterval(detectionCleanupRef.current);
      }
      cameraServiceRef.current.stopCamera();
    };
  }, [actions]);

  // User Flow Handlers
  const handleStartFlow = () => {
    actions.setError(null);
    actions.setCurrentView('prepare');
  };

  const handleNavigateHome = () => {
    // Comprehensive camera & loop cleanup when returning to landing
    isRunningRef.current = false;
    if (detectionCleanupRef.current) {
      clearInterval(detectionCleanupRef.current);
    }
    cameraServiceRef.current.stopCamera();
    actions.setRunning(false);
    actions.resetResults();
    lastVegetableRef.current = null;
    actions.setPermissionState('idle');
    actions.setCurrentView('landing');
  };

  const handleRequestPermission = async () => {
    try {
      actions.setError(null);
      actions.setPermissionState('prompting');
      await cameraServiceRef.current.startCamera('default');
      actions.setPermissionState('granted');
      actions.setCurrentView('scanner');
      actions.setRunning(true);
      actions.setAppState('analyzing');
      isRunningRef.current = true;
      startDetectionLoop();
    } catch (err) {
      console.error('❌ Gagal mendapatkan izin / mengaktifkan kamera:', err);
      actions.setPermissionState('denied');
      actions.setError('Akses kamera tidak diizinkan. Harap beri izin kamera pada browser Anda.');
      actions.setRunning(false);
    }
  };

  // Fungsi untuk mengontrol kamera di dalam Scanner Workspace
  const handleToggleCamera = async () => {
    if (state.isRunning) {
      // Stop Scan: Hentikan kamera dan loop, tetapi TETAP berada di Scanner Workspace
      isRunningRef.current = false;
      if (detectionCleanupRef.current) {
        clearInterval(detectionCleanupRef.current);
      }
      cameraServiceRef.current.stopCamera();
      actions.setRunning(false);
    } else {
      // Scan Lagi: Aktifkan kembali kamera di dalam Scanner Workspace
      try {
        actions.setError(null);
        await cameraServiceRef.current.startCamera('default');
        actions.setRunning(true);
        actions.setAppState('analyzing');
        isRunningRef.current = true;
        startDetectionLoop();
      } catch (err) {
        console.error('❌ Gagal mengaktifkan kamera kembali:', err);
        actions.setError(err.message || 'Gagal mengaktifkan kamera');
        actions.setRunning(false);
      }
    }
  };

  // Fungsi untuk mengubah nada fakta yang dihasilkan
  const handleToneChange = (newTone) => {
    setCurrentTone(newTone);
    rootFactsServiceRef.current.setTone(newTone);
    if (state.detectionResult && (state.detectionResult.rawLabel || state.detectionResult.className)) {
      const label = state.detectionResult.rawLabel || state.detectionResult.className;
      generateFunFactForVegetable(label);
    }
  };

  // Fungsi untuk menyalin fakta ke clipboard
  const handleCopyFact = async () => {
    if (!state.funFactData || state.funFactData === 'error') return;
    try {
      await navigator.clipboard.writeText(state.funFactData);
      alert('Fakta menarik berhasil disalin!');
    } catch (err) {
      console.error('❌ Gagal menyalin teks ke clipboard:', err);
      actions.setError('Gagal menyalin fakta ke clipboard.');
    }
  };

  return (
    <div className="app-layout">
      <Header
        modelStatus={state.modelStatus}
        currentView={state.currentView}
        onNavigateHome={handleNavigateHome}
        onStartScan={handleStartFlow}
      />

      <div className="app-container">
        {state.currentView === 'landing' && (
          <LandingPage onStart={handleStartFlow} />
        )}

        {state.currentView === 'prepare' && (
          <PreScanSection
            onRequestPermission={handleRequestPermission}
            onBack={handleNavigateHome}
            error={state.error}
            permissionState={state.permissionState}
            isModelReady={state.modelStatus === 'Model AI Siap'}
          />
        )}

        {state.currentView === 'scanner' && (
          <main className="main-content view-transition">
            <CameraSection
              isRunning={state.isRunning}
              onToggleCamera={handleToggleCamera}
              onToneChange={handleToneChange}
              services={state.services}
              modelStatus={state.modelStatus}
              error={state.error}
              currentTone={currentTone}
            />

            <InfoPanel
              appState={state.appState}
              detectionResult={state.detectionResult}
              funFactData={state.funFactData}
              error={state.error}
              onCopyFact={handleCopyFact}
              onRetryFact={handleRetryFact}
            />
          </main>
        )}

        <footer className="footer">
          <p>VeggieLens &copy; 2026 &bull; See it. Know it.</p>
        </footer>
      </div>

      {state.error && state.currentView === 'scanner' && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
