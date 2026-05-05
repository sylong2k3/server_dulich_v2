/**
 * i18n SQL helpers — shared across repositories that store bilingual columns.
 *
 * The database keeps two physical columns per translatable field
 * (e.g. name_vi / name_en). At query time we pick the requested language
 * and fall back to the other one when NULL, so the API always returns
 * a value even if the translation is missing.
 *
 * Usage in repositories:
 *
 *   const { normalizeLang, localizedSQL, localizedValueSQL } = require('../../utils/i18n.utils');
 *   const lang = normalizeLang(rawLang);
 *   const sql = `SELECT ${localizedSQL(lang, 'ts.name_vi', 'ts.name_en', 'name')} FROM ...`;
 */

const SUPPORTED_LANGS = ['vi', 'en'];
const DEFAULT_LANG = 'vi';

/**
 * Chuẩn hoá tham số ngôn ngữ — chỉ chấp nhận 'vi' hoặc 'en', mặc định 'vi'.
 */
const normalizeLang = (lang) => {
  const code = String(lang || DEFAULT_LANG).toLowerCase();
  return SUPPORTED_LANGS.includes(code) ? code : DEFAULT_LANG;
};

/**
 * Sinh biểu thức `COALESCE(primary, fallback) AS alias` cho một cặp cột song ngữ.
 * - lang === 'en' → primary là cột _en, fallback là _vi
 * - lang === 'vi' → primary là cột _vi, fallback là _en
 *
 * @param {'vi'|'en'} lang   Ngôn ngữ đã normalize
 * @param {string}    viCol  Cột tiếng Việt (vd: 'ts.name_vi')
 * @param {string}    enCol  Cột tiếng Anh   (vd: 'ts.name_en')
 * @param {string}    alias  Tên alias cho output (vd: 'name')
 * @returns {string}         Đoạn SQL: `COALESCE(primary, fallback) AS alias`
 */
const localizedSQL = (lang, viCol, enCol, alias) => {
  const primary = lang === 'en' ? enCol : viCol;
  const fallback = lang === 'en' ? viCol : enCol;
  return `COALESCE(${primary}, ${fallback}) AS ${alias}`;
};

/**
 * Như `localizedSQL` nhưng không gắn AS — dùng khi cần nhúng giá trị
 * vào ORDER BY, json_build_object, hoặc subquery.
 */
const localizedValueSQL = (lang, viCol, enCol) => {
  const primary = lang === 'en' ? enCol : viCol;
  const fallback = lang === 'en' ? viCol : enCol;
  return `COALESCE(${primary}, ${fallback})`;
};

/**
 * Helper để build cache key suffix theo ngôn ngữ.
 * Tránh việc cache đè lẫn giữa các ngôn ngữ khác nhau.
 */
const langCacheKey = (lang) => `lang:${normalizeLang(lang)}`;

module.exports = {
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  normalizeLang,
  localizedSQL,
  localizedValueSQL,
  langCacheKey,
};
