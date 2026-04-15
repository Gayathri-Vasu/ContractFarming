/**
 * Helpers for multilingual fields stored as either legacy string or { en, ta, kn, te, ur }.
 */

const SUPPORTED = ['en', 'ta', 'kn', 'te', 'ur'];

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/** English text for notifications, PDFs, or legacy code paths. */
function toPlainEnglish(field) {
  if (field == null || field === '') return '';
  if (typeof field === 'string') return field;
  if (isPlainObject(field) && field.en != null) return String(field.en);
  return '';
}

/** Pick one locale with fallback to English, then legacy string. */
function pickLocalized(field, lang) {
  if (field == null || field === '') return '';
  if (typeof field === 'string') return field;
  if (isPlainObject(field)) {
    const code = SUPPORTED.includes(lang) ? lang : 'en';
    const v = field[code] ?? field.en;
    return v != null ? String(v) : '';
  }
  return String(field);
}

module.exports = {
  SUPPORTED_LOCALES: SUPPORTED,
  toPlainEnglish,
  pickLocalized
};
