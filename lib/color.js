/**
 * Small color and HTML-escaping utilities used for brand customization
 * (site name, accent color) and server-side rendering of HTML pages.
 */

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

/** Darkens a hex color (0 = unchanged, 1 = black). */
function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** Blends a hex color with white (0 = unchanged, 1 = pure white). */
function blendWithWhite(hex, whiteRatio) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r * (1 - whiteRatio) + 255 * whiteRatio,
    g * (1 - whiteRatio) + 255 * whiteRatio,
    b * (1 - whiteRatio) + 255 * whiteRatio
  );
}

function isValidHexColor(str) {
  return typeof str === 'string' && /^#[0-9a-fA-F]{6}$/.test(str);
}

/** Escapes a string for safe insertion into HTML (text or attribute). */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Returns the first alphanumeric letter/digit of a name, uppercased. */
function getInitial(name) {
  const match = String(name || '').match(/[A-Za-z0-9À-ÖØ-öø-ÿ]/);
  return match ? match[0].toUpperCase() : 'A';
}

module.exports = { darken, blendWithWhite, isValidHexColor, escapeHtml, getInitial };
