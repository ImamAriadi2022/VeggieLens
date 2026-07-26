import { getCameraErrorMessage } from '../utils/common.js';

export class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.cameras = [];
    this.selectedDeviceId = 'default';
    this.fps = 30;
  }

  setVideoElement(videoElement) {
    this.video = videoElement;
  }

  setCanvasElement(canvasElement) {
    this.canvas = canvasElement;
  }

  // Tambahkan konfigurasi kamera untuk mendapatkan daftar perangkat input video
  async loadCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras = devices.filter((device) => device.kind === 'videoinput');
      return this.cameras;
    } catch (error) {
      console.warn('⚠️ Gagal mendapatkan daftar kamera:', error);
      return [];
    }
  }

  // Memulai kamera dengan perangkat yang dipilih dan menampilkan pada elemen video
  async startCamera(selectedCameraId = 'default') {
    this.selectedDeviceId = selectedCameraId;

    if (this.isActive()) {
      this.stopCamera();
    }

    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    if (selectedCameraId === 'front') {
      constraints.video.facingMode = 'user';
    } else if (selectedCameraId === 'back' || selectedCameraId === 'default') {
      constraints.video.facingMode = { ideal: 'environment' };
    } else if (selectedCameraId) {
      constraints.video.deviceId = { exact: selectedCameraId };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (firstErr) {
      console.warn('⚠️ getUserMedia awal gagal, mencoba fallback constraints:', firstErr);
      try {
        const fallbackConstraints = {
          video: selectedCameraId === 'front' ? { facingMode: 'user' } : { facingMode: 'environment' }
        };
        this.stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      } catch (secondErr) {
        console.warn('⚠️ Fallback facingMode gagal, mencoba basic video constraints:', secondErr);
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (finalErr) {
          const errorMsg = getCameraErrorMessage(finalErr);
          throw new Error(errorMsg);
        }
      }
    }

    if (this.video && this.stream) {
      this.video.srcObject = this.stream;
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(resolve).catch(resolve);
        };
      });
    }

    return this.stream;
  }

  // Menghentikan siaran kamera dan membersihkan sumber daya
  stopCamera() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      tracks.forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // Implementasikan metode untuk mengatur FPS kamera
  setFPS(fps) {
    this.fps = Number(fps) || 30;
  }

  // Periksa apakah kamera sedang aktif
  isActive() {
    if (!this.stream) return false;
    return this.stream.active && this.stream.getVideoTracks().some((track) => track.readyState === 'live');
  }

  // Periksa apakah elemen video siap untuk digunakan
  isReady() {
    return Boolean(this.video && this.video.readyState >= 2 && this.isActive());
  }
}