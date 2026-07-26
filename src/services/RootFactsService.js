import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';

// Configure transformers environment for browser cache & webgpu/wasm execution
env.allowLocalModels = false;
env.useBrowserCache = true;

export class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = TONE_CONFIG.defaultTone;
  }

  // Muat model dan inisialisasi pipeline text2text-generation
  // Implementasikan strategi Backend Adaptive
  async loadModel() {
    try {
      console.log('🔄 Memuat Transformers.js model (LaMini-Flan-T5-77M q4)...');

      this.generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M', {
        dtype: 'q4',
        progress_callback: (progressInfo) => {
          if (progressInfo.status === 'progress') {
            console.log(`📥 Progress unduh model AI: ${Math.round(progressInfo.progress || 0)}%`);
          }
        }
      });

      this.isModelLoaded = true;
      console.log('✅ Transformers.js model berhasil dimuat!');
      return true;
    } catch (error) {
      console.warn('⚠️ Gagal memuat Transformers.js model secara lokal:', error);
      // fallback status jika offline/terbatas
      this.isModelLoaded = false;
      throw error;
    }
  }

  // Konfigurasi tone fakta yang dihasilkan
  setTone(tone) {
    const validTones = TONE_CONFIG.availableTones.map((t) => t.value);
    if (validTones.includes(tone)) {
      this.currentTone = tone;
      console.log('🎭 Tone generator diperbarui:', tone);
    }
  }

  // Generate prompt berdasarkan tone yang dipilih
  getPrompt(vegetableName) {
    const name = vegetableName || 'vegetables';
    switch (this.currentTone) {
    case 'funny':
      return `Tell me a funny, silly, and entertaining fun fact about ${name}.`;
    case 'professional':
      return `Provide a concise, scientific, and educational fact about ${name}.`;
    case 'casual':
      return `Tell me a casual, simple, and friendly fun fact about ${name}.`;
    case 'normal':
    default:
      return `Tell me an interesting and unique fact about ${name}.`;
    }
  }

  // Lakukan prediksi pada elemen gambar/label yang diberikan dan kembalikan hasilnya
  // Konfigurasikan parameter generasi berdasarkan kebutuhan (max_new_tokens <= 150)
  async generateFacts(vegetableName) {
    if (!this.isReady()) {
      throw new Error('Generator AI belum siap.');
    }

    if (this.isGenerating) {
      return null;
    }

    this.isGenerating = true;
    try {
      const prompt = this.getPrompt(vegetableName);
      console.log(`🤖 Generating facts for "${vegetableName}" with tone "${this.currentTone}"...`);

      const result = await this.generator(prompt, {
        max_new_tokens: 120,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      });

      this.isGenerating = false;

      if (Array.isArray(result) && result[0] && result[0].generated_text) {
        const text = result[0].generated_text.trim();
        return text;
      }

      return `Fact: ${vegetableName} is full of vitamins and nutrients essential for health!`;
    } catch (error) {
      this.isGenerating = false;
      console.error('❌ Gagal menghasilkan fakta unik:', error);
      throw error;
    }
  }

  // Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return Boolean(this.isModelLoaded && this.generator !== null);
  }
}
