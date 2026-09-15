/**
 * Petits utilitaires de couleur et d'échappement HTML utilisés pour la
 * personnalisation de marque (nom du site, couleur d'accent) et le rendu
 * côté serveur des pages HTML.
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

/** Assombrit une couleur hex (0 = inchangé, 1 = noir). */
function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/** Mélange une couleur hex avec du blanc (0 = inchangé, 1 = blanc pur). */
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

/** Échappe une chaîne pour une insertion sûre dans du HTML (texte ou attribut). */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renvoie la première lettre/chiffre alphanumérique d'un nom, en majuscule. */
function getInitial(name) {
  const match = String(name || '').match(/[A-Za-z0-9À-ÖØ-öø-ÿ]/);
  return match ? match[0].toUpperCase() : 'A';
}

module.exports = { darken, blendWithWhite, isValidHexColor, escapeHtml, getInitial };
