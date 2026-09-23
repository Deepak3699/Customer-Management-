/* ===== Shop Manager — i18n (English Only) ===== */

export let LANG = 'en';
export function setLangValue(l) { LANG = 'en'; }

/* T(text) — identity helper for strings */
export function T(s) {
  return s || '';
}

/* TH(html) — identity helper for HTML strings */
export function TH(html) {
  return html || '';
}
