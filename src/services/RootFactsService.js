import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { getIndonesianFunFact, translateVegetableName } from '../utils/common.js';

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

  // Generate prompt terarah secara dinamis sesuai nama sayuran dan tone
  getPrompt(vegetableName) {
    const name = translateVegetableName(vegetableName);
    switch (this.currentTone) {
    case 'funny':
      return `Write one short, playful, and funny fun fact about ${name}. Keep it under 2 sentences.`;
    case 'professional':
      return `Write one concise, educational, and scientific fact about ${name}. Keep it under 2 sentences.`;
    case 'casual':
      return `Write one short, friendly, and simple fun fact about ${name}. Keep it under 2 sentences.`;
    case 'normal':
    default:
      return `Write one short, interesting factual fun fact about ${name}. Keep it under 2 sentences.`;
    }
  }

  // Validasi output Generative AI untuk menyaring teks yang tidak relevan/refusal
  validateFactOutput(text, vegetableName) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 15) return false;

    const lower = clean.toLowerCase();

    // Saring boilerplate refusal atau model disclaimers
    const refusalPatterns = [
      'cannot perform',
      'against my programming',
      'propaganda',
      'biased language',
      'as an ai',
      'i am an ai',
      'i cannot',
      'write one short',
      'tuliskan fakta'
    ];

    for (const pattern of refusalPatterns) {
      if (lower.includes(pattern)) {
        return false;
      }
    }

    return true;
  }

  // Lakukan generasi fakta menarik secara dinamis
  async generateFacts(vegetableName) {
    const indonesianFallback = getIndonesianFunFact(vegetableName, this.currentTone);

    if (this.isGenerating) {
      return indonesianFallback;
    }

    this.isGenerating = true;
    try {
      if (this.isReady()) {
        const prompt = this.getPrompt(vegetableName);
        console.log(`🤖 Generating facts for "${vegetableName}" with tone "${this.currentTone}"...`);

        const result = await this.generator(prompt, {
          max_new_tokens: 60,
          temperature: 0.6,
          top_p: 0.9,
          do_sample: true
        });

        if (Array.isArray(result) && result[0] && result[0].generated_text) {
          const rawText = result[0].generated_text.trim();
          if (this.validateFactOutput(rawText, vegetableName)) {
            this.isGenerating = false;
            return rawText;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Generative AI error, fallback ke fakta terverifikasi:', error);
    } finally {
      this.isGenerating = false;
    }

    return indonesianFallback;
  }

  // Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return Boolean(this.isModelLoaded && this.generator !== null);
  }
}
