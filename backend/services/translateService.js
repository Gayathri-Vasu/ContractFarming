const axios = require('axios');
const crypto = require('crypto');

const TARGETS = ['ta', 'kn', 'te', 'ur'];
const CACHE = new Map();
const MAX_CACHE = 500;

function cacheKey(text, target) {
  return `${target}:${crypto.createHash('sha256').update(text).digest('hex')}`;
}

/**
 * Translate a single string to target language (en returns source).
 * @param {string} text
 * @param {string} targetLanguage - 'ta'|'kn'|'te'|'ur'|'en'
 */
async function translateText(text, targetLanguage) {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (targetLanguage === 'en') return trimmed;

  const ck = cacheKey(trimmed, targetLanguage);
  if (CACHE.has(ck)) return CACHE.get(ck);

  let translated = null;

  const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (googleKey) {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
        googleKey
      )}`;
      const { data } = await axios.post(
        url,
        { q: trimmed, source: 'en', target: targetLanguage, format: 'text' },
        { timeout: 20000 }
      );
      translated = data?.data?.translations?.[0]?.translatedText ?? null;
    } catch (e) {
      console.error('Google Translate error:', e.message);
    }
  }

  if (!translated) {
    try {
      const { data } = await axios.post(
        process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate',
        {
          q: trimmed,
          source: 'en',
          target: targetLanguage,
          format: 'text'
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
      );
      translated = data?.translatedText ?? null;
    } catch (e) {
      console.error('LibreTranslate error:', e.message);
    }
  }

  const out = translated !== null && translated !== undefined ? String(translated) : trimmed;
  if (CACHE.size < MAX_CACHE) CACHE.set(ck, out);
  return out;
}

/**
 * Build { en, ta, kn, te, ur } from English source text.
 * On failure for a target, copies English for that key.
 */
async function buildI18nFromEnglish(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const out = { en: trimmed };
  await Promise.all(
    TARGETS.map(async (lang) => {
      try {
        out[lang] = await translateText(trimmed, lang);
      } catch {
        out[lang] = trimmed;
      }
    })
  );
  return out;
}

/**
 * Convert user string input to i18n object or empty string (legacy).
 */
async function stringToI18nOrEmpty(field) {
  if (field == null) return undefined;
  if (typeof field !== 'string') return undefined;
  const s = field.trim();
  if (!s) return '';
  try {
    return (await buildI18nFromEnglish(s)) || { en: s };
  } catch (e) {
    console.error('buildI18nFromEnglish failed:', e.message);
    return { en: s };
  }
}

module.exports = {
  translateText,
  buildI18nFromEnglish,
  stringToI18nOrEmpty
};
