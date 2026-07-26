import { pipeline, env } from '@huggingface/transformers';
import { TONE_CONFIG } from '../utils/config.js';
import { VEGETABLE_ALIASES } from '../utils/common.js';

// Configure transformers environment for browser cache & webgpu/wasm execution
env.allowLocalModels = false;
env.useBrowserCache = true;

// Helper: Bersihkan output teks mentah dari model AI
export const cleanGeneratedText = (text, prompt) => {
  if (!text || typeof text !== 'string') return '';
  let clean = text.trim();

  // Jika output diawali oleh prompt, bersihkan prefix prompt tersebut
  if (prompt && clean.toLowerCase().startsWith(prompt.toLowerCase())) {
    clean = clean.slice(prompt.length).trim();
  }

  // Bersihkan spasi/baris baru berlebih
  clean = clean.replace(/\s+/g, ' ');

  // Pastikan kalimat memiliki tanda baca penutup di akhir
  if (clean && !/[.!?]$/.test(clean)) {
    clean = `${clean}.`;
  }

  return clean;
};

// Helper: Deteksi pengulangan kata / frasa abnormal
export const hasAbnormalRepetition = (text) => {
  if (!text) return false;
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  // 1. Deteksi kata berulang berurutan (misal "soybean soybean")
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 2) {
      return true;
    }
  }

  // 2. Deteksi pengulangan 2-gram (misal "is a is a")
  for (let i = 0; i < words.length - 3; i++) {
    const p1 = `${words[i]} ${words[i + 1]}`;
    const p2 = `${words[i + 2]} ${words[i + 3]}`;
    if (p1 === p2) {
      return true;
    }
  }

  // 3. Deteksi frekuensi token abnormal
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
    if (words.length >= 8 && freq[w] >= Math.ceil(words.length * 0.35) && !['and', 'the', 'a', 'is', 'are', 'in', 'to', 'of', 'with', 'for'].includes(w)) {
      return true;
    }
  }

  return false;
};

// Helper: Memastikan kalimat selesai dan tidak menggantung
export const isSentenceComplete = (text) => {
  if (!text || text.length < 15) return false;
  const clean = text.trim();

  // Kata sambung/preposisi/kata kerja pembantu yang menggantung di akhir kata
  const danglingEndings = [
    'and', 'or', 'that', 'which', 'to', 'can', 'is', 'are', 'with', 'for', 'of', 'in', 'on', 'at', 'by', 'as', 'be', 'been', 'being', 'have', 'has', 'had', 'the', 'a', 'an', 'its', 'their', 'also', 'such'
  ];

  const words = clean.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().split(/\s+/);
  const lastWord = words[words.length - 1];

  if (danglingEndings.includes(lastWord)) {
    return false;
  }

  return true;
};

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

  // Prompt utama sesuai rekomendasi eksplisit reviewer Dicoding:
  // "describe vegetable ${vegetable} in ${tone} way with one sentence"
  getPrompt(vegetableName) {
    const canonicalName = vegetableName || 'vegetable';
    const toneMap = {
      normal: 'informative',
      funny: 'funny',
      professional: 'professional',
      casual: 'casual'
    };
    const toneStyle = toneMap[this.currentTone] || 'informative';
    return `describe vegetable ${canonicalName} in ${toneStyle} way with one sentence`;
  }

  // Prompt retry yang lebih tegas jika generasi pertama tidak lolos validasi
  getRetryPrompt(vegetableName) {
    const canonicalName = vegetableName || 'vegetable';
    return `write one complete factual sentence about vegetable ${canonicalName}`;
  }

  // Validasi kualitas, relevansi & integritas output Generative AI
  validateFactOutput(text, vegetableName) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length < 15) return false;

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

    // 2. Deteksi pengulangan kata/frasa abnormal
    if (hasAbnormalRepetition(clean)) {
      console.warn(`⚠️ Repetition detected in AI output for "${vegetableName}": "${clean}"`);
      return false;
    }

    // 3. Memastikan kalimat selesai dan tidak terpotong menggantung
    if (!isSentenceComplete(clean)) {
      console.warn(`⚠️ Incomplete/truncated sentence detected for "${vegetableName}": "${clean}"`);
      return false;
    }

    // 4. Relevance check: Periksa apakah output berkaitan dengan objek sayuran yang dideteksi
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

    // Generation parameters yang dikalibrasi sesuai petunjuk resmi reviewer Dicoding:
    // max_new_tokens: 65, temperature: 0.1, top_p: 0.9, do_sample: false, repetition_penalty: 1.2
    const genParams = {
      max_new_tokens: 65,
      temperature: 0.1,
      top_p: 0.9,
      do_sample: false,
      repetition_penalty: 1.2
    };

    try {
      // --- GENERATION 1 ---
      const prompt1 = this.getPrompt(vegetableName);
      console.log(`🤖 [Gen 1] Prompt for "${vegetableName}" (${this.currentTone}): "${prompt1}"`);

      const result1 = await this.generator(prompt1, genParams);

      if (Array.isArray(result1) && result1[0] && result1[0].generated_text) {
        const text1 = cleanGeneratedText(result1[0].generated_text, prompt1);
        if (this.validateFactOutput(text1, vegetableName)) {
          console.log(`✅ [Gen 1] Valid output for "${vegetableName}": "${text1}"`);
          this.isGenerating = false;
          return text1;
        }
      }

      // --- AUTOMATIC RETRY 1 (Prompt lebih ketat) ---
      console.warn(`⚠️ [Gen 1] Invalid/incomplete output for "${vegetableName}". Executing automatic retry...`);
      const retryPrompt = this.getRetryPrompt(vegetableName);
      console.log(`🤖 [Retry 1] Prompt: "${retryPrompt}"`);

      const result2 = await this.generator(retryPrompt, genParams);

      if (Array.isArray(result2) && result2[0] && result2[0].generated_text) {
        const text2 = cleanGeneratedText(result2[0].generated_text, retryPrompt);
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
