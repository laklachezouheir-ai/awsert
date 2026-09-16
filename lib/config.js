// Point d'entrée unique de configuration. Bascule automatiquement entre
// deux backends selon la configuration :
//   - DATABASE_URL définie  -> PostgreSQL (lib/configPostgres.js), persistant
//   - DATABASE_URL absente  -> fichier JSON local (lib/configJson.js),
//     filet de secours pour développer sans base de données à disposition
const crypto = require('crypto');
const configJson = require('./configJson');

const usingPostgres = Boolean(process.env.DATABASE_URL);

function backend() {
  if (usingPostgres) return require('./configPostgres'); // require différé : n'initialise le pool `pg` que si utilisé
  return configJson;
}

/**
 * Clé Serper : priorité à la variable d'environnement SERPER_API_KEY,
 * sinon à la valeur enregistrée depuis la page d'administration.
 */
async function getSerperApiKey() {
  const envKey = process.env.SERPER_API_KEY?.trim();
  if (envKey) return envKey;
  const raw = await backend().getRaw();
  return raw.serperApiKey || null;
}

async function setSerperApiKey(key) {
  await backend().setKey('serperApiKey', key);
}

/**
 * Mot de passe d'administration : priorité à la variable d'environnement
 * ADMIN_PASSWORD. À défaut, un mot de passe est généré automatiquement au
 * premier démarrage, enregistré, et affiché dans les logs du serveur.
 */
async function getAdminPassword() {
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  if (envPassword) {
    return { password: envPassword, generated: false, source: 'env' };
  }

  const raw = await backend().getRaw();
  if (raw.adminPassword) {
    return { password: raw.adminPassword, generated: false, source: 'generated' };
  }

  const generated = crypto.randomBytes(9).toString('base64url');
  await backend().setKey('adminPassword', generated);
  return { password: generated, generated: true, source: 'generated' };
}

module.exports = { getSerperApiKey, setSerperApiKey, getAdminPassword, usingPostgres };
