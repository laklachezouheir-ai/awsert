const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { darken, blendWithWhite } = require('./color');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeConfig(config) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Serper key: priority to the SERPER_API_KEY environment variable,
 * otherwise the value saved from the admin page.
 * Extra whitespace (common when copy-pasting into a hosting provider's
 * dashboard) is trimmed.
 */
function getSerperApiKey() {
  const envKey = process.env.SERPER_API_KEY?.trim();
  if (envKey) return envKey;
  const config = readConfig();
  return config.serperApiKey || null;
}

function setSerperApiKey(key) {
  const config = readConfig();
  config.serperApiKey = key;
  writeConfig(config);
}

/**
 * Admin password: priority to the ADMIN_PASSWORD environment variable.
 * Otherwise, a password is generated automatically on first startup,
 * saved locally, and printed to the server logs so the user can log
 * into /admin.
 */
function getAdminPassword() {
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  if (envPassword) {
    return { password: envPassword, generated: false, source: 'env' };
  }

  const config = readConfig();
  if (config.adminPassword) {
    return { password: config.adminPassword, generated: false, source: 'generated' };
  }

  const generated = crypto.randomBytes(9).toString('base64url');
  config.adminPassword = generated;
  writeConfig(config);
  return { password: generated, generated: true, source: 'generated' };
}

const DEFAULT_BRANDING = { siteName: 'Awsert', accentColor: '#5b7c99' };

/**
 * Brand customization (site name, accent color). The
 * derived shades (hover, soft backgrounds, borders) are recalculated on
 * the fly from the single chosen accent color, to keep a consistent
 * palette without asking the user for several colors.
 */
function getBranding() {
  const config = readConfig();
  const stored = { ...DEFAULT_BRANDING, ...(config.branding || {}) };
  return {
    siteName: stored.siteName,
    accentColor: stored.accentColor,
    accentHover: darken(stored.accentColor, 0.14),
    accentSoft: blendWithWhite(stored.accentColor, 0.88),
    accentBorder: blendWithWhite(stored.accentColor, 0.72),
  };
}

function setBranding(partial) {
  const config = readConfig();
  const current = { ...DEFAULT_BRANDING, ...(config.branding || {}) };
  config.branding = { ...current, ...partial };
  writeConfig(config);
}

module.exports = { getSerperApiKey, setSerperApiKey, getAdminPassword, getBranding, setBranding };
