require('dotenv').config();

const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { searchProductPrices } = require('./lib/priceSearch');
const config = require('./lib/config');
const adminAuth = require('./lib/adminAuth');
const branding = require('./lib/branding');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Nécessaire pour que le rate limiting basé sur l'IP et les cookies
// "secure" fonctionnent correctement derrière le proxy inverse de Render.
if (isProduction) app.set('trust proxy', 1);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function asyncRoute(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// Nombre maximum de produits qu'un utilisateur peut soumettre en une seule requête.
const MAX_PRODUCTS = 10;

app.post(
  '/api/search',
  asyncRoute(async (req, res) => {
    const rawProducts = Array.isArray(req.body?.products) ? req.body.products : [];

    const products = rawProducts
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter((p) => p.length > 0)
      .slice(0, MAX_PRODUCTS);

    if (products.length === 0) {
      return res
        .status(400)
        .json({ code: 'NO_PRODUCTS', error: 'Please enter at least one product to search.' });
    }

    const apiKey = await config.getSerperApiKey();

    if (!apiKey) {
      return res.status(503).json({
        code: 'NO_API_KEY',
        error: 'No Serper key configured. Go to /admin to add your key and enable price search.',
      });
    }

    try {
      const results = await Promise.all(
        products.map(async (query) => {
          try {
            const { offers, location } = await searchProductPrices(query, apiKey);
            return { query, offers, location, error: null, code: null };
          } catch (err) {
            return {
              query,
              offers: [],
              location: null,
              error: err.message || 'Unknown error during search.',
              code: err.code || null,
            };
          }
        })
      );

      res.json({ results });
    } catch (err) {
      console.error('Erreur de recherche:', err);
      res
        .status(500)
        .json({ code: 'SEARCH_ERROR', error: 'An error occurred while searching for prices.' });
    }
  })
);

// Route de santé simple, utile pour le monitoring et le diagnostic.
app.get(
  '/api/health',
  asyncRoute(async (_req, res) => {
    const { source: adminPasswordSource } = await config.getAdminPassword();
    res.json({
      status: 'ok',
      hasApiKey: Boolean(await config.getSerperApiKey()),
      adminPasswordSource, // 'env' si ADMIN_PASSWORD est définie, 'generated' sinon
      storage: config.usingPostgres ? 'postgres' : 'json',
    });
  })
);

// Identité de marque active sur ce déploiement (voir lib/branding.js) —
// le front-end s'en sert pour afficher le bon nom/logo/couleurs sans
// dupliquer le code entre les variantes.
app.get('/api/brand', (_req, res) => {
  res.json(branding.getBrand());
});

// --- Administration : connexion + configuration de la clé Serper ---

// Anti-brute-force : une IP ne peut tenter qu'un nombre limité de
// connexions admin par fenêtre de temps.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, merci de réessayer dans quelques minutes.' },
});

function setSessionCookie(res, token) {
  const secureFlag = isProduction ? ' Secure;' : '';
  res.setHeader(
    'Set-Cookie',
    `${adminAuth.COOKIE_NAME}=${token}; HttpOnly;${secureFlag} Path=/; SameSite=Strict; Max-Age=86400`
  );
}

app.post(
  '/api/admin/login',
  adminLoginLimiter,
  asyncRoute(async (req, res) => {
    const { password } = req.body || {};
    const { password: expected } = await config.getAdminPassword();

    const submitted = typeof password === 'string' ? password.trim() : '';

    if (!submitted || !adminAuth.timingSafeEqualStrings(submitted, expected)) {
      return res.status(401).json({ code: 'INVALID_PASSWORD', error: 'Incorrect password.' });
    }

    const token = await adminAuth.createSession();
    setSessionCookie(res, token);
    res.json({ ok: true });
  })
);

app.post(
  '/api/admin/logout',
  asyncRoute(async (req, res) => {
    const cookies = adminAuth.parseCookies(req.headers.cookie);
    await adminAuth.destroySession(cookies[adminAuth.COOKIE_NAME]);
    res.setHeader('Set-Cookie', `${adminAuth.COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
    res.json({ ok: true });
  })
);

app.get(
  '/api/admin/config',
  adminAuth.requireAdmin,
  asyncRoute(async (_req, res) => {
    const key = await config.getSerperApiKey();
    const maskedKey = key ? `${'•'.repeat(Math.max(key.length - 4, 0))}${key.slice(-4)}` : null;
    res.json({
      hasKey: Boolean(key),
      maskedKey,
      keySource: process.env.SERPER_API_KEY ? 'env' : 'admin',
    });
  })
);

app.post(
  '/api/admin/config',
  adminAuth.requireAdmin,
  asyncRoute(async (req, res) => {
    const { serperApiKey } = req.body || {};

    if (typeof serperApiKey !== 'string' || serperApiKey.trim().length === 0) {
      return res.status(400).json({ code: 'INVALID_KEY', error: 'Please enter a valid Serper key.' });
    }

    if (process.env.SERPER_API_KEY) {
      return res.status(409).json({
        code: 'KEY_ENV_LOCKED',
        error:
          'The Serper key is currently set via the SERPER_API_KEY environment variable, which takes priority. Remove it from .env to manage it from this page.',
      });
    }

    await config.setSerperApiKey(serperApiKey.trim());
    res.json({ ok: true });
  })
);

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

app.listen(PORT, async () => {
  console.log(`Awsert est lancé sur http://localhost:${PORT}`);
  console.log(`Stockage config : ${config.usingPostgres ? 'PostgreSQL (DATABASE_URL)' : 'fichier JSON local (dev)'}`);

  const { password, generated } = await config.getAdminPassword();
  if (generated) {
    console.log('');
    console.log('========================================================');
    console.log(' Mot de passe administrateur généré automatiquement :');
    console.log(` ${password}`);
    console.log(' Connectez-vous sur /admin pour configurer votre clé Serper.');
    console.log(' (Définissez ADMIN_PASSWORD dans .env pour choisir le vôtre.)');
    console.log('========================================================');
    console.log('');
  } else {
    console.log('Page d\'administration disponible sur /admin.');
  }
});
