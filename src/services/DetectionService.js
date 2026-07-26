import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

export class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
    this.backend = null;
    this.imageSize = 224;
  }

  // Muat model dan metadata secara bersamaan, lalu simpan ke instance
  // Implementasikan strategi Backend Adaptive
  async loadModel() {
    try {
      console.log('🔄 Memulai inisialisasi TensorFlow.js backend...');

      // Adaptive backend: WebGPU -> WebGL -> CPU
      let backendLoaded = false;
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try {
          console.log('⚡ Mencoba backend WebGPU...');
          await tf.setBackend('webgpu');
          await tf.ready();
          this.backend = 'webgpu';
          backendLoaded = true;
          console.log('✅ Backend WebGPU berhasil diinisialisasi');
        } catch (gpuErr) {
          console.warn('⚠️ WebGPU gagal, fallback ke WebGL:', gpuErr);
        }
      }

      if (!backendLoaded) {
        try {
          console.log('🌐 Mencoba backend WebGL...');
          await tf.setBackend('webgl');
          await tf.ready();
          this.backend = 'webgl';
          backendLoaded = true;
          console.log('✅ Backend WebGL berhasil diinisialisasi');
        } catch (webglErr) {
          console.warn('⚠️ WebGL gagal, fallback ke CPU:', webglErr);
          await tf.setBackend('cpu');
          await tf.ready();
          this.backend = 'cpu';
          console.log('✅ Backend CPU diaktifkan');
        }
      }

      console.log('📦 Memuat model & metadata sayuran...');
      const [model, metadataRes] = await Promise.all([
        tf.loadLayersModel('/model/model.json'),
        fetch('/model/metadata.json').then((res) => {
          if (!res.ok) throw new Error('Gagal mengunduh metadata.json');
          return res.json();
        })
      ]);

      this.model = model;
      if (metadataRes && Array.isArray(metadataRes.labels)) {
        this.labels = metadataRes.labels;
      }
      if (metadataRes && metadataRes.imageSize) {
        this.imageSize = metadataRes.imageSize;
      }

      console.log('✅ Model TensorFlow.js & metadata berhasil dimuat. Label:', this.labels);
      return true;
    } catch (error) {
      console.error('❌ Gagal memuat DetectionService model:', error);
      throw error;
    }
  }

  // Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  async predict(imageElement) {
    if (!this.isLoaded() || !imageElement) {
      return null;
    }

    try {
      // Menggunakan tf.tidy untuk mencegah tensor memory leak
      const result = tf.tidy(() => {
        let tensor = tf.browser.fromPixels(imageElement);
        tensor = tf.image.resizeBilinear(tensor, [this.imageSize, this.imageSize]);
        const normalized = tensor.toFloat().div(tf.scalar(255.0)).expandDims(0);

        const predictionTensor = this.model.predict(normalized);
        const scores = predictionTensor.dataSync();
        return scores;
      });

      let maxScore = -1;
      let maxIndex = 0;

      for (let i = 0; i < result.length; i++) {
        if (result[i] > maxScore) {
          maxScore = result[i];
          maxIndex = i;
        }
      }

      const rawLabel = this.labels[maxIndex] || 'Unknown';
      // Format display label e.g., 'eggplant' -> 'Eggplant'
      const className = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      const confidencePercentage = Math.round(maxScore * 100);

      return {
        className,
        rawLabel,
        score: maxScore,
        confidence: confidencePercentage,
        isValid: true
      };
    } catch (error) {
      console.error('❌ Gagal melakukan prediksi:', error);
      return null;
    }
  }

  // Periksa apakah model sudah dimuat dan siap digunakan
  isLoaded() {
    return Boolean(this.model && this.labels.length > 0);
  }
}
