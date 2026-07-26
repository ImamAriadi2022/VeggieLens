import { useEffect, useRef, useState, useCallback } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG } from './utils/config';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const isPredictingRef = useRef(false);
  const lastVegetableRef = useRef(null);
  const [currentTone, setCurrentTone] = useState('normal');

  // Service instances persistent across renders
  const cameraServiceRef = useRef(new CameraService());
  const detectionServiceRef = useRef(new DetectionService());
  const rootFactsServiceRef = useRef(new RootFactsService());

  // Generate fun fact helper
  const generateFunFactForVegetable = useCallback(async (vegName) => {
    actions.setFunFactData(null);
    try {
      if (rootFactsServiceRef.current.isReady()) {
        const fact = await rootFactsServiceRef.current.generateFacts(vegName);
        if (fact) {
          actions.setFunFactData(fact);
        } else {
          actions.setFunFactData(`Fact: ${vegName} is a delicious and healthy vegetable rich in nutrients!`);
        }
      } else {
        actions.setFunFactData(`Fact: ${vegName} is rich in vitamins, minerals, and antioxidants essential for health!`);
      }
    } catch (error) {
      console.error('❌ Fact generation error:', error);
      actions.setFunFactData('error');
    }
  }, [actions]);

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

            if (lastVegetableRef.current !== result.className) {
              lastVegetableRef.current = result.className;
              generateFunFactForVegetable(result.className);
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

  // Fungsi untuk memulai dan menghentikan kamera
  const handleToggleCamera = async () => {
    if (state.isRunning) {
      isRunningRef.current = false;
      if (detectionCleanupRef.current) {
        clearInterval(detectionCleanupRef.current);
      }
      cameraServiceRef.current.stopCamera();
      actions.setRunning(false);
      actions.resetResults();
      lastVegetableRef.current = null;
    } else {
      try {
        actions.setError(null);
        await cameraServiceRef.current.startCamera('default');
        actions.setRunning(true);
        actions.setAppState('analyzing');
        isRunningRef.current = true;
        startDetectionLoop();
      } catch (err) {
        console.error('❌ Gagal mengaktifkan kamera:', err);
        actions.setError(err.message || 'Gagal mengaktifkan kamera');
        actions.setRunning(false);
      }
    }
  };

  // Fungsi untuk mengubah nada fakta yang dihasilkan
  const handleToneChange = (newTone) => {
    setCurrentTone(newTone);
    rootFactsServiceRef.current.setTone(newTone);
    if (state.detectionResult && state.detectionResult.className) {
      generateFunFactForVegetable(state.detectionResult.className);
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
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
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
        />
      </main>

      <footer className="footer">
        <p>VeggieLens &copy; 2026 &bull; See it. Know it.</p>
      </footer>

      {state.error && (
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
