// Backend de configuration PostgreSQL — utilisé dès que DATABASE_URL est
// configurée. Table clé/valeur minimale (l'app n'a que 2 réglages :
// la clé Serper et le mot de passe admin), persistante indépendamment du
// disque de l'app — corrige la perte de config à chaque redéploiement/
// veille sur le plan gratuit Render.
const { Pool } = require('pg');

let pool = null;
let schemaReady = null;

function getPool() {
  if (!pool) {
    const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // La plupart des Postgres hébergés (Neon, Supabase, Render...)
      // utilisent une chaîne de certificats que Node ne valide pas
      // toujours out-of-the-box ; rejectUnauthorized:false est la
      // pratique standard recommandée par ces fournisseurs pour `pg`.
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);
  }
  await schemaReady;
}

async function getRaw() {
  await ensureSchema();
  const { rows } = await getPool().query('SELECT key, value FROM app_config');
  const out = {};
  for (const row of rows) out[row.key] = row.value;
  return out;
}

async function setKey(key, value) {
  await ensureSchema();
  await getPool().query(
    'INSERT INTO app_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, value]
  );
}

module.exports = { getRaw, setKey, getPool, ensureSchema };
