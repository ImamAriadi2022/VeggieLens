import { pipeline, env } from '@huggingface/transformers';
import { VEGETABLE_ALIASES } from '../src/utils/common.js';

env.allowLocalModels = false;
env.useBrowserCache = false;

const testVegetables = ['Carrot', 'Soybean', 'Potato', 'Spinach', 'Cucumber'];
const testTones = ['normal', 'funny', 'professional', 'casual'];

const cleanGeneratedText = (text, prompt) => {
  if (!text || typeof text !== 'string') return '';
  let clean = text.trim();

  // If generated text includes the prompt, remove prompt prefix
  if (prompt && clean.toLowerCase().startsWith(prompt.toLowerCase())) {
    clean = clean.slice(prompt.length).trim();
  }

  // Remove duplicate spaces
  clean = clean.replace(/\s+/g, ' ');

  return clean;
};

const hasAbnormalRepetition = (text) => {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  // 1. Consecutive word repetition (e.g. "soybean soybean")
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 2) {
      return true;
    }
  }

  // 2. 2-gram phrase repetition (e.g. "is a is a")
  for (let i = 0; i < words.length - 3; i++) {
    const p1 = `${words[i]} ${words[i + 1]}`;
    const p2 = `${words[i + 2]} ${words[i + 3]}`;
    if (p1 === p2) {
      return true;
    }
  }

  // 3. Excessive single word frequency (e.g., word appears more than 35% of total tokens if tokens >= 8)
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
    if (words.length >= 8 && freq[w] >= Math.ceil(words.length * 0.35) && w !== 'and' && w !== 'the' && w !== 'a' && w !== 'is' && w !== 'are' && w !== 'in' && w !== 'to' && w !== 'of') {
      return true;
    }
  }

  return false;
};

const isSentenceComplete = (text) => {
  if (!text || text.length < 15) return false;
  const clean = text.trim();

  // Dangling conjunctions / prepositions / verbs at the end indicate truncation
  const danglingEndings = [
    'and', 'or', 'that', 'which', 'to', 'can', 'is', 'are', 'with', 'for', 'of', 'in', 'on', 'at', 'by', 'as', 'be', 'been', 'being', 'have', 'has', 'had', 'the', 'a', 'an', 'its', 'their', 'also', 'such'
  ];

  const words = clean.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().split(/\s+/);
  const lastWord = words[words.length - 1];

  if (danglingEndings.includes(lastWord)) {
    return false;
  }

  // If text has punctuation at end (. ! ?), or ends with a complete noun/adjective
  return true;
};

const validateGeneratedFact = (text, vegetableName) => {
  if (!text || typeof text !== 'string') return false;
  const clean = text.trim();
  if (clean.length < 15) return false;

  const lower = clean.toLowerCase();

  // 1. Refusal check
  const refusalPatterns = [
    'cannot perform', 'against my programming', 'propaganda', 'biased language',
    'as an ai', 'i am an ai', 'i cannot', 'i can\'t', 'unable to', 'describe vegetable'
  ];
  for (const p of refusalPatterns) {
    if (lower.includes(p)) return false;
  }

  // 2. Repetition check
  if (hasAbnormalRepetition(clean)) {
    console.warn(`⚠️ Repetition detected in: "${clean}"`);
    return false;
  }

  // 3. Sentence completeness check
  if (!isSentenceComplete(clean)) {
    console.warn(`⚠️ Incomplete sentence detected: "${clean}"`);
    return false;
  }

  // 4. Relevance check
  const vegKey = vegetableName.toLowerCase().trim();
  const aliases = VEGETABLE_ALIASES[vegKey] || [vegKey, 'vegetable', 'plant', 'food'];
  const hasRelevance = aliases.some((alias) => lower.includes(alias.toLowerCase()));
  if (!hasRelevance) {
    console.warn(`⚠️ Relevance failed for ${vegetableName}: "${clean}"`);
    return false;
  }

  return true;
};

async function runTests() {
  console.log('🔄 Loading Transformers.js text2text-generation pipeline...');
  const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M', { dtype: 'q4' });
  console.log('✅ Pipeline loaded!');

  const genParams = {
    max_new_tokens: 65,
    temperature: 0.1,
    top_p: 0.9,
    do_sample: false,
    repetition_penalty: 1.2
  };

  const results = [];

  for (const veg of testVegetables) {
    for (const tone of testTones) {
      const toneMap = { normal: 'informative', funny: 'funny', professional: 'professional', casual: 'casual' };
      const toneStyle = toneMap[tone] || 'informative';
      const prompt = `describe vegetable ${veg} in ${toneStyle} way with one sentence`;

      console.log('\n--------------------------------------------------');
      console.log(`Testing: ${veg} | Tone: ${tone} | Prompt: "${prompt}"`);

      let rawOutput = '';
      let cleanOutput = '';
      let isVal = false;
      let retryUsed = false;

      const res1 = await generator(prompt, genParams);
      if (res1 && res1[0] && res1[0].generated_text) {
        rawOutput = res1[0].generated_text;
        cleanOutput = cleanGeneratedText(rawOutput, prompt);

        // Auto-fix trailing punctuation if incomplete punctuation
        if (cleanOutput && !/[.!?]$/.test(cleanOutput)) {
          cleanOutput = `${cleanOutput  }.`;
        }

        isVal = validateGeneratedFact(cleanOutput, veg);
      }

      if (!isVal) {
        console.warn('⚠️ Gen 1 failed validation! Executing Retry 1...');
        retryUsed = true;
        const retryPrompt = `write one complete factual sentence about vegetable ${veg}`;
        const res2 = await generator(retryPrompt, genParams);
        if (res2 && res2[0] && res2[0].generated_text) {
          rawOutput = res2[0].generated_text;
          cleanOutput = cleanGeneratedText(rawOutput, retryPrompt);
          if (cleanOutput && !/[.!?]$/.test(cleanOutput)) {
            cleanOutput = `${cleanOutput  }.`;
          }
          isVal = validateGeneratedFact(cleanOutput, veg);
        }
      }

      const hasRep = hasAbnormalRepetition(cleanOutput);
      const isComp = isSentenceComplete(cleanOutput);

      results.push({
        veg,
        tone,
        prompt,
        rawOutput,
        cleanOutput,
        relevant: isVal ? 'YES' : 'NO',
        repetitive: hasRep ? 'YES' : 'NO',
        completeSentence: isComp ? 'YES' : 'NO',
        retry: retryUsed ? 'YES' : 'NO',
        status: isVal ? 'PASS' : 'FAIL'
      });

      console.log(`Result: ${isVal ? '✅ PASS' : '❌ FAIL'} | Clean Output: "${cleanOutput}"`);
    }
  }

  console.log('\n==================================================');
  console.log('SUMMARY TEST MATRIX:');
  console.table(results);
}

runTests().catch(console.error);
