import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { VEGETABLE_ALIASES } from '../utils/common.js';

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

  // Prompt utama sesuai rekomendasi resmi reviewer Dicoding:
  // "describe vegetable ${vegetable} in ${tone} way with one sentence"
  getPrompt(vegetableName) {
    const canonicalName = vegetableName || 'vegetable';
    const toneStyle = this.currentTone || 'normal';
    return `describe vegetable ${canonicalName} in ${toneStyle} way with one sentence`;
  }

  // Prompt retry yang lebih ketat jika generasi pertama gagal validasi
  getRetryPrompt(vegetableName) {
    const canonicalName = vegetableName || 'vegetable';
    return `write exactly one factual sentence about vegetable ${canonicalName}`;
  }

  // Validasi relevansi & integritas output Generative AI
  validateFactOutput(text, vegetableName) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 12) return false;

    const lower = clean.toLowerCase();

    // 1. Saring frasa refusal / disclaimers AI
    const refusalPatterns = [
      'cannot perform',
      'against my programming',
      'propaganda',
      'biased language',
      'as an ai',
      'i am an ai',
      'i cannot',
      'i can\'t',
      'unable to',
      'describe vegetable',
      'tuliskan fakta'
    ];

    for (const pattern of refusalPatterns) {
      if (lower.includes(pattern)) {
        return false;
      }
    }

    // 2. Saring pengulangan prompt persis
    if (lower.startsWith('describe vegetable') || lower.startsWith('write exactly one')) {
      return false;
    }

    // 3. Relevance check: Periksa apakah output berkaitan dengan objek sayuran yang dideteksi
    const vegKey = vegetableName.toLowerCase().trim();
    const aliases = VEGETABLE_ALIASES[vegKey] || [vegKey, 'vegetable', 'plant', 'food'];

    const hasRelevance = aliases.some((alias) => lower.includes(alias.toLowerCase()));
    if (!hasRelevance) {
      console.warn(`⚠️ Relevance validation failed for "${vegetableName}". Text: "${clean}"`);
      return false;
    }

    return true;
  }

  // Lakukan generasi fakta menarik secara dinamis menggunakan Transformers.js
  async generateFacts(vegetableName) {
    if (!this.isReady()) {
      return null;
    }

    if (this.isGenerating) {
      return null;
    }

    this.isGenerating = true;

    // Generation parameters sesuai petunjuk resmi reviewer Dicoding:
    // temperature: 0.1, top_p: 0.9, do_sample: false, max_new_tokens: 50
    const genParams = {
      max_new_tokens: 50,
      temperature: 0.1,
      top_p: 0.9,
      do_sample: false
    };

    try {
      // --- GENERATION 1 ---
      const prompt1 = this.getPrompt(vegetableName);
      console.log(`🤖 [Gen 1] Prompt for "${vegetableName}" (${this.currentTone}): "${prompt1}"`);

      const result1 = await this.generator(prompt1, genParams);

      if (Array.isArray(result1) && result1[0] && result1[0].generated_text) {
        const text1 = result1[0].generated_text.trim();
        if (this.validateFactOutput(text1, vegetableName)) {
          console.log(`✅ [Gen 1] Valid output for "${vegetableName}": "${text1}"`);
          this.isGenerating = false;
          return text1;
        }
      }

      // --- AUTOMATIC RETRY 1 (Prompt lebih ketat) ---
      console.warn(`⚠️ [Gen 1] Invalid/off-topic output for "${vegetableName}". Executing automatic retry...`);
      const retryPrompt = this.getRetryPrompt(vegetableName);
      console.log(`🤖 [Retry 1] Prompt: "${retryPrompt}"`);

      const result2 = await this.generator(retryPrompt, genParams);

      if (Array.isArray(result2) && result2[0] && result2[0].generated_text) {
        const text2 = result2[0].generated_text.trim();
        if (this.validateFactOutput(text2, vegetableName)) {
          console.log(`✅ [Retry 1] Valid output for "${vegetableName}": "${text2}"`);
          this.isGenerating = false;
          return text2;
        }
      }

      console.error(`❌ Both Generation 1 and Retry 1 failed validation for "${vegetableName}".`);
      this.isGenerating = false;
      return null;
    } catch (error) {
      console.error('❌ Error during Transformers.js fact generation:', error);
      this.isGenerating = false;
      return null;
    }
  }

  // Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return Boolean(this.isModelLoaded && this.generator !== null);
  }
}
