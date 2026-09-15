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
 * Clé Serper : priorité à la variable d'environnement SERPER_API_KEY,
 * sinon à la valeur enregistrée depuis la page d'administration.
 * Les espaces superflus (fréquents lors d'un copier-coller dans un
 * dashboard d'hébergeur) sont retirés.
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
 * Mot de passe d'administration : priorité à la variable d'environnement
 * ADMIN_PASSWORD. À défaut, un mot de passe est généré automatiquement au
 * premier démarrage, enregistré localement, et affiché dans les logs du
 * serveur pour que l'utilisateur puisse se connecter à /admin.
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
 * Personnalisation de marque (nom du site, couleur d'accent). Les teintes
 * dérivées (survol, fonds doux, bordures) sont recalculées à la volée à
 * partir de la seule couleur d'accent choisie, pour garder une palette
 * cohérente sans demander plusieurs couleurs à l'utilisateur.
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
