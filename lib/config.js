const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
 * Clé SerpApi : priorité à la variable d'environnement SERPAPI_KEY,
 * sinon à la valeur enregistrée depuis la page d'administration.
 * Les espaces superflus (fréquents lors d'un copier-coller dans un
 * dashboard d'hébergeur) sont retirés.
 */
function getSerpApiKey() {
  const envKey = process.env.SERPAPI_KEY?.trim();
  if (envKey) return envKey;
  const config = readConfig();
  return config.serpApiKey || null;
}

function setSerpApiKey(key) {
  const config = readConfig();
  config.serpApiKey = key;
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

module.exports = { getSerpApiKey, setSerpApiKey, getAdminPassword };
