const crypto = require('crypto');

// In-memory admin sessions (sufficient for a very simple single-instance app).
const sessions = new Set();

const COOKIE_NAME = 'awsert_admin_session';

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.add(token);
  return token;
}

function isValidSession(token) {
  return Boolean(token) && sessions.has(token);
}

function destroySession(token) {
  sessions.delete(token);
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
    // Still compare against a buffer of the same length to avoid timing
    // leaks related to length differences.
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Express middleware: requires a valid admin session. */
function requireAdmin(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  if (!isValidSession(cookies[COOKIE_NAME])) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
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
