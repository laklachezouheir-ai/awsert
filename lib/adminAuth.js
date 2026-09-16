const crypto = require('crypto');
const config = require('./config');

const COOKIE_NAME = 'awsert_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h, aligné sur le Max-Age du cookie

// Sessions en mémoire — utilisées quand Postgres n'est pas configuré
// (suffisant pour du dev local ; perdues à chaque redémarrage du process).
const memorySessions = new Map(); // token -> expiresAt (ms epoch)

async function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  if (config.usingPostgres) {
    const { getPool, ensureSchema } = require('./configPostgres');
    await ensureSchema();
    await getPool().query('INSERT INTO admin_sessions (token, expires_at) VALUES ($1, $2)', [
      token,
      expiresAt,
    ]);
  } else {
    memorySessions.set(token, expiresAt.getTime());
  }
  return token;
}

async function isValidSession(token) {
  if (!token) return false;
  if (config.usingPostgres) {
    const { getPool, ensureSchema } = require('./configPostgres');
    await ensureSchema();
    const { rows } = await getPool().query(
      'SELECT 1 FROM admin_sessions WHERE token = $1 AND expires_at > now()',
      [token]
    );
    return rows.length > 0;
  }
  const expiresAt = memorySessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    memorySessions.delete(token);
    return false;
  }
  return true;
}

async function destroySession(token) {
  if (!token) return;
  if (config.usingPostgres) {
    const { getPool, ensureSchema } = require('./configPostgres');
    await ensureSchema();
    await getPool().query('DELETE FROM admin_sessions WHERE token = $1', [token]);
  } else {
    memorySessions.delete(token);
  }
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Compare quand même contre un buffer de même taille pour éviter les
    // fuites de timing liées à la longueur.
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Middleware Express : exige une session admin valide. */
async function requireAdmin(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    if (!(await isValidSession(cookies[COOKIE_NAME]))) {
      return res.status(401).json({ error: 'Non authentifié.' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  COOKIE_NAME,
  createSession,
  isValidSession,
  destroySession,
  parseCookies,
  timingSafeEqualStrings,
  requireAdmin,
};
